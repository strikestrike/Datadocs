import { type DatabaseQueryProvider } from '@datadocs/local-storage';
import { transformDuckDBValue } from './utils/transformDuckDBValue';
import type { DuckDBState } from './types/db-state';
import type {
  Struct,
  CellStyleDeclaration,
  FilterableColors,
  GridHeader,
} from '@datadocs/canvas-datagrid-ng';
import { getGridTypeFromDatabaseType } from './utils/transformDuckDBTypes';
import { mergeCellMetadataProperty } from '@datadocs/canvas-datagrid-ng/lib/draw/cell-creator/cell-style';
import type { Metadata } from './types/metadata';
import type { InfoSchemaColumns } from '@datadocs/duckdb-utils';
import {
  ArrowAsyncRowReader,
  batchesToObjects,
  escapeId,
} from '@datadocs/duckdb-utils';

export const METADATA_ROW_UNIQUE_ID = '__row_unique_id';
export const METADATA_ROW_REF = '__metadata_row_ref';

export const METADATA_REF_ID = '__ref';
export const METADATA_REF_DATA = '__metadata';

const METADATA_DB_STRUCT_TYPE = `
  STRUCT(
    style STRUCT(
      isBold BOOLEAN,
      isItalic BOOLEAN,
      isStrikethrough BOOLEAN,
      isUnderline BOOLEAN,
      textColor VARCHAR,
      backgroundColor VARCHAR,
      fontSize INTEGER,
      textRotation INTEGER,
      fontFamily VARCHAR,
      iconSet VARCHAR,
      horizontalAlignment VARCHAR,
      verticalAlignment VARCHAR,
      wrapMode VARCHAR,
      borders STRUCT(
        top STRUCT(
          style VARCHAR,
          color VARCHAR
        ),
        bottom STRUCT(
          style VARCHAR,
          color VARCHAR
        ),
        "left" STRUCT(
          style VARCHAR,
          color VARCHAR
        ),
        "right" STRUCT(
          style VARCHAR,
          color VARCHAR
        )
      ),
      dataFormat STRUCT(
        type VARCHAR,
        format VARCHAR,
        decimalPlaces INTEGER,
        currency VARCHAR,
        timeZone VARCHAR,
        timeZoneOffset INTEGER,
        style VARCHAR,
        value VARCHAR,
        separator BOOLEAN,
        conjunction BOOLEAN,
        display VARCHAR[],
        image VARCHAR[]
      )
    ),
    linkData STRUCT(
      effectiveText VARCHAR,
      originalTextHash VARCHAR,
      spans STRUCT(
        startOffset INTEGER,
        endOffset INTEGER,
        label VARCHAR,
        ref VARCHAR
      )[]
    )
  )
`;

export function getEmptyDataFormat() {
  return {
    type: null,
    format: null,
    decimalPlaces: null,
    currency: null,
    timeZone: null,
    timeZoneOffset: null,
    style: null,
    value: null,
    separator: null,
    conjunction: null,
    display: [],
    image: [],
  };
}

function emptyBorder() {
  return { style: null, color: null };
}

export function getEmptyBorders(): Metadata['style']['borders'] {
  return {
    top: emptyBorder(),
    bottom: emptyBorder(),
    left: emptyBorder(),
    right: emptyBorder(),
  };
}

export function getEmptyStyle(): Metadata['style'] {
  return {
    isBold: null,
    isItalic: null,
    isStrikethrough: null,
    isUnderline: null,
    textColor: null,
    backgroundColor: null,
    fontSize: null,
    textRotation: null,
    fontFamily: null,
    iconSet: null,
    horizontalAlignment: null,
    verticalAlignment: null,
    wrapMode: null,
    borders: getEmptyBorders(),
    dataFormat: getEmptyDataFormat(),
  };
}

export function getEmptyMetadata(): Metadata {
  return {
    style: getEmptyStyle(),
    linkData: null,
  };
}

export function getEmptyLinkData(): Metadata['linkData'] {
  return {
    effectiveText: null,
    originalTextHash: null,
    spans: null,
  };
}

export function getEmptyLinkSpans(): Metadata['linkData']['spans'][number] {
  return {
    startOffset: null,
    endOffset: null,
    label: null,
    ref: null,
  };
}

const supportedStyleKey: Record<keyof Metadata['style'], boolean> = {
  isBold: true,
  isItalic: true,
  isStrikethrough: true,
  isUnderline: true,
  textColor: true,
  backgroundColor: true,
  fontSize: true,
  textRotation: true,
  fontFamily: true,
  iconSet: true,
  horizontalAlignment: true,
  verticalAlignment: true,
  wrapMode: true,
  borders: true,
  dataFormat: true,
};

