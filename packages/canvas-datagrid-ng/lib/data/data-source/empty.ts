import { integerToAlpha } from '../../util';
import { ColumnsManager } from './columns-manager';
import type {
  DataSourceBase,
  EditCellDescriptor,
  FilterDescriptor,
  GetFilterableValuesOptions,
  RequestDataFrameInput,
  RequestDataFrameOutput,
  SortDescriptor,
} from './spec';
import { InMemoryFilter } from './in-memory-filter';
import { InMemoryHiddenRangeStore } from './in-memory-hidden-range-store';
import { InMemorySorter } from './in-memory-sorter';
import { InMemoryPositionHelper } from './in-memory-position-helper';
import { SizesManager } from './sizes-manager';
import { getLastIndexes, TableManager } from './table-manager';
import type { MoveCallback } from './table-modification';
import { TableModification } from './table-modification';
import { getDefaultDataSourceState } from './defaults';
import { DefaultDataEventTarget } from '../event-target';
import { DefaultNamespaceController } from '../namespace/default-controller';
import {
  getTableRangeInRange,
  editTableCell,
  getCellStyleFromTable,
  getCellValueFromTable,
  getSkipsFromHeaders,
  loadTableDataOnToOuput,
  moveTableData,
  getCellMetaFromTable,
  getCellValueFromTableById,
  editTableCells,
} from '../table/util';
import { DefaultMergedCellsManager } from './merged-cells-manager';
import {
  checkIfRangeFullyContainsRange,
  filterColumnsWithSparseRange,
  isInRange,
} from '../../range/util';
import { checkReorder } from '../reorder/util';
import { DefaultNamedRangeManager } from '../../named-ranges/default-manager';
import type {
  GridHeader,
  GridSchemaItem,
  CellStyleDeclaration,
  IntervalDescriptor,
  MergedCellDescriptor,
  RangeDescriptor,
  TableDescriptor,
  TableSpillBehavior,
  TableStyle,
  CellClearMode,
  GridPublicAPI,
} from '../../types';
import { DefaultComponentProvider } from '../namespace/default-component-provider';
import { RangeResult } from '../../range/result';
import type { CellMeta } from './spec/base';
import type { DataEvent } from './spec/events';
import {
  getFilterableColorsForColumn,
  getFilterableValuesForColumn,
} from './filters/utils';
import {
  updateDataSourceState,
  updateVisibleIndexes,
} from './generic/update-state';
import { ensureAsync } from './await';

const maxSortRows = 1000 * 1000;
const returnTrue = () => true;
// const notAllow = () => false;
type Size = { rows: number; cols: number };

export class EmptyDataSource implements DataSourceBase {
  readonly name = 'Empty';
  readonly namedRanges = new DefaultNamedRangeManager();
  readonly tables: TableManager = new TableManager(this, (table, event) => {
    if (
      event.type === 'datasource' &&
      event.dataSourceEvent.name === 'dataCount'
    ) {
      if (
        this.positionHelper &&
        updateVisibleIndexes(this.positionHelper, this.tables)
      ) {
        const { startRow, startColumn, endRow, endColumn } = table;
        this.dispatchEvent({
          name: 'data',
          type: 'resize',
          targetRange: { startRow, startColumn, endRow, endColumn },
        });
      }
    } else {
      this.dispatchEvent({
        name: 'table',
        tableEvent: event,
      });
    }
  });

  readonly namespace = new DefaultNamespaceController([
    new DefaultComponentProvider(this.namedRanges, this.tables),
  ]);
  readonly state = getDefaultDataSourceState();
  readonly sizes: SizesManager;
  readonly positionHelper: InMemoryPositionHelper;
  readonly mergedCells = new DefaultMergedCellsManager();

  protected readonly hiddenRowRanges = new InMemoryHiddenRangeStore();
  protected readonly size: Size;
  protected noCells: boolean;
  protected columns: ColumnsManager;
  protected updateState = () => {
    this.noCells = this.size.rows === 0 && this.size.cols === 0;
    return updateDataSourceState(
      this,
      this.positionHelper,
      this.tables,
      this.state,
      this.size.rows,
      this.columns.length,
    );
  };
  protected initColumnHeaders = () => {
    let columns: GridHeader[] = [];
    if (!this.noCells) {
      columns = new Array(this.size.cols).fill(null).map((_, columnIndex) => {
        const name = integerToAlpha(columnIndex).toUpperCase();
        return {
          dataKey: name,
          title: name,
          id: name,
          columnViewIndex: columnIndex,
          columnIndex,
          type: 'string',
        } as GridHeader;
      });
    }
    this.columns = new ColumnsManager(columns);
  };

  private edit = new TableModification();
  private editMeta = new TableModification<CellMeta>();
  private editStyle = new TableModification<Partial<CellStyleDeclaration>>();
  private sorter: InMemorySorter;
  private filter = new InMemoryFilter();

  //#region data event target
  private eventTarget = new DefaultDataEventTarget<DataEvent>();
  addListener = this.eventTarget.addListener;
  removeListener = this.eventTarget.removeListener;
  dispatchEvent = this.eventTarget.dispatchEvent;
  //#endregion

