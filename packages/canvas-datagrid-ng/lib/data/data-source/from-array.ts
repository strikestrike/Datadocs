import type { GridSchemaItem } from '../../types';
import { reorderInArray, reorderConsequentInArray } from '../reorder/array';
import { ColumnsManager } from './columns-manager';
import { InMemorySorter } from './in-memory-sorter';
import type {
  AllowAsync,
  DataSourceBase,
  EditCellDescriptor,
  FilterDescriptor,
  RequestDataFrameInput,
  RequestDataFrameOutput,
  SortDescriptor,
} from './spec';
import { guessColumnSchemas } from './guess-schema';
import { InMemoryFilter } from './in-memory-filter';
import { SizesManager } from './sizes-manager';
import { fillSequence } from '../../util';
import { TableModification } from './table-modification';
import { InMemoryHiddenRangeStore } from './in-memory-hidden-range-store';
import { InMemoryPositionHelper } from './in-memory-position-helper';
import type { PositionHelper } from './types/position-helper';
import { DefaultDataEventTarget } from '../event-target';
import { getDefaultDataSourceState } from './defaults';
import { DefaultNamespaceController } from '../namespace/default-controller';
import type {
  CellStyleDeclaration,
  MergedCellDescriptor,
} from '../../types/cell';
import { RangeResult } from '../../range/result';
import { DefaultNamedRangeManager } from '../../named-ranges/default-manager';
import { DefaultComponentProvider } from '../namespace/default-component-provider';
import { DefaultMergedCellsManager } from './merged-cells-manager';
import type { CellMeta } from './spec/base';
import { TableManager } from './table-manager';
import type {
  RangeDescriptor,
  TableDescriptor,
  TableSpillBehavior,
  TableStyle,
} from '../../types';
import {
  applyTableRowData,
  editTableCell,
  getCellStyleFromTable,
  getCellValueFromTable,
  loadTableDataForFrame,
} from '../table/util';
import { filterColumnsWithSparseRange } from '../../range/util';
import type { DataEvent } from './spec/events';

const returnTrue = () => true;
const numberSorters = {
  asc: (a: number, b: number) => a - b,
  desc: (a: number, b: number) => b - a,
};

export class DataSourceFromArray implements DataSourceBase {
  readonly name = 'Array';
  readonly namedRanges = new DefaultNamedRangeManager();
  readonly tables = new TableManager(this, (_, event) => {
    this.dispatchEvent({
      name: 'table',
      tableEvent: event,
    });
  });
  readonly namespace = new DefaultNamespaceController([
    new DefaultComponentProvider(this.namedRanges, this.tables),
  ]);
  readonly state = getDefaultDataSourceState();
  readonly sizes: SizesManager;
  readonly mergedCells = new DefaultMergedCellsManager();
  readonly positionHelper: PositionHelper;

  private readonly hiddenRowRanges = new InMemoryHiddenRangeStore();
  private columns: ColumnsManager;
  private sorter: InMemorySorter;
  private filter = new InMemoryFilter();
  private editMeta = new TableModification<CellMeta>();
  private editStyle = new TableModification<Partial<CellStyleDeclaration>>();

  //#region data event target
  private eventTarget = new DefaultDataEventTarget<DataEvent>();
  addListener = this.eventTarget.addListener;
  removeListener = this.eventTarget.removeListener;
  dispatchEvent = this.eventTarget.dispatchEvent;
  //#endregion

  constructor(private readonly rows: any[]) {
    this.state.rows = rows.length;

    const columns = guessColumnSchemas(rows);
    this.columns = new ColumnsManager(columns);
    this.sorter = new InMemorySorter(this.columns);
    this.sizes = new SizesManager(this.columns);
    this.positionHelper = new InMemoryPositionHelper(
      this,
      this.sizes,
      this.hiddenRowRanges,
    );
    this.state.cols = columns.length;
    this.state.initialized = true;
    this.state.loading = false;
  }
  containsDataInRange = (
    range: RangeDescriptor<unknown>,
    options?: { skipTableWithName?: string },
  ) => {
    throw new Error('Method not implemented.');
  };
  expandRange = (range: RangeDescriptor<unknown>) => {
    throw new Error('Method not implemented.');
  };

