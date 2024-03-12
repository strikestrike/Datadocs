import type {
  CellBorder,
  CellStyleDeclaration,
  DataSourceBase,
  DataGroup,
  GridHeader,
  GridPublicAPI,
  GridSavedFilter,
  GridSchemaItem,
  GridSort,
  GridStructPathType,
  RangeDescriptor,
  SortDescriptor,
  TableSpillBehavior,
  TableStyle,
  GridFilterValue,
  DataSourceSettings,
} from '@datadocs/canvas-datagrid-ng';
import { ColumnsManager } from '@datadocs/canvas-datagrid-ng/lib/data/data-source/columns-manager/index';
import { getDefaultDataSourceState } from '@datadocs/canvas-datagrid-ng/lib/data/data-source/defaults';
import { InMemoryFilter } from '@datadocs/canvas-datagrid-ng/lib/data/data-source/in-memory-filter';
import { InMemoryHiddenRangeStore } from '@datadocs/canvas-datagrid-ng/lib/data/data-source/in-memory-hidden-range-store';
import { InMemoryPositionHelper } from '@datadocs/canvas-datagrid-ng/lib/data/data-source/in-memory-position-helper';
import { DefaultMergedCellsManager } from '@datadocs/canvas-datagrid-ng/lib/data/data-source/merged-cells-manager';
import { SizesManager } from '@datadocs/canvas-datagrid-ng/lib/data/data-source/sizes-manager';
import type { DataEvent } from '@datadocs/canvas-datagrid-ng/lib/data/data-source/spec/events';
import { TableManager } from '@datadocs/canvas-datagrid-ng/lib/data/data-source/table-manager';
import { TableModification } from '@datadocs/canvas-datagrid-ng/lib/data/data-source/table-modification';
import { DefaultDataEventTarget } from '@datadocs/canvas-datagrid-ng/lib/data/event-target/index';
import { DefaultNamespaceController } from '@datadocs/canvas-datagrid-ng/lib/data/namespace/default-controller';
import { DefaultNamedRangeManager } from '@datadocs/canvas-datagrid-ng/lib/named-ranges/default-manager';
import type { DatabaseQueryProvider } from '@datadocs/local-storage';
import type { DuckDbDataSourceOptions } from './types/init-options';
import { DuckDBRowsLoader } from './RowsLoader';
import { updateDataSourceState } from '@datadocs/canvas-datagrid-ng/lib/data/data-source/generic/update-state';
import { Tick } from './utils';
import { getGridTypeFromDatabaseType } from './utils/transformDuckDBTypes';
import {
  getFilterableColorsForColumn,
  getFilterableValuesForColumn,
} from './filter/getFilterable';
import { editCells } from './editCells';
import { setFilterNg } from './filter/setFilter';
import {
  getCellMeta,
  getCellStyle,
  getCellValue,
  getCellValueByColumnId,
  getDataFrame,
} from './getData';
import { DuckDBState } from './types/db-state';
import { preload } from './preload-and-init';
import { getTableFromQuery } from './utils/deprecated/getTableFromQuery';
import { MetadataTable } from './MetadataTable';
import { ParsedDuckDBQuery } from './ParsedDuckDBQuery';
import { escape, escapeId, batchesToObjects } from '@datadocs/duckdb-utils';
import type { AsyncDuckDB } from '@datadocs/duckdb-wasm';

/**
 *
 */
export class FromDuckDb implements DataSourceBase {
  name = 'DuckDB';
  mergedCells = new DefaultMergedCellsManager();
  namedRanges = new DefaultNamedRangeManager();
  namespace = new DefaultNamespaceController();
  state = getDefaultDataSourceState();
  sizes = new SizesManager();
  hiddenRowRanges = new InMemoryHiddenRangeStore();
  positionHelper = new InMemoryPositionHelper(
    this,
    this.sizes,
    this.hiddenRowRanges,
  );
  tables = new TableManager(this);
  metadataTable: MetadataTable;
  contextId: string;
  prefix: string;

  readonly dbState = new DuckDBState();
  schemaName: string;
  rawQuery: DuckDbDataSourceOptions['query'];
  parsedQuery: ParsedDuckDBQuery;

  settings: DataSourceSettings = {
    caseSensitive: false,
    hideSubtotalsRows: false,
  };

  readonly connectionIds = {
    stateUpdate: undefined as string,
    suggestion: undefined as string,
  };

