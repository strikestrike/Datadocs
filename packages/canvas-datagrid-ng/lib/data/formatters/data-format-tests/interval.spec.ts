// /// <reference types="mocha" />

import { equal } from 'assert';
import type { CellIntervalFormat } from '../../../types/data-format';
import { DataType, type ParserCellData } from '../../../types';
import { formatFormulaData, formatTableCellValue } from '../../data-format';
import { dateTimeToMs } from '../interval-formatter';

const intervalSample = dateTimeToMs(1, 1, 1, 1, 1, 1, 111);

const testData: {
  input: ParserCellData;
  output: string;
  format: CellIntervalFormat;
}[] = [
  {
    input: { dataType: 'interval', value: intervalSample },
    format: { type: 'interval', format: 'ISO_FULL' },
    output: `P1Y1M1DT1H1M1.111S`,
  },
  {
    input: { dataType: 'interval', value: intervalSample },
    format: { type: 'interval', format: 'INTERVAL_DATETIME' },
    output: `P0001-01-01T01:01:01.111`,
  },
  {
    input: { dataType: 'interval', value: intervalSample },
    format: { type: 'interval', format: 'NORMAL_DATETIME' },
    output: `0001-01-01 01:01:01.111`,
  },
];

const columnType = { typeId: DataType.Interval };
const testTableData: {
  input: bigint;
  output: string;
  columnType: any;
  format: CellIntervalFormat;
}[] = [
  {
    input: BigInt(intervalSample) * 1000n,
    format: { type: 'interval', format: 'ISO_FULL' },
    columnType,
    output: `P1Y1M1DT1H1M1.111S`,
  },
  {
    input: BigInt(intervalSample) * 1000n,
    format: { type: 'interval', format: 'INTERVAL_DATETIME' },
    columnType,
    output: `P0001-01-01T01:01:01.111`,
  },
  {
    input: BigInt(intervalSample) * 1000n,
    format: { type: 'interval', format: 'NORMAL_DATETIME' },
    columnType,
    output: `0001-01-01 01:01:01.111`,
  },
];

describe('test data format for interval', () => {
  for (let i = 0; i < testData.length; i++) {
    const { input, output, format } = testData[i];
    it(`interval ${input} with format ${format} should be ${output}`, () => {
      const result = formatFormulaData(input, format, { isRoot: true });
      equal(result, output);
    });
  }

  for (let i = 0; i < testTableData.length; i++) {
    const { input, output, format, columnType } = testTableData[i];
    it(`table string ${input} with format ${format} should be ${output}`, () => {
      const result = formatTableCellValue(input, columnType, format, {
        isRoot: true,
      });
      equal(result, output);
    });
  }
});
