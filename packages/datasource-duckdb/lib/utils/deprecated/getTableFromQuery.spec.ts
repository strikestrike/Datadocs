/* eslint-disable @typescript-eslint/no-unused-vars */

import { deepStrictEqual as eq, ok } from 'assert';
import { getTableFromQuery } from './getTableFromQuery';

describe('Utils', () => {
  it('getTableFromQuery', function () {
    const tbname = getTableFromQuery(
      `SELECT * FROM test WHERE str <> chr(code)`,
    );
    eq(tbname, 'test');
  });

  it('getTableFromQuery (nested SELECT)', function () {
    const tbname = getTableFromQuery(
      `SELECT * FROM (SELECT * FROM test) AS t WHERE str <> chr(code)`,
    );
    eq(tbname, 'test');
  });

  it('getTableFromQuery (join)', function () {
    const tbname = getTableFromQuery(
      `SELECT * FROM (SELECT * FROM test) AS t LEFT JOIN test2
      ON test.id = test2.id
      WHERE test.value > 20
      ;`,
    );
    eq(tbname, 'test');
  });
});