  /**
   * EXPERIMENTAL: Remove this after implementing formulas.
   * TODO: Remove EXPERIMENTAL.AUTOCREATECOLUMNS
   *
   * A record of tables where the key is the name and the SQL function, e.g.,
   * the key 'multiplied' with the value 'id * 2)' will turn into:
   *
   * (id * 2) AS multiplied
   */
  virtualColumns: Record<string, string> = {};

  protected readonly cellStyles = new TableModification<
    Partial<CellStyleDeclaration>
  >();
  protected readonly filter = new InMemoryFilter();

  // The sort feature has yet been implemented, the lastSort properties
  // is just a temporarily store sort state of columns and should be removed
  // in the future. It is just used for drawing table filter icon.
  private lastSort: Array<{
    column: GridHeader;
    dir: 'desc' | 'asc';
  }> = [];

  //#region temporarytypes
  protected readonly columns: ColumnsManager;

  readonly updateState = () => {
    return updateDataSourceState(
      this,
      this.positionHelper,
      this.tables,
      this.state,
      this.dbState.getNumRows(),
      this.columns.length,
    );
  };
  protected eventTarget = new DefaultDataEventTarget<DataEvent>();
  //#endregion temporarytypes

  readonly dbManager: DatabaseQueryProvider<AsyncDuckDB>;

  private readonly rowsLoader: DuckDBRowsLoader;
  private currentFilter: GridSavedFilter | undefined;
  private sorters: GridSort[] = [];
  private dataGroups: DataGroup[] = [];

  constructor(opts: DuckDbDataSourceOptions) {
    this.dbManager = opts.db;
    this.rawQuery = opts.query;
    this.schemaName = opts.schemaName;
    this.parsedQuery = new ParsedDuckDBQuery(opts.query);
    this.contextId = opts.contextId || this.parsedQuery.contextId;

    // todo: find a way to check if any duplicate
    // load the schema, then generate it via `generatePrefix`
    this.prefix = `__dd__${this.contextId.slice(0, 3)}`;

    this.dbState.setSelectionSource(opts.query.sql);
    if (opts.fields) this.dbState.fields = opts.fields;

    this.columns = new ColumnsManager([]);
    this.rowsLoader = new DuckDBRowsLoader(this, this.dbManager);
    this.metadataTable = new MetadataTable(this.dbManager, this.dbState);
    this.metadataTable.setMetadataTableName(
      this.schemaName,
      this.prefix + '_meta',
      this.prefix + '_metaref',
    );
    this.updateState();
  }

  currentGrid: GridPublicAPI;
  bind(grid: GridPublicAPI) {
    this.currentGrid = grid;
  }
  unbind() {
    this.currentGrid = null;
  }

  async setMetadataTableName(
    meatadataSchemaName: string,
    metadataTableName: string,
    metadataRefTableName: string,
  ) {
    this.metadataTable.setMetadataTableName(
      meatadataSchemaName,
      metadataTableName,
      metadataRefTableName,
    );
  }

  readonly abort = (id: number) => this.rowsLoader.loading.cancel(id);
  readonly preload: DataSourceBase['preload'] = preload;
  readonly getDataFrame = getDataFrame;
  readonly getCellValue = getCellValue;
  readonly getCellValueByColumnId = getCellValueByColumnId;
  readonly getCellStyle = getCellStyle;
  readonly getCellMeta = getCellMeta;

  readonly getTableNameForUpdate = () => {
    const q = this.rawQuery;
    if ('tbname' in q) return q.tbname;
    return getTableFromQuery(q.sql);
  };

  getFilter = (columnId: string) => {
    if (!this.currentFilter) return;
    if (this.currentFilter.type === 'advanced') {
      return this.currentFilter.simplified?.targets?.[columnId];
    }
    return this.currentFilter.targets[columnId];
  };
  getFilters = () => structuredClone(this.currentFilter);
  setFilterNg = setFilterNg;