  constructor(size?: Size) {
    if (!size) size = { rows: 0, cols: 0 };
    if (size.rows < 0 || !Number.isInteger(size.rows)) size.rows = 0;
    if (size.cols < 0 || !Number.isInteger(size.cols)) size.cols = 0;
    this.size = size;
    this.noCells = size.rows === 0 && size.cols === 0;
    this.initColumnHeaders();
    this.sorter = new InMemorySorter(this.columns, 'id');
    this.updateState();
    this.sizes = new SizesManager(this.columns);
    this.positionHelper = new InMemoryPositionHelper(
      this,
      this.sizes,
      this.hiddenRowRanges,
    );
  }

  private resolveRowIndex = (rowViewIndex: number) => {
    if (!this.filter.indexes) return rowViewIndex;
    const { indexes, originalLength } = this.filter;
    if (rowViewIndex >= indexes.length)
      return rowViewIndex - indexes.length + originalLength;
    return indexes[rowViewIndex];
  };

  private currentGrid: GridPublicAPI;
  bind(grid: GridPublicAPI) {
    this.currentGrid = grid;
    this.tables.values.forEach((tb) => tb.dataSource.bind(grid));
  }
  unbind(grid: GridPublicAPI) {
    const before = this.currentGrid;
    if (grid !== before) return;
    this.currentGrid = null;
    this.tables.values.forEach((tb) => tb.dataSource.unbind(grid));
  }

  createTable = (
    name: string,
    rowViewIndex: number,
    columnViewIndex: number,
    dataSource: DataSourceBase,
    style?: Partial<TableStyle>,
    spillBehavior?: TableSpillBehavior,
  ) => {
    const column = this.getHeader(columnViewIndex);
    if (!column) throw 'invalid-range';

    const rowIndex = this.resolveRowIndex(rowViewIndex);
    const { columnIndex } = column;
    const endIndexes = getLastIndexes(dataSource, rowIndex, columnIndex, style);
    const tableRange: RangeDescriptor = {
      startRow: rowIndex,
      startColumn: columnIndex,
      endRow: endIndexes.endRow,
      endColumn: endIndexes.endColumn,
    };
    if (spillBehavior === 'fail') {
      if (this.containsDataInRange(tableRange)) {
        throw 'invalid-range';
      }
    } else if (spillBehavior === 'replace') {
      const clearRange = {
        startRow: rowIndex,
        startColumn: columnIndex,
        endRow: endIndexes.endRow,
        endColumn: endIndexes.endColumn,
      };
      this.clearRange(clearRange, { wholeTable: true });
    } else if (
      spillBehavior === 'moveToBottom' ||
      spillBehavior === 'moveToRight'
    ) {
      if (this.containsDataInRange(tableRange)) {
        if (spillBehavior === 'moveToBottom') {
          const rowCount = tableRange.endRow - tableRange.startRow + 1;
          this.createRows(rowIndex - 1, rowCount);
        } else {
          const columnCount = tableRange.endColumn - tableRange.startColumn + 1;
          this.createColumns(columnIndex - 1, columnCount);
        }
      }
    } else {
      const range: RangeDescriptor = {
        startRow: rowIndex,
        startColumn: columnIndex,
        endRow: rowIndex,
        endColumn: columnIndex,
      };
      this.clearRange(range, { skipTables: true });
      for (const table of this.tables.values) {
        if (table.startRow === rowIndex && table.startColumn === columnIndex) {
          this.deleteTable(table.name);
          break;
        }
      }
    }

    const table = this.tables.add(
      this.namespace,
      name,
      rowIndex,
      columnIndex,
      dataSource,
      style,
    );
    if (this.currentGrid) table.dataSource.bind(this.currentGrid);
    table.dataSource.addListener(this.handleTableDataEvent);
    this.onDataRangeChanged(table);
    this.dispatchEvent({
      name: 'data',
      type: 'tableAdd',
      targetRange: tableRange,
      source: this,
    });
    if (!this.updateState()) {
      // Ensure we update the scrollable area when the size of the data source
      // doesn't change.
      const { visibleScrollIndexes: indexes } = this.positionHelper;
      indexes.rowIndex = Math.max(table.endRow, indexes.rowIndex);
      indexes.columnIndex = Math.max(table.endColumn, indexes.columnIndex);
    }
    return table as TableDescriptor;
  };
  deleteTable = (name: string) => {
    const table = this.tables.delete(name);
    if (!table) return false;
    this.onDataRangeChanged(table);
    this.dispatchEvent({
      name: 'data',
      type: 'tableDelete',
      targetRange: table,
      source: this,
    });
    if (this.currentGrid) table.dataSource.unbind(this.currentGrid);
    table.dataSource.removeListener(this.handleTableDataEvent);
    return true;
  };
  getTable = (name: string) => {
    return this.tables.get(name);
  };
  getTableByIndex = (rowViewIndex: number, columnViewIndex: any) => {
    const column = this.getHeader(columnViewIndex);
    if (!column) return;
    const { columnIndex } = column;
    const rowIndex = this.resolveRowIndex(rowViewIndex);
    return this.tables.getByIndex(rowIndex, columnIndex);
  };
  getTablesInRange = (range: RangeDescriptor) => {
    if (
      range.endRow < range.startRow ||
      range.endColumn < range.startColumn ||
      range.endRow >= this.state.rows ||
      range.endColumn >= this.state.cols
    ) {
      return [];
    }

    const { columnIndex: startColumnIndex } = this.getHeader(range.startColumn);
    const { columnIndex: endColumnIndex } = this.getHeader(range.endColumn);
    const targetRange: RangeDescriptor = {
      startRow: this.resolveRowIndex(range.startRow),
      startColumn: startColumnIndex,
      endRow: this.resolveRowIndex(range.endRow),
      endColumn: endColumnIndex,
    };

    const tables = this.tables.getForRange(targetRange);
    return tables;
  };
  isInTableRange = (
    table: TableDescriptor,
    rowViewIndex: number,
    columnViewIndex: number,
  ) => {
    const column = this.getHeader(columnViewIndex);
    if (!column) return;
    const { columnIndex } = column;
    const rowIndex = this.resolveRowIndex(rowViewIndex);
    return isInRange(table, rowIndex, columnIndex);
  };

