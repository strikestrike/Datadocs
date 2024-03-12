/* eslint-disable @typescript-eslint/no-unused-vars */

import { parseDuckDBSQL } from '@datadocs/duckdb-utils';
import { ParsedDuckDBQuery } from './ParsedDuckDBQuery';
import { deepStrictEqual as eq, ok } from 'assert';

const getContextId = (sql: string) =>
  ParsedDuckDBQuery.genContextId(parseDuckDBSQL(sql).lexer.getAllTokens());

describe('ParsedDuckDBQuery', () => {
  it('generateContextId', function () {
    const contextId1 = getContextId(
      `-- 1\nSELECT * FROM (SELECT * FROM test) AS t WHERE str <> chr(code) AND a <> '\n';`,
    );
    const contextId2 = getContextId(
      `SELECT * FROM (SELECT  * FROM test) t WHERE str <> chr(code) AND a <> '\n'-- a`,
    );
    eq(contextId1, contextId2);
  });

  it('generateContextId with empty input', function () {
    const contextId1 = getContextId('');
    const contextId2 = getContextId('-- no sql');
    eq(contextId1, contextId2);
  });

  it('generateContextId with invalid SQL', function () {
    const contextId1 = getContextId('select "');
    ok(contextId1);
  });
});
