import type { AsyncDuckDB, AsyncDuckDBConnection } from "@datadocs/duckdb-wasm";
import type { RecordBatch } from "apache-arrow/recordbatch";
import type { Field as GridField } from "@datadocs/canvas-datagrid-ng/lib/types/column-types";

export type TableType = "BASE TABLE" | "LOCAL TEMPORARY" | "VIEW";

export type OptimizedType = null | TableType | "VIEW TABLE";

export type StoreType = AsyncDuckDB;

export type ConnectionType = AsyncDuckDBConnection;

/**
 * This type is used to describe the execution/query results of user-input SQL,
 * the number of total rows and related column information.
 * It can also be understood as: InitQueryResult.
 */
export type QueryData = {
  /** The display related info and type info for each column */
  fields: GridField[];
  sampleRows: RecordBatch<any>[];
  /** The total number of rows */
  numRows: number;
};

/**
 * It represents the position of a row or column in the grid.
 * It is used to indicate the location of the result table of a database query.
 * Its old name is `Position`
 */
export type GridPositionForDBQuery = {
  rowIndex: number;
  colIndex: number;
};

export type Frame = {
  startPoint: GridPositionForDBQuery;
  endPoint: GridPositionForDBQuery;
};

/**
 * @deprecated
 * This state object is used for the canvas datagrid's data sources for DuckDB or other databases.
 */
export type QueryState = {
  tbname: string;
  /** The input SQL */
  currentQuery: string;
  loadedData: boolean;
  fields: GridField[];
  numRows: number;
  /** The location where the query result table is positioned (top-left) */
  startPoint: GridPositionForDBQuery;
  /** It is currently not being used. */
  currentFrame?: Frame;
};

export type TableSchema = {
  schemaName: string;
  tbname: string;
  tbtype: OptimizedType;
  query: string;
  columns: GridField[];
  numRows: number;
};

export type SchemaChildrenItemResult = {
  name: string;
  type: "table" | "view" | "function";
  fileName?: string;
};
