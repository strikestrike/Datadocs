import { SimpleDuckDBQueryProvider } from '@datadocs/local-storage';
import { DuckDB } from './duckdb-loader';
import { createOptimized } from '../query-optimaztion/create-optimized';
import type { RecordBatch } from 'apache-arrow';

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
async function main() {
  const duckdb = await DuckDB();
  const queryProvider = new SimpleDuckDBQueryProvider(duckdb);
  await queryProvider.queryAll(`CREATE SCHEMA s1;`);
  await queryProvider.queryAll(`CREATE TABLE s1.a (id int);`);
  await queryProvider.queryAll(`INSERT INTO s1.a VALUES (10), (20);`);

  const querySQL = 'SELECT * FROM memory.s1.a; -- query all rows';
  const batches = await queryProvider.queryAll(querySQL);
  const rows = batchesToRows(batches);
  console.log(rows);

  const r1 = await createOptimized(querySQL, queryProvider, {
    prefix: 'test_',
  });
  const r2 = await createOptimized(querySQL, queryProvider, {
    prefix: 'test_',
  });
  console.log(r1, r2);
  return;

  function batchesToRows<T = any>(batches: RecordBatch<any>[]) {
    const result: T[] = [];
    for (const batch of batches)
      for (const row of batch) result.push(row.toJSON() as any);
    return result;
  }
}
