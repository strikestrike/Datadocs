import type { GridSchemaItem } from '../lib/types';
import type {
  DataSourceBase,
  EditCellDescriptor,
  FilterDescriptor,
  RequestDataFrameInput,
  RequestDataFrameOutput,
  SortDescriptor,
  TableDescriptor,
  TableSpillBehavior,
  TableStyle,
} from '../lib/data/data-source/spec';
import { guessColumnSchema } from '../lib/data/data-source/guess-schema';
import { CSVReader } from '../lib/data/csv/csv-reader-browser';
import { TableModification } from '../lib/data/data-source/table-modification';
import { ColumnsManager } from '../lib/data/data-source/columns-manager';
import { OrderInLargeData } from '../lib/data/reorder/large-data';
import { SizesManager } from '../lib/data/data-source/sizes-manager';
import { InMemoryHiddenRangeStore } from '../lib/data/data-source/in-memory-hidden-range-store';
import type { PositionHelper } from '../lib/data/data-source/types/position-helper';
import { InMemoryPositionHelper } from '../lib/data/data-source/in-memory-position-helper';
import { getDefaultDataSourceState } from '../lib/data/data-source/defaults';
import { DefaultDataEventTarget } from '../lib/data/event-target';
import { DefaultNamespaceController } from '../lib/data/namespace/default-controller';
import type {
  CellStyleDeclaration,
  MergedCellDescriptor,
} from '../lib/types/cell';
import { RangeResult } from '../lib/range/result';
import { DefaultNamedRangeManager } from '../lib/named-ranges/default-manager';
import { DefaultComponentProvider } from '../lib/data/namespace/default-component-provider';
import { DefaultMergedCellsManager } from '../lib/data/data-source/merged-cells-manager';
import type { CellMeta } from '../lib/data/data-source/spec/base';
import { TableManager } from '../lib/data/data-source/table-manager';
import type { RangeDescriptor } from '../lib/types';
import {
  getCellStyleFromTable,
  getCellValueFromTable,
} from '../lib/data/table/util';
import type { DataEvent } from '../lib/data/data-source/spec/events';

const returnTrue = () => true;

export class DataSourceFromCSV implements DataSourceBase {
  readonly name = 'CSV';
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
  readonly mergedCells = new DefaultMergedCellsManager();
  readonly state = getDefaultDataSourceState();
  readonly sizes = new SizesManager();
  readonly positionHelper: PositionHelper;

  readonly reader: CSVReader;

  private readonly hiddenRowRanges = new InMemoryHiddenRangeStore();
  private columns: ColumnsManager;
  private csvColumnNamesMap: string[];

  private rowsOrder = new OrderInLargeData();
  private edit = new TableModification();
  private editMeta = new TableModification<CellMeta>();
  private editStyle = new TableModification<Partial<CellStyleDeclaration>>();

  private updateState = () => {
    const { reader, state } = this;
    state.initialized = reader.initialized;
    state.loading = reader.loading;
    if (reader.headers) {
      if (!this.columns) {
        const usedId = new Set<string>();
        this.columns = new ColumnsManager(
          reader.headers.map((it, index) =>
            guessColumnSchema(it, index, [], usedId),
          ),
        );
      }
      if (!this.csvColumnNamesMap) this.csvColumnNamesMap = reader.headers;
      this.sizes.columnsManager = this.columns;
    }
    this.state.cols = this.columns?.length || 0;
    this.state.rows = reader.lastRowIndex + 1;
    return true;
  };

  //#region data event target
  private eventTarget = new DefaultDataEventTarget<DataEvent>();
  addListener = this.eventTarget.addListener;
  removeListener = this.eventTarget.removeListener;
  dispatchEvent = this.eventTarget.dispatchEvent;
  //#endregion

  constructor(private readonly file: Blob) {
    this.positionHelper = new InMemoryPositionHelper(
      this,
      this.sizes,
      this.hiddenRowRanges,
    );
    this.reader = new CSVReader(file);
    this.reader.setLoadChunkListener((chunkId, chunk) => {
      console.log(`loaded csv chunk#${chunkId}, rows=${chunk.rows?.length}`);
      this.updateState();
      this.dispatchEvent({ name: 'load', source: this });
    });
    this.updateState();
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

    const { columnIndex } = column;
    const rowIndex = this.rowsOrder.getRealIndex(rowViewIndex);
    return this.tables.add(
      this.namespace,
      name,
      rowIndex,
      columnIndex,
      dataSource,
      style,
    );
  };
  deleteTable = (name: string) => {
    return !!this.tables.delete(name);
  };
  getTable = (name: string) => {
    return this.tables.get(name);
  };
  getTableByIndex = (rowViewIndex: number, columnViewIndex: any) => {
    return this.tables.getByIndex(rowViewIndex, columnViewIndex);
  };

