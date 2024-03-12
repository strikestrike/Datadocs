// // /// <reference types="mocha" />

import { deepStrictEqual } from 'assert';
import type {
  CellJSONFormat,
  DataFormatWithHyperlinkResult,
  DataFormatOptions,
} from '../../../types/data-format';
import type { ParserCellData } from '../../../types';
import { formatFormulaData } from '../../data-format';

const testData: {
  input: ParserCellData;
  expect: string | DataFormatWithHyperlinkResult;
  format: CellJSONFormat;
  options?: DataFormatOptions;
}[] = [
  {
    input: {
      dataType: 'json[]',
      value: [
        { value: 1.234, dataType: 'json' },
        { value: null, dataType: 'json' },
        { value: true, dataType: 'json' },
        { value: { a: 'hello', b: 'world' }, dataType: 'json' },
      ],
    },
    format: { type: 'json', format: 'short' },
    expect: `[ 1.234, null, true, {"a": "hello", "b": "world"} ]`,
  },
  {
    input: {
      dataType: 'json[]',
      value: [
        { value: 1.234, dataType: 'json' },
        { value: null, dataType: 'json' },
        { value: true, dataType: 'json' },
        { value: { a: 'hello', b: 'world' }, dataType: 'json' },
      ],
    },
    format: { type: 'json', format: 'long' },
    expect: `[ JSON 1.234, JSON null, JSON true, JSON {"a": "hello", "b": "world"} ]`,
  },
  {
    input: {
      dataType: 'json[]',
      value: [
        { value: { hello: 'Hello helloworld.com' }, dataType: 'json' },
        { value: { google: 'https://google.com' }, dataType: 'json' },
      ],
    },
    format: { type: 'json', format: 'long' },
    options: { isRoot: true, showHyperlink: true },
    expect: {
      type: 'hyperlink',
      value: `[ JSON {"hello": "Hello helloworld.com"}, JSON {"google": "https://google.com"} ]`,
      linkRuns: [
        {
          startOffset: 24,
          endOffset: 38,
          ref: 'helloworld.com',
        },
        {
          startOffset: 59,
          endOffset: 77,
          ref: 'https://google.com',
        },
      ],
    },
  },
];

describe('test data format for json list', () => {
  for (let i = 0; i < testData.length; i++) {
    const { input, expect, format } = testData[i];
    const options = testData[i].options ?? {};

    it(`json ${input} with format ${format} should be ${expect}`, () => {
      const output = formatFormulaData(input, format, {
        isRoot: true,
        ...options,
      });
      deepStrictEqual(output, expect);
    });
  }
});
