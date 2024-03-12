// /// <reference types="mocha" />

import { equal } from 'assert';
import type { CellTimestampTypeFormat } from '../../../types/data-format';
import type { ParserCellData } from '../../../types';
import { formatFormulaData, formatTableCellValue } from '../../data-format';
import { DataType } from '../../../types/column-types';
import { getDateObject } from './util';

const timestampSample = getDateObject('2023-1-1 8:01:02.432').getTime();

const testData: {
  input: ParserCellData;
  output: string;
  format: CellTimestampTypeFormat;
}[] = [
  {
    input: { dataType: 'timestamp', value: timestampSample },
    format: {
      type: 'timestamp',
      format: 'M/d/yyyy HH:mm:ss UTCZ',
      timeZoneOffset: 360,
    },
    output: `1/1/2023 02:01:02 UTC-6`,
  },
  {
    input: { dataType: 'timestamp', value: timestampSample },
    format: {
      type: 'timestamp',
      format: 'MM/dd/yyyy HH:mm:ss UTCZZZ',
      timeZoneOffset: -120,
    },
    output: `01/01/2023 10:01:02 UTC+0200`,
  },
];

const columnType = { typeId: DataType.Timestamp };

const testTableData: {
  input: number;
  output: string;
  format: CellTimestampTypeFormat;
  columnType: any;
}[] = [
  {
    input: timestampSample,
    columnType,
    format: {
      type: 'timestamp',
      format: 'M/d/yyyy HH:mm:ss UTCZ',
      timeZoneOffset: 360,
    },
    output: `1/1/2023 02:01:02 UTC-6`,
  },
  {
    input: timestampSample,
    columnType,
    format: {
      type: 'timestamp',
      format: 'MM/dd/yyyy HH:mm:ss UTCZZZ',
      timeZoneOffset: -120,
    },
    output: `01/01/2023 10:01:02 UTC+0200`,
  },
];

describe('test data format for timestamp', () => {
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