  clearRange = returnTrue;
  containsDataInRange = (
    range: RangeDescriptor,
    options?: { skipTableWithName?: string; skipTables?: boolean },
  ) => {
    const { startRow: startRowIndex, endRow: endRowIndex } = range;
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
      startRow: range.startRow,
      startColumn: startColumn.columnIndex,
      endRow: range.endRow,
      endColumn: endColumn.columnIndex,
    };
    const tables = this.tables.getForRange(range);
    if (tables.length === 1 && !tables[0].isSpilling) {
      const table = tables[0];

      if (
        table.startRow <= tableRange.startRow &&
        table.endRow >= tableRange.endRow &&
        table.startColumn <= tableRange.startRow &&
        table.endRow >= tableRange.endRow &&
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
      const columnIds: string[] = [];
      let startRowIndex = 0;
      let endRowIndex = 0;
      let hadSuccess = false;
      let success = false;
      do {
        success = false;
        // Traverse all four sides of the range.
        for (let i = 0; i < 4; i++) {
          if (i === 0 || i === 1) {
            const currentColumn = this.getHeader(
              i === 0 ? range.startColumn - 1 : range.endColumn + 1,
            );
            if (!currentColumn) continue;
            startRowIndex = Math.max(range.startRow - 1, 0);
            endRowIndex = range.endRow + 1;
            columnIds.length = 0;
            columnIds.push(currentColumn.id);
          } else if (i === 2 || i === 3) {
            startRowIndex = i === 2 ? range.startRow - 1 : range.endRow + 1;
            endRowIndex = startRowIndex;
            if (i === 2) {
              columnIds.length = 0;
              for (
                let i = range.startColumn - 1;
                i <= range.endColumn + 1;
                i++
              ) {
                if (i < 0 || i >= this.columns.length) continue;
                columnIds.push(this.getHeader(i).id);
              }
            }
          }
          if (this.edit.containsData(columnIds, startRowIndex, endRowIndex)) {
            if (i === 0) range.startColumn--;
            else if (i === 1) range.endColumn++;
            else if (i === 2) range.startRow--;
            else if (i === 3) range.endRow++;
            success = true;
          }
        }
        if (success) hadSuccess = true;
      } while (success);
      if (hadSuccess) return true;
    }

    return false;
  };

  getCellValue = (rowViewIndex: number, columnViewIndex: number) => {
    if (!this.columns) return;

    const rowIndex = this.rowsOrder.getRealIndex(rowViewIndex);

    const table = this.getTableByIndex(rowIndex, columnViewIndex);
    if (table) {
      return getCellValueFromTable(table, rowIndex, columnViewIndex);
    }

    const column = this.columns.get(columnViewIndex);
    if (!column) return;

    const v = this.edit.get(rowIndex, column.id);
    if (typeof v !== 'undefined') return v;

    const row = this.reader.getRows(rowIndex, rowIndex);
    if (!row) return;
    return row[column.columnIndex];
  };

