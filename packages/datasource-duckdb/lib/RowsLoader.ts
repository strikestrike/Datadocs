import {
  RowsLoadingQueue,
  InMemRowsCacheManager,
} from '@datadocs/canvas-datagrid-ng/lib/data/rows-loader/index';
import type { FromDuckDb } from './FromDuckDb';
import type { DatabaseQueryProvider } from '@datadocs/local-storage';
import { transformDuckDBValue } from './utils/transformDuckDBValue';
import {
  type GridHeader,
  type ColumnType,
  type GridFilterValue,
  type TableGroupHeader,
  type TableGroupSummary,
  type TableSummaryFn,
  type DataGroup,
  type TableSummaryContext,
  DataType,
} from '@datadocs/canvas-datagrid-ng';
import type { LoadAllThreshold } from './LoadAllThresold';
import { isLoadingAllSatisfied } from './LoadAllThresold';
import {
  convertFilterToWhereClause,
  getOverridingBoolean,
  getSqlFieldFromPathInfo,
} from '@datadocs/canvas-datagrid-ng/lib/data/data-source/filters/utils';
import type { PreloadResult } from '@datadocs/canvas-datagrid-ng/lib/data/data-source/spec/preload';
import { Tick } from './utils';
import { countQuery } from './utils/countQuery';
import {
  METADATA_REF_DATA,
  METADATA_REF_ID,
  METADATA_ROW_REF,
  METADATA_ROW_UNIQUE_ID,
  type MetadataRow,
} from './MetadataTable';
import { mergeCellMetadataProperty } from '@datadocs/canvas-datagrid-ng/lib/draw/cell-creator/cell-style';
import {
  GRID_FILTER_CONDITION_NAME_CELL_COLOR,
  GRID_FILTER_CONDITION_NAME_TEXT_COLOR,
} from '@datadocs/canvas-datagrid-ng/lib/data/data-source/filters/constants';
import type { Metadata } from './types/metadata';
import { ArrowAsyncRowReader, escapeId } from '@datadocs/duckdb-utils';
import {
  getTableSummaryFn,
  isTableGroupFiltered,
} from '@datadocs/canvas-datagrid-ng/lib/data/table/util';
import { getTableInformationSchema } from './utils/getTableInformationSchema';
import type { TableField } from './types/db-state';
import { ensureAsync } from '@datadocs/canvas-datagrid-ng/lib/data/data-source/await';

export type DuckDBLoadedRow = {
  data: { [x: string]: any };
  style: { [x: string]: any };
  metadata: MetadataRow;
};

export type DuckDBRowsLoaderOptions = {
  loadingAll?: LoadAllThreshold;
};

type GroupsContextItem = {
  fieldNames: {
    /**
     * The default field name .
     */
    def: string;
    /**
     * {@link def} AS defAsSel.
     */
    defAsSel: string;
    /**
     * CAST({@link def} AS string) AS defAsStr
     */
    defAsStr: string;
    /**
     * This is the field that is used for grouping, and is the manipulated
     * version of the field used group by.
     *
     * String values are converted to lowercase.
     *
     * Variant values are fed into `variant_sort_hash()` function.
     */
    defAsGroup: string;
    /**
     * grouping({@link def}) AS grouping.
     */
    grouping: string;
    /**
     * lag({@link defAsSel}) AS defAsSelLag
     */
    defAsSelLag: string;
    /**
     * (${defAsSel} != ${defAsSelLag}) AS changing
     */
    changing: string;
  };
  clause: {
    groupSelect: (field: string) => string;
  };
  columnId: string;
  type: ColumnType;
  ascending: boolean;
};

type GroupsContext = {
  tblName: string;
  fieldNames: {
    /**
     * count(1).
     */
    count: string;
    /**
     * column id => summary field name.
     */
    summary: {
      header: GridHeader;
      name: string;
      fn: TableSummaryFn;
      /**
       * Becomes available after the groups are successfully set, and the fields
       * are queried.
       */
      dataType?: ColumnType;
    }[];
  };
  items: GroupsContextItem[];
  groups: DataGroup[];
  query: string;
};

type SummaryRowContext = {
  query: string;
  descs: Record<
    string,
    { header: GridHeader; fn: TableSummaryFn; type: ColumnType }
  >;
  fields: TableField[];
};

export class DuckDBRowsLoader {
  readonly loaded = new InMemRowsCacheManager<DuckDBLoadedRow>({
    data: {},
    style: {},
    metadata: null,
  });
  readonly loading: RowsLoadingQueue;

  private readonly customViewQuery: string;
  readonly tblName: string;
  readonly rowNum: string;
  readonly customViewTable: string;
  readonly summaryViewTable: string;
  private query: string;

  private options: DuckDBRowsLoaderOptions;
  private useCustomView = false;
  private groupsContext: GroupsContext | undefined;
  private summaryRowContext: SummaryRowContext | undefined;
  private customViewFields: { name: string; type: ColumnType }[] | undefined;

