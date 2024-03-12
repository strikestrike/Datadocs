// /// <reference types="mocha" />

import { equal } from 'assert';
import type { CellTimeTypeFormat } from '../../../types/data-format';
import type { ParserCellData, List } from '../../../types';
import { formatFormulaData, formatTableCellValue } from '../../data-format';
import { DataType } from '../../../types/column-types';
import { getDateObject } from './util';

const freeFormDateArrayInput = {
  dataType: 'time[]',
  value: [
    {
      value: getDateObject('2023-1-1 21:12:02').getTime(),
      dataType: 'time',
    },
    {
      value: getDateObject('2023-1-1 00:01:02').getTime(),
      dataType: 'time',
    },
    {
      value: getDateObject('2023-1-1 7:45:12').getTime(),
      dataType: 'time',
    },
  ],
};

const testData: {
  input: ParserCellData;
  output: string;
  format: CellTimeTypeFormat;
}[] = [
  {
    input: freeFormDateArrayInput,
    format: { type: 'time', format: 'HH:mm:ss' },
    output: `[ 21:12:02, 00:01:02, 07:45:12 ]`,
  },
  {
    input: freeFormDateArrayInput,
    format: { type: 'time', format: 'h:mm AM/PM' },
    output: `[ 9:12 PM, 12:01 AM, 7:45 AM ]`,
  },
  {
    input: freeFormDateArrayInput,
    format: { type: 'time', format: 'HH:mm' },
    output: `[ 21:12, 00:01, 07:45 ]`,
  },
];

const tableDateArrayInput = [
  BigInt(getDateObject('2023-1-1 21:12:02').getTime() * 1000),
  BigInt(getDateObject('2023-1-1 00:01:02').getTime() * 1000),
  BigInt(getDateObject('2023-1-1 7:45:12').getTime() * 1000),
];
const tableDateArrayType: List = {
  typeId: DataType.List,
  child: { name: 'f', type: { typeId: DataType.Time } },
};

const testTableData: {
  input: Array<bigint>;
  output: string;
  format: CellTimeTypeFormat;
  columnType: List;
}[] = [
  {
    input: tableDateArrayInput,
    columnType: tableDateArrayType,
    format: { type: 'time', format: 'HH:mm:ss' },
    output: `[ 21:12:02, 00:01:02, 07:45:12 ]`,
  },
  {
    input: tableDateArrayInput,
    columnType: tableDateArrayType,
    format: { type: 'time', format: 'h:mm AM/PM' },
    output: `[ 9:12 PM, 12:01 AM, 7:45 AM ]`,
  },
  {
    input: tableDateArrayInput,
    columnType: tableDateArrayType,
    format: { type: 'time', format: 'HH:mm' },
    output: `[ 21:12, 00:01, 07:45 ]`,
  },
];

describe('test data format for time list', () => {
  for (let i = 0; i < testData.length; i++) {
    const { input, output, format } = testData[i];
    it(`free form time ${input} with format ${format} should be ${output}`, () => {
      const result = formatFormulaData(input, format, { isRoot: true });
      equal(result, output);
    });
  }

  for (let i = 0; i < testTableData.length; i++) {
    const { input, output, format, columnType } = testTableData[i];
    it(`table time ${input} with format ${format} should be ${output}`, () => {
      const result = formatTableCellValue(input, columnType, format, {
        isRoot: true,
      });
      equal(result, output);
    });
  }
});
