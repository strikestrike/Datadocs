// /// <reference types="mocha" />

import { equal } from 'assert';
import type { CellNumberFormat } from '../../../types/data-format';
import type { ParserCellData, List } from '../../../types';
import { formatFormulaData, formatTableCellValue } from '../../data-format';
import { DataType } from '../../../types/column-types';

const testData: {
  input: ParserCellData;
  output: string;
  format: CellNumberFormat;
}[] = [
  {
    input: {
      dataType: 'int[]',
      value: [
        { value: 0, dataType: 'int' },
        { value: 1777777777777777, dataType: 'int' },
        { value: -15, dataType: 'int' },
      ],
    },
    format: undefined,
    output: `[ 0, 1.77778e+15, -15 ]`,
  },
  {
    input: {
      dataType: 'int[]',
      value: [
        { value: 0, dataType: 'int' },
        { value: 1777777777777777, dataType: 'int' },
        { value: -15, dataType: 'int' },
      ],
    },
    format: {
      type: 'number',
      format: 'default',
      decimalPlaces: 3,
    },
    output: `[ 0.000, 1.778e+15, -15.000 ]`,
  },
  {
    input: {
      dataType: 'int[]',
      value: [
        { value: 0, dataType: 'int' },
        { value: 1777777777777777, dataType: 'int' },
        { value: -15, dataType: 'int' },
      ],
    },
    format: {
      type: 'number',
      format: 'percent',
    },
    output: `[ 0.00%, 177777777777777700.00%, -1500.00% ]`,
  },
  {
    input: {
      dataType: 'int[]',
      value: [
        { value: 0, dataType: 'int' },
        { value: 1777777777777777, dataType: 'int' },
        { value: -15, dataType: 'int' },
      ],
    },
    format: {
      type: 'number',
      format: 'percent',
      decimalPlaces: 0,
    },
    output: `[ 0%, 177777777777777700%, -1500% ]`,
  },
  {
    input: {
      dataType: 'float[]',
      value: [
        { value: 0, dataType: 'float' },
        { value: 17777.88888, dataType: 'float' },
        { value: -155.234, dataType: 'float' },
      ],
    },
    format: {
      type: 'number',
      format: 'currency',
      decimalPlaces: 4,
    },
    output: `[ $0.0000, $17,777.8889, -$155.2340 ]`,
  },
  {
    input: {
      dataType: 'float[]',
      value: [
        {
          value: { a: 0n, b: 9 },
          dataType: 'float',
        },
        { value: { a: 1777788888n, b: 5 }, dataType: 'float' },
        { value: { a: -155234n, b: 3 }, dataType: 'float' },
      ],
    },
    format: {
      type: 'number',
      format: 'currency',
      decimalPlaces: 3,
    },
    output: `[ $0.000, $17,777.889, -$155.234 ]`,
  },
  {
    input: {
      dataType: 'float[]',
      value: [
        { value: 0, dataType: 'float' },
        { value: 17777.88888, dataType: 'float' },
        { value: -155.234, dataType: 'float' },
      ],
    },
    format: {
      type: 'number',
      format: 'scientific',
      decimalPlaces: 1,
    },
    output: `[ 0.0e+0, 1.8e+4, -1.6e+2 ]`,
  },
  {
    input: {
      dataType: 'float[]',
      value: [
        {
          value: { a: 0n, b: 9 },
          dataType: 'float',
        },
        { value: { a: 1777788888n, b: 5 }, dataType: 'float' },
        { value: { a: -155234n, b: 3 }, dataType: 'float' },
      ],
    },
    format: {
      type: 'number',
      format: 'scientific',
      decimalPlaces: 1,
    },
    output: `[ 0.0e+0, 1.8e+4, -1.6e+2 ]`,
  },
  {
    input: {
      dataType: 'float[]',
      value: [
        { value: 0, dataType: 'float' },
        { value: 17777.88888, dataType: 'float' },
        { value: -155.234, dataType: 'float' },
      ],
    },
    format: {
      type: 'number',
      format: 'accounting',
      decimalPlaces: 4,
    },
    output: `[ $ -, $ 17,777.8889, $ (155.2340) ]`,
  },
  {
    input: {
      dataType: 'float[]',
      value: [
        {
          value: { a: 0n, b: 9 },
          dataType: 'float',
        },
        { value: { a: 1777788888n, b: 5 }, dataType: 'float' },
        { value: { a: -155234n, b: 3 }, dataType: 'float' },
      ],
    },
    format: {
      type: 'number',
      format: 'accounting',
      decimalPlaces: 3,
    },
    output: `[ $ -, $ 17,777.889, $ (155.234) ]`,
  },
];