  constructor(
    private ds: FromDuckDb,
    private readonly dbManager: DatabaseQueryProvider,
    options?: DuckDBRowsLoaderOptions,
  ) {
    this.loading = new RowsLoadingQueue(
      {
        transformRange: this.optimizeRange.bind(this),
        load: this.load.bind(this),
      },
      {
        parallel: 1,
        fifo: true,
      },
    );

    this.tblName = this.ds.prefix + '_tblname';
    this.rowNum = this.ds.prefix + '_row_num';
    this.customViewTable = ds.prefix + '_custom_view';
    this.summaryViewTable = ds.prefix + '_summary_view';
    this.customViewQuery = `SELECT * FROM ${
      this.ds.schemaName ? escapeId(this.ds.schemaName) + '.' : ''
    }${this.customViewTable}`;
    this.query = this.baseQuery;
    this.options = options || {};
  }

  /**
   * We don't cache baseQuery in RowsLoader because the selection source may change
   * (For example, the selection source may be chnaged after optimization table is created)
   */
  get baseQuery() {
    return this.ds.dbState.selectionSource;
  }

  /**
   * This method is used to load the grid data for the first screen/current screen.
   *
   * Call this method before binding the data source to the grid to avoid table flickering.
   * This is because the grid will not receive an empty result from the data source initially.
   */
  readonly init = (viewPortRowsRange?: [number, number]): PreloadResult => {
    const { ds } = this;
    const { dbManager: db, contextId } = ds;

    const wait = (async () => {
      const init = ds.dbState.init;
      if (viewPortRowsRange)
        viewPortRowsRange = this.optimizeRange(viewPortRowsRange);
      if (init instanceof Promise) await init;
      if (viewPortRowsRange) {
        await this.load(viewPortRowsRange);
      } else console.warn(`RowsLoader#init doesn't receive a viewport range`);
      this.loaded.clearOutdated();
    })();

    const idle = async () => {
      const { dbState } = ds;
      const tick = new Tick(`Idle load for ${contextId.slice(0, 4)}`);
      let connID: string;
      const getConnID = async () => {
        if (!connID) connID = await db.createConnection();
        return connID;
      };

      if (typeof dbState.numRows !== 'number') {
        const numRows = await countQuery({
          db,
          connID: await getConnID(),
          from: dbState.selectionSource,
        });
        dbState.numRows = numRows;
        tick.tick(`counting all: numRows=${numRows}`);
      }

      const dataSize = {
        columns: dbState.getNumRows(),
        rows: dbState.numRows,
      };
      if (isLoadingAllSatisfied(this.options.loadingAll, dataSize)) {
        console.log(`Loading all rows for init`);
        await this.load([0, dbState.numRows], await getConnID());
      } else {
        // load partial rows
        const range = this.optimizeRange([0, 100]);
        if (range) await this.load(range, await getConnID());
      }

      if (connID) await db.closeConnection(connID);
    };
    return { wait, idle };
  };

  private optimizeRange(range: [number, number]): [number, number] | null {
    let [begin, end] = range;

    const numRows = this.ds.dbState.numRows;
    if (typeof numRows === 'number') {
      if (begin >= numRows) return null;
      if (end >= numRows) end = numRows - 1;
      if (begin > end) return null;
    }

    for (; begin <= end; begin++) {
      if (this.loaded.isRowLoaded(begin)) continue;
      break;
    }
    if (begin > end) return null;
    for (; end >= begin; end--) {
      if (this.loaded.isRowLoaded(end)) continue;
      break;
    }
    if (end < begin) return null;
    return [begin, end];
  }

  private async load(range: [number, number], connID?: string) {
    const [startRow, endRow] = range;
    const baseQuery = this.useCustomView
      ? this.customViewQuery
      : this.baseQuery;
    const rowCount = endRow - startRow + 1;
    let needToCloseConn = false;
    if (!connID) {
      connID = await this.dbManager.createConnection();
      needToCloseConn = true;
    }
    const query = `${baseQuery} OFFSET ${startRow} LIMIT ${rowCount}`;
    try {
      // TODO: Get actual __row_unique_id ranges from range
      await this.ds.metadataTable.load([range]);
      const records = await this.dbManager.queryAll(query, connID);
      const columns: { name: string; type: ColumnType }[] =
        this.customViewFields ?? this.ds.dbState.fields;
      let rowIndexPtr = startRow;
      for (const record of records) {
        // console.log(record);
        for (const v of record) {
          const row = {};
          for (const { name, type } of columns) {
            row[name] = transformDuckDBValue(v[name], type);
          }

          // Use the row number if available to load the metadata.
          const rowNum = row[this.rowNum];
          const rowIndex = rowNum ? Number(rowNum) : rowIndexPtr;

          this.loaded.add(rowIndexPtr, {
            data: row,
            style: {},
            metadata:
              this.ds.metadataTable.getLoadedMetadataRow(rowIndex) ?? null,
          });

          rowIndexPtr++;
        }
      }

      this.ds.updateState();
      this.ds.dispatchEvent({ name: 'load' });
    } finally {
      if (needToCloseConn) await this.dbManager.closeConnection(connID);
    }
  }

