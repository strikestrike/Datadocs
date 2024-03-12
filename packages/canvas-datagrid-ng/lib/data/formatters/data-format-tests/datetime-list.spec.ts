// /// <reference types="mocha" />

import { equal } from 'assert';
import type { CellDateTimeFormat } from '../../../types/data-format';
import type { ParserCellData, List } from '../../../types';
import { formatFormulaData, formatTableCellValue } from '../../data-format';
import { DataType } from '../../../types/column-types';
import { getDateObject } from './util';

const freeFormDateArrayInput = {
  dataType: 'datetime[]',
  value: [
    {
      value: getDateObject('2023-3-31 21:12:02').getTime(),
      dataType: 'datetime',
    },
    {
      value: getDateObject('1567-7-4 00:01:02').getTime(),
      dataType: 'datetime',
    },
    {
      value: getDateObject('1987-11-21 7:45:12').getTime(),
      dataType: 'datetime',
    },
  ],
};

const testData: {
  input: ParserCellData;
  output: string;
  format: CellDateTimeFormat;
}[] = [
  {
    input: freeFormDateArrayInput,
    format: { type: 'datetime', format: 'M/d/yyyy HH:mm:ss' },
    output: `[ 3/31/2023 21:12:02, 7/4/1567 00:01:02, 11/21/1987 07:45:12 ]`,
  },
  {
    input: freeFormDateArrayInput,
    format: { type: 'datetime', format: 'yyyy-MM-dd h:mm AM/PM' },
    output: `[ 2023-03-31 9:12 PM, 1567-07-04 12:01 AM, 1987-11-21 7:45 AM ]`,
  },
  {
    input: freeFormDateArrayInput,
    format: { type: 'datetime', format: 'MMMM d, yyyy HH:mm' },
    output: `[ March 31, 2023 21:12, July 4, 1567 00:01, November 21, 1987 07:45 ]`,
  },
];

const tableDateArrayInput = [
  getDateObject('2023-3-31 21:12:02').getTime(),
  getDateObject('1567-7-4 00:01:02').getTime(),
  getDateObject('1987-11-21 7:45:12').getTime(),
];
const tableDateArrayType: List = {
  typeId: DataType.List,
  child: { name: 'f', type: { typeId: DataType.DateTime } },
};

const testTableData: {
  input: Array<number>;
  output: string;
  format: CellDateTimeFormat;
  columnType: List;
}[] = [
  {
    input: tableDateArrayInput,
    columnType: tableDateArrayType,
    format: { type: 'datetime', format: 'M/d/yyyy HH:mm:ss' },
    output: `[ 3/31/2023 21:12:02, 7/4/1567 00:01:02, 11/21/1987 07:45:12 ]`,
  },
  {
    input: tableDateArrayInput,
    columnType: tableDateArrayType,
    format: { type: 'datetime', format: 'yyyy-MM-dd h:mm AM/PM' },
    output: `[ 2023-03-31 9:12 PM, 1567-07-04 12:01 AM, 1987-11-21 7:45 AM ]`,
  },
  {
    input: tableDateArrayInput,
    columnType: tableDateArrayType,
    format: { type: 'datetime', format: 'MMMM d, yyyy HH:mm' },
    output: `[ March 31, 2023 21:12, July 4, 1567 00:01, November 21, 1987 07:45 ]`,
  },
];

describe('test data format for datetime list', () => {
  for (let i = 0; i < testData.length; i++) {
    const { input, output, format } = testData[i];
    it(`free form datetime ${input} with format ${format} should be ${output}`, () => {
      const result = formatFormulaData(input, format, { isRoot: true });
      equal(result, output);
    });
  }

  for (let i = 0; i < testTableData.length; i++) {
    const { input, output, format, columnType } = testTableData[i];
    it(`table datetime ${input} with format ${format} should be ${output}`, () => {
      const result = formatTableCellValue(input, columnType, format, {
        isRoot: true,
      });
      equal(result, output);
    });
  }
});