  getSorter = (columnId: string) =>
    this.sorters.find(
      (sorter) => sorter.type === 'preset' && sorter.columnId === columnId,
    );
  getSorters = () => this.sorters.map((sorter) => structuredClone(sorter));
  setSorter = async (sort: GridSort | GridSort[]) => {
    const previous = this.getSorters();
    if (Array.isArray(sort)) {
      this.sorters = structuredClone(sort);
    } else if (sort) {
      this.sorters = this.sorters.filter(
        (other) =>
          sort.type !== other.type ||
          (sort.type === 'preset' &&
            other.type === 'preset' &&
            other.columnId !== sort.columnId),
      );
      this.sorters.splice(0, 0, structuredClone(sort));
    }

    if (await this.rowsLoader.updateState()) {
      this.updateState();
      this.dispatchEvent({
        name: 'sort',
        previous,
        change: sort,
      });
      const t = new Tick('preload for setSorter');
      const promises = this.preload();
      if (promises.wait) await promises.wait;
      t.tick('wait');
      if (promises.idle) {
        setTimeout(() => {
          t.tick();
          promises.idle().then(() => t.tick('idle'));
        }, 15);
      }
      return true;
    } else {
      this.sorters = previous;
    }

    return false;
  };
  removeSorter = async (columnId?: string) => {
    const sorters = columnId
      ? this.sorters.filter(
          (sort) => sort.type !== 'preset' || sort.columnId !== columnId,
        )
      : [];
    return await this.setSorter(sorters);
  };

  setGroups = async (groups: DataGroup[] | undefined) => {
    const previous = structuredClone(this.dataGroups);

    if (!groups || groups.length == 0) {
      this.dataGroups = [];
    } else {
      this.dataGroups = structuredClone(groups);
    }

    if (await this.rowsLoader.updateState()) {
      this.updateState();
      this.dispatchEvent({
        name: 'dataGroup',
        previous,
        current: structuredClone(this.dataGroups),
      });
      const t = new Tick('preload for setGroups');
      const promises = this.preload();
      if (promises.wait) await promises.wait;
      t.tick('wait');
      if (promises.idle) {
        setTimeout(() => {
          t.tick();
          promises.idle().then(() => t.tick('idle'));
        }, 15);
      }
      return true;
    }
    this.dataGroups = previous;
    return false;
  };
  getGroups = () => structuredClone(this.dataGroups);
  getGroupSummary = async (
    columnId: string,
    groupLookupValues: GridFilterValue[],
  ) => {
    return await this.rowsLoader.getGroupSummary(columnId, groupLookupValues);
  };
  setAggregationFn = async (columnId: string, fnName?: string | null) => {
    const header = this.getHeaderById(columnId);
    if (!header) return false;

    const previous = header.aggregationFn;
    header.aggregationFn = fnName;
    if (await this.rowsLoader.updateState()) {
      this.updateState();
      this.dispatchEvent({
        name: 'setAggregationFn',
        columnId,
        previous,
        current: fnName,
      });
      const t = new Tick('preload for setGroups');
      const promises = this.preload();
      if (promises.wait) await promises.wait;
      t.tick('wait');
      if (promises.idle) {
        setTimeout(() => {
          t.tick();
          promises.idle().then(() => t.tick('idle'));
        }, 15);
      }
      return true;
    }
    header.aggregationFn = previous;
    return false;
  };

  readonly getFilterableColorsForColumn = getFilterableColorsForColumn;
  readonly getFilterableValuesForColumn = getFilterableValuesForColumn;