/**
 * Class for metadata row
 *
 * The idea is if there're metadata changes of rows, we don't want to
 * invalid/refetch table value for those row. `RowsLoader` will hold
 * `MetadataRow` instances, so any changes to `MetadataRow` will be
 * available for rendering.
 */
export class MetadataRow {
  rowData: Record<string, number>;

  constructor(
    protected readonly metadataTable: MetadataTable,
    rowData: Record<string, number>,
  ) {
    this.rowData = rowData ?? {};
  }

  getColumnMetadataRef(columnId: string) {
    return this.rowData[columnId];
  }

  getColumnMetadata(columnId: string) {
    const ref = this.getColumnMetadataRef(columnId);
    return this.metadataTable.getMetadataFromRef(ref);
  }

  setColumnMetadata(columnId: string, metadataRef: number) {
    this.rowData[columnId] = metadataRef;
  }

  updateRowData(rowData: Record<string, number>, replace: boolean) {
    if (replace) {
      this.rowData = rowData ?? {};
    } else {
      this.rowData = { ...this.rowData, ...rowData };
    }
  }

  /**
   * Convert row data into value that can be used in sql statement
   * @returns
   */
  toSqlValue() {
    const columnNames = this.metadataTable.getColumnNames();
    return columnNames
      .map((columnName) => {
        return this.rowData[columnName] ?? 'null';
      }, this)
      .join(',');
  }
}

/**
 * Implementation of table metadata
 */
export class MetadataTable {
  /**
   * Indicate if all table has been init
   */
  isInit: boolean;
  /**
   * Metadata schema name
   */
  metadataSchemaName: string;
  /**
   * Metadata table name, should provide a unique name to prevent conflict
   * with other table in DuckDB
   */
  metadataTableName: string;
  /**
   * Metadata ref table name, should provide a unique name to prevent conflict
   * with other table in DuckDB
   */
  metadataRefTableName: string;
  /**
   * Metadata grid Struct type, use for transform DuckDB into grid consumable value
   */
  metadataStructType: Struct;
  /**
   * Loaded rows of metadata table
   */
  loaded: Record<number, MetadataRow> = {};
  /**
   * Loaded records of metadata ref table
   */
  loadedMetadataRef: Record<number, Metadata> = {};
  /**
   * A counter ensure that all row in metadata ref table have different value
   */
  metadataRefCounter = 1;
  /**
   * Use to keep track of which metadata ref has been loaded
   */
  loadedMetadataRefSet: Set<number> = new Set();

  constructor(
    protected readonly dbManager: DatabaseQueryProvider,
    readonly dbState: DuckDBState,
  ) {}

  async setMetadataTableName(
    metadataSchemaName: string,
    metadataTableName: string,
    metadataRefTableName: string,
  ) {
    this.metadataSchemaName = metadataSchemaName;
    this.metadataTableName = metadataTableName;
    this.metadataRefTableName = metadataRefTableName;
  }

  async init() {
    if (this.isInit) {
      console.warn('Metadata table has been init.');
      return;
    }

    if (!this.metadataRefTableName || !this.metadataTableName) {
      console.warn('Metadata table name not found.');
      return;
    }

    const connId = await this.dbManager.createConnection();
    try {
      // Create metadata table
      await this.createMetadataTable(connId);
      await this.createMetadataRefTable(connId);
    } catch (error) {
      console.error(error);
    } finally {
      this.isInit = true;
      await this.dbManager.closeConnection(connId);
    }
  }

  /**
   * Build metadata table name from Schema
   * @returns
   */
  getMetadataTableNameWithSchema(): string {
    return (
      (this.metadataSchemaName ? escapeId(this.metadataSchemaName) + '.' : '') +
      escapeId(this.metadataTableName)
    );
  }

  /**
   * Build metadata reference table name from Schema
   * @returns
   */
  getMetadataRefTableNameWithSchema(): string {
    return (
      (this.metadataSchemaName ? escapeId(this.metadataSchemaName) + '.' : '') +
      escapeId(this.metadataRefTableName)
    );
  }

