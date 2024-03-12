/// <reference types="mocha" />

import { equal } from 'assert';
import type { CellStringFormat } from '../../../types/data-format';
import type { ParserCellData } from '../../../types';
import { formatFormulaData, formatTableCellValue } from '../../data-format';

const testData: {
  input: ParserCellData;
  output: string;
  format: CellStringFormat['format'];
}[] = [
  {
    input: { value: 'hello', dataType: 'string' },
    format: 'DoubleQuote',
    output: `"hello"`,
  },
  {
    input: { value: 'hello world', dataType: 'string' },
    format: 'SingleQuote',
    output: `'hello world'`,
  },
  {
    input: { value: 'hello world', dataType: 'string' },
    format: 'WithoutQuote',
    output: `hello world`,
  },
];

const columnType = 'string';
const testTableData: {
  input: string;
  output: string;
  format: CellStringFormat['format'];
  columnType: any;
}[] = [
  {
    input: 'hello',
    format: 'DoubleQuote',
    columnType,
    output: `"hello"`,
  },
  {
    input: 'hello world',
    format: 'SingleQuote',
    columnType,
    output: `'hello world'`,
  },
  {
    input: 'hello world',
    format: 'WithoutQuote',
    columnType,
    output: `hello world`,
  },
];

describe('test data format for string', () => {
  for (let i = 0; i < testData.length; i++) {
    const { input, output, format } = testData[i];
    it(`free form string ${input} with format ${format} should be ${output}`, () => {
      const result = formatFormulaData(
        input,
        {
          type: 'string',
          format,
        },
        { isRoot: true },
      );
      equal(result, output);
    });
  }

  for (let i = 0; i < testTableData.length; i++) {
    const { input, output, format, columnType } = testTableData[i];
    it(`table string ${input} with format ${format} should be ${output}`, () => {
      const result = formatTableCellValue(
        input,
        columnType,
        {
          type: 'string',
          format,
        },
        { isRoot: true },
      );
      equal(result, output);
    });
  }
});
