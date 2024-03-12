// /// <reference types="mocha" />

import { equal } from 'assert';
import type { CellIntervalFormat } from '../../../types/data-format';
import type { ParserCellData } from '../../../types';
import { formatFormulaData } from '../../data-format';
import { dateTimeToMs } from '../interval-formatter';

const intervalArrayData = {
  dataType: 'interval[]',
  value: [
    { value: dateTimeToMs(1, 1, 1, 1, 1, 1, 111), dataType: 'interval' },
    { value: dateTimeToMs(0, 2, 3, 4, 5, 6), dataType: 'interval' },
    { value: dateTimeToMs(0, 0, 0, 2, 3, 20), dataType: 'interval' },
  ],
};

const testData: {
  input: ParserCellData;
  output: string;
  format: CellIntervalFormat;
}[] = [
  {
    input: intervalArrayData,
    format: { type: 'interval', format: 'ISO_FULL' },
    output: `[ P1Y1M1DT1H1M1.111S, P2M3DT4H5M6S, PT2H3M20S ]`,
  },
  {
    input: intervalArrayData,
    format: { type: 'interval', format: 'INTERVAL_DATETIME' },
    output: `[ P0001-01-01T01:01:01.111, P0000-02-03T04:05:06, PT02:03:20 ]`,
  },
  {
    input: intervalArrayData,
    format: { type: 'interval', format: 'NORMAL_DATETIME' },
    output: `[ 0001-01-01 01:01:01.111, 0000-02-03 04:05:06, 02:03:20 ]`,
  },
];

describe('test data format for interval list', () => {
  for (let i = 0; i < testData.length; i++) {
    const { input, output, format } = testData[i];
    it(`interval ${input} with format ${format} should be ${output}`, () => {
      const result = formatFormulaData(input, format, { isRoot: true });
      equal(result, output);
    });
  }
});