  clearRange = (
    range: RangeDescriptor,
    options?: { skipTables?: boolean; wholeTable?: boolean },
  ) => {
    if (
      range.endRow < range.startRow ||
      range.endColumn < range.startColumn ||
      range.endRow >= this.state.rows ||
      range.endColumn >= this.state.cols
    ) {
      return false;
    }

    const { columnIndex: startColumnIndex } = this.getHeader(range.startColumn);
    const { columnIndex: endColumnIndex } = this.getHeader(range.endColumn);
    const targetRange: RangeDescriptor = {
      startRow: this.resolveRowIndex(range.startRow),
      startColumn: startColumnIndex,
      endRow: this.resolveRowIndex(range.endRow),
      endColumn: endColumnIndex,
    };
    const columnIds = this.columns
      .slice(range.startColumn, range.endColumn + 1)
      .map((column) => column.id);
    for (let i = range.startColumn; i <= range.endColumn; i++) {
      const header = this.getHeader(i);
      if (!header) return false;
      columnIds.push(header.id);
    }

    this.edit.delete(columnIds, range.startRow, range.endRow);
    this.editMeta.delete(columnIds, range.startRow, range.endRow);
    this.editStyle.delete(columnIds, range.startRow, range.endRow);
    if (!options?.skipTables) {
      this.tables.deleteRange(targetRange, options?.wholeTable);
    }

    this.onDataRangeChanged(range);
    this.dispatchEvent({
      name: 'data',
      type: 'clear',
      targetRange: range,
      source: this,
    });

    return true;
  };
  containsDataInRange = (
    range: RangeDescriptor,
    options?: { skipTableWithName?: string; skipTables?: boolean },
  ) => {
    const startRowIndex = this.resolveRowIndex(range.startRow);
    const endRowIndex = this.resolveRowIndex(range.endRow);
    const columnIds = this.columns
      .slice(range.startColumn, range.endColumn + 1)
      .map((column) => column.id);
    return (
      this.edit.containsData(columnIds, startRowIndex, endRowIndex) ||
      (!options?.skipTables &&
        this.tables.containsInRange(range, options?.skipTableWithName))
    );
  };
  expandRange = (range: RangeDescriptor) => {
    const startColumn = this.getHeader(range.startColumn);
    const endColumn = this.getHeader(range.endColumn);
    if (!startColumn || !endColumn) return;

    const tableRange = {
      startRow: this.resolveRowIndex(range.startRow),
      startColumn: startColumn.columnIndex,
      endRow: this.resolveRowIndex(range.endRow),
      endColumn: endColumn.columnIndex,
    };
    const tables = this.tables
      .getForRange(range)
      .filter((table) => !table.isSpilling);

    if (tables.length === 1 && !tables[0].isSpilling) {
      const table = tables[0];

      if (
        checkIfRangeFullyContainsRange(table, tableRange) &&
        (table.startRow < tableRange.startRow ||
          table.startColumn < tableRange.startColumn ||
          table.endRow > tableRange.endRow ||
          table.endColumn > tableRange.endColumn)
      ) {
        const dataOnly =
          (table.firstRowIndex === table.startRow ||
            tableRange.startRow >= table.firstRowIndex) &&
          (table.lastRowIndex === table.endRow ||
            tableRange.endRow <= table.lastRowIndex) &&
          (table.startColumn < tableRange.startColumn ||
            table.endColumn > tableRange.endColumn);
        range.startColumn = this.columns.getViewIndexByOriginalIndex(
          table.startColumn,
        );
        range.endColumn = this.columns.getViewIndexByOriginalIndex(
          table.endColumn,
        );
        // TODO: Get the view indexes for these two.
        range.startRow = dataOnly ? table.firstRowIndex : table.startRow;
        range.endRow = dataOnly ? table.lastRowIndex : table.endRow;
        return true;
      } else {
        return false;
      }
    } else if (tables.length > 1) {
      return false;
    } else {
      return this.edit.expandRange(range, this.getHeader);
    }
  };

  getCellValue = (rowViewIndex: number, columnViewIndex: number) => {
    const column = this.columns.get(columnViewIndex);
    if (!column) return;
    const rowIndex = this.resolveRowIndex(rowViewIndex);
    const { columnIndex } = column;
    const table = this.tables.getByIndex(rowIndex, columnIndex);
    if (table) {
      return getCellValueFromTable(table, rowIndex, columnIndex);
    }

    const v = this.edit.get(rowIndex, column.id);
    if (typeof v !== 'undefined') return v;
  };

  getTableCellValueByColumnId(
    table: TableDescriptor,
    columnId: string,
    rowViewIndex: number,
  ) {
    const rowIndex = this.resolveRowIndex(rowViewIndex);
    return getCellValueFromTableById(table, columnId, rowIndex);
  }

