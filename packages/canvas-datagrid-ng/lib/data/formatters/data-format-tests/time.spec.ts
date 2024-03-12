// /// <reference types="mocha" />

import { equal } from 'assert';
import type { CellTimeTypeFormat } from '../../../types/data-format';
import type { ParserCellData, List } from '../../../types';
import { formatFormulaData, formatTableCellValue } from '../../data-format';
import { DataType } from '../../../types/column-types';
import { getDateObject } from './util';

const sampleTime = getDateObject('2023-1-1 21:12:02').getTime();

const testData: {
  input: ParserCellData;
  output: string;
  format: CellTimeTypeFormat;
}[] = [
  {
    input: { dataType: 'time', value: sampleTime },
    format: { type: 'time', format: 'HH:mm:ss' },
    output: `21:12:02`,
  },
  {
    input: { dataType: 'time', value: sampleTime },
    format: { type: 'time', format: 'h:mm AM/PM' },
    output: `9:12 PM`,
  },
  {
    input: { dataType: 'time', value: sampleTime },
    format: { type: 'time', format: 'HH:mm' },
    output: `21:12`,
  },
];

const tableTimeSample = BigInt(sampleTime) * 1000n;
const columnType = { typeId: DataType.Time };

const testTableData: {
  input: bigint;
  output: string;
  format: CellTimeTypeFormat;
  columnType: any;
}[] = [
  {
    input: tableTimeSample,
    columnType,
    format: { type: 'time', format: 'HH:mm:ss' },
    output: `21:12:02`,
  },
  {
    input: tableTimeSample,
    columnType,
    format: { type: 'time', format: 'h:mm AM/PM' },
    output: `9:12 PM`,
  },
  {
    input: tableTimeSample,
    columnType,
    format: { type: 'time', format: 'HH:mm' },
    output: `21:12`,
  },
];

describe('test data format for time', () => {
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