  private async loadSummaryRow() {
    if (!this.summaryRowContext) return;

    const context = this.summaryRowContext;
    const connID = await this.dbManager.createConnection();
    try {
      const stream = await this.dbManager.query(context.query, connID);
      const reader = new ArrowAsyncRowReader(stream);
      for await (const v of reader) {
        const row = {};
        for (const { name, type } of context.fields) {
          row[name] = transformDuckDBValue(v[name], type);
        }
        this.loaded.add('total', {
          data: row,
          style: {},
          metadata: null,
        });
      }
      this.ds.dispatchEvent({ name: 'load' });
    } finally {
      await this.dbManager.closeConnection(connID);
    }
  }

  readonly getCellsDataForRow = <T>(
    basedValues: T[],
    rowIndex: number,
    columnIds: string[],
  ) => {
    const row = this.loaded.get(rowIndex);
    if (!row) return;
    for (let i = 0; i < columnIds.length; i++) {
      const columnId = columnIds[i];
      if (columnId === '__proto__') continue;
      const modification = row.data[columnId];
      if (typeof modification !== 'undefined') basedValues[i] = modification;
    }
    return basedValues;
  };

  readonly getSummaryRow = (
    loadInto: TableSummaryContext[],
    columnIds: string[],
  ) => {
    if (!this.summaryRowContext) return;

    const row = this.loaded.get('total');
    if (!row) {
      this.loadSummaryRow();
      return loadInto;
    }
    columnIds.forEach((columnId, i) => {
      const desc = this.summaryRowContext.descs[columnId];
      if (!desc) return;

      loadInto[i] = {
        fn: desc.fn,
        dataType: desc.type,
        data: row.data[columnId],
      };
    });
    return loadInto;
  };

  readonly getCellsMetaForRow = <T>(
    basedValues: T[],
    rowIndex: number,
    columnIds: string[],
  ) => {
    const row = this.loaded.get(rowIndex);
    if (!row?.metadata) return;

    for (let i = 0; i < columnIds.length; i++) {
      const columnId = columnIds[i];
      if (columnId === '__proto__') continue;

      const linkData = row?.metadata?.getColumnMetadata(columnId)?.linkData;

      if (linkData?.spans) {
        basedValues[i] = { linkData } as T;
      }
    }

    return basedValues;
  };

  readonly getGroupHeader = (
    rowIndex: number,
  ): TableGroupHeader | undefined => {
    if (!this.groupsContext) return;

    const row = this.loaded.get(rowIndex);
    if (!row) return;

    const { fieldNames, items, groups } = this.groupsContext;
    const rowCount = row.data[fieldNames.count];
    const groupsData = items.map(({ columnId, fieldNames, type }) => {
      return {
        columnId,
        type,
        grouping: row.data[fieldNames.grouping],
        data: row.data[fieldNames.defAsSel],
        dataAsStr: row.data[fieldNames.defAsStr],
        changing: row.data[fieldNames.changing],
      };
    });

    const getSummary = (): Record<string, TableSummaryContext> => {
      const summaryData: Record<string, TableSummaryContext> = {};
      fieldNames.summary.forEach(({ header, name, dataType, fn }) => {
        summaryData[header.id] = {
          fn,
          dataType,
          data: row.data[name],
        };
      });
      return summaryData;
    };

    if (groupsData[0].grouping) {
      return {
        data: groupsData[0].data,
        dataType: groupsData[0].type,
        header: this.ds.getHeaderById(items[0].columnId),
        level: 0,
        rowType: 'total',
        collapsed: false,
        changing: true,
        rowCount,
        summaryData: getSummary(),
        hasSummaryData: true,
        filterValues: [],
      };
    } else {
      const index = groupsData.findIndex((data) => data.grouping);
      // Assume the index '0' will never land here thanks to the total row check
      // we do above.
      const level = (index === -1 ? groupsData.length : index) - 1;
      const group = groupsData[level];
      const header = this.ds.getHeaderById(group.columnId);
      const rowType =
        (level == groupsData.length - 1 &&
          (group.changing ? 'dataStart' : 'data')) ||
        'intermediate';
      const filterValues: string[] = [];

      for (let i = 0; i <= level; i++) {
        filterValues.push(groupsData[i].dataAsStr);
      }

      const groupHeader: TableGroupHeader = {
        data: group.data,
        dataType: group.type,
        header,
        level,
        rowType,
        collapsed: false,
        changing: group.changing,
        rowCount,
        summaryData: {},
        hasSummaryData: false,
        filterValues,
      };
      groupHeader.collapsed = isTableGroupFiltered(groups, groupHeader);

      if (
        rowType === 'intermediate' ||
        (rowType === 'dataStart' &&
          (groupHeader.collapsed || !this.ds.settings.hideSubtotalsRows))
      ) {
        groupHeader.summaryData = getSummary();
        groupHeader.hasSummaryData = true;
      }

      return groupHeader;
    }
  };

