// /// <reference types="mocha" />

import { deepEqual } from 'assert';
import type {
  CellAccountingFormatResult,
  CellNumberFormat,
} from '../../../types/data-format';
import type { ParserCellData } from '../../../types';
import { formatFormulaData, formatTableCellValue } from '../../data-format';
import { type ColumnType, DataType } from '../../../types/column-types';

const testData: {
  input: ParserCellData;
  output: string | CellAccountingFormatResult;
  format: CellNumberFormat;
}[] = [
  {
    input: { value: 1777777777777777, dataType: 'int' },
    format: undefined,
    output: `1.77778e+15`,
  },
  {
    input: { value: -15, dataType: 'int' },
    format: {
      type: 'number',
      format: 'default',
      decimalPlaces: 3,
    },
    output: `-15.000`,
  },
  {
    input: { value: 1777777777777777, dataType: 'int' },
    format: {
      type: 'number',
      format: 'percent',
    },
    output: `177777777777777700.00%`,
  },
  {
    input: { value: -155.234, dataType: 'float' },
    format: {
      type: 'number',
      format: 'currency',
      decimalPlaces: 4,
    },
    output: `-$155.2340`,
  },
  {
    input: { value: { a: -155234n, b: 3 }, dataType: 'float' },
    format: {
      type: 'number',
      format: 'accounting',
      decimalPlaces: 3,
    },
    output: { type: 'accounting', prefix: '$', value: '(155.234)' },
  },
];

const testTableData: {
  input: number | bigint;
  output: string | CellAccountingFormatResult;
  format: CellNumberFormat;
  columnType: ColumnType;
}[] = [
  {
    input: -34567,
    format: undefined,
    columnType: 'int',
    output: '-34567',
  },
  {
    input: 0,
    format: {
      type: 'number',
      format: 'default',
      decimalPlaces: 3,
    },
    columnType: 'int',
    output: '0.000',
  },
  {
    input: -1234.56789,
    format: {
      type: 'number',
      format: 'scientific',
      decimalPlaces: 4,
    },
    columnType: { typeId: DataType.Float },
    output: '-1.2346e+3',
  },
  {
    input: -1234.56789,
    format: {
      type: 'number',
      format: 'accounting',
      decimalPlaces: 1,
    },
    columnType: { typeId: DataType.Float },
    output: { type: 'accounting', prefix: '$', value: '(1,234.6)' },
  },
  {
    input: -78903456n,
    format: {
      type: 'number',
      format: 'percent',
      decimalPlaces: 1,
    },
    columnType: { typeId: DataType.Decimal, precision: 8, scale: 4 },
    output: '-789034.6%',
  },
];

describe('test data format for number', () => {
  for (let i = 0; i < testData.length; i++) {
    const { input, output, format } = testData[i];
    it(`free form number ${input} with format ${format} should be ${output}`, () => {
      const result = formatFormulaData(input, format, { isRoot: true });
      deepEqual(result, output);
    });
  }

  for (let i = 0; i < testTableData.length; i++) {
    const { input, output, format, columnType } = testTableData[i];
    it(`table number ${input} with format ${format} should be ${output}`, () => {
      const result = formatTableCellValue(input, columnType, format, {
        isRoot: true,
      });
      deepEqual(result, output);
    });
  }
});
