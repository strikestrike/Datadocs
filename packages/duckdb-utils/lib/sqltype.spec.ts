/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { deepStrictEqual as eq, ok } from 'assert';
import { parseDuckDBSQL } from './parser.js';
import { isDQLQuery } from './sqltype.js';

describe('isDQLQuery', () => {
  const trueTests = [
    '   SELECT * FROM test WHERE str <> chr(code)',
    'WITH cte AS (SELECT 42 AS x)',
    'WITH cte AS (SELECT 42 AS x) SELECT * FROM cte;',
    'VALUES (1,2,3)',
    '-- comment\nSELECT * from test',
  ];
  const falseTests = ['', 'SHOW TABLES'];

  for (let i = 0; i < trueTests.length; i++)
    test(`trueTests[${i}]`, [parseDuckDBSQL(trueTests[i]).lexer], true);
  for (let i = 0; i < falseTests.length; i++)
    test(`falseTests[${i}]`, [parseDuckDBSQL(falseTests[i]).lexer], false);

  function test(
    testName: string,
    args: Parameters<typeof isDQLQuery>,
    expected: ReturnType<typeof isDQLQuery>,
  ) {
    it(testName, () => {
      const result = isDQLQuery(...args);
      eq(result, expected);
    });
  }
});
