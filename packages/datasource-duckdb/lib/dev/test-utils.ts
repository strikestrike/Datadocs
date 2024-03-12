import { SimpleDuckDBQueryProvider } from '@datadocs/local-storage';
import { DuckDB } from './duckdb-loader';

export async function getDuckDBForTest() {
  const duckdb = await DuckDB();
  const db = new SimpleDuckDBQueryProvider(duckdb);
  const connID = await db.createConnection();
  return { db, connID };
}