  /**
   * Create metadata table. Metadata is stored one row by one row.
   *
   * <table_name> (
   *    <METADATA_ROW_UNIQUE_ID> INTEGER NOT NULL PRIMARY KEY, // used for joining the value table
   *    <METADATA_ROW_REF> INTEGER,                   // row metadata
   *    ...COLUMN_NAMES_ref INTEGER                   // rest of column inside value table
   * )
   * @param connId
   */
  async createMetadataTable(connId: string) {
    const tableFields: Array<string> = [];
    tableFields.push(METADATA_ROW_UNIQUE_ID + ' INTEGER NOT NULL PRIMARY KEY');
    this.getColumnNames().forEach((columnName) => {
      tableFields.push(`${escapeId(columnName, true)}` + ' INTEGER');
    });
    console.log(tableFields);
    const fieldsString = tableFields.join(', ');
    const queryString = `CREATE TABLE ${this.getMetadataTableNameWithSchema()} (${fieldsString});`;
    await this.dbManager.queryAll(queryString, connId);
  }

  /**
   * Create metadata ref table. It is used for storing metadata, ensure that we
   * don't duplicate the same metadata value.
   *
   * <table_name> (
   *    <METADATA_REF_ID> INTEGER NOT NULL PRIMARY KEY, // unique key of metadata
   *    <METADATA_REF_DATA> STRUCT,                     // metadata value
   * )
   * @param connId
   */
  async createMetadataRefTable(connId: string) {
    const tableFields: Array<string> = [];
    tableFields.push(METADATA_REF_ID + ' INTEGER NOT NULL PRIMARY KEY');
    tableFields.push(METADATA_REF_DATA + ' ' + METADATA_DB_STRUCT_TYPE);
    const fieldsString = tableFields.join(', ');

    const queryString = `CREATE TABLE ${this.getMetadataRefTableNameWithSchema()} (${fieldsString});`;
    await this.dbManager.queryAll(queryString, connId);

    // Get metadata struct type
    const schemaQuery = `SELECT column_name, data_type FROM information_schema.columns WHERE table_name='${this.metadataRefTableName}'`;
    const columns = batchesToObjects<InfoSchemaColumns>(
      await this.dbManager.queryAll(schemaQuery, connId),
    );
    for (const row of columns) {
      if (row.column_name === METADATA_REF_DATA) {
        this.metadataStructType = getGridTypeFromDatabaseType(
          row.data_type,
        ) as Struct;
      }
    }
  }

  getColumnNames() {
    const columnNames = this.dbState.fields?.map((col) => col.name) ?? [];
    return [METADATA_ROW_REF, ...columnNames];
  }

  /**
   * Get a clone of metadata associated with @ref to prevent changing the
   * original value and cause unexpected behaviors.
   * @param ref
   * @returns
   */
  getMetadataFromRef(ref: number) {
    // use structuredClone to not accidentaly modify the data
    return !isNaN(ref)
      ? structuredClone(this.loadedMetadataRef[ref])
      : undefined;
  }

  async getFilterableColorsForColumn(columnName: string, rowCount: number) {
    const result: FilterableColors = {
      cellColors: [],
      cellIcons: [],
      textColors: [],
    };
    let noFillBgColor = rowCount;
    let autoTextColor = rowCount;

    try {
      const connId = await this.dbManager.createConnection();
      let columnPath = `${this.getMetadataTableNameWithSchema()}.`;
      columnPath += escapeId(columnName, true);
      try {
        const query = `
          WITH style AS (
            SELECT UNNEST(${METADATA_REF_DATA}.style)
            FROM (
              SELECT ${METADATA_REF_DATA}
              FROM ${this.getMetadataRefTableNameWithSchema()}
              LEFT JOIN ${this.getMetadataTableNameWithSchema()}
                ON ${this.getMetadataRefTableNameWithSchema()}.${METADATA_REF_ID} = ${columnPath}
              WHERE ${columnPath} IS NOT NULL
            )
          )
          SELECT * FROM (
            (
              SELECT
                'bg' AS valType,
                backgroundColor AS color,
                COUNT(backgroundColor) AS _count
              FROM style GROUP BY backgroundColor
            ) UNION (
              SELECT
                'text' AS valType,
                textColor AS color,
                COUNT(textColor) AS _count
              FROM style GROUP BY textColor
            )
          )
          WHERE color IS NOT NULL
          ORDER BY color
        `;

        const stream = await this.dbManager.query(query, connId);
        const reader = new ArrowAsyncRowReader(stream);

        for await (const r of reader) {
          if (r['valType'] === 'bg') {
            const color = {
              color: r['color'],
              usageCount: Number(r['_count']),
            };
            result.cellColors.push(color);
            noFillBgColor -= color.usageCount;
          } else if (r['valType'] === 'text') {
            const color = {
              color: r['color'],
              usageCount: Number(r['_count']),
            };
            result.textColors.push(color);
            autoTextColor -= color.usageCount;
          }
        }
      } finally {
        await this.dbManager.closeConnection(connId);
      }
    } catch (e) {
      console.error(e);
    }

    if (noFillBgColor > 0 && result.cellColors.length > 0) {
      result.cellColors.unshift({ color: null, usageCount: noFillBgColor });
    }
    if (autoTextColor > 0 && result.textColors.length > 0) {
      result.textColors.unshift({ color: null, usageCount: autoTextColor });
    }

    return result;
  }

