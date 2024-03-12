import type { AsyncDuckDB, AsyncDuckDBConnection } from '@datadocs/duckdb-wasm';
import type { AsyncRecordBatchStreamReader, RecordBatch } from 'apache-arrow';
import type { DatabaseQueryProvider } from '@datadocs/local-storage';

const defaultLimitAll = 1_000_000;

/**
 * @version 2023-12-06
 */
export class SimpleDuckDBQueryProvider
  implements DatabaseQueryProvider<AsyncDuckDB>
{
  private connId = 0;
  readonly conns: Record<string, AsyncDuckDBConnection> = {};
  constructor(readonly store: AsyncDuckDB, private readonly prefix = 'conn') {}

  protected getConnection(connID: string): AsyncDuckDBConnection {
    /** For security, e.g., __proto__,  */
    if (!connID.startsWith(this.prefix))
      throw new Error(`Invalid connection ID "${connID}"`);
    const conn = this.conns[connID];
    if (!conn) throw new Error(`Unknown connection with ID "${connID}"`);
    return conn;
  }

  hasConnection(connID: string): boolean {
    return !!(
      typeof connID === 'string' &&
      connID.startsWith(this.prefix) &&
      this.conns[connID]
    );
  }

  async createConnection(): Promise<string> {
    const conn: AsyncDuckDBConnection = await this.store.connect();
    const connId = this.prefix + ++this.connId;
    this.conns[connId] = conn;
    return connId;
  }

  async closeConnection(connId: string) {
    const conn = this.conns[connId];
    if (!conn) return;
    delete this.conns[connId];

    try {
      await conn.cancelSent();
    } finally {
      await conn.close();
    }
  }

  async query(
    queryStr: string,
    connId: string,
  ): Promise<AsyncRecordBatchStreamReader> {
    const conn = this.getConnection(connId);
    return await conn.send(queryStr);
  }

  async queryAll(
    queryStr: string,
    connId?: string | undefined | null,
    limit?: number,
  ): Promise<RecordBatch<any>[]> {
    let needToCloseConn = false;
    if (!connId) {
      connId = await this.createConnection();
      needToCloseConn = true;
    }

    const conn = this.getConnection(connId);
    let stream: AsyncRecordBatchStreamReader;
    const chunks: RecordBatch<any>[] = [];
    try {
      stream = await conn.send(queryStr);
      if (typeof limit !== 'number') limit = defaultLimitAll;
      if (limit < 0 || limit === Infinity) {
        console.warn(
          'Not setting the `limit` parameter may lead to a large amount of data being loaded ' +
            'and consuming significant resources.',
        );
        limit = Infinity;
      }

      let count = 0;
      while (count <= limit) {
        const it = await stream.next();
        if (it.done) break;
        const chunk: RecordBatch<any> = it.value;
        chunks.push(chunk);
        count += chunk.numRows;
      }
    } finally {
      if (needToCloseConn) await this.closeConnection(connId);
    }
    return chunks;
  }
}