  readonly getCellsStyleForRow = <T>(
    basedValues: T[],
    rowIndex: number,
    columnIds: string[],
  ) => {
    const row = this.loaded.get(rowIndex);
    if (!row?.metadata) return;

    const rowStyle = row.metadata.getColumnMetadata(METADATA_ROW_REF)?.style;

    for (let i = 0; i < columnIds.length; i++) {
      const columnId = columnIds[i];
      if (columnId === '__proto__') continue;

      let modification = row.metadata.getColumnMetadata(columnId)?.style;
      if (rowStyle || modification) {
        let dataFormat = null;
        if (modification?.dataFormat?.type) {
          dataFormat = modification.dataFormat;
        } else if (rowStyle?.dataFormat?.type) {
          dataFormat = rowStyle.dataFormat;
        }

        modification = mergeCellMetadataProperty(rowStyle, modification, true);
        modification.dataFormat = dataFormat;
      }

      if (typeof modification !== 'undefined') {
        const borders = modification.borders;
        const newBorders = {};

        if (borders) {
          for (const key in borders) {
            if (borders[key].style) {
              newBorders[key] = borders[key];
            }
          }

          modification.borders = newBorders as Metadata['style']['borders'];
        }
        basedValues[i] = modification as T;
      }
    }
    return basedValues;
  };

