// /// <reference types="mocha" />

import { equal } from 'assert';
import type { CellDateTypeFormat } from '../../../types/data-format';
import type { ParserCellData, List } from '../../../types';
import { formatFormulaData, formatTableCellValue } from '../../data-format';
import { DataType } from '../../../types/column-types';
import { getDateObject } from './util';

const freeFormDateArrayInput = {
  dataType: 'date[]',
  value: [
    {
      value: getDateObject('2023-3-31').getTime(),
      dataType: 'date',
    },
    {
      value: getDateObject('1567-7-4').getTime(),
      dataType: 'date',
    },
    {
      value: getDateObject('1987-11-21').getTime(),
      dataType: 'date',
    },
  ],
};

const testData: {
  input: ParserCellData;
  output: string;
  format: CellDateTypeFormat;
}[] = [
  {
    input: freeFormDateArrayInput,
    format: { type: 'date', format: 'M/d/yyyy' },
    output: `[ 3/31/2023, 7/4/1567, 11/21/1987 ]`,
  },
  {
    input: freeFormDateArrayInput,
    format: { type: 'date', format: 'yyyy-MM-dd' },
    output: `[ 2023-03-31, 1567-07-04, 1987-11-21 ]`,
  },
  {
    input: freeFormDateArrayInput,
    format: { type: 'date', format: 'MMMM d, yyyy' },
    output: `[ March 31, 2023, July 4, 1567, November 21, 1987 ]`,
  },
];

const tableDateArrayInput = [
  getDateObject('2023-3-31'),
  getDateObject('1567-7-4'),
  getDateObject('1987-11-21'),
];
const tableDateArrayType: List = {
  typeId: DataType.List,
  child: { name: 'f', type: 'date' },
};

const testTableData: {
  input: Array<Date | Date[]>;
  output: string;
  format: CellDateTypeFormat;
  columnType: List;
}[] = [
  {
    input: tableDateArrayInput,
    columnType: tableDateArrayType,
    format: { type: 'date', format: 'M/d/yyyy' },
    output: `[ 3/31/2023, 7/4/1567, 11/21/1987 ]`,
  },
  {
    input: tableDateArrayInput,
    columnType: tableDateArrayType,
    format: { type: 'date', format: 'yyyy-MM-dd' },
    output: `[ 2023-03-31, 1567-07-04, 1987-11-21 ]`,
  },
  {
    input: tableDateArrayInput,
    columnType: tableDateArrayType,
    format: { type: 'date', format: 'MMMM d, yyyy' },
    output: `[ March 31, 2023, July 4, 1567, November 21, 1987 ]`,
  },
];

describe('test data format for date list', () => {
  for (let i = 0; i < testData.length; i++) {
    const { input, output, format } = testData[i];
    it(`free form date ${input} with format ${format} should be ${output}`, () => {
      const result = formatFormulaData(input, format, { isRoot: true });
      equal(result, output);
    });
  }

  for (let i = 0; i < testTableData.length; i++) {
    const { input, output, format, columnType } = testTableData[i];
    it(`table date ${input} with format ${format} should be ${output}`, () => {
      const result = formatTableCellValue(input, columnType, format, {
        isRoot: true,
      });
      equal(result, output);
    });
  }
});