  getStructFilterPath = (columnId: string) =>
    this.columns.getStructTarget(columnId);
  setStructFilterPath = (columnId: string, target: string | undefined) => {
    if (this.columns.setStructField(columnId, target)) {
      this.dispatchEvent({
        name: 'fieldsetting',
        columnId,
        target: 'structFilterPath',
      });
      return true;
    }
    return false;
  };
  getStructFilterPathType = (columnId: string) => {
    const column = this.getHeaderById(columnId);
    if (!column) return;
    return column.structFilterPathType;
  };
  setStructFilterPathType = (
    columnId: string,
    pathType: GridStructPathType,
  ) => {
    const column = this.getHeaderById(columnId);
    if (column) {
      column.structFilterPathType = pathType;
      this.dispatchEvent({
        name: 'fieldsetting',
        columnId,
        target: 'structFilterPath',
      });
      return true;
    }
    return false;
  };
  getJsonFieldStructure = async (columnId: string, limit: number) => {
    const column = this.getHeaderById(columnId);
    if (!column) return {};
    try {
      const { selectionSource } = this.dbState;
      const columnId = column.id;
      const escpaedId = escapeId(columnId, true);
      const query = `SELECT ${escpaedId} FROM (${selectionSource}) LIMIT ${limit}`;
      const map = {};
      const assign = (source, target: object, level = 0) => {
        if (
          Array.isArray(source) ||
          typeof source !== 'object' ||
          level > 100
        ) {
          return;
        }
        for (const [key, value] of Object.entries(source)) {
          if (typeof value === 'object') {
            let newTarget = target[key];
            if (!newTarget) target[key] = newTarget = {};
            assign(value, newTarget, level + 1);
          } else {
            target[key] = undefined;
          }
        }
      };

      const recordsInBatch = await this.dbManager.queryAll(query);
      for (const records of recordsInBatch) {
        for (const record of records) {
          try {
            const data = JSON.parse(record[columnId]);
            assign(data, map);
          } catch (e) {
            // Do nothing
          }
        }
      }
      return map;
    } catch (e) {
      // Do nothing
      console.error(e);
    }
    return {};
  };
  deprecated_getAllSchema = () => [];
  deprecated_getRowData = (rowViewIndex: number) => '';
  setSchema = (schema: GridSchemaItem[]) => false;
  getHeader = (viewIndex: number) => this.columns.get(viewIndex);
  getHeaderById = (columnId: string) => this.columns.getById(columnId);
  getHeaders = (search?: string) => {
    const result = this.columns.getAll(true);
    if (search) {
      search = search.trim();
      return result.filter((header) => header.title?.includes(search));
    }
    return result;
  };
  setHeaderVisibility = (columnId: string, visible: boolean | 'replace') => {
    const result =
      this.columns.setVisibility(columnId, visible) && this.updateState();
    const column = this.getHeaderById(columnId);
    if (result) {
      this.dispatchEvent({
        name: 'data',
        type:
          typeof visible === 'boolean' && visible
            ? 'unhideColumns'
            : 'hideColumns',
        targetRange: {
          startColumn: visible === 'replace' ? 0 : column.columnIndex,
          endColumn:
            visible === 'replace' ? this.state.cols - 1 : column.columnIndex,
          startRow: 0,
          endRow: this.state.rows - 1,
        },
        source: this,
      });
    }
    return result;
  };

  createRows = (afterRowViewIndex: number, count: number) => true;
  deleteRows = (rowViewIndex: number, count: number) => true;
  createColumns = async (
    afterColumnViewIndex: number,
    count: number | { name?: string; formula: string },
  ) => {
    // TODO: Remove EXPERIMENTAL.AUTOCREATECOLUMNS
    if (typeof count === 'object') {
      let { name, formula } = count;
      if (!name) name = `column_${this.columns.length + 1}`;
      const slug = name
        .toLowerCase()
        .trim()
        .replace(/[\s\W-]+/g, '_');
      this.virtualColumns[slug] = formula;

      console.log(JSON.stringify(this.virtualColumns, undefined, 1));

      if (await this.rowsLoader.updateState()) {
        const connId = await this.dbManager.createConnection();
        const escapedName = escape(this.rowsLoader.customViewTable);
        try {
          const queryStr =
            `SELECT column_name, data_type ` +
            `FROM information_schema.columns ` +
            `WHERE table_name=${escapedName}`;
          const batches = await this.dbManager.queryAll(queryStr, connId);
          const columns = batchesToObjects(batches);
          for (const row of columns) {
            if (row['column_name'] !== slug) continue;
            const databaseType = getGridTypeFromDatabaseType(row['data_type']);

            this.columns.insert(this.columns.length - 1, [
              {
                title: name,
                dataKey: slug,
                id: slug,
                type: databaseType,
              },
            ]);
            return this.updateState();
          }
        } finally {
          await this.dbManager.closeConnection(connId);
        }
      }

      delete this.virtualColumns[slug];
    }

    return false;
  };
  deleteColumns = (columnViewIndex: number, count: number) => true;
  containsDataInRange = (
    range: RangeDescriptor<unknown>,
    options?: { skipTableWithName?: string },
  ) => false;
  clearRange = async (
    range: RangeDescriptor,
    options?: { skipTables?: boolean },
  ) => {
    const tbname = this.getTableNameForUpdate();
    const connID = await this.dbManager.createConnection();

    const columns = this.columns.slice(range.startColumn, range.endColumn + 1);
    if (!columns.length) return false;

    let setColumns = '';
    for (const column of columns) {
      if (setColumns.length > 0) setColumns += ', ';
      setColumns += `${column.id} = NULL `;
    }

    // The query is for testing only
    await this.dbManager.query(
      `UPDATE ${tbname} ` +
        `SET ${setColumns}` +
        `WHERE id IN (` +
        `  SELECT id FROM (` +
        `    SELECT id, row_number() OVER () AS RowNum FROM ${tbname}` +
        `  ) t1 WHERE RowNum >= ${range.startRow + 1} AND RowNum <= ${
          range.endRow + 1
        }` +
        `)`,
      connID,
    );

    await this.dbManager.closeConnection(connID);
    return true;
  };
  expandRange = (range: RangeDescriptor<unknown>) => true;
  readonly editCells = editCells;