  /**
   * Compares the previous and current query and recounts rows if there is a
   * change.
   * @returns True if there is a change and new query is successfully run.
   */
  readonly updateState = async () => {
    const { baseQuery } = this;
    const { query: prevQuery } = this;

    const savedFilter = this.ds.getFilters();
    const groups = this.ds.getGroups().filter((group) => !group.disabled);
    const sorts = this.ds.getSorters().filter((sort) => !sort.disabled);
    const virtualColumnNames = Object.keys(this.ds.virtualColumns);
    const dsSettings = this.ds.getSettings();

    const hasGroups = groups.length > 0;
    const hasSorts = sorts.length > 0;
    const hasVirtualColumns = virtualColumnNames.length > 0;
    const useCustomView = !!(
      hasGroups ||
      savedFilter ||
      hasSorts ||
      hasVirtualColumns
    );

    let selectionClause = '*';
    let loadMetadata = false;
    let leftJoins = '';
    let whereClause = '';
    let sortsClause = '';
    let groupsContext: GroupsContext | undefined;

    // TODO: Remove EXPERIMENTAL.AUTOCREATECOLUMNS
    if (hasVirtualColumns) {
      const { virtualColumns: columns } = this.ds;

      selectionClause += ', ';
      selectionClause += virtualColumnNames
        .map((name) => `(${columns[name] || `''`}) AS ${name}`)
        .join(', ');
    }

    const metadataCols: Record<string, { col: GridHeader; tbl: string }> = {};
    const addMetadataColumn = (columnId: string) => {
      const header = this.ds.getHeaderById(columnId);
      if (metadataCols[columnId]) return header;
      metadataCols[columnId] = {
        col: header,
        tbl: `${this.ds.prefix}_${header.dataKey}_md`,
      };
      loadMetadata = true;
      return header;
    };

    if (savedFilter) {
      whereClause += convertFilterToWhereClause(
        this.tblName,
        savedFilter,
        escapeId,
        this.ds.getHeaderById,
        dsSettings.caseSensitive,
        (condition) => {
          const { target } = condition;
          const { conditionName } = target;
          if (
            conditionName !== GRID_FILTER_CONDITION_NAME_TEXT_COLOR &&
            conditionName !== GRID_FILTER_CONDITION_NAME_CELL_COLOR
          ) {
            return '';
          }

          const header = addMetadataColumn(target.columnId);
          const styleKey =
            target.conditionName === GRID_FILTER_CONDITION_NAME_TEXT_COLOR
              ? 'textColor'
              : 'backgroundColor';
          const filterValue = target.values[0];
          const refField = metadataCols[target.columnId].tbl;
          const metadataField = `${refField}.${METADATA_REF_DATA}`;
          const targetField = `${metadataField}.style.${styleKey}`;
          const columnColor = header.columnStyle?.[styleKey];

          const nullity = `${metadataField} IS NULL OR ${targetField} IS NULL`;

          if (filterValue.valueType === 'null') {
            return nullity;
          } else if (filterValue.valueType === 'string') {
            const { value } = filterValue;
            const isColumnColor = value === columnColor;
            return (
              `${targetField} = '${value}'` +
              (isColumnColor ? ` OR ${nullity}` : '')
            );
          }
        },
      );
    }

    if (loadMetadata || savedFilter) {
      // Generate the row numbers if a filter is applied.
      selectionClause += `, ROW_NUMBER() OVER () - 1 AS ${this.rowNum}`;
    }

    if (loadMetadata) {
      const md = this.ds.metadataTable;

      leftJoins += `
        LEFT JOIN ${md.getMetadataTableNameWithSchema()}
          ON ${md.getMetadataTableNameWithSchema()}.${METADATA_ROW_UNIQUE_ID} = ${
        this.tblName
      }.${this.rowNum}
      `;

      for (const cols of Object.values(metadataCols)) {
        const columnName = cols.col.dataKey as string;
        leftJoins += `
          LEFT JOIN ${md.getMetadataRefTableNameWithSchema()} AS ${cols.tbl}
            ON ${
              cols.tbl
            }.${METADATA_REF_ID} = ${md.getMetadataTableNameWithSchema()}.${columnName}
        `;
      }
    }

    let newBaseQuery = `
      WITH ${this.tblName} AS (
        SELECT ${selectionClause} FROM ${baseQuery}
      )
      SELECT * FROM ${this.tblName}
      ${leftJoins}
      ${whereClause ? 'WHERE ' + whereClause : ''}
    `;

    if (hasGroups) {
      const rootTblName = this.ds.prefix + '_root_tbl';
      const groupingTblName = this.ds.prefix + '_grouping_tbl';
      const prefix = this.ds.prefix + '_group';
      const contextItems = groups.map((group): GroupsContextItem => {
        const header = this.ds.getHeaderById(group.columnId);
        const fieldAsSelection = prefix + '_' + header.dataKey;
        const caseSensitive = getOverridingBoolean(
          group.caseSensitive,
          dsSettings.caseSensitive,
        );

        const { field, target } = getSqlFieldFromPathInfo(
          undefined,
          escapeId(String(header.dataKey)),
          header.type,
          group.pathInfo,
        );

        return {
          fieldNames: {
            def: target,
            defAsSel: fieldAsSelection,
            defAsStr: `${fieldAsSelection}_str`,
            defAsGroup: `${fieldAsSelection}_group`,
            defAsSelLag: `${fieldAsSelection}_lag`,
            grouping: `${fieldAsSelection}_grouping`,
            changing: `${fieldAsSelection}_changing`,
          },
          clause: {
            groupSelect: (field) => {
              if (typeof header.type === 'object') {
                switch (header.type.typeId) {
                  case DataType.DateTime:
                  case DataType.Timestamp:
                    return `CAST(${field} AS DATE)`;
                  case DataType.Variant:
                  case DataType.Geography:
                  case DataType.Json:
                  case DataType.List:
                  case DataType.Struct:
                    return `sort_hash(${field})`;
                }
              } else if (header.type === 'string' && !caseSensitive) {
                return `LOWER(${field})`;
              }
              return field;
            },
          },
          columnId: group.columnId,
          type: field.type,
          ascending: group.ascending,
        };
      });
      const headers: GridHeader[] = await ensureAsync(this.ds.getHeaders());
      const showSubsummary = !dsSettings.hideSubtotalsRows;

      groupsContext = {
        tblName: groupingTblName,
        fieldNames: {
          count: `${prefix}_count`,
          summary: headers
            .map((header) => ({
              header,
              name: `${prefix}_summary_${header.dataKey}`,
              fn: getTableSummaryFn(header),
            }))
            .filter((summary) => summary.fn),
        },
        items: contextItems,
        query: newBaseQuery,
        groups,
      };

      const filterOnClause = groups
        .map((group) => {
          return group.collapsedValues
            .map((values) => {
              const result = values
                .map((value, i) => {
                  const { defAsGroup } = contextItems[i].fieldNames;
                  return (
                    `${groupingTblName}.${escapeId(defAsGroup)} != ` +
                    `'${value}'`
                  );
                })
                .join(' OR ');
              return `(${result})`;
            })
            .join(' AND ');
        })
        .filter((clause) => clause.length > 0)
        .join(' AND ');
      const filterFromClause = groups
        .map((group, i) => {
          if (i === groups.length - 1) return '';
          return group.collapsedValues
            .map((values) => {
              const result = values
                .map((value, i) => {
                  const { defAsGroup } = contextItems[i].fieldNames;
                  const subFieldNames = contextItems[i + 1]?.fieldNames;
                  return (
                    `${escapeId(defAsGroup)} != '${value}'` +
                    (subFieldNames
                      ? ` OR ${escapeId(subFieldNames.defAsGroup)} IS NULL`
                      : '')
                  );
                })
                .join(' OR ');
              return `(${result})`;
            })
            .join(' AND ');
        })
        .filter((clause) => clause.length > 0)
        .join(' AND ');

      const subsummaryEmptyRowJoin = `
        LEFT JOIN (SELECT true AS ____summary_row UNION ALL SELECT false) AS ___t1
        ON
          ${groupingTblName}.____grouping_any == 0
          ${filterOnClause ? ' AND ' + filterOnClause : ''}`;

      newBaseQuery = `
        WITH
          ${rootTblName} AS (${newBaseQuery}),
          ${groupingTblName} AS (
            SELECT
              COUNT(1) AS ${groupsContext.fieldNames.count},
              ${contextItems
                .map(
                  ({
                    fieldNames: {
                      def,
                      defAsSel,
                      defAsGroup,
                      defAsStr,
                      grouping,
                    },
                    clause: { groupSelect },
                  }) =>
                    `ANY_VALUE(${def}) as ${escapeId(defAsSel)}, ` +
                    `${groupSelect(def)} AS ` +
                    `${escapeId(defAsGroup)}, ` +
                    `CAST(${escapeId(defAsGroup)} AS text) ` +
                    `AS ${escapeId(defAsStr)}, ` +
                    `(GROUPING(${escapeId(defAsGroup)}) == 1) AS ` +
                    `${escapeId(grouping)}`,
                )
                .join(', ')}
              ${groupsContext.fieldNames.summary.length > 0 ? ', ' : ''}
              ${groupsContext.fieldNames.summary
                .map(
                  ({ header, name, fn }) =>
                    fn.getAsSql(escapeId(header.dataKey)) +
                    ` AS ${escapeId(name)}`,
                )
                .join(', ')},
              grouping(${contextItems
                .map(({ fieldNames: { defAsGroup } }) => escapeId(defAsGroup))
                .join(', ')}) AS ____grouping_any
            FROM ${rootTblName}
            GROUP BY ROLLUP(${contextItems
              .map((group) => escapeId(group.fieldNames.defAsGroup))
              .join(', ')})
          )
        SELECT *
        FROM ${groupingTblName}
        ${showSubsummary ? subsummaryEmptyRowJoin : ''}
        LEFT JOIN ${rootTblName}
        ON
          ${contextItems
            .map(
              ({ fieldNames: { def, defAsGroup }, clause: { groupSelect } }) =>
                `${groupSelect(def)} = ` +
                `${groupingTblName}.${escapeId(defAsGroup)}`,
            )
            .join(' AND ')}
          ${filterOnClause ? ' AND ' + filterOnClause : ''}
          ${showSubsummary ? ' AND ___t1.____summary_row == FALSE ' : ''}
        ${filterFromClause ? 'WHERE ' + filterFromClause : ''}
      `;

      if (sortsClause.length > 0) sortsClause += ', ';
      sortsClause += `
        (${contextItems
          .map(
            ({ fieldNames: { grouping } }) =>
              `${this.tblName}.${escapeId(grouping)} == TRUE`,
          )
          .join(' AND ')}) ASC,
        ${contextItems
          .map(
            ({ fieldNames: { defAsGroup, grouping }, ascending }, i) =>
              `(${this.tblName}.${escapeId(grouping)} == TRUE) DESC, ` +
              `${this.tblName}.${escapeId(defAsGroup)} ` +
              `${ascending ? 'ASC' : 'DESC'}` +
              (showSubsummary && i === contextItems.length - 1
                ? `, (____summary_row == TRUE) DESC`
                : ''),
          )
          .join(', ')}
        `;
    }

    if (hasSorts) {
      if (sortsClause.length > 0) sortsClause += ', ';
      sortsClause += sorts
        // TODO: Implement formula and icon sorts.
        .filter(
          (sort) =>
            !sort.disabled &&
            sort.type !== 'formula' &&
            sort.on.type !== 'icon',
        )
        .map((sort) => {
          if (sort.type === 'formula') throw 'Unimplemented';
          if (sort.on.type === 'value') {
            const column = this.ds.getHeaderById(sort.columnId);
            const caseSensitive = getOverridingBoolean(
              sort.caseSensitive,
              dsSettings.caseSensitive,
            );

            const { field, target } = getSqlFieldFromPathInfo(
              this.tblName,
              escapeId(column.dataKey),
              column.type,
              sort.on.type === 'value' ? sort.on.pathInfo : undefined,
            );

            let sortTarget = target;
            if (!caseSensitive) {
              if (typeof field.type === 'object') {
                if (
                  field.type.typeId === DataType.Variant ||
                  field.type.typeId === DataType.Geography ||
                  field.type.typeId === DataType.Json ||
                  field.type.typeId === DataType.List ||
                  field.type.typeId === DataType.Struct
                ) {
                  sortTarget = `sort_hash(${sortTarget})`;
                }
              } else if (field.type === 'string') {
                sortTarget += ' COLLATE NOCASE';
              }
            }

            return `${sortTarget} ` + sort.dir;
          }

          const header = addMetadataColumn(sort.columnId);
          const styleKey =
            sort.on.type === 'color' && sort.on.colorType === 'text'
              ? 'textColor'
              : 'backgroundColor';
          const value = sort.on.type === 'color' ? sort.on.code : null;
          const refField = metadataCols[sort.columnId].tbl;
          const metadataField = `${refField}.${METADATA_REF_DATA}`;
          const targetField = `${metadataField}.style.${styleKey}`;
          const columnColor = header.columnStyle?.[styleKey];

          const nullity = `${metadataField} IS NULL OR ${targetField} IS NULL`;
          // Desc moves the value to appear first, that is why we are flipping
          // it here.
          const direction = sort.dir === 'asc' ? 'DESC' : 'ASC';

          if (value === null) {
            return `(${nullity}) ${direction}`;
          }

          let condition = `${metadataField} IS NOT NULL AND ${targetField} = '${value}'`;
          if (value === columnColor) {
            condition = `${nullity} OR (${condition})`;
          }
          return `(${condition}) ${direction}`;
        })
        .join(', ');
    }

    let finalSelectionClause = '*';

    if (hasGroups) {
      finalSelectionClause +=
        ', ' +
        groupsContext.items
          .map(
            ({ fieldNames: { defAsGroup, defAsSelLag, changing } }) =>
              `lag(${escapeId(defAsGroup)}) ` +
              `OVER () AS ${escapeId(defAsSelLag)}, ` +
              `(${escapeId(defAsSelLag)} IS NULL ` +
              `OR ${escapeId(defAsGroup)} != ${escapeId(defAsSelLag)})` +
              ` AS ${escapeId(changing)}`,
          )
          .join(', ');
    }

    const newQuery = `
      WITH
        ${this.tblName} AS (SELECT * FROM (${newBaseQuery})),
        ${this.tblName}_final AS (
          SELECT * FROM ${this.tblName}
          ${sortsClause ? 'ORDER BY ' + sortsClause : ''}
        )
      SELECT ${finalSelectionClause} FROM ${this.tblName}_final
    `;

    if (newQuery !== prevQuery) {
      console.log('Query changed:');
      console.log(newQuery);
      this.loaded.clear();
      const t = new Tick('countRows');
      try {
        const { stateUpdate } = this.ds.connectionIds;
        if (stateUpdate) {
          try {
            await this.dbManager.closeConnection(stateUpdate);
          } catch {
            console.log('Failed to close the previous connection');
          } finally {
            this.ds.connectionIds.stateUpdate = undefined;
          }
        }

        const connID = await this.dbManager.createConnection();
        this.ds.connectionIds.stateUpdate = connID;

        try {
          if (useCustomView) {
            await this.dbManager.query(
              `CREATE OR REPLACE VIEW ${
                this.ds.schemaName ? escapeId(this.ds.schemaName) + '.' : ''
              }${this.customViewTable} AS (${newQuery})`,
              connID,
            );

            this.customViewFields = await getTableInformationSchema(
              this.dbManager,
              `SELECT * FROM ${
                this.ds.schemaName ? escapeId(this.ds.schemaName) + '.' : ''
              }${this.customViewTable}`,
              connID,
            );
          } else {
            this.customViewFields = undefined;
          }

          const numRows = await countQuery({
            db: this.dbManager,
            connID,
            sql: newQuery,
          });
          this.ds.dbState.numRows = numRows;
          this.query = newQuery;
          this.useCustomView = useCustomView;
          this.groupsContext = groupsContext;
          t.tick('done');

          if (groupsContext) {
            groupsContext.fieldNames.summary.forEach((summary) => {
              summary.dataType = this.customViewFields.find(
                (field) => field.name === summary.name,
              ).type;
            });
          }

          await this.updateSummaryRowState(groups, connID);
          return true;
        } catch (e) {
          if (connID === this.ds.connectionIds.stateUpdate) {
            throw e;
          }
        } finally {
          if (connID === this.ds.connectionIds.stateUpdate) {
            await this.dbManager.closeConnection(connID);
            this.ds.connectionIds.stateUpdate = undefined;
          }
        }
      } catch (e) {
        console.error(e);
      }
    } else if (await this.updateSummaryRowState(groups)) {
      return true;
    }

    return false;
  };

