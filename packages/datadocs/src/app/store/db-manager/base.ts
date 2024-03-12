/**
 * @deprecated This file is deprecated
 * Please add code into `duckdb.ts` but not this file.
 * We keep this file as a reference
 */
import type { AsyncDuckDBConnection } from "@datadocs/duckdb-wasm";
import type {
  Table,
  RecordBatch,
  AsyncRecordBatchStreamReader,
} from "apache-arrow";

import type { Writable } from "svelte/store";
import { get, writable } from "svelte/store";

import type {
  OptimizedType,
  StoreType,
  ConnectionType,
  QueryState,
  TableSchema,
  SchemaChildrenItemResult,
} from "./types";
import { getGridTypeFromDatabaseType } from "@datadocs/datasource-duckdb";
import type {
  DBTable,
  DBTableType,
} from "../../../components/panels/Sources/components/tree-view";
import {
  columnFieldFromDatabaseField,
  createDatabaseSchemaItem,
  generateExampleCounter,
} from "../panels/store-sources-panel";
import type {
  DatabaseSchemaItem,
  DatabaseTableItem,
  DatabaseViewItem,
  ManagedFileTableItem,
  ManagedFileViewItem,
} from "../panels/sources/type";
import { isDQLQuery, parseDuckDBSQL } from "@datadocs/duckdb-utils";

/**
 * Default value for Decimal type
 */
export const defaultDecimalPrecision = 38;
export const defaultDecimalScale = 0;
export const defaultDecimalBitWidth = 128;

/**
 * Class for manage and query data base
 */
export abstract class BaseDBManager {
  /**
   * Store database object
   */
  readonly store: StoreType;
  /**
   * Store dummy table status for demo
   */
  readonly tempTableStatuses: Writable<{ [key: string]: boolean }>;
  /**
   * Store table schema like name, colname, coltype
   */
  readonly tableSchemas: { [key: string]: TableSchema };
  /**
   * Store information of data fetching from database
   */
  readonly gridQueryStateMap: { [key: string]: QueryState };
  /**
   * Mapping ID to connection
   */
  readonly connectionMapping: { [key: string]: ConnectionType };

  optimizedPrefix: string;

  connectionPrefix: string;

  counterIndex: number;

  optimizedType: OptimizedType;

  constructor(store: StoreType, optimizedType: OptimizedType = "VIEW") {
    this.tempTableStatuses = writable({});
    this.tableSchemas = {};
    this.gridQueryStateMap = {};
    this.connectionMapping = {};
    this.counterIndex = 0;
    this.store = store;
    this.optimizedType = optimizedType;
  }

  /**
   * Create database connection
   */
  abstract createConnection(): Promise<string>;

  /**
   * Close database connection
   * @param connID
   */
  abstract closeConnection(connID: string);

  /**
   * Retrieve connection
   * @param connID
   * @returns
   */
  getConnection(connID: string): ConnectionType {
    return this.connectionMapping[connID];
  }

  /**
   * update table schema
   * @param schema
   */
  updateTableSchemas(schema: TableSchema) {
    this.tableSchemas[schema.tbname] = schema;
  }

  /**
   * Update Optimized type for manager
   * @param value
   */
  updateOptimizedType(value: OptimizedType) {
    this.optimizedType = value;
  }

  /**
   * Get updated query from schema
   * @param schema
   */
  abstract getUpdatedQuery(
    schema: TableSchema,
    limit: number,
    offset: number
  ): string;

  /**
   * Get Number of Rows for current query
   * @param schema
   */
  abstract getUpdatedQueryNumRows(
    schema: TableSchema,
    connID: string,
    currQuery: string
  ): Promise<number>;

  /**
   * Query data from database base on query string and connection ID
   * @param queryStr
   * @param connID
   */
  abstract query(queryStr: string, connID: string): Promise<Table<any>>;

  /**
   * Query stream data from database
   * @param queryStr
   * @param connID
   */
  abstract send(
    queryStr: string,
    connID: string
  ): Promise<AsyncRecordBatchStreamReader>;

  /**
   * Query all result rows from database
   * @param queryStr
   * @param connID
   */
  abstract all(queryStr: string, connID: string): Promise<RecordBatch<any>[]>;

  /**
   * Cancel query for connection
   * @param connID
   */
  abstract cancelQuery(connID: string);

  /**
   * create table base on CSV url
   * @param name
   * @param connID
   */
  abstract importCsv(name: string, connID: string);

  /**
   * create table base on CSV file
   * @param file
   * @param name
   * @param connID
   */
  abstract importFile(file: File, name: string, connID: string);

  /**
   * create table base on ingesting file
   * @param file
   * @param name
   * @param connID
   */
  abstract ingestFile(file: File, name: string, connID: string);

  /**
   * Function to create file and store it to duckdb
   * @param file
   * @param fileName
   * @param connID
   */
  abstract createFile(file: File, fileName: string): Promise<boolean>;

  /**
   * Function to check file exists in duckdb
   * @param fileName
   */
  abstract fileExists(fileName: string): Promise<boolean>;

  /**
   * Function to drop file in duckdb
   * @param fileName
   */
  abstract dropFile(fileName: string): Promise<boolean>;

  /**
   * fetch query data from database
   * @param connID
   * @param limit
   * @param offset
   * @param queryStr
   * @returns
   */
  async fetchQueryData(
    connID: string,
    queryStr: string,
    limit: number,
    offset: number
  ): Promise<RecordBatch<any>[]> {
    let updatedQuery = queryStr;
    if (
      this.optimizedType !== null &&
      isDQLQuery(parseDuckDBSQL(queryStr).lexer)
    ) {
      const schema = this.getTableSchemaByQuery(queryStr);
      if (!schema) {
        return [];
      }
      updatedQuery = this.getUpdatedQuery(schema, limit, offset);
    }

    const result = await this.send(updatedQuery, connID);
    return result.readAll();
  }