  createTable = (
    name: string,
    rowViewIndex: number,
    columnViewIndex: number,
    dataSource: DataSourceBase,
    style?: Partial<TableStyle>,
    spillBehavior?: TableSpillBehavior,
  ) => {
    const table = this.tables.add(
      this.namespace,
      name,
      rowViewIndex,
      columnViewIndex,
      dataSource,
      style,
    );
    if (table) {
      this.dispatchEvent({
        name: 'data',
        type: 'tableAdd',
        targetRange: table,
        source: this,
      });
    }
    return table;
  };
  deleteTable = (name: string) => {
    const table = this.tables.delete(name);
    if (table) {
      this.dispatchEvent({
        name: 'data',
        type: 'tableAdd',
        targetRange: table,
        source: this,
      });
    }
    return !!table;
  };
  getTable = (name: string) => this.tables.get(name);
  getTableByIndex = (rowViewIndex: number, columnViewIndex: number) =>
    this.tables.getByIndex(rowViewIndex, columnViewIndex);
  getTableGroupHeader = (rowViewIndex: number) =>
    this.rowsLoader.getGroupHeader(rowViewIndex);

  sort = (sortRules: SortDescriptor[]) => {
    for (const rule of sortRules) {
      if ('id' in rule) {
        const column = this.columns.getById(rule.id);
        const existRule = this.lastSort.find((r) => r.column.id === column.id);
        if (existRule) existRule.dir = rule.dir;
        else this.lastSort.push({ column, dir: rule.dir });
      }
    }

    this.dispatchEvent({ name: 'sort', source: this });
    return true;
  };

