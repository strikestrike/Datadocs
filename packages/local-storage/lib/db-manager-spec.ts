import type { AsyncRecordBatchStreamReader, RecordBatch } from 'apache-arrow';

/**
 * A basic DuckDB manager(connector) interface without any high-level state management
 * Please keep this interface be simple
 *
 * @version 2023-12-08
 */
export interface DatabaseQueryProvider<DatabaseType = unknown> {
  /**
   * Low-level database
   */
  readonly store: DatabaseType;

  /**
   * @returns Connection ID
   */
  createConnection(): Promise<string>;

  hasConnection(connID: string): boolean;

  /**
   * Close a connection and cancel all ongoing queries
   * @param connID Connection ID
   */
  closeConnection(connID: string): Promise<void>;

  /**
   *  Send query SQL to the database and return an iterator for result
   * @param sql
   */
  query(
    sql: string,
    connId: string,
  ): Promise<AsyncRecordBatchStreamReader | undefined>;

  /**
   * Send query SQL to the database and return all the results.
   * @param queryStr SQL
   * @param connId Unlike the `query` method, if this `connId` is not provided,
   * this method will automatically create a connection and close it.
   * @param limit Max rows (A negative value (e.g., -1) represents no limit, but it is not recommended)
   */
  queryAll(
    queryStr: string,
    connId?: string | undefined | null,
    limit?: number,
  ): Promise<RecordBatch<any>[]>;
}