  getCellStyle = (rowViewIndex: number, columnViewIndex: number) => {
    const column = this.columns.get(columnViewIndex);
    if (!column) return;
    const rowIndex = this.resolveRowIndex(rowViewIndex);
    const { columnIndex } = column;
    const table = this.tables.getByIndex(rowIndex, columnIndex);
    if (table) {
      const style = getCellStyleFromTable(table, rowIndex, columnIndex);
      if (style) return style;
    }

    const v = this.editStyle.get(rowIndex, column.id);
    if (typeof v !== 'undefined') return v;
  };

  getCellMeta = (rowViewIndex: number, columnViewIndex: number) => {
    const column = this.columns.get(columnViewIndex);
    if (!column) return;
    const rowIndex = this.resolveRowIndex(rowViewIndex);
    const { columnIndex } = column;
    const table = this.tables.getByIndex(rowIndex, columnIndex);
    if (table) {
      const meta = getCellMetaFromTable(table, rowIndex, columnIndex);
      if (meta) return meta;
    }
    const v = this.editMeta.get(rowIndex, column.id);
    if (typeof v !== 'undefined') return v;
  };

  clearCells = (range: RangeDescriptor, clearMode: CellClearMode): boolean => {
    if (
      range.endRow < range.startRow ||
      range.endColumn < range.startColumn ||
      range.endRow >= this.state.rows ||
      range.endColumn >= this.state.cols
    ) {
      return false;
    }

    const { columnIndex: startColumnIndex } = this.getHeader(range.startColumn);
    const { columnIndex: endColumnIndex } = this.getHeader(range.endColumn);
    const targetRange: RangeDescriptor = {
      startRow: this.resolveRowIndex(range.startRow),
      startColumn: startColumnIndex,
      endRow: this.resolveRowIndex(range.endRow),
      endColumn: endColumnIndex,
    };

    const columnIds = this.columns
      .slice(range.startColumn, range.endColumn + 1)
      .map((it) => it.id);

    const shouldClearStyle = clearMode === 'all' || clearMode === 'format';
    const shouldClearContent = clearMode === 'all' || clearMode === 'content';
    if (shouldClearStyle)
      this.editStyle.delete(columnIds, range.startRow, range.endRow);
    if (shouldClearContent) {
      this.edit.delete(columnIds, range.startRow, range.endRow);
      this.editMeta.delete(columnIds, range.startRow, range.endRow);
    }
    this.tables.clearCells(targetRange, clearMode);
    return true;
  };

  getDataFrame = (request: RequestDataFrameInput) => {
    if (this.noCells) return { cells: [], columns: [], style: [], meta: [] };

    let { startRow, endRow, startColumn, endColumn } = request;
    if (startColumn < 0) startColumn = 0;
    if (startColumn >= this.columns.length)
      return { columns: [], cells: [], style: [], meta: [] };
    if (endColumn >= this.columns.length) endColumn = this.columns.length - 1;

    const columns = filterColumnsWithSparseRange(
      this.columns.slice(startColumn, endColumn + 1),
      request?.skippedColumns,
    );
    const columnIds = columns.map((it) => it.id);
    const cells: string[][] = [];
    const rowHeaders: number[] = [];
    const cellsMeta: any[][] = [];
    const cellsStyle: Partial<CellStyleDeclaration>[][] = [];

    if (startRow < 0) startRow = 0;
    if (endRow >= this.size.rows) endRow = this.size.rows - 1;

    const skippedRows: IntervalDescriptor[] = [];
    let rowHeader = startRow + 1;
    let previousRowIndex: number | undefined;

    for (let rowIndex = startRow; rowIndex <= endRow; rowIndex++) {
      const row = [];
      const rowStyle = [];
      const rowMeta = [];

      const targetRowIndex = this.resolveRowIndex(rowIndex);

      this.edit.assign(row, columnIds, targetRowIndex);
      this.editMeta.assign(rowMeta, columnIds, targetRowIndex);
      this.editStyle.assign(rowStyle, columnIds, targetRowIndex);

      cells.push(row);
      cellsStyle.push(rowStyle);
      cellsMeta.push(rowMeta);
      rowHeaders.push(rowHeader++);

      if (targetRowIndex - previousRowIndex > 1) {
        skippedRows.push([previousRowIndex + 1, targetRowIndex - 1]);
      }
      previousRowIndex = targetRowIndex;
    }

    const output: RequestDataFrameOutput = {
      range: {
        startRow: this.resolveRowIndex(startRow),
        endRow: this.resolveRowIndex(endRow),
        startColumn: columns[0].columnIndex,
        endColumn: columns[columns.length - 1].columnIndex,
        skippedRows,
        skippedColumns: getSkipsFromHeaders(columns),
      },
      cells,
      columns,
      rowHeaders,
      style: cellsStyle,
      meta: cellsMeta,
    };

    const mergedCells = this.mergedCells.getForRange(output.range);
    const tables = this.tables.getForRange(output.range);

    output.mergedCells = new RangeResult<MergedCellDescriptor>(mergedCells);
    output.tables = new RangeResult<TableDescriptor>(tables);

    const { abortAfter } = request;
    for (const table of tables)
      loadTableDataOnToOuput(abortAfter, output, table);
    return output;
  };