  /**
   * Load metadata table rows
   *
   * It provides ability to load multiple ranges inside metadata table,
   * because if there is a sort/filter in table value, the __row_unique_id
   * ranges are different from the range inside `RowsLoader.load`.
   * @param ranges Real ranges of unique row ids.
   * @returns
   */
  async load(ranges: Array<[number, number]>) {
    if (!this.isInit || ranges.length === 0) return;
    const connId = await this.dbManager.createConnection();

    const getQueryCondition = (ranges: Array<[number, number]>) => {
      const conditions: string[] = [];
      ranges.forEach((range) => {
        const [startRow, endRow] = range;
        conditions.push(
          `(${METADATA_ROW_UNIQUE_ID} BETWEEN ${startRow} AND ${endRow})`,
        );
      });
      return conditions.join(' OR ');
    };

    const columnNames = this.getColumnNames();
    const condition = getQueryCondition(ranges);
    const query = `SELECT * FROM ${this.getMetadataTableNameWithSchema()} WHERE ${condition}`;

    const batches = await this.dbManager.queryAll(query, connId);
    const records = batchesToObjects(batches);
    const rows = [];
    for (const r of records) {
      const row = { ...r };
      for (const column of columnNames) {
        row[column] = transformDuckDBValue(row[column], 'int');
      }
      rows[row[METADATA_ROW_UNIQUE_ID]] = row;
    }

    await this.loadMetadata(rows, connId);

    for (const [startRow, endRow] of ranges) {
      for (let i = startRow; i <= endRow; i++) {
        if (this.loaded[i]) {
          this.loaded[i].updateRowData(rows[i], true);
        } else {
          this.loaded[i] = new MetadataRow(this, rows[i]);
        }
      }
    }

    await this.dbManager.closeConnection(connId);
  }

  getLoadedMetadataRow(rowIndex: number): MetadataRow {
    return this.loaded[rowIndex];
  }

  getUnloadedMetadataRefs(rows: Array<Record<string, number>>) {
    const uniqueRefSet: Set<number> = new Set();
    const unloadedRefs: number[] = [];

    rows.forEach((row) => {
      for (const key in row) {
        if (key === METADATA_ROW_UNIQUE_ID || row[key] == null) {
          continue;
        }
        uniqueRefSet.add(row[key]);
      }
    });

    for (const ref of uniqueRefSet) {
      if (!isNaN(ref) && !this.loadedMetadataRefSet.has(ref)) {
        unloadedRefs.push(ref);
      }
    }

    return unloadedRefs;
  }

  async loadMetadata(rows: Array<Record<string, number>>, connId: string) {
    const unloadedRefs = this.getUnloadedMetadataRefs(rows);
    if (unloadedRefs.length === 0) {
      return;
    }

    const condition = `${METADATA_REF_ID} IN (${unloadedRefs.join(', ')})`;
    const query = `SELECT * FROM ${this.getMetadataRefTableNameWithSchema()} WHERE ${condition};`;

    const batches = await this.dbManager.queryAll(query, connId);
    const records = batchesToObjects(batches);
    for (const r of records) {
      const refId: number = transformDuckDBValue(r[METADATA_REF_ID], 'int');
      this.loadedMetadataRef[refId] = transformDuckDBValue(
        r[METADATA_REF_DATA],
        this.metadataStructType,
      );
    }

    this.loadedMetadataRefSet = new Set([
      ...this.loadedMetadataRefSet,
      ...unloadedRefs,
    ]);
  }

