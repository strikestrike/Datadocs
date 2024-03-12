/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { DuckDB } from './duckdb-loader';
import type { RecordBatch } from 'apache-arrow/recordbatch';
import { ok, deepStrictEqual as eq } from 'assert';
import { getObjectsFromQueryResult } from '../utils';
import { ArrowAsyncRowReader } from '@datadocs/duckdb-utils';

describe('DuckDB', () => {
  /**
   * @see https://duckdb.org/docs/api/wasm/query
   */
  it('send and query', async function () {
    this.slow(3000);
    const duckdb = await DuckDB();
    const conn = await duckdb.connect();
    await conn.send(
      `CREATE TABLE __duckdb_testempty72s3nz (id int not null, name text)`,
    );
    await conn.send(
      `CREATE TABLE __duckdb_test63bs6 AS
        (SELECT (generate_series) AS id, (generate_series * 2) AS value
        FROM generate_series(0, 500000))`,
    );
    let t1: number, t2: number;
    let elapsed1: number, elapsed2: number;
    let subset1: any[];
    let subset2: any[];

    const sql = 'SELECT * from __duckdb_test63bs6';
    const limit = 1000;
    {
      t1 = performance.now();
      const result0 = await conn.query(`DESCRIBE ${sql}`);
      console.log(getObjectsFromQueryResult(result0));
      const result = await conn.query(sql);
      subset1 = new Array(limit)
        .fill(null)
        .map((it, i) => result.get(i).toArray());
      t2 = performance.now();
      elapsed1 = t2 - t1;
    }

    {
      t1 = performance.now();
      const result2 = await conn.send(sql);
      subset2 = new Array(limit);
      let i = 0;
      while (i < limit) {
        const row = await result2.next();
        if (row.done) break;
        const value: RecordBatch<any> = row.value;
        const numRows = value.numRows;
        for (let offset = 0; offset < numRows && i < limit; offset++) {
          const row = value.get(offset);
          subset2[i++] = row.toArray();
        }
        if (i >= limit) break;
      }
      await result2.cancel();
      t2 = performance.now();
      elapsed2 = t2 - t1;
    }

    {
      const stream = await conn.send(`SELECT * FROM __duckdb_testempty72s3nz`);
      const reader = new ArrowAsyncRowReader(stream);
      console.log(await reader.getSchema());

      let i = 0;
      for await (const row of reader) {
        if (!row) break;
        console.log(i++, row);
      }
      await stream.cancel();
    }

    {
      await conn.send(`CREATE TABLE __duckdb_test_aaa (id int, name text)`);
      await conn.send(`CREATE TABLE __duckdb_test_bbb (id int, name text)`);
      await conn.send(`INSERT INTO __duckdb_test_aaa VALUES (1,'A1'),(2,'A2')`);
      await conn.send(
        `INSERT INTO __duckdb_test_aaa VALUES (3,'A3'),(4,'A4'),(5,'A5')`,
      );
      await conn.send(`INSERT INTO __duckdb_test_bbb VALUES (1,'B1'),(2,'B2')`);

      const sql =
        `SELECT __duckdb_test_aaa.*, __duckdb_test_bbb.* FROM __duckdb_test_aaa ` +
        `FULL JOIN __duckdb_test_bbb ON (__duckdb_test_aaa.id = __duckdb_test_bbb.id)`;

      // duplicated key can make some values lost
      // const stream = await conn.send(sql);
      const stream = await conn.send(`SELECT * FROM (${sql})`);
      const reader = new ArrowAsyncRowReader(stream);
      console.log(await reader.getSchema());

      let i = 0;
      for await (const row of reader) {
        if (!row) break;
        console.log(i++, row.toArray(), row.toJSON());
      }
      await stream.cancel();
    }

    console.log(
      `LIMIT=${limit} ` +
        `conn.query use ${elapsed1.toFixed(1)}ms ` +
        `conn.send use ${elapsed2.toFixed(1)}ms `,
    );
    ok(elapsed1 > elapsed2);
    for (let i = 0; i < subset1.length; i++) eq(subset1[i], subset2[i]);

    conn.close();
  });
});
