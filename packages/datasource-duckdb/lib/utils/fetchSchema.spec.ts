import type { Utf8 } from 'apache-arrow';
import { ArrowAsyncRowReader, escapeId } from '@datadocs/duckdb-utils';
import { ok, deepStrictEqual } from 'assert';
import { getDuckDBForTest } from '../dev/test-utils';
import { fetchSchemaInformationTable } from './fetchSchema';

function eq<T>(actual: T, expected: T) {
  deepStrictEqual(actual, expected);
}

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
  });
  after(async () => {
    const { db, connID } = await getDuckDBForTest();
    await db.query(`DROP TABLE ${escapeId(baseTbName)};`, connID);
    await db.closeConnection(connID);
  });

  it('fetchSchemaInformationTable', async () => {
    const { db, connID } = await getDuckDBForTest();
    const result = await fetchSchemaInformationTable('main', baseTbName, db, connID);
    await db.closeConnection(connID);
    console.log(result);
    eq(result.tbname, baseTbName);
    eq(result.columns.length, 2);
    eq(result.columns[0], { name: 'id', displayname: 'id', type: 'int' });
    eq(result.columns[1], {
      name: 'name',
      displayname: 'name',
      type: 'string',
    });
  });
});