  /**
   * Combine new style with old metadata to create a new one
   * @param metadata Old metadata
   * @param style
   * @param replace
   * @returns
   */
  getNewMetadataFromStyle(
    metadata: Metadata,
    style: Partial<Metadata['style']>,
    replace = false,
  ): Metadata {
    const updatedStyle = { ...style };

    // Note: Aware of empty style and make sure not to ignore it
    for (const key in updatedStyle) {
      if (!supportedStyleKey[key]) {
        delete updatedStyle[key];
        continue;
      } else if (key === 'dataFormat') {
        updatedStyle.dataFormat = mergeCellMetadataProperty(
          getEmptyDataFormat(),
          updatedStyle.dataFormat,
          true,
        );
      } else if (key === 'borders') {
        updatedStyle.borders = mergeCellMetadataProperty(
          getEmptyBorders(),
          updatedStyle.borders,
          true,
        );
      } else if (updatedStyle[key] == null) {
        updatedStyle[key] = null;
      }
    }

    if (!metadata) {
      return mergeCellMetadataProperty(getEmptyMetadata(), {
        style: updatedStyle as Metadata['style'],
      });
    } else if (replace) {
      const normalizedStyle = mergeCellMetadataProperty(
        getEmptyStyle(),
        updatedStyle as any,
      );
      return { ...metadata, ...{ style: normalizedStyle } };
    } else {
      return mergeCellMetadataProperty(metadata, {
        style: updatedStyle as Metadata['style'],
      });
    }
  }

  /**
   * Create new metadata by combining the old one and linkData information
   * @param metadata
   * @param linkData
   * @returns
   */
  getNewMetadataFromLinkData(
    metadata: Metadata,
    linkData: Metadata['linkData'],
  ) {
    const updatedLinkData = { ...getEmptyLinkData(), ...linkData };
    if (updatedLinkData.spans?.length) {
      for (let i = 0; i < updatedLinkData.spans.length; i++) {
        updatedLinkData.spans[i] = {
          ...getEmptyLinkSpans(),
          ...updatedLinkData.spans[i],
        };
      }
    }

    if (!metadata) {
      return mergeCellMetadataProperty(getEmptyMetadata(), {
        linkData: updatedLinkData,
      });
    } else {
      return { ...metadata, linkData: updatedLinkData };
    }
  }

  metadataToSqlString(value: Metadata) {
    return JSON.stringify(value).replaceAll('"', "'");
  }

  getNextMetadataRefCounter() {
    return this.metadataRefCounter++;
  }

  addLoadedMetadataRef(metadataRef: number, metadata: Metadata) {
    this.loadedMetadataRefSet.add(metadataRef);
    this.loadedMetadataRef[metadataRef] = metadata;
  }

  async getOrInsertMetadata(metadata: Metadata, connId: string) {
    const metadataString = this.metadataToSqlString(metadata);
    const getMetadataQuery = `SELECT * FROM ${this.getMetadataRefTableNameWithSchema()} WHERE ${METADATA_REF_DATA}=${metadataString} LIMIT 1`;
    const batches = await this.dbManager.queryAll(getMetadataQuery, connId);
    const records = batchesToObjects(batches);

    for (const r of records) {
      // metadata already exist
      const metadataRef: number = transformDuckDBValue(
        r[METADATA_REF_ID],
        'int',
      );
      const metadata = transformDuckDBValue(
        r[METADATA_REF_DATA],
        this.metadataStructType,
      );
      this.addLoadedMetadataRef(metadataRef, metadata);
      return metadataRef;
    }

    const metadataRef = this.getNextMetadataRefCounter();
    const refSqlValue = '(' + metadataRef + ', ' + metadataString + ')';
    const insertMetadataQuery = `INSERT INTO ${this.getMetadataRefTableNameWithSchema()} VALUES ${refSqlValue}`;
    await this.dbManager.query(insertMetadataQuery, connId);
    this.addLoadedMetadataRef(metadataRef, metadata);
    return metadataRef;
  }

  /**
   * Get metadata row at @rowIndex . If not available, query it from DB
   * @param rowIndex
   */
  async getMetadataRow(rowIndex: number) {
    const row = this.getLoadedMetadataRow(rowIndex);
    if (!row) {
      await this.load([[rowIndex, rowIndex]]);
      return this.getLoadedMetadataRow(rowIndex);
    }
    return row;
  }

