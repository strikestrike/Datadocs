import type { AsyncDuckDB } from '@datadocs/duckdb-wasm';
import type { DatabaseQueryProvider } from '@datadocs/local-storage';
import type { TableField } from './db-state';

///
/// |---------------------------------------------------------------------------------|
/// |           The matrix of DuckDbQueryType and DuckDbQueryOptimization             |
/// |------------------------|--------|--------|---------|--------|--------|----------|
/// | QueryType              |           RAW             |            DQL             |
/// |                        |                   default |          default           |
/// | Optimization           |  NONE  |  VIEW  |  TABLE  |  NONE  |  VIEW  |  TABLE   |
/// |------------------------|--------|--------|---------|--------|--------|----------|
/// | Validity               |  YES   |   NO   |   YES   |  YES   |  YES   |   YES    |
/// |------------------------|--------|--------|---------|--------|--------|----------|
/// | Editable               |   NO   |   /    |   YES   |  YES   |  YES   |   YES    |
/// | Modify original data   |        |        |   NO    |  YES   |  YES   |   NO     |
/// |------------------------|--------|--------|---------|--------|--------|----------|
/// | How the optimization   |   /    |   /    | CREATE  |    /   | CREATE TABLE/VIEW |
/// | entity will be created |   /    |   /    | INSERT  |    /   | AS ....           |
/// |------------------------|--------|--------|---------|--------|--------|----------|
///
/**
 * Thie type will determine how the data source treats and transforms the input query.
 *
 * For example, it can perform a transforming on a DQL query `SELECT * FROM test` like
 * `SELECT COUNT(*) FROM (SELECT * FROM test)`.
 * But it can not do it on a raw query `SHOW TABLES`.
 *
 * Moreover, it can modify the data back to the original table/view if this type is DQL,
 * but it cannot do it if the query is not a statement or any DML, DDL command.
 */
export enum DuckDbQueryType {
  /**
   * Treat the query in raw mode.
   * In this mode, unless the DuckDbQueryOptimization is `CREATE_TABLE`,
   * all modification, filtering, and sorting are managed by the script directly,
   * not by the DuckDB engine.
   *
   * For example: `SHOW ...`, `INSERT INTO ...`, `SUMMARIZE ...`
   */
  RAW = 0,

  /**
   * Treat the query as a statement only contains Data Query Language command.
   *
   * For example: `SELECT ...`
   */
  DQL = 1,
}

/**
 * Thie type will determine how the data source optimize the query result.
 */
export enum DuckDbQueryOptimization {
  /**
   * Without any optimization for the query result.
   * This optimization mode **is not recommended**,
   * and many actions in this mode are not completely implemented.
   */
  NONE = 0,

  /**
   * This mode is the default optimization mode for DQL query.
   *
   * Creating a view for the input DQL query and then query the rows from this view.
   * - `CREATE VIEW ${viewName} AS (${inputQuery})`
   *
   * This option is similar to the previous `VIEW` for the type `OptimizedType`.
   */
  CREATE_VIEW = 1,

  /**
   * This mode is the default optimization mode for RAW query.
   *
   * Creating a table from the input query and then query the rows from this table.
   * - `CREATE TABLE ${tableName} AS (${inputQuery})`
   * - `CREATE TABLE ${tableName} (...); INSERT INTO ${tableName} VALUES ...(...)`
   *
   * This option is similar to the previous `VIEW TABLE` for the type `OptimizedType`.
   */
  CREATE_TABLE = 2,
}

export type DuckDbQuery = {
  sql: string;
  /**
   * There's no need to explicitly set this option usually.
   * Because the DuckDB data source will choose it automatically based on the query SQL/table name.
   */
  type?: DuckDbQueryType;
  opt?: DuckDbQueryOptimization;
};

export type DuckDbDataSourceOptions = {
  /**
   * A context id for this data source.
   * It is used to identify this data source while saving/restoring persistent data.
   * A simple way to generate it in pseudo-code is:
   * `hash_func(format_sql(query_sql), query_option)`
   */
  contextId?: string;

  /**
   * The database manager for the grid data source.
   * All database operations from the grid data source will be managed by it.
   */
  db: DatabaseQueryProvider<AsyncDuckDB>;

  /**
   * Schema name for store table/view optimized and summary view
   */
  schemaName: string;

  /**
   * The query SQL or the name of table/view for the data source.
   * The data source will load row results from it.
   */
  query: DuckDbQuery;

  /**
   * Force the setting of field info instead of automatically getting it from the query result
   */
  fields?: TableField[];
};
