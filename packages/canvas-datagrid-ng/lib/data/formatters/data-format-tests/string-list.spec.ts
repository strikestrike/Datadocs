/// <reference types="mocha" />

import { deepStrictEqual } from 'assert';
import type {
  CellStringFormat,
  DataFormatWithHyperlinkResult,
  DataFormatOptions,
} from '../../../types/data-format';
import type { ParserCellData } from '../../../types';
import type { List } from '../../../types/column-types';
import { DataType } from '../../../types/column-types';
import { formatFormulaData, formatTableCellValue } from '../../data-format';

const testData: {
  input: ParserCellData;
  expect: string | DataFormatWithHyperlinkResult;
  format: CellStringFormat['format'];
  options?: DataFormatOptions;
}[] = [
  {
    input: {
      dataType: 'string[]',
      value: [
        { value: 'hello', dataType: 'string' },
        { value: 'world', dataType: 'string' },
      ],
    },
    format: 'DoubleQuote',
    expect: `[ "hello", "world" ]`,
  },
  {
    input: {
      dataType: 'string[]',
      value: [
        { value: 'hello world', dataType: 'string' },
        { value: '1', dataType: 'string' },
      ],
    },
    format: 'SingleQuote',
    expect: `[ 'hello world', '1' ]`,
  },
  {
    input: {
      dataType: 'string[]',
      value: [
        { value: 'hello world', dataType: 'string' },
        { value: '2', dataType: 'string' },
      ],
    },
    format: 'WithoutQuote',
    expect: `[ hello world, 2 ]`,
  },
  {
    input: {
      dataType: 'string[]',
      value: [
        { value: 'https://google.com', dataType: 'string' },
        { value: 'Youtube youtube.com', dataType: 'string' },
      ],
    },
    format: 'DoubleQuote',
    options: { isRoot: true, showHyperlink: true },
    expect: {
      type: 'hyperlink',
      value: `[ "https://google.com", "Youtube youtube.com" ]`,
      linkRuns: [
        {
          startOffset: 3,
          endOffset: 21,
          ref: 'https://google.com',
        },
        {
          startOffset: 33,
          endOffset: 44,
          ref: 'youtube.com',
        },
      ],
    },
  },
];

const testTableData: {
  input: Array<string | null>;
  expect: string | DataFormatWithHyperlinkResult;
  format: CellStringFormat['format'];
  columnType?: List;
  options?: DataFormatOptions;
}[] = [
  {
    input: ['hello', 'world'],
    format: 'DoubleQuote',
    expect: `[ "hello", "world" ]`,
  },
  {
    input: ['hello world', '1'],
    format: 'SingleQuote',
    expect: `[ 'hello world', '1' ]`,
  },
  {
    input: ['hello world', '2'],
    format: 'WithoutQuote',
    expect: `[ hello world, 2 ]`,
  },
  {
    input: ['https://google.com', 'Youtube youtube.com'],
    format: 'DoubleQuote',
    options: { isRoot: true, showHyperlink: true },
    expect: {
      type: 'hyperlink',
      value: `[ "https://google.com", "Youtube youtube.com" ]`,
      linkRuns: [
        {
          startOffset: 3,
          endOffset: 21,
          ref: 'https://google.com',
        },
        {
          startOffset: 33,
          endOffset: 44,
          ref: 'youtube.com',
        },
      ],
    },
  },
];

describe('test data format for string list', () => {
  for (let i = 0; i < testData.length; i++) {
    const { input, expect, format } = testData[i];
    const options = testData[i].options ?? {};

    it(`free form string ${input} with format ${format} should be ${expect}`, () => {
      const output = formatFormulaData(
        input,
        {
          type: 'string',
          format,
        },
        { isRoot: true, ...options },
      );
      deepStrictEqual(output, expect);
    });
  }

  const stringListType: List = {
    typeId: DataType.List,
    child: { name: 'f', type: 'string' },
  };
  for (let i = 0; i < testTableData.length; i++) {
    const { input, expect, format, columnType } = testTableData[i];
    const options = testTableData[i].options ?? {};

    it(`table string ${input} with format ${format} should be ${expect}`, () => {
      const output = formatTableCellValue(
        input,
        columnType ?? stringListType,
        {
          type: 'string',
          format,
        },
        { isRoot: true, ...options },
      );
      deepStrictEqual(output, expect);
    });
  }
});