  getCurrentFilters = () => [];
  getCurrentSorters = (): { column: GridHeader; dir: 'desc' | 'asc' }[] =>
    this.lastSort || [];
  move = (
    range: RangeDescriptor<unknown>,
    rowOffset: number,
    columnOffset: number,
  ) => true;
  hideColumns = (columnViewIndex: number, count: number, isGroup?: boolean) => {
    return (
      this.columns.hide(columnViewIndex, count, isGroup) && this.updateState()
    );
  };
  unhideColumns = (afterColumnViewIndex: number, isGroup?: boolean) => {
    const inserted = this.columns.unhide(afterColumnViewIndex, isGroup);
    if (inserted) {
      this.sizes.unhide(afterColumnViewIndex, inserted.columns);
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
    }
    return inserted.columns.map((it) => it.columnViewIndex);
  };
  unhideAllColumns = () => {
    this.columns.unhideAll();
    this.dispatchEvent({
      name: 'data',
      type: 'unhideColumns',
      targetRange: {
        startColumn: 0,
        endColumn: this.state.cols - 1,
        startRow: 0,
        endRow: this.state.rows - 1,
      },
      source: this,
    });
    return this.updateState();
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
        startRow: range.startRow,
        startColumn: startColumnIndex,
        endRow: range.endRow,
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

  hideRows = (beginIndex: number, endIndex: number, isGroup?: boolean) => true;
  unhideRows = (beginIndex: number, endIndex: number, isGroup?: boolean) => {
    return { start: 0, end: 0 };
  };
  getHiddenColumns = (viewIndex: number) =>
    this.columns.getHiddenColumns(viewIndex);
  getHiddenColumnCount = (): number => this.columns.getHiddenColumnCount();
  getHiddenRowCount = () => this.hiddenRowRanges.getHiddenIndexCount();
  allowReorderColumns = (
    beginViewIndex: number,
    count: number,
    afterViewIndex?: number,
  ) => true;
  reorderField = (columnId: string, afterColumnId: string) =>
    this.columns.reorderWithIds(columnId, afterColumnId);
  reorderColumns = (
    beginViewIndex: number,
    count: number,
    afterViewIndex: number,
  ) => {
    if (!this.allowReorderColumns(beginViewIndex, count, afterViewIndex)) {
      return false;
    }
    this.columns.reorder(beginViewIndex, count, afterViewIndex);
    return true;
  };
  allowReorderRows = (
    beginViewIndex: number,
    count: number,
    afterViewIndex?: number,
  ) => true;
  reorderRows = (
    beginViewIndex: number,
    count: number,
    afterViewIndex: number,
  ) => true;

  editColumnStyle = async (
    viewIndex: number,
    style: Partial<CellStyleDeclaration>,
    clearLinkRuns: boolean,
    oldState: {
      column: Partial<CellStyleDeclaration>;
      cells: any;
      dataSource: FromDuckDb;
    },
  ) => {
    const header = this.columns.get(viewIndex);

    if (!header || !style) {
      return false;
    }

    const oldCellsStyle = await this.metadataTable.clearTableColumnStyle(
      header.id,
      style,
      clearLinkRuns,
    );
    const oldColumnStyle = { ...header.columnStyle };
    header.columnStyle = { ...header.columnStyle, ...style };

    oldState.column = oldColumnStyle;
    oldState.cells = oldCellsStyle;
    oldState.dataSource = this;
    return true;
  };

  editColumnBorders = async (
    viewIndex: number,
    positions: Array<keyof GridHeader['borderStyle']>,
    border: CellBorder,
    type: 'add' | 'clear',
    oldState?: {
      column: GridHeader['borderStyle'];
      cells: any;
      dataSource: FromDuckDb;
    },
  ) => {
    function isSameBorder(b1: CellBorder, b2: CellBorder) {
      return b1 == b2 || (b1?.style === b2?.style && b1?.color === b2?.color);
    }
    const header = this.columns.get(viewIndex);
    header.borderStyle = header.borderStyle ?? {};
    const oldBorders = { ...header.borderStyle };

    if (type === 'add') {
      positions.forEach((pos) => {
        header.borderStyle[pos] = border;
      });
    } else {
      positions.forEach((pos) => {
        const headerBorder = header.borderStyle[pos];
        if (!isSameBorder(headerBorder, border)) {
          header.borderStyle[pos] = null;
        }
      });
    }

    const oldCellsStyle = await this.metadataTable.clearTableCellBorders(
      header.id,
      positions,
      0,
      this.dbState.getNumRows() - 1,
    );

    if (oldState) {
      oldState.column = oldBorders;
      oldState.cells = oldCellsStyle;
      oldState.dataSource = this;
    }
    return true;
  };

  setColumnStyleState = async (
    columnId: string,
    columnStyle: Partial<CellStyleDeclaration>,
    cellsStyle: Record<number, number>,
  ) => {
    const header = this.columns.getById(columnId);
    if (!header) {
      return false;
    }

    header.columnStyle = { ...columnStyle };
    if (cellsStyle) {
      await this.metadataTable.updateTableColumnCellsStyle(
        columnId,
        cellsStyle,
      );
    }

    return true;
  };

  setColumnBorderState = async (
    columnId: string,
    columnBorder: GridHeader['borderStyle'],
    cellsStyle: Record<number, number>,
  ) => {
    const header = this.columns.getById(columnId);
    if (!header) {
      return false;
    }

    header.borderStyle = { ...columnBorder };
    if (cellsStyle) {
      await this.metadataTable.updateTableColumnCellsStyle(
        columnId,
        cellsStyle,
      );
    }

    return true;
  };

  getAllColumns(): GridHeader[] {
    return this.columns.getAll(true);
  }

  getSettings = () => structuredClone(this.settings);
  updateSettings = async (settings: Partial<DataSourceSettings>) => {
    const previous = structuredClone(this.settings);

    Object.assign(this.settings, settings);
    if (await this.rowsLoader.updateState()) {
      this.updateState();
    }

    this.dispatchEvent({
      name: 'settings',
      previous,
      current: structuredClone(this.settings),
    });
    return true;
  };

  addListener = this.eventTarget.addListener;
  removeListener = this.eventTarget.removeListener;
  dispatchEvent = this.eventTarget.dispatchEvent;
}