  createTable = (
    name: string,
    rowViewIndex: number,
    columnViewIndex: number,
    dataSource: DataSourceBase,
    style?: Partial<TableStyle>,
    spillBehavior?: TableSpillBehavior,
  ) => {
    // TODO: Convert to real indexes and respect the spill behavior.
    return this.tables.add(
      this.namespace,
      name,
      rowViewIndex,
      columnViewIndex,
      dataSource,
      style,
    );
  };
  deleteTable = (name: string) => {
    return this.tables.delete(name) !== null;
  };
  getTable = (name: string) => {
    return this.tables.get(name);
  };
  getTableByIndex = (rowViewIndex: number, columnViewIndex: any) => {
    return this.tables.getByIndex(rowViewIndex, columnViewIndex);
  };

  clearRange = (range: RangeDescriptor) => {
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
      startRow: range.startRow,
      startColumn: startColumnIndex,
      endRow: range.endRow,
      endColumn: endColumnIndex,
    };
    const columnIds: string[] = [];
    for (let i = range.startColumn; i <= range.endColumn; i++) {
      const header = this.getHeader(i);
      if (!header) return false;
      columnIds.push(header.id);
    }

    for (let i = range.startRow; i <= range.endRow; i++) {
      const row = this.rows[i];
      if (!row) continue;
      for (const columnId of columnIds) {
        delete row[columnId];
      }
    }

    this.editStyle.delete(columnIds, range.startRow, range.endRow);
    this.tables.deleteRange(targetRange);
    // TODO: Delete merged cells as well.

