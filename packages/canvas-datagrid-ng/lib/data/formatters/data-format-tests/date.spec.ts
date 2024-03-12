// /// <reference types="mocha" />

import { equal } from 'assert';
import type { CellDateTypeFormat } from '../../../types/data-format';
import type { ParserCellData, List } from '../../../types';
import { formatFormulaData, formatTableCellValue } from '../../data-format';
import { DataType } from '../../../types/column-types';
import { getDateObject } from './util';

const sampleDate = getDateObject('2023-3-31');

const testData: {
  input: ParserCellData;
  output: string;
  format: CellDateTypeFormat;
}[] = [
  {
    input: { dataType: 'date', value: sampleDate.getTime() },
    format: { type: 'date', format: 'M/d/yyyy' },
    output: `3/31/2023`,
  },
  {
    input: { dataType: 'date', value: sampleDate.getTime() },
    format: { type: 'date', format: 'yyyy-MM-dd' },
    output: `2023-03-31`,
  },
  {
    input: { dataType: 'date', value: sampleDate.getTime() },
    format: { type: 'date', format: 'MMMM d, yyyy' },
    output: `March 31, 2023`,
  },
];

const dateType = { typeId: DataType.Date };

const testTableData: {
  input: Date;
  output: string;
  format: CellDateTypeFormat;
  columnType: any;
}[] = [
  {
    input: sampleDate,
    columnType: dateType,
    format: { type: 'date', format: 'M/d/yyyy' },
    output: `3/31/2023`,
  },
  {
    input: sampleDate,
    columnType: dateType,
    format: { type: 'date', format: 'yyyy-MM-dd' },
    output: `2023-03-31`,
  },
  {
    input: sampleDate,
    columnType: dateType,
    format: { type: 'date', format: 'MMMM d, yyyy' },
    output: `March 31, 2023`,
  },
];

describe('test data format for date', () => {
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
