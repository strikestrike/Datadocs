import type { Utf8 } from 'apache-arrow';
import { ArrowAsyncRowReader, escapeId } from '@datadocs/duckdb-utils';
import { ok } from 'assert';
import { getDuckDBForTest } from '../dev/test-utils';
import { CreateOptimizedType, createOptimized } from './create-optimized';

describe('createOptimized', () => {
  const baseTbName = '__test_1234567_';

  before(async () => {
    const { db, connID } = await getDuckDBForTest();
    await db.query(
      `CREATE TABLE ${escapeId(baseTbName)} (
        id INT,
        name STRING
      )`,
      connID,
    );
    await db.query(
      `INSERT INTO ${escapeId(baseTbName)} VALUES
      (1, 'Mark'), (2, 'Hannes');`,
      connID,
    );

    const tables = new ArrowAsyncRowReader<{ name: Utf8 }>(
      await db.query('SHOW TABLES', connID),
    );
    for await (const tableName of tables) console.log(tableName.toJSON());
    await db.closeConnection(connID);
  });
  after(async () => {
    const { db, connID } = await getDuckDBForTest();
    await db.query(`DROP TABLE ${escapeId(baseTbName)};`, connID);
    await db.closeConnection(connID);
  });

  it('sql => table', async () => {
    const { db, connID: connId } = await getDuckDBForTest();
    const result = await createOptimized(
      `SELECT * FROM ${escapeId(baseTbName, true)}`,
      db,
      { type: CreateOptimizedType.TEMP_TABLE, connId, prefix: '_' },
    );
    await db.closeConnection(connId);
    console.log(result);
  });

  it('sql => view', async () => {
    const { db, connID: connId } = await getDuckDBForTest();
    const result = await createOptimized(
      `SELECT * FROM ${escapeId(baseTbName)}`,
      db,
      { type: CreateOptimizedType.TEMP_VIEW, connId, prefix: '_' },
    );
    await db.closeConnection(connId);
    console.log(result);
  });

  it('sql = copy => table ', async () => {
    const { db, connID: connId } = await getDuckDBForTest();

    const result = await createOptimized(`SHOW TABLES`, db, {
      type: CreateOptimizedType.COPY_TO_TABLE,
      connId,
      prefix: '_',
    });
    await db.closeConnection(connId);
    console.log(result);
    ok(result.copied === 1); // 1 table
  });
});