    return true;
  };

  getCellValue = (rowViewIndex: number, columnViewIndex: number) => {
    if (!this.columns) return;
    if (this.filter.indexes) rowViewIndex = this.filter.indexes[rowViewIndex];

    const { columnIndex } = this.getHeader(columnViewIndex);
    const table = this.getTableByIndex(rowViewIndex, columnIndex);
    if (table) {
      return getCellValueFromTable(table, rowViewIndex, columnIndex);
    }

    const column = this.columns.get(columnViewIndex);
    if (!column) return;

    const row = this.rows[rowViewIndex];
    if (!row) return;
    return row[column.dataKey];
  };

  getCellStyle = (rowViewIndex: number, columnViewIndex: number) => {
    if (!this.columns) return;
    if (this.filter.indexes) rowViewIndex = this.filter.indexes[rowViewIndex];

    const { columnIndex } = this.getHeader(columnViewIndex);
    const table = this.getTableByIndex(rowViewIndex, columnIndex);
    if (table) {
      const style = getCellStyleFromTable(table, rowViewIndex, columnIndex);
      if (style) return style;
    }

    const column = this.columns.get(columnViewIndex);
    if (!column) return;

    const v = this.editStyle.get(rowViewIndex, column.id);
    if (typeof v !== 'undefined') return v;
  };

  getCellMeta = (rowViewIndex: number, columnViewIndex: number) => {
    const column = this.columns.get(columnViewIndex);
    if (!column) return;
    let v = this.editMeta.get(rowViewIndex, column.id);
    if (typeof v === 'undefined') {
      v = Object.create(null);
      this.editMeta.modify(rowViewIndex, column.id, v);
    }
    return v;
  };

  getDataFrame = (request: RequestDataFrameInput) => {
    // TODO:
    // - [ ] The order of columns
    // - [ ] The order of rows
    let { startRow, endRow, startColumn, endColumn } = request;
    if (this.columns.length === 0) return { columns: [], cells: [], meta: [] };
    if (startColumn < 0) startColumn = 0;
    if (startColumn >= this.columns.length)
      return { columns: [], cells: [], meta: [] };
    if (endColumn >= this.columns.length) endColumn = this.columns.length - 1;

    const columns = filterColumnsWithSparseRange(
      this.columns.slice(startColumn, endColumn + 1),
      request.skippedColumns,
    );
    const columnsCount = columns.length;
    const range = {
      startRow,
      startColumn: columns[0]?.columnIndex ?? startColumn,
      endRow,
      endColumn: columns[columns.length - 1]?.columnIndex ?? endColumn,
    };
    const columnIds = columns.map((it) => it.id);
    // const rows = this.filteredRows || this.rows;
    const cells: string[][] = [];
    const rowHeaders: number[] = [];
    const meta: any[][] = [];
    const style: any[][] = [];
    const tables: TableDescriptor[] = [];
    const mergedCells: MergedCellDescriptor[] = [];
    const getResult = (): RequestDataFrameOutput => ({
      cells,
      columns,
      rowHeaders,
      meta,
      style,
      tables: new RangeResult(tables),
      mergedCells: new RangeResult(mergedCells),
    });
    if (startRow < 0) startRow = 0;

    if (this.filter.indexes) {
      const rowIndexes = this.filter.indexes;
      // empty
      if (rowIndexes.length === 0 || startRow >= rowIndexes.length)
        return getResult();
      if (endRow >= rowIndexes.length) endRow = rowIndexes.length - 1;

      for (let rowIndex = startRow; rowIndex <= endRow; rowIndex++) {
        const row = [];
        const rowStyle = [];
        const tablesForRow: TableDescriptor[] = [];
        const boundRowIndex = rowIndexes[rowIndex];
        const rawRow = this.rows[boundRowIndex];
        for (let columnIndex = 0; columnIndex < columnsCount; columnIndex++) {
          const col = columns[columnIndex];
          row.push(rawRow[col.dataKey]);
        }
        this.tables.getForRange(range, tablesForRow);
        this.mergedCells
          .getForRange(range)
          .forEach((mergedCell) => mergedCells.push(mergedCell));
        cells.push(row);
        this.editStyle.assign(rowStyle, columnIds, boundRowIndex);
        style.push(rowStyle);
        rowHeaders.push(boundRowIndex + 1);

        for (const table of tablesForRow) {
          tables.push(table);
          applyTableRowData(
            table,
            boundRowIndex,
            startColumn,
            endColumn,
            row,
            style,
          );
        }
      }

      return getResult();
    } else {
      // there is not a filter
      if (this.rows.length === 0 || startRow >= this.rows.length)
        return getResult();
      if (endRow >= this.rows.length) endRow = this.rows.length - 1;

      const range = {
        startRow,
        startColumn: 0,
        endRow,
        endColumn: columnsCount,
      };
      this.tables.getForRange(range, tables);
      this.mergedCells
        .getForRange(range)
        .forEach((mergedCell) => mergedCells.push(mergedCell));
      for (let rowIndex = startRow; rowIndex <= endRow; rowIndex++) {
        const row = [];
        const rowStyle = [];
        const rawRow = this.rows[rowIndex];
        for (let columnIndex = 0; columnIndex < columnsCount; columnIndex++) {
          const col = columns[columnIndex];
          row.push(rawRow[col.dataKey]);
        }
        cells.push(row);
        this.editStyle.assign(rowStyle, columnIds, rowIndex);
        style.push(rowStyle);
        rowHeaders.push(rowIndex + 1);
      }

      const output = getResult();
      for (const table of tables) {
        loadTableDataForFrame(table, request, output);
      }
      return output;
    }
  };
  deprecated_getAllSchema = () => this.columns.getAll();
  deprecated_getRowData = (rowViewIndex: number) => {
    if (this.filter.indexes) rowViewIndex = this.filter.indexes[rowViewIndex];
    return this.rows[rowViewIndex];
  };

  setSchema = (schema: GridSchemaItem[]) => {
    this.columns.set(schema);
    this.updateState();
    return true;
  };
  getHeaderById = (columnId: string) => this.columns.getById(columnId);
  getHeader = (viewIndex: number) => this.columns.get(viewIndex);
  getHeaders = () => this.columns.getAll(true);

  private updateState = () => {
    if (this.filter.indexes) this.state.rows = this.filter.indexes.length;
    else this.state.rows = this.rows.length;
    this.state.cols = this.columns.length;
    return true;
  };

  private createNewRowData = (rowBoundIndex?: number) => {
    const row = {};
    this.columns.forEach((column) => {
      const { defaultValue } = column;
      if (typeof defaultValue === 'function') {
        row[column.dataKey] = defaultValue(column, rowBoundIndex);
      } else {
        row[column.dataKey] = defaultValue || '';
      }
    });
    return row;
  };

  createColumns = returnTrue;
  deleteColumns = returnTrue;

  createRows = (afterRowViewIndex: number, count: number): boolean => {
    const rows = this.rows;

    let maxRowIndexes = rows.length - 1;
    if (this.filter.indexes) maxRowIndexes = this.filter.indexes.length - 1;

    const newRows = [];
    // prepend rows
    if (afterRowViewIndex <= -1) {
      for (let i = 0; i < count; i++) newRows.push(this.createNewRowData(i));
      rows.unshift(...rows);
    } else if (afterRowViewIndex >= maxRowIndexes) {
      // append rows
      for (let i = 0; i < count; i++)
        newRows.push(this.createNewRowData(i + rows.length));
      rows.push(...rows);
    } else {
      // insert rows

      // convert view index to bound index
      if (this.filter.indexes)
        afterRowViewIndex = this.filter.indexes[afterRowViewIndex];

      for (let i = 0; i < count; i++)
        newRows.push(this.createNewRowData(i + afterRowViewIndex + 1));
      rows.splice(afterRowViewIndex + 1, 0, ...newRows);
    }
    return this.updateState();
  };

  deleteRows = (rowViewIndex: number, count: number): boolean => {
    if (this.filter.indexes) {
      // remove view
      const removedBoundIndexes = this.filter.indexes.splice(
        rowViewIndex,
        count,
      );
      removedBoundIndexes.sort(numberSorters.asc);
      removedBoundIndexes.unshift(0);
      for (
        let viewIndex = 0, newLen = this.filter.indexes.length;
        viewIndex < newLen;
        viewIndex++
      ) {
        const boundIndex = this.filter.indexes[viewIndex];
        for (let sub = 1; sub < removedBoundIndexes.length; sub++) {
          if (boundIndex >= removedBoundIndexes[sub]) {
            this.filter.indexes[viewIndex] = boundIndex - sub;
            break;
          }
        }
      }

      // remove data
      for (let i = removedBoundIndexes.length - 1; i >= 0; i--) {
        const boundIndex = removedBoundIndexes[i];
        this.rows.splice(boundIndex, 1);
      }
    } else {
      // there is not a filter
      this.rows.splice(rowViewIndex, count);
    }
    return this.updateState();
  };

  editCells = (edit: EditCellDescriptor[], replace = false): boolean => {
    // convert view index to bound index
    if (this.filter.indexes) {
      const rowIndexes = this.filter.indexes;
      for (let i = 0; i < edit.length; i++) {
        edit[i].row = rowIndexes[edit[i].row];
      }
    }

    for (let i = 0; i < edit.length; i++) {
      const { row, column, value, style, meta } = edit[i];

      const table = this.getTableByIndex(row, column);
      if (table) {
        editTableCell(table, edit[i], replace);
        continue;
      }
      const columnInfo = this.columns.get(column);
      if (!columnInfo) continue;
      if (!this.rows[row]) this.rows[row] = this.createNewRowData(row);
      if (value !== undefined || replace) {
        this.rows[row][columnInfo.dataKey] = value;
      }
      if (meta !== undefined)
        this.editMeta.modify(row, columnInfo.dataKey, meta);
      if (style !== undefined) {
        const newStyle = {
          ...this.editStyle.get(row, columnInfo.id),
          ...style,
        };
        this.editStyle.modify(row, columnInfo.id, newStyle);
      } else if (replace) {
        this.editStyle.modify(row, columnInfo.id, undefined);
      }
    }
    return this.updateState();
  };

  getCurrentFilters = () => this.filter.lastFilters || [];
  setFilter = (filters: FilterDescriptor[]): boolean => {
    this.filter.filter(filters, this.rows, this.columns);
    this.updateState();
    this.dispatchEvent({ name: 'filter', source: this });
    return true;
  };

  getCurrentSorters = () => this.sorter.lastSort || [];
  sort = (sortRules: SortDescriptor[]): boolean => {
    this.sorter.sort(sortRules, this.rows);
    this.filter.filterAgain(this.rows, this.columns);
    this.updateState();
    this.dispatchEvent({ name: 'sort', source: this });
    return true;
  };

  hideColumns = (columnViewIndex: number, count: number, isGroup?: boolean) => {
    const removed = this.columns.hide(columnViewIndex, count, isGroup);
    if (removed) {
      this.sizes.hide(removed);
      return this.updateState();
    }
    return false;
  };

  unhideColumns = (afterViewIndex: number, isGroup?: boolean) => {
    const inserted = this.columns.unhide(afterViewIndex, isGroup);
    if (inserted) {
      this.sizes.unhide(afterViewIndex, inserted.columns);
      this.updateState();
      return inserted.columns.map((it) => it.columnViewIndex);
    }
    return;
  };

  allowReorderColumns = returnTrue;
  reorderField = (columnId: string, afterColumnId: string) => {
    return this.columns.reorderWithIds(columnId, afterColumnId);
  };
  reorderColumns = (
    columnViewIndex: number,
    count: number,
    afterViewIndex: number,
  ): boolean => {
    this.columns.reorder(columnViewIndex, count, afterViewIndex);
    this.sizes.reorderColumns(columnViewIndex, count, afterViewIndex);
    return this.updateState();
  };

  allowReorderRows = returnTrue;
  reorderRows = (
    beginViewIndex: number,
    count: number,
    afterViewIndex: number,
  ): AllowAsync<boolean> => {
    const viewIndexes = fillSequence(
      [],
      beginViewIndex,
      beginViewIndex + count - 1,
    );
    this.sizes.reorderRows(beginViewIndex, count, afterViewIndex);
    this.editStyle.reorder(viewIndexes, afterViewIndex);

    if (this.filter.indexes) {
      const realIndexes: number[] = [];
      for (let i = 0; i < count; i++)
        realIndexes.push(this.filter.indexes[beginViewIndex + i]);

      reorderInArray(
        this.rows,
        realIndexes,
        afterViewIndex < 0 ? -1 : this.filter.indexes[afterViewIndex],
      );
      this.setFilter(this.filter.lastFilters.map((it) => it[1]));
    } else {
      reorderConsequentInArray(
        this.rows,
        beginViewIndex,
        count,
        afterViewIndex,
      );
    }
    this.hiddenRowRanges.reorder(
      beginViewIndex,
      beginViewIndex + count - 1,
      afterViewIndex,
    );
    return this.updateState();
  };

  getHiddenColumns = (viewIndex: number) =>
    this.columns.getHiddenColumns(viewIndex);
  getHiddenColumnCount = (): number => this.columns.getHiddenColumnCount();
  getHiddenRowCount = () => this.hiddenRowRanges.getHiddenIndexCount();

  hideRows = (beginIndex: number, endIndex: number, isGroup?: boolean) => {
    return this.hiddenRowRanges.hide(beginIndex, endIndex, isGroup);
  };
  unhideRows = (beginIndex: number, endIndex: number) => {
    return this.hiddenRowRanges.unhide(beginIndex, endIndex);
  };

  move = returnTrue;
}