  getFilterableColorsForColumn = (columnId: string) => {
    return getFilterableColorsForColumn(
      this.editStyle,
      this.edit,
      columnId,
      this.state.rows,
    );
  };
  getFilterableValuesForColumn = (
    columnId: string,
    options?: GetFilterableValuesOptions,
  ) => {
    const column = this.columns.getById(columnId);
    if (!column) {
      return { data: [], limited: false };
    }

    return getFilterableValuesForColumn(this.edit, column, options, undefined);
  };
  getStructFilterPath = (columnId: string) =>
    this.columns.getStructTarget(columnId);
  setStructFilterPath = (columnId: string, target: string) => {
    return this.columns.setStructField(columnId, target);
  };

  deprecated_getAllSchema = () => this.columns.getAll();
  deprecated_getRowData = (rowViewIndex: number) => {
    const result = {};
    const columns = this.columns.getAll();
    const rowIndex = this.resolveRowIndex(rowViewIndex);
    for (let i = 0; i < columns.length; i++) {
      const column = columns[i];
      const v = this.edit.get(rowIndex, column.id);
      result[column.name] = v;
    }
    return result;
  };

  setSchema = (schema: GridSchemaItem[]) => {
    this.columns.set(schema);
    this.updateState();
    return true;
  };
  getHeaderById = (columnId: string) => this.columns.getById(columnId);
  getHeader = (viewIndex: number) => this.columns.get(viewIndex);
  getHeaders = () => this.columns.getAll(true);
  setHeaderVisibility = (columnId: string, visible: boolean | 'replace') => {
    return this.columns.setVisibility(columnId, visible) && this.updateState();
  };
  unhideAllColumns = () => {
    this.columns.unhideAll();
    return this.updateState();
  };

  allowReorderColumns = (
    beginViewIndex: number,
    count: number,
    afterViewIndex: number,
  ) => {
    const beginIndex = this.getHeader(beginViewIndex).columnIndex;
    let afterIndex: number | undefined;
    if (afterViewIndex !== undefined) {
      afterIndex =
        afterViewIndex > beginViewIndex
          ? this.getHeader(afterViewIndex).columnIndex
          : this.getHeader(afterViewIndex + 1).columnIndex - 1;
    }

    const result = checkReorder(
      false,
      beginIndex,
      count,
      afterIndex,
      this.mergedCells,
      this.tables,
    );
    if (typeof result === 'number') {
      return this.columns.getViewIndexByOriginalIndex(result) ?? false;
    }
    return result;
  };
  reorderField = (columnId: string, afterColumnId: string) => {
    const column = this.getHeaderById(columnId);
    if (!column) return false;
    const { columnIndex: initialPos } = column;
    const result = this.columns.reorderWithIds(columnId, afterColumnId);
    if (result) {
      const { columnIndex: afterPos } = this.getHeaderById(columnId);
      const targetRange: RangeDescriptor = {
        startColumn: Math.min(initialPos, afterPos),
        endColumn: Math.max(initialPos, afterPos),
        startRow: 0,
        endRow: this.state.rows,
      };

      this.dispatchEvent({
        name: 'data',
        type: 'reorder',
        targetRange,
        source: this,
      });
    }
    return result;
  };
  reorderColumns = (
    columnViewIndex: number,
    count: number,
    afterViewIndex: number,
  ): boolean => {
    const { columnIndex } = this.getHeader(columnViewIndex);
    let afterIndex: number | undefined;
    if (afterViewIndex !== undefined) {
      afterIndex =
        afterViewIndex > columnViewIndex
          ? this.getHeader(afterViewIndex).columnIndex
          : this.getHeader(afterViewIndex + 1).columnIndex - 1;
    }

    if (
      this.tables.checkBeforeReorder(false, columnIndex, count, afterIndex) !==
      true
    ) {
      return false;
    }
    if (
      this.mergedCells.checkBeforeReorder(
        false,
        columnIndex,
        count,
        afterIndex,
      ) !== true
    ) {
      return false;
    }

    this.columns.reorder(columnViewIndex, count, afterViewIndex);
    this.sizes.reorderColumns(columnIndex, count, afterIndex);
    this.tables.reorderColumns(columnIndex, count, afterIndex);
    this.mergedCells.reorderColumns(columnIndex, count, afterIndex);
    return this.updateState();
  };

  allowReorderRows = (
    beginIndex: number,
    count: number,
    afterIndex?: number,
  ) => {
    return checkReorder(
      true,
      beginIndex,
      count,
      afterIndex,
      this.mergedCells,
      this.tables,
    );
  };
  reorderRows = (
    beginViewIndex: number,
    count: number,
    afterViewIndex: number,
  ): boolean => {
    if (
      this.tables.checkBeforeReorder(
        true,
        beginViewIndex,
        count,
        afterViewIndex,
      ) !== true
    ) {
      return false;
    }

    if (
      this.mergedCells.checkBeforeReorder(
        true,
        beginViewIndex,
        count,
        afterViewIndex,
      ) !== true
    ) {
      return false;
    }

    const rowIndexes: number[] = [];
    if (this.filter.indexes) {
      for (let i = 0; i < count; i++)
        rowIndexes.push(this.resolveRowIndex(beginViewIndex + i));
    } else {
      for (let i = 0; i < count; i++) rowIndexes.push(beginViewIndex + i);
    }

    this.edit.reorder(rowIndexes, afterViewIndex);
    this.editMeta.reorder(rowIndexes, afterViewIndex);
    this.editStyle.reorder(rowIndexes, afterViewIndex);
    this.sizes.reorderRows(beginViewIndex, count, afterViewIndex);
    this.tables.reorderRows(beginViewIndex, count, afterViewIndex);
    this.mergedCells.reorderRows(beginViewIndex, count, afterViewIndex);

    if (this.filter.has) {
      const records = this.edit.getAll();
      const rowIndexes = Object.keys(records).length;
      const rows4Filter: any[] = [];
      for (let rowIndex = 0; rowIndex < rowIndexes; rowIndex++)
        rows4Filter.push(this.resolveObjectFromIdMap(records[rowIndex] || {}));
      this.filter.filterAgain(rows4Filter, this.columns);
    }

    this.sorter.lastSort = [];
    this.hiddenRowRanges.reorder(
      beginViewIndex,
      beginViewIndex + count - 1,
      afterViewIndex,
    );
    return this.updateState();
  };

