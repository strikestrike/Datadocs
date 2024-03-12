import { DuckDB } from './duckdb-loader';
import { ok } from 'assert';

describe('DuckDB Loader', () => {
  it('DuckDB can be loaded', async function () {
    this.slow(1000);
    const duckdb = await DuckDB();
    ok(duckdb);
  });
});