  /**
   * Change style for only one cell
   * @param rowIndex row unique id
   * @param columnId
   * @param format
   */
  async editCellStyle(
    rowIndex: number,
    columnId: string,
    style: Partial<Metadata['style']>,
    connId: string,
  ) {
    const metadataRow = await this.getMetadataRow(rowIndex);
    const newMetadata = this.getNewMetadataFromStyle(
      metadataRow.getColumnMetadata(columnId),
      style,
    );

    metadataRow.setColumnMetadata(
      columnId,
      await this.getOrInsertMetadata(newMetadata, connId),
    );

    const rowSqlValue = `(${rowIndex},${metadataRow.toSqlValue()})`;
    const metadataSqlQuery = `INSERT OR REPLACE INTO ${this.getMetadataTableNameWithSchema()} VALUES ${rowSqlValue}`;
    await this.dbManager.query(metadataSqlQuery, connId);
    this.loaded[rowIndex] = metadataRow;
  }

  /**
   * Edit link runs for a cell
   * @param rowIndex
   * @param columnId
   * @param linkData
   * @param connId
   */
  async editCellLinkData(
    rowIndex: number,
    columnId: string,
    linkData: Metadata['linkData'],
    connId: string,
  ) {
    const metadataRow = await this.getMetadataRow(rowIndex);
    const newMetadata = this.getNewMetadataFromLinkData(
      metadataRow.getColumnMetadata(columnId),
      linkData,
    );

    metadataRow.setColumnMetadata(
      columnId,
      await this.getOrInsertMetadata(newMetadata, connId),
    );

    const rowSqlValue = `(${rowIndex},${metadataRow.toSqlValue()})`;
    const metadataSqlQuery = `INSERT OR REPLACE INTO ${this.getMetadataTableNameWithSchema()} VALUES ${rowSqlValue}`;
    await this.dbManager.query(metadataSqlQuery, connId);
    this.loaded[rowIndex] = metadataRow;
  }

  /**
   * When appling a table column style, need to remove all related
   * style on cell-level
   * @param columnId
   * @param style
   * @param clearLinkRuns Whether link-runs should be cleared or not
   * @returns
   */
  async clearTableColumnStyle(
    columnId: string,
    style: Partial<CellStyleDeclaration>,
    clearLinkRuns: boolean,
  ) {
    const removeKeys: string[] = [];
    const oldStyle: Record<number, number> = {};

    for (const key in style) {
      if (supportedStyleKey[key]) {
        removeKeys.push(key);
      }
    }
    if (removeKeys.length === 0) return oldStyle;

    const connId = await this.dbManager.createConnection();
    const query = `SELECT ${METADATA_ROW_UNIQUE_ID},${columnId} FROM ${this.getMetadataTableNameWithSchema()} WHERE ${columnId} IS NOT NULL;`;
    const records = batchesToObjects(
      await this.dbManager.queryAll(query, connId),
    );
    const rows: Array<Record<string, number>> = [];
    const uniqueRefSet: Set<number> = new Set();
    const transformRefMap: Map<number, number> = new Map();

    for (const r of records) {
      const row = { ...r };
      for (const column of [columnId, METADATA_ROW_UNIQUE_ID]) {
        row[column] = transformDuckDBValue(row[column], 'int');
      }
      rows.push(row);
      uniqueRefSet.add(row[columnId]);
    }

    // there is no custom style at cell level in column
    if (rows.length === 0) {
      return;
    }

    // ensure that all meatadata is loaded
    await this.loadMetadata(rows, connId);

    // get and insert new metadata ref
    for (const ref of uniqueRefSet) {
      const metadata = this.getMetadataFromRef(ref);
      for (const key of removeKeys) {
        if (key === 'dataFormat') {
          metadata.style.dataFormat = getEmptyDataFormat();
        } else {
          metadata.style[key] = null;
        }
      }

      // Clear link run inside metadata if needed
      if (clearLinkRuns) {
        metadata.linkData = null;
      }

      const newRef = await this.getOrInsertMetadata(metadata, connId);
      transformRefMap.set(ref, newRef);
    }

    const sqlValues: string[] = [];
    rows.forEach((row) => {
      // get old dataformat of that has been changed for undo/redo
      if (row[columnId]) {
        oldStyle[row[METADATA_ROW_UNIQUE_ID]] = row[columnId];
      }

      // update new metadata for rows
      row[columnId] = transformRefMap.get(row[columnId]);
      const rowId = row[METADATA_ROW_UNIQUE_ID];
      sqlValues.push(`(${rowId},${row[columnId]})`);

      if (this.loaded[rowId]) {
        this.loaded[rowId].setColumnMetadata(columnId, row[columnId]);
      }
    });

    const queryString = `INSERT OR REPLACE INTO ${this.getMetadataTableNameWithSchema()}(${METADATA_ROW_UNIQUE_ID}, ${columnId}) VALUES ${sqlValues.join(
      ',',
    )};`;
    await this.dbManager.queryAll(queryString, connId);

    await this.dbManager.closeConnection(connId);

    return oldStyle;
  }