  getCellStyle = (rowViewIndex: number, columnViewIndex: number) => {
    if (!this.columns) return;

    const rowIndex = this.rowsOrder.getRealIndex(rowViewIndex);

    const table = this.getTableByIndex(rowIndex, columnViewIndex);
    if (table) {
      const style = getCellStyleFromTable(table, rowIndex, columnViewIndex);
      if (style) return style;
    }

    const column = this.columns.get(columnViewIndex);
    if (!column) return;

    const v = this.editStyle.get(rowIndex, column.id);
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
    let { startRow, startColumn, endColumn } = request;
    const { endRow } = request;
    let columns = this.columns ? this.columns.getAll() : [];
    if (columns.length === 0) return { columns: [], cells: [], meta: [] };
    if (startColumn < 0) startColumn = 0;
    if (startColumn >= columns.length)
      return { columns: [], cells: [], meta: [] };
    if (endColumn >= columns.length) endColumn = columns.length - 1;

    columns = columns.slice(startColumn, endColumn + 1);
    const columnIds = columns.map((it) => it.id);
    // const rows = this.filteredRows || this.rows;
    const cells: string[][] = [];
    const rowHeaders: number[] = [];
    const style: any[][] = [];
    const meta: any[][] = [];
    const tables: TableDescriptor[] = [];
    const mergedCells: MergedCellDescriptor[] = [];
    const getResult = (): RequestDataFrameOutput => ({
      cells,
      columns,
      meta,
      rowHeaders,
      style,
      mergedCells: new RangeResult(mergedCells),
      tables: new RangeResult(tables),
    });
    if (startRow < 0) startRow = 0;

    const intervals = this.rowsOrder.getRealIndexes(
      startRow,
      endRow - startRow + 1,
    );
    const targetRange = { startRow, startColumn, endRow, endColumn };

    this.tables.getForRange(targetRange, tables);
    this.mergedCells.getForRange(targetRange, mergedCells);

    for (const [startRow, endRow] of intervals) {
      const data = this.reader.getRows(startRow, endRow);
      const count = endRow - startRow + 1;
      for (let i = 0; i < count; i++) {
        let row = [];
        const rowStyle = [];
        const rawRow = data[i];
        if (rawRow) {
          row = columns.map((column) => {
            return rawRow[column.columnIndex];
          });
        }
        this.edit.assign(row, columnIds, startRow + i);
        this.editStyle.assign(rowStyle, columnIds, startRow + i);
        cells.push(row);
        style.push(rowStyle);
        rowHeaders.push(startRow + i + 1);
      }
    }

    return getResult();
  };

  deprecated_getAllSchema = () => (this.columns ? this.columns.getAll() : []);
  deprecated_getRowData = (rowViewIndex: number) => {
    if (!this.columns) return {};

    const rowIndex = this.rowsOrder.getRealIndex(rowViewIndex);
    const rows = this.reader.getRows(rowIndex, rowIndex);
    if (!rows || rows.length <= 0) return {};

    const row = rows[0];
    const result = {};
    const columns = this.columns.getAll();
    for (let i = 0; i < columns.length; i++) {
      const column = columns[i];
      const v = this.edit.get(rowIndex, column.id);
      result[column.name] =
        typeof v === 'undefined' ? row[column.columnIndex] : v;
    }
    return result;
  };

  setSchema = (schema: GridSchemaItem[]) => {
    this.columns = new ColumnsManager(schema);
    this.updateState();
    return true;
  };
  getHeaderById = (columnId: string) => this.columns.getById(columnId);
  getHeader = (viewIndex: number) => this.columns.get(viewIndex);
  getHeaders = () => this.columns.getAll(true);

  createColumns = returnTrue;
  deleteColumns = returnTrue;

  createRows = (afterRowViewIndex: number, count: number): boolean => {
    return false;
  };

  deleteRows = (rowViewIndex: number, count: number): boolean => {
    return false;
  };

  editCells = (edit: EditCellDescriptor[]): boolean => {
    if (!this.columns) return;
    for (let i = 0; i < edit.length; i++) {
      const e = edit[i];
      const column = this.columns.get(e.column);
      if (!column) continue;
      const rowId = this.rowsOrder.getRealIndex(e.row);
      if (e.value !== undefined) this.edit.modify(rowId, column.id, e.value);
      if (e.style !== undefined) {
        const style = {
          ...this.editStyle.get(rowId, column.id),
          ...e.style,
        };
        this.editStyle.modify(rowId, column.id, style);
      }
    }
    return this.updateState();
  };

  getCurrentFilters = () => [];
  setFilter = (filters: FilterDescriptor[]): boolean => {
    return false;
  };

  getCurrentSorters = () => [];
  sort = (sortRules: SortDescriptor[]): boolean => {
    return false;
  };

  hideColumns = (columnViewIndex: number, count: number, isGroup?: boolean) => {
    const removed = this.columns.hide(columnViewIndex, count, isGroup);
    if (removed) {
      this.sizes.hide(removed);
      return true;
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
    return this.updateState();
  };

  allowReorderRows = returnTrue;
  reorderRows = (
    beginViewIndex: number,
    count: number,
    afterViewIndex: number,
  ): boolean => {
    // const viewIndexes = fillSequence(
    //   [],
    //   beginViewIndex,
    //   beginViewIndex + count - 1,
    // );
    // this.sizes.reorderRows(viewIndexes, afterViewIndex);
    this.sizes.reorderRows(beginViewIndex, count, afterViewIndex);
    this.rowsOrder.reorder(beginViewIndex, count, afterViewIndex);
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
