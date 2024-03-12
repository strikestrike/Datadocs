/// <reference types="mocha" />

import { deepStrictEqual } from 'assert';
import type { CellStringFormat } from '../../../types/data-format';
import { stringFormatter } from './string-formatter';

const ELLIPISS = '…';

const testData: {
  input: string;
  output: string;
  limit?: number;
  format: CellStringFormat['format'];
}[] = [
  {
    input: 'hello',
    format: 'WithoutQuote',
    output: 'hello',
  },
  {
    input: 'hello world',
    format: 'WithoutQuote',
    output: `h${ELLIPISS}`,
    limit: 1,
  },
  {
    input: 'world',
    format: 'DoubleQuote',
    output: '"world"',
  },
  {
    input: 'hello world',
    format: 'DoubleQuote',
    output: `"hello wo${ELLIPISS}"`,
    limit: 8,
  },
  {
    input: 'demo',
    format: 'SingleQuote',
    output: "'demo'",
  },
  {
    input: 'demo',
    format: 'SingleQuote',
    output: `'demo'`,
    limit: 0,
  },
  {
    input: 'demo',
    format: 'SingleQuote',
    output: `'demo'`,
    limit: -1,
  },

  // default format
  {
    input: 'default',
    format: undefined,
    output: 'default',
  },
];

describe('test string formatter', () => {
  for (let i = 0; i < testData.length; i++) {
    const { input, output, format, limit } = testData[i];
    it(`string ${input} with format ${format} and limit ${limit} should be ${output}`, () => {
      const result = stringFormatter(input, limit, { type: 'string', format });
      deepStrictEqual(output, result);
    });
  }
});