  /**
   * Clear table cells border. It is used when defining column
   * border style
   */
  async clearTableCellBorders(
    columnId: string,
    positions: Array<keyof GridHeader['borderStyle']>,
    topIndex: number,
    bottomIndex: number,
  ) {
    const connId = await this.dbManager.createConnection();
    const updateCellMetadata = (
      row: Record<string, number>,
      columnId: string,
      newMetadataRef: number,
      oldStyle: Record<number, number>,
    ) => {
      // get old dataformat of that has been changed for undo/redo
      if (row[columnId]) {
        oldStyle[row[METADATA_ROW_UNIQUE_ID]] = row[columnId];
      }

      // update new metadata for rows
      row[columnId] = newMetadataRef;
      const rowId = row[METADATA_ROW_UNIQUE_ID];

      // update new metadata for loaded rows
      if (this.loaded[rowId]) {
        this.loaded[rowId].setColumnMetadata(columnId, row[columnId]);
      }

      return `(${rowId},${row[columnId]})`;
    };

    // need to clear borders for all cell inside column
    const hasLeft = positions.includes('left');
    const hasRight = positions.includes('right');
    const hasInner = positions.includes('inner');
    const hasTop = positions.includes('top');
    const hasBottom = positions.includes('bottom');
    const oldStyle: Record<number, number> = {};
    const NOT_NULL_CHECK = `${columnId} IS NOT NULL`;
    const TOP_BOTTOM_CHECK = `(${METADATA_ROW_UNIQUE_ID}=${topIndex} OR ${METADATA_ROW_UNIQUE_ID}=${bottomIndex})`;
    const sqlValues: string[] = [];

    if (hasLeft || hasRight || hasInner) {
      // clear style for all cells in column
      const query = `SELECT ${METADATA_ROW_UNIQUE_ID},${columnId} FROM ${this.getMetadataTableNameWithSchema()} WHERE ${NOT_NULL_CHECK};`;
      const records = await this.dbManager.queryAll(query, connId);
      const rows: Array<Record<string, number>> = [];
      const uniqueRefSet: Set<number> = new Set();
      const transformRefMap: Map<number, number> = new Map();

      for (const record of records) {
        for (const r of record) {
          const row = { ...r };
          for (const column of [columnId, METADATA_ROW_UNIQUE_ID]) {
            row[column] = transformDuckDBValue(row[column], 'int');
          }
          rows.push(row);
          uniqueRefSet.add(row[columnId]);
        }
      }

      // there is no custom style at cell level in column
      if (rows.length === 0) {
        return;
      }

      // ensure that all meatadata is loaded
      await this.loadMetadata(rows, connId);

      const edit: any = {};
      if (hasLeft) {
        edit.left = emptyBorder();
      }
      if (hasRight) {
        edit.right = emptyBorder();
      }
      if (hasInner) {
        edit.top = emptyBorder();
        edit.bottom = emptyBorder();
      }

      // get and insert new metadata ref
      for (const ref of uniqueRefSet) {
        const metadata = this.getMetadataFromRef(ref);
        metadata.style.borders = mergeCellMetadataProperty(
          metadata.style.borders,
          edit,
          false,
        );
        const newRef = await this.getOrInsertMetadata(metadata, connId);
        transformRefMap.set(ref, newRef);
      }

      let changeTopBorder = true;
      let changeBottomBorder = true;
      let topRow: Record<string, number>;
      let bottomRow: Record<string, number>;

      rows.forEach((row) => {
        let shouldIgnoreRow = false;

        if (
          row[METADATA_ROW_UNIQUE_ID] === topIndex &&
          (!hasTop || !hasInner)
        ) {
          changeTopBorder = false;
          topRow = row;
          shouldIgnoreRow = true;
        }
        if (
          row[METADATA_ROW_UNIQUE_ID] === bottomIndex &&
          (!hasBottom || !hasInner)
        ) {
          changeBottomBorder = false;
          bottomRow = row;
          shouldIgnoreRow = true;
        }

        if (!shouldIgnoreRow) {
          sqlValues.push(
            updateCellMetadata(
              row,
              columnId,
              transformRefMap.get(row[columnId]),
              oldStyle,
            ),
          );
        }
      });

      if (!changeTopBorder) {
        const topCellEdit = { ...edit };
        if (!hasTop) {
          delete topCellEdit.top;
        } else {
          topCellEdit.top = emptyBorder();
        }
        const metadata = this.getMetadataFromRef(topRow[columnId]);
        metadata.style.borders = mergeCellMetadataProperty(
          metadata.style.borders,
          topCellEdit,
          false,
        );
        const newRef = await this.getOrInsertMetadata(metadata, connId);
        sqlValues.push(updateCellMetadata(topRow, columnId, newRef, oldStyle));
      }

      if (!changeBottomBorder) {
        const bottomCellEdit = { ...edit };
        if (!hasBottom) {
          delete bottomCellEdit.bottom;
        } else {
          bottomCellEdit.bottom = emptyBorder();
        }
        const metadata = this.getMetadataFromRef(bottomRow[columnId]);
        metadata.style.borders = mergeCellMetadataProperty(
          metadata.style.borders,
          bottomCellEdit,
          false,
        );
        const newRef = await this.getOrInsertMetadata(metadata, connId);
        sqlValues.push(
          updateCellMetadata(bottomRow, columnId, newRef, oldStyle),
        );
      }
    } else {
      const rows: Record<string, number>[] = [];
      let topRow: Record<string, number>;
      let bottomRow: Record<string, number>;

      // only clear style for current top/bottom cell in column
      const query = `SELECT ${METADATA_ROW_UNIQUE_ID},${columnId} FROM ${this.getMetadataTableNameWithSchema()} WHERE ${TOP_BOTTOM_CHECK} AND ${NOT_NULL_CHECK};`;
      const records = await this.dbManager.queryAll(query, connId);

      for (const record of records) {
        for (const r of record) {
          const row = { ...r };
          for (const column of [columnId, METADATA_ROW_UNIQUE_ID]) {
            row[column] = transformDuckDBValue(row[column], 'int');
          }
          if (row[METADATA_ROW_UNIQUE_ID] === topIndex) {
            topRow = row;
          }
          if (row[METADATA_ROW_UNIQUE_ID] === bottomIndex) {
            bottomRow = row;
          }
          rows.push(row);
        }
      }

      if (rows.length === 0) return;
      await this.loadMetadata(rows, connId);

      if (hasTop && topRow) {
        const topCellEdit = { top: emptyBorder() };
        const metadata = this.getMetadataFromRef(topRow[columnId]);
        metadata.style.borders = mergeCellMetadataProperty(
          metadata.style.borders,
          topCellEdit,
          false,
        );
        const newRef = await this.getOrInsertMetadata(metadata, connId);
        sqlValues.push(updateCellMetadata(topRow, columnId, newRef, oldStyle));
      }

      if (hasBottom && bottomRow) {
        const bottomCellEdit = { bottom: emptyBorder() };
        const metadata = this.getMetadataFromRef(bottomRow[columnId]);
        metadata.style.borders = mergeCellMetadataProperty(
          metadata.style.borders,
          bottomCellEdit,
          false,
        );
        const newRef = await this.getOrInsertMetadata(metadata, connId);
        sqlValues.push(
          updateCellMetadata(bottomRow, columnId, newRef, oldStyle),
        );
      }
    }

    if (sqlValues.length >= 0) {
      const queryString = `INSERT OR REPLACE INTO ${this.getMetadataTableNameWithSchema()}(${METADATA_ROW_UNIQUE_ID}, ${columnId}) VALUES ${sqlValues.join(
        ',',
      )};`;
      await this.dbManager.queryAll(queryString, connId);
    }
    await this.dbManager.closeConnection(connId);
    return oldStyle;
  }

  async updateTableColumnCellsStyle(
    columnId: string,
    rows: Record<number, number>,
  ) {
    const sqlValues: string[] = [];

    for (const rowId in rows) {
      sqlValues.push(`(${rowId},${rows[rowId]})`);
      if (this.loaded[rowId]) {
        this.loaded[rowId].setColumnMetadata(columnId, rows[rowId]);
      }
    }

    const connId = await this.dbManager.createConnection();
    const queryString = `INSERT OR REPLACE INTO ${this.getMetadataTableNameWithSchema()}(${METADATA_ROW_UNIQUE_ID}, ${columnId}) VALUES ${sqlValues.join(
      ',',
    )};`;
    await this.dbManager.query(queryString, connId);
    await this.dbManager.closeConnection(connId);
  }

  /**
   * Clear all cached data of metadata table
   */
  clear() {
    this.loaded = {};
    this.loadedMetadataRef = {};
    this.loadedMetadataRefSet = new Set();
  }
}