  private readonly updateSummaryRowState = async (
    groups: DataGroup[],
    connId?: string,
  ) => {
    const previous = this.summaryRowContext;
    const descs: { header: GridHeader; fn: TableSummaryFn }[] = [];
    const headers = this.ds.getHeaders();
    for (const header of headers) {
      const fn = getTableSummaryFn(header);
      if (fn) descs.push({ header, fn });
    }

    const tblName = this.summaryViewTable;
    const selectionSource = this.useCustomView
      ? (this.ds.schemaName ? escapeId(this.ds.schemaName) + '.' : '') +
        this.customViewTable
      : this.ds.dbState.selectionSource;

    const query =
      descs.length > 0 && groups.length == 0
        ? `SELECT  ${descs
            .map(
              ({ header, fn }) =>
                `${fn.getAsSql(escapeId(header.dataKey))} ` +
                `AS ${escapeId(header.dataKey)}`,
            )
            .join(', ')} FROM ${selectionSource}
         `
        : undefined;

    if (previous?.query !== query) {
      const shouldCloseConn = !!connId;
      if (!connId) connId = await this.dbManager.createConnection();
      try {
        if (query) {
          await this.dbManager.query(
            `CREATE OR REPLACE VIEW ${
              this.ds.schemaName ? escapeId(this.ds.schemaName) + '.' : ''
            }${tblName} AS (${query})`,
            connId,
          );

          const fields = await getTableInformationSchema(
            this.dbManager,
            `SELECT * FROM ${
              this.ds.schemaName ? escapeId(this.ds.schemaName) + '.' : ''
            }${tblName}`,
            connId,
          );
          const newDescs: SummaryRowContext['descs'] = {};

          for (const { fn, header } of descs) {
            const field = fields.find((field) => field.name === header.dataKey);
            if (!field) continue;

            newDescs[header.id] = {
              fn,
              header,
              type: field.type,
            };
          }

          this.summaryRowContext = {
            query,
            descs: newDescs,
            fields,
          };
        } else {
          await this.dbManager.query(`DROP VIEW IF EXISTS ${tblName};`, connId);
          this.summaryRowContext = undefined;
        }
        this.loadSummaryRow();
        return true;
      } catch (e) {
        console.error(e);
      } finally {
        if (shouldCloseConn) await this.dbManager.closeConnection(connId);
      }
    }

    return false;
  };