  createColumns = (afterViewIndex: number, count: number) => {
    const nameStartIndex =
      Math.max(this.state.cols - 1, 0) +
      Math.max(this.getHiddenColumnCount() - 1, 0) +
      1;
    const headers = new Array(count).fill(null).map((_, index) => {
      const name = integerToAlpha(nameStartIndex + index).toUpperCase();
      return {
        dataKey: name,
        title: name,
        id: name,
        columnViewIndex: -1,
        columnIndex: -1,
        type: 'string',
      } as GridHeader;
    });
    this.columns.insert(afterViewIndex, headers);
    this.tables.insertColumns(afterViewIndex, count);
    this.mergedCells.insertColumns(afterViewIndex, count);
    return this.updateState();
  };
  deleteColumns = returnTrue;

  createRows = (afterViewIndex: number, count: number) => {
    this.size.rows += count;
    this.edit.insert(afterViewIndex, count);
    this.editMeta.insert(afterViewIndex, count);
    this.editStyle.insert(afterViewIndex, count);
    this.tables.insertRows(afterViewIndex, count);
    this.mergedCells.insertRows(afterViewIndex, count);
    return this.updateState();
  };
  editCells = async (
    edit: EditCellDescriptor[],
    replace = false,
  ): Promise<boolean> => {
    for (let i = 0; i < edit.length; i++) {
      const e = edit[i];
      const column = this.columns.get(e.column);
      if (!column) continue;
      const rowId = this.resolveRowIndex(e.row);
      const table = this.tables.getByIndex(rowId, column.columnIndex);
      if (table) {
        e.row = rowId;
        e.column = column.columnIndex;
        await ensureAsync(editTableCell(table, e, replace));
        continue;
      } else if (e.meta?.parserData) {
        const tableOnLeft = this.tables.getByIndex(rowId, e.column - 1);
        if (tableOnLeft) {
          if (rowId === tableOnLeft.startRow) {
            tableOnLeft.dataSource.createColumns(-1, {
              name: e.value,
              formula: '',
            });
          } else {
            tableOnLeft.dataSource.createColumns(-1, {
              formula: e.value,
            });
          }
          return true;
        }
      }
      if (e.value !== undefined || replace) {
        this.edit.modify(rowId, column.id, e.value);
      }
      if (e.meta !== undefined) {
        const prev = this.editMeta.get(rowId, column.id);
        if (prev !== undefined) {
          Object.assign(prev, e.meta);
          this.editMeta.modify(rowId, column.id, prev);
        } else {
          this.editMeta.modify(rowId, column.id, e.meta);
        }
      } else if (replace) {
        this.editMeta.modify(rowId, column.id, undefined);
      }
      if (e.style !== undefined) {
        const style = {
          ...this.editStyle.get(rowId, column.id),
          ...e.style,
        };
        this.editStyle.modify(rowId, column.id, style);
      } else if (replace) {
        this.editStyle.modify(rowId, column.id, undefined);
      }
    }
    this.dispatchEvent({ name: 'edit', cells: edit, source: this });
    return this.updateState();
  };

  deleteRows = returnTrue;

  private resolveObjectFromIdMap(map: { [id: string]: any }): any {
    const object: any = {};
    Object.keys(map).forEach((id) => {
      const name = this.columns.getName(id);
      if (name) object[name] = map[id];
    });
    return object;
  }

  getCurrentFilters = () => this.filter.lastFilters || [];
  setFilter = (filters: FilterDescriptor[]) => {
    if (this.edit.touchedRows >= maxSortRows) return false;
    const records = this.edit.getAll();
    const rowIndexes = Object.keys(records)
      .map((it) => parseInt(it, 10))
      .sort((a, b) => a - b);

    const newRecords: typeof records = {};
    const rows4Filter: any[] = [];
    for (let i = 0; i < rowIndexes.length; i++) {
      const row = records[rowIndexes[i]];
      newRecords[i] = row;
      rows4Filter.push(this.resolveObjectFromIdMap(row));
    }
    this.edit.unsafeOverwrite(newRecords, rowIndexes.length);

    this.filter.filter(filters, rows4Filter, this.columns);
    this.dispatchEvent({ name: 'filter', source: this });
    return true;
  };

  getCurrentSorters = () => this.sorter.lastSort || [];
  sort = (sortRules: SortDescriptor[]) => {
    if (this.edit.touchedRows >= maxSortRows) return false;
    const records = this.edit.getAll();
    const rows = Object.values(records);
    this.sorter.sort(sortRules, rows);

    const newRecords: typeof records = {};
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      const row = rows[rowIndex];
      newRecords[rowIndex] = row;
    }
    this.edit.unsafeOverwrite(newRecords, rows.length);

