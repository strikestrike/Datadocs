// /// <reference types="mocha" />

import { equal } from 'assert';
import type { CellDateTimeFormat } from '../../../types/data-format';
import type { ParserCellData, List } from '../../../types';
import { formatFormulaData, formatTableCellValue } from '../../data-format';
import { DataType } from '../../../types/column-types';
import { getDateObject } from './util';

const sampleDatetime = getDateObject('2023-3-31 21:12:02').getTime();

const testData: {
  input: ParserCellData;
  output: string;
  format: CellDateTimeFormat;
}[] = [
  {
    input: { dataType: 'datetime', value: sampleDatetime },
    format: { type: 'datetime', format: 'M/d/yyyy HH:mm:ss' },
    output: `3/31/2023 21:12:02`,
  },
  {
    input: { dataType: 'datetime', value: sampleDatetime },
    format: { type: 'datetime', format: 'yyyy-MM-dd h:mm AM/PM' },
    output: `2023-03-31 9:12 PM`,
  },
  {
    input: { dataType: 'datetime', value: sampleDatetime },
    format: { type: 'datetime', format: 'MMMM d, yyyy HH:mm' },
    output: `March 31, 2023 21:12`,
  },
];

const columnType = { typeId: DataType.DateTime };
const testTableData: {
  input: number;
  output: string;
  format: CellDateTimeFormat;
  columnType: any;
}[] = [
  {
    input: sampleDatetime,
    columnType,
    format: { type: 'datetime', format: 'M/d/yyyy HH:mm:ss' },
    output: `3/31/2023 21:12:02`,
  },
  {
    input: sampleDatetime,
    columnType,
    format: { type: 'datetime', format: 'yyyy-MM-dd h:mm AM/PM' },
    output: `2023-03-31 9:12 PM`,
  },
  {
    input: sampleDatetime,
    columnType,
    format: { type: 'datetime', format: 'MMMM d, yyyy HH:mm' },
    output: `March 31, 2023 21:12`,
  },
];

describe('test data format for datetime', () => {
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