  getGroupSummary = async (
    columnId: string,
    groupLookupValues: GridFilterValue[],
  ): Promise<TableGroupSummary[]> => {
    const context = this.groupsContext;
    if (!context) return [];

    const header = this.ds.getHeaderById(columnId);
    const { items, fieldNames, tblName } = context;
    const summaryField = fieldNames.summary.find(
      (other) => other.header.id == columnId,
    );

    if (!summaryField) return [];

    const query = `
      WITH ${tblName} AS (
        SELECT
        COUNT(1) AS ${fieldNames.count},
          ${items
            .map(
              ({
                fieldNames: { def, defAsSel, defAsGroup, grouping },
                clause: { groupSelect },
              }) =>
                `ANY_VALUE(${escapeId(def)}) AS ${escapeId(defAsSel)}, ` +
                `${groupSelect(escapeId(def))} AS ${escapeId(defAsGroup)}, ` +
                `(GROUPING(${escapeId(defAsGroup)}) == 1) AS ` +
                `${escapeId(grouping)}`,
            )
            .join(', ')},
            ${summaryField.fn.getAsSql(escapeId(header.dataKey))}
              AS ${escapeId(summaryField.name)}
        FROM (${context.query})
        GROUP BY ROLLUP(${items
          .map((group) => escapeId(group.fieldNames.defAsGroup))
          .join(', ')})
      )
      SELECT * FROM ${tblName}
      ORDER BY
          (${items
            .map(
              ({ fieldNames: { grouping } }) =>
                `${tblName}.${escapeId(grouping)} == TRUE`,
            )
            .join(' AND ')}) ASC,
          ${items
            .map(
              ({ fieldNames: { defAsGroup, grouping }, ascending }) =>
                `(${tblName}.${escapeId(grouping)} == TRUE) DESC, ` +
                `${tblName}.${escapeId(defAsGroup)} ` +
                `${ascending ? 'ASC' : 'DESC'}`,
            )
            .join(', ')}
    `;

    console.log('query is');
    console.log(query);

    try {
      const connID = await this.dbManager.createConnection();
      try {
        type ResultAccessor = Record<
          string,
          { accessor: ResultAccessor; summary: TableGroupSummary }
        >;

        const stream = await this.dbManager.query(query, connID);
        const reader = new ArrowAsyncRowReader(stream);
        const result: TableGroupSummary[] = [];
        const resultAccessor: ResultAccessor = {};
        const groupByHeaders = items.map((item) =>
          this.ds.getHeaderById(item.columnId),
        );

        for await (const v of reader) {
          let prevResultAccessor: ResultAccessor = resultAccessor;
          let prevContainer: TableGroupSummary[] = result;
          for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const groupHeader = groupByHeaders[i];

            let groupHeaderType = groupHeader.type;
            if (
              typeof groupHeaderType === 'object' &&
              (groupHeaderType.typeId === DataType.Timestamp ||
                groupHeaderType.typeId === DataType.DateTime)
            ) {
              groupHeaderType = 'date';
            }

            const grouping = v[item.fieldNames.grouping];
            if (grouping) break;

            const group = transformDuckDBValue(
              v[item.fieldNames.defAsSel],
              groupHeader.type,
            );
            const groupAsStr = String(group);
            const summaryData = transformDuckDBValue(
              v[summaryField.name],
              summaryField.dataType,
            );

            let curResultAccessor = prevResultAccessor[groupAsStr];
            let curContainer: TableGroupSummary[] =
              curResultAccessor?.summary?.subgroups;
            if (!curResultAccessor) {
              curContainer = [];
              curResultAccessor = {
                summary: {
                  group,
                  headerDataType: groupHeaderType,
                  summary: summaryData,
                  summaryFn: summaryField.fn,
                  summaryDataType: summaryField.dataType,
                  subgroups: curContainer,
                },
                accessor: {},
              };
              prevResultAccessor[groupAsStr] = curResultAccessor;
              prevContainer.push(curResultAccessor.summary);
            }

            prevResultAccessor = curResultAccessor.accessor;
            prevContainer = curContainer;
          }
        }

        return result;
      } finally {
        await this.dbManager.closeConnection(connID);
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  };
}
