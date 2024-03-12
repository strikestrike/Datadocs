// // /// <reference types="mocha" />

import { deepStrictEqual } from 'assert';
import type {
  CellJSONFormat,
  DataFormatOptions,
  DataFormatWithHyperlinkResult,
} from '../../../types/data-format';
import { DataType, type ParserCellData } from '../../../types';
import { formatFormulaData, formatTableCellValue } from '../../data-format';

const testData: {
  input: ParserCellData;
  expect: string | DataFormatWithHyperlinkResult;
  format: CellJSONFormat;
  options?: DataFormatOptions;
}[] = [
  {
    input: { value: { value: 1.234 }, dataType: 'json' },
    format: { type: 'json', format: 'short' },
    expect: `{ "value": 1.234 }`,
  },
  {
    input: { value: { a: 'hello', b: 'world' }, dataType: 'json' },
    format: { type: 'json', format: 'long' },
    expect: `JSON {"a": "hello", "b": "world"}`,
  },
  {
    input: {
      value: { a: 'https://google.com', b: 'Youtube youtube.com.' },
      dataType: 'json',
    },
    format: { type: 'json', format: 'long' },
    options: { isRoot: true, showHyperlink: true },
    expect: {
      type: 'hyperlink',
      value: `JSON {"a": "https://google.com", "b": "Youtube youtube.com."}`,
      linkRuns: [
        {
          startOffset: 12,
          endOffset: 30,
          ref: 'https://google.com',
        },
        {
          startOffset: 47,
          endOffset: 58,
          ref: 'youtube.com',
        },
      ],
    },
  },
];

const columnType = { typeId: DataType.Json };
const testTableData: {
  input: any;
  expect: string | DataFormatWithHyperlinkResult;
  format: CellJSONFormat;
  columnType: any;
  options?: DataFormatOptions;
}[] = [
  {
    input: { value: 1.234 },
    format: { type: 'json', format: 'short' },
    columnType,
    expect: `{ "value": 1.234 }`,
  },
  {
    input: { a: 'hello', b: 'world' },
    format: { type: 'json', format: 'long' },
    columnType,
    expect: `JSON {"a": "hello", "b": "world"}`,
  },
  {
    input: { google: 'google.com', youtube: 'https://youtube.com' },
    format: { type: 'json', format: 'short' },
    columnType,
    options: { isRoot: true, showHyperlink: true },
    expect: {
      type: 'hyperlink',
      value: `{ "google": "google.com", "youtube": "https://youtube.com" }`,
      linkRuns: [
        {
          startOffset: 13,
          endOffset: 23,
          ref: 'google.com',
        },
        {
          startOffset: 38,
          endOffset: 57,
          ref: 'https://youtube.com',
        },
      ],
    },
  },
];

describe('test data format for json', () => {
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

  for (let i = 0; i < testTableData.length; i++) {
    const { input, expect, format, columnType } = testTableData[i];
    const options = testTableData[i].options ?? {};

    it(`table string ${input} with format ${format} should be ${expect}`, () => {
      const output = formatTableCellValue(input, columnType, format, {
        isRoot: true,
        ...options,
      });
      deepStrictEqual(output, expect);
    });
  }
});