  /**
   * Generate Unique connection ID
   * @returns
   */
  generateConnectionID(): string {
    this.counterIndex++;
    return `${this.connectionPrefix}${this.counterIndex}`;
  }

  /**
   * Gennerate Unique optimized ID
   * @returns
   */
  generateOptimizedID(): string {
    this.counterIndex++;
    return `${this.optimizedPrefix}${this.counterIndex}`;
  }

  /**
   * Check connection is valid or not
   * @param connID
   * @returns
   */
  validConnection(connID: string): boolean {
    if (this.connectionMapping[connID]) {
      return true;
    }
    return false;
  }

  /**
   * Update status for tempoary table table
   * @param name
   * @param status
   */
  updateTemporaryTableStatus(name: string, status: boolean) {
    this.tempTableStatuses.update((value) => {
      value[name] = status;
      return value;
    });
  }

  /**
   * Get demo table status
   * @param name
   * @returns
   */
  getTemporaryTableStatus(name: string): boolean {
    return get(this.tempTableStatuses)[name];
  }

  /**
   * get table schema base on query
   * @param query
   * @returns TableSchema | null
   */
  getTableSchemaByQuery(query: string): TableSchema | null {
    let schema: TableSchema | null = null;
    for (const tbname in this.tableSchemas) {
      if (
        this.tableSchemas[tbname].query === query &&
        this.optimizedType === "VIEW TABLE"
      ) {
        if (this.tableSchemas[tbname].tbtype === "BASE TABLE") {
          schema = this.tableSchemas[tbname];
          break;
        } else {
          schema = this.tableSchemas[tbname];
          continue;
        }
      }
      if (
        this.tableSchemas[tbname].query === query &&
        this.tableSchemas[tbname].tbtype === this.optimizedType
      ) {
        schema = this.tableSchemas[tbname];
        break;
      }
    }

    return schema;
  }

  /**
   * get existing grid query state base on id, create new if not existing
   * @param id
   * @param createNew
   * @returns
   */
  getGridQueryStateById(id: string, createNew = false): QueryState {
    let queryState = this.gridQueryStateMap[id];

    if (!queryState && createNew) {
      queryState = {
        tbname: "test",
        // Math.floor(Math.random() * 100) % 2 ? "investments_short" : "test",
        currentQuery: "",
        loadedData: false,
        fields: [],
        numRows: 100,
        startPoint: {
          rowIndex: 0,
          colIndex: 0,
        },
      };
      this.gridQueryStateMap[id] = queryState;
    }

    return queryState;
  }

  /**
   * Get list of schema
   * @param connID
   */
  abstract getSchemasList(
    connID: string,
    catalogName: string
  ): Promise<string[]>;

  /**
   * Get schema of database
   * @param connID
   */
  async getDatabaseSchemaItems(
    connID: string,
    catalogName: string,
    parentId: string
  ): Promise<DatabaseSchemaItem[]> {
    const schemas: string[] = await this.getSchemasList(connID, catalogName);
    const dbSchemas: DatabaseSchemaItem[] = [];
    for (const schemaName of schemas) {
      dbSchemas.push(createDatabaseSchemaItem(schemaName, parentId));
    }
    return dbSchemas;
  }

  abstract getDatabaseTableViewItems(
    connID: string,
    schemaIdMap?: { [key: string]: string },
    collectionIdMap?: { [key: string]: string },
    schemaName?: string,
    type?: "dbtable" | "dbview"
  ): Promise<
    (
      | DatabaseTableItem
      | DatabaseViewItem
      | ManagedFileTableItem
      | ManagedFileViewItem
    )[]
  >;

  abstract createSchema(connID: string, schemaName: string): Promise<void>;

  abstract getCurrentSchema(connID: string): Promise<string>;

  abstract getTablesViewsBySchema(
    connID: string,
    schemaName: string
  ): Promise<SchemaChildrenItemResult[]>;

  abstract changeDatabaseItemName(
    connID: string,
    schemaName: string,
    type: "TABLE" | "VIEW",
    oldName: string,
    newName: string
  ): Promise<boolean>;

  abstract dropDatabaseItem(
    connID: string,
    schemaName: string,
    type: "TABLE" | "VIEW",
    name: string
  ): Promise<boolean>;

  async createDbTable(
    schema_name: string,
    tbname: string,
    tbtype: DBTableType
  ): Promise<DBTable> {
    const dbtable: DBTable = {
      id: "12",
      name: tbname,
      type: tbtype,
      isOpen: true,
      children: [],
    };
    const connID: string = await this.createConnection();
    const get_table_information_query_str = `PRAGMA table_info('${schema_name}.${tbname}');`;
    const columns = await this.query(get_table_information_query_str, connID);
    if (columns.numRows > 0) {
      for (const row of columns) {
        const databaseType = getGridTypeFromDatabaseType(row["type"]);

        dbtable.children.push(
          columnFieldFromDatabaseField(
            generateExampleCounter(),
            row["name"],
            databaseType
          )
        );
      }
    }
    this.closeConnection(connID);
    return structuredClone(dbtable);
  }

  /**
   * update grid query data base on id
   * @param id
   * @param queryState
   */
  updateGridQueryState(id: string, queryState: Partial<QueryState>) {
    this.gridQueryStateMap[id] = {
      ...this.gridQueryStateMap[id],
      ...queryState,
    };
  }
}