    if (this.filter.has) {
      const rows4Filter: any[] = [];
      for (let rowIndex = 0; rowIndex < rows.length; rowIndex++)
        rows4Filter.push(this.resolveObjectFromIdMap(rows[rowIndex]));
      this.filter.filterAgain(rows4Filter, this.columns);
    }

    this.dispatchEvent({ name: 'sort', source: this });
    return true;
  };

  hideColumns = (columnViewIndex: number, count: number, isGroup?: boolean) => {
    const removed = this.columns.hide(columnViewIndex, count, isGroup);
    if (removed) {
      this.sizes.hide(removed);
      this.updateState();
      this.dispatchEvent({
        name: 'data',
        type: 'hideColumns',
        targetRange: {
          startColumn: columnViewIndex,
          endColumn: columnViewIndex + count - 1,
          startRow: 0,
          endRow: this.state.rows - 1,
        },
        source: this,
      });
      return true;
    }
    return false;
  };
  unhideColumns = (afterViewIndex: number, isGroup?: boolean) => {
    const inserted = this.columns.unhide(afterViewIndex, isGroup);
    if (inserted) {
      this.sizes.unhide(afterViewIndex, inserted.columns);
      this.updateState();
      this.dispatchEvent({
        name: 'data',
        type: 'unhideColumns',
        targetRange: {
          startColumn: inserted.columns[0].columnIndex,
          endColumn: inserted.columns[inserted.columns.length - 1].columnIndex,
          startRow: 0,
          endRow: this.state.rows - 1,
        },
        source: this,
      });
      return inserted.columns.map((it) => it.columnViewIndex);
    }
    return;
  };

  hideTableColumns = (tableId: string, ranges: RangeDescriptor[]) => {
    const table = this.tables.getById(tableId);
    if (!table) return false;

    for (let i = 0; i < ranges.length; i++) {
      const range = ranges[i];
      const { columnIndex: startColumnIndex } = this.getHeader(
        range.startColumn,
      );
      const { columnIndex: endColumnIndex } = this.getHeader(range.endColumn);
      ranges[i] = {
        startRow: this.resolveRowIndex(range.startRow),
        startColumn: startColumnIndex,
        endRow: this.resolveRowIndex(range.endRow),
        endColumn: endColumnIndex,
      };
    }

    // Using InMemoryHiddenRangeStore to levarage its features such as
    // merge and sort ranges
    const hidingRange = new InMemoryHiddenRangeStore();
    const { startColumn: tableStartColumn, endColumn: tableEndColumn } = table;

    // Only adding ranges that are inside table
    for (const range of ranges) {
      if (!this.tables.checkIfRangeIntersectTable(range, table)) {
        continue;
      }
      const start = Math.max(range.startColumn, tableStartColumn);
      const end = Math.min(range.endColumn, tableEndColumn);
      if (start <= end) hidingRange.hide(start, end, false);
    }

    const hidingTableColumnsRange = [] as {
      startIndex: number;
      endIndex: number;
    }[];

    hidingRange.forRange(
      tableStartColumn,
      tableEndColumn,
      true,
      (start, end, _) => {
        if (start <= end) {
          hidingTableColumnsRange.push({
            startIndex: start,
            endIndex: end,
          });
        }
      },
    );

    const result = table.hideColumns(hidingTableColumnsRange);
    if (result) {
      this.dispatchEvent({
        name: 'data',
        type: 'tableColumn',
        targetRange: table,
        source: this,
      });
    }
    return result;
  };

  unhideAllTableColumns = (tableId: string) => {
    const table = this.tables.getById(tableId);
    if (!table) return false;

    const result = table.unhideAllColumns();
    if (result) {
      this.dispatchEvent({
        name: 'data',
        type: 'tableColumn',
        targetRange: table,
        source: this,
      });
    }
    return table.unhideAllColumns();
  };

  getHiddenColumns = (viewIndex: number) =>
    this.columns.getHiddenColumns(viewIndex);
  getHiddenColumnCount = (): number => this.columns.getHiddenColumnCount();
  getHiddenRowCount = () => this.hiddenRowRanges.getHiddenIndexCount();

  hideRows = (beginIndex: number, endIndex: number, isGroup?: boolean) => {
    const result = this.hiddenRowRanges.hide(beginIndex, endIndex, isGroup);
    if (result) {
      this.dispatchEvent({
        name: 'data',
        type: 'hideRows',
        targetRange: {
          startRow: beginIndex,
          endRow: endIndex,
          startColumn: 0,
          endColumn: this.state.cols - 1,
        },
        source: this,
      });
    }
    return result;
  };
  unhideRows = (beginIndex: number, endIndex: number) => {
    const result = this.hiddenRowRanges.unhide(beginIndex, endIndex);
    if (result) {
      this.dispatchEvent({
        name: 'data',
        type: 'unhideRows',
        targetRange: {
          startRow: beginIndex,
          endRow: endIndex,
          startColumn: 0,
          endColumn: this.state.cols - 1,
        },
        source: this,
      });
    }
    return result;
  };

  move = (
    range: RangeDescriptor,
    rowOffset: number,
    columnOffset: number,
    replace?: boolean,
  ) => {
    const cols = this.columns.slice(range.startColumn, range.endColumn + 1);
    const targetCols = this.columns.slice(
      range.startColumn + columnOffset,
      range.endColumn + 1 + columnOffset,
    );
    const realRange = {
      startRow: range.startRow,
      startColumn: cols[0].columnIndex,
      endRow: range.endRow,
      endColumn: cols[cols.length - 1].columnIndex,
    };
    const targetRange: RangeDescriptor = {
      startRow: range.startRow + rowOffset,
      startColumn: targetCols[0].columnIndex,
      endRow: range.endRow + rowOffset,
      endColumn: targetCols[targetCols.length - 1].columnIndex,
    };
    if (
      !replace &&
      (!this.mergedCells.checkBeforeMove(realRange, rowOffset, columnOffset) ||
        !this.tables.checkBeforeMove(realRange, rowOffset, columnOffset) ||
        !this.edit.checkBeforeMove(realRange, targetRange, cols, targetCols))
    ) {
      return false;
    }

    cols.sort((a, b) => a.columnIndex - b.columnIndex);
    targetCols.sort((a, b) => a.columnIndex - b.columnIndex);

    const targetTables = this.tables.getForRange(targetRange);
    const pendingTableMove: [TableDescriptor, EditCellDescriptor[]][] = [];
    for (const table of targetTables) {
      const targetTableRange = getTableRangeInRange(targetRange, table, true);
      const rowOffset = Math.max(table.firstRowIndex - targetRange.startRow, 0);
      const columnOffset = Math.max(
        table.startColumn - targetRange.startColumn,
        0,
      );
      const endRowOffset = Math.max(targetRange.endRow - table.endRow, 0);
      const endColumnOffset = Math.max(
        targetRange.endColumn - table.endColumn,
        0,
      );
      const tableColumns = cols.filter(
        (column) =>
          column.columnIndex >= realRange.startColumn + columnOffset &&
          column.columnIndex <= realRange.endColumn - endColumnOffset,
      );
      const targetTableColumns = targetCols.filter(
        (column) =>
          column.columnIndex >= targetRange.startColumn + columnOffset &&
          column.columnIndex <= targetRange.endColumn - endColumnOffset,
      );
      const values = this.edit.getRange(
        realRange.startRow + rowOffset,
        realRange.endRow - endRowOffset,
        tableColumns,
      );
      const metas = this.editMeta.getRange(
        realRange.startRow + rowOffset,
        realRange.endRow - endRowOffset,
        tableColumns,
      );
      const styles = this.editStyle.getRange(
        realRange.startRow + rowOffset,
        realRange.endRow - endRowOffset,
        tableColumns,
      );
      const tablesData: EditCellDescriptor[] = [];
      for (let i = 0; i < values.length; i++) {
        const rowIndex = targetTableRange.startRow + i;
        const valuesRow = values[i];
        const metasRow = metas[i];
        const stylesRow = styles[i];
        for (let j = 0; j < targetTableColumns.length; j++) {
          const column = targetTableColumns[j];
          const data = {
            row: rowIndex,
            column: column.columnIndex - table.startColumn,
            value: valuesRow?.[j],
            meta: metasRow?.[j],
            style: stylesRow?.[j],
          };
          tablesData.push(data);
        }
      }

      pendingTableMove.push([table, tablesData]);
    }

    const tablesResult = new RangeResult<TableDescriptor>(targetTables);
    const value: MoveCallback<any> = (row, column) =>
      tablesResult.get(row, column.columnIndex) !== undefined;

    const { startRow, endRow } = range;
    this.edit.move(startRow, endRow, cols, rowOffset, targetCols, value);
    this.editMeta.move(startRow, endRow, cols, rowOffset, targetCols, value);
    this.editStyle.move(startRow, endRow, cols, rowOffset, targetCols, value);
    this.mergedCells.move(realRange, rowOffset, columnOffset);

    for (const [table, tableData] of pendingTableMove) {
      editTableCells(table, tableData);
    }

    const tables = this.tables.moveRange(realRange, rowOffset, columnOffset);
    for (const table of tables) {
      moveTableData(this, table, realRange, rowOffset, columnOffset);
    }
    this.onDataRangeChanged(range);
    this.onDataRangeChanged(targetRange);
    this.dispatchEvent({
      name: 'data',
      type: 'move',
      targetRange: targetRange,
      sourceRange: range,
      source: this,
    });
    return true;
  };

  private onDataRangeChanged = (
    range: RangeDescriptor,
    isNormalIndex = false,
  ) => {
    const startHeader = this.getHeader(range.startColumn);
    const endHeader = this.getHeader(range.endColumn);
    if (!startHeader || !endHeader) return;

    let targetRange = range;
    if (!isNormalIndex) {
      targetRange = {
        startRow: this.resolveRowIndex(range.startRow),
        startColumn: startHeader.columnIndex,
        endRow: this.resolveRowIndex(range.endRow),
        endColumn: endHeader.columnIndex,
      };
    }

    this.tables.setSpillingStateForRange(targetRange, (table) =>
      this.containsDataInRange(table.fullBounds, {
        skipTableWithName: table.name,
      }),
    );
  };

  private handleTableDataEvent = (event: DataEvent) => {
    // TODO: Tables should be identifiable
    // TODO: We should prevent events from being fired the parent data source,
    //  that is doing the change.
    // TODO: delegate all the events coming from a table when the change is
    //  being made outside the parent data source.
    if (
      event.name === 'load' ||
      event.name === 'error' ||
      (event.name === 'data' &&
        (event.type === 'hideColumns' ||
          event.type === 'hideRows' ||
          event.type === 'unhideColumns' ||
          event.type === 'unhideRows' ||
          event.type === 'reorder'))
    ) {
      this.dispatchEvent(event);
    }
  };
}
