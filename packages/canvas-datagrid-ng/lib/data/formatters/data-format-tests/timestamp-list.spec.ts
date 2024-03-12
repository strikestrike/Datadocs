// /// <reference types="mocha" />

import { equal } from 'assert';
import type { CellTimestampTypeFormat } from '../../../types/data-format';
import type { ParserCellData, List } from '../../../types';
import { formatFormulaData, formatTableCellValue } from '../../data-format';
import { DataType } from '../../../types/column-types';
import { getDateObject } from './util';

const freeFormDateArrayInput = {
  dataType: 'timestamp[]',
  value: [
    {
      value: getDateObject('2023-1-1 8:01:02.432').getTime(),
      dataType: 'timestamp',
    },
    {
      value: getDateObject('1567-4-1 1:01:02').getTime(),
      dataType: 'timestamp',
    },
    {
      value: getDateObject('1987-11-21 7:45:12').getTime(),
      dataType: 'timestamp',
    },
  ],
};

const testData: {
  input: ParserCellData;
  output: string;
  format: CellTimestampTypeFormat;
}[] = [
  {
    input: freeFormDateArrayInput,
    format: {
      type: 'timestamp',
      format: 'M/d/yyyy HH:mm:ss UTCZ',
      timeZoneOffset: 360,
    },
    output: `[ 1/1/2023 02:01:02 UTC-6, 3/31/1567 19:01:02 UTC-6, 11/21/1987 01:45:12 UTC-6 ]`,
  },
  {
    input: freeFormDateArrayInput,
    format: {
      type: 'timestamp',
      format: 'MM/dd/yyyy HH:mm:ss UTCZZZ',
      timeZoneOffset: -120,
    },
    output: `[ 01/01/2023 10:01:02 UTC+0200, 04/01/1567 03:01:02 UTC+0200, 11/21/1987 09:45:12 UTC+0200 ]`,
  },
];

const tableDateArrayInput = [
  getDateObject('2023-1-1 8:01:02.432').getTime(),
  getDateObject('1567-4-1 1:01:02').getTime(),
  getDateObject('1987-11-21 7:45:12').getTime(),
];
const tableDateArrayType: List = {
  typeId: DataType.List,
  child: { name: 'f', type: { typeId: DataType.Timestamp } },
};

const testTableData: {
  input: Array<number>;
  output: string;
  format: CellTimestampTypeFormat;
  columnType: List;
}[] = [
  {
    input: tableDateArrayInput,
    columnType: tableDateArrayType,
    format: {
      type: 'timestamp',
      format: 'M/d/yyyy HH:mm:ss UTCZ',
      timeZoneOffset: 360,
    },
    output: `[ 1/1/2023 02:01:02 UTC-6, 3/31/1567 19:01:02 UTC-6, 11/21/1987 01:45:12 UTC-6 ]`,
  },
  {
    input: tableDateArrayInput,
    columnType: tableDateArrayType,
    format: {
      type: 'timestamp',
      format: 'MM/dd/yyyy HH:mm:ss UTCZZZ',
      timeZoneOffset: -120,
    },
    output: `[ 01/01/2023 10:01:02 UTC+0200, 04/01/1567 03:01:02 UTC+0200, 11/21/1987 09:45:12 UTC+0200 ]`,
  },
];

describe('test data format for timestamp list', () => {
  for (let i = 0; i < testData.length; i++) {
    const { input, output, format } = testData[i];
    it(`free form timestamp ${input} with format ${format} should be ${output}`, () => {
      const result = formatFormulaData(input, format, { isRoot: true });
      equal(result, output);
    });
  }

  for (let i = 0; i < testTableData.length; i++) {
    const { input, output, format, columnType } = testTableData[i];
    it(`table timestamp ${input} with format ${format} should be ${output}`, () => {
      const result = formatTableCellValue(input, columnType, format, {
        isRoot: true,
      });
      equal(result, output);
    });
  }
});
