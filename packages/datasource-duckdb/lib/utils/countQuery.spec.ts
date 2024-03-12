import { escapeId } from '@datadocs/duckdb-utils';
import { deepStrictEqual as eq } from 'assert';
import { getDuckDBForTest } from '../dev/test-utils';
import { countQuery } from './countQuery';

describe('Utils', () => {
  const viewName = "test_utils_count'_query";
  const allRow = 1000000;
  const viewSQL = `
  SELECT
        generate_series i,
        (generate_series % 10) + 1 i2
      FROM generate_series(0, ${allRow - 1})
  `;

  before(async () => {
    const { db, connID } = await getDuckDBForTest();
    await db.query(`CREATE VIEW ${escapeId(viewName)} AS (${viewSQL})`, connID);
    await db.closeConnection(connID);
  });

  it('countQuery', async function () {
    const { db, connID } = await getDuckDBForTest();

    let actualCount = await countQuery({
      db,
      connID,
      tbname: viewName,
    });
    eq(actualCount, allRow);

    actualCount = await countQuery({
      db,
      connID,
      sql: viewSQL,
    });
    eq(actualCount, allRow);

    actualCount = await countQuery({
      db,
      connID,
      tbname: viewName,
      max: 1000,
    });
    eq(actualCount, 1000);

    actualCount = await countQuery({
      db,
      connID,
      sql: viewSQL + ' LIMIT 100',
      max: 1000,
    });
    eq(actualCount, 100);

    await db.closeConnection(connID);
  });
});