const testTableData: {
  input: Array<number | bigint | null>;
  output: string;
  format: CellNumberFormat;
  columnType: List;
}[] = [
  {
    input: [0, 100, -34567],
    format: undefined,
    columnType: {
      typeId: DataType.List,
      child: { name: 'f', type: 'int' },
    },
    output: '[ 0, 100, -34567 ]',
  },
  {
    input: [0, 100, -34567],
    format: {
      type: 'number',
      format: 'default',
      decimalPlaces: 3,
    },
    columnType: {
      typeId: DataType.List,
      child: { name: 'f', type: 'int' },
    },
    output: '[ 0.000, 100.000, -34567.000 ]',
  },
  {
    input: [0, 100, -34567],
    format: {
      type: 'number',
      format: 'currency',
      currency: 'pounds',
    },
    columnType: {
      typeId: DataType.List,
      child: { name: 'f', type: 'int' },
    },
    output: '[ £0.00, £100.00, -£34,567.00 ]',
  },
  {
    input: [0, 100, -34567],
    format: {
      type: 'number',
      format: 'percent',
      decimalPlaces: 1,
    },
    columnType: {
      typeId: DataType.List,
      child: { name: 'f', type: 'int' },
    },
    output: '[ 0.0%, 10000.0%, -3456700.0% ]',
  },
  {
    input: [0, 3.656768, -1234.56789],
    format: {
      type: 'number',
      format: 'scientific',
      decimalPlaces: 4,
    },
    columnType: {
      typeId: DataType.List,
      child: { name: 'f', type: { typeId: DataType.Float } },
    },
    output: '[ 0.0000e+0, 3.6568e+0, -1.2346e+3 ]',
  },
  {
    input: [0, 3.656768, -1234.56789],
    format: {
      type: 'number',
      format: 'accounting',
      decimalPlaces: 1,
    },
    columnType: {
      typeId: DataType.List,
      child: { name: 'f', type: { typeId: DataType.Float } },
    },
    output: '[ $ -, $ 3.7, $ (1,234.6) ]',
  },
  {
    input: [0n, 12345678n, -78903456n],
    format: {
      type: 'number',
      format: 'percent',
      decimalPlaces: 1,
    },
    columnType: {
      typeId: DataType.List,
      child: {
        name: 'f',
        type: { typeId: DataType.Decimal, precision: 8, scale: 4 },
      },
    },
    output: '[ 0.0%, 123456.8%, -789034.6% ]',
  },
  {
    input: [0n, 12345678n, -78993456n],
    format: {
      type: 'number',
      format: 'accounting',
      decimalPlaces: 1,
    },
    columnType: {
      typeId: DataType.List,
      child: {
        name: 'f',
        type: { typeId: DataType.Decimal, precision: 8, scale: 6 },
      },
    },
    output: '[ $ -, $ 12.3, $ (79.0) ]',
  },
];

describe('test data format for number list', () => {
  for (let i = 0; i < testData.length; i++) {
    const { input, output, format } = testData[i];
    it(`free form number ${input} with format ${format} should be ${output}`, () => {
      const result = formatFormulaData(input, format, { isRoot: true });
      equal(result, output);
    });
  }

  for (let i = 0; i < testTableData.length; i++) {
    const { input, output, format, columnType } = testTableData[i];
    it(`table number ${input} with format ${format} should be ${output}`, () => {
      const result = formatTableCellValue(input, columnType, format, {
        isRoot: true,
      });
      equal(result, output);
    });
  }
});
