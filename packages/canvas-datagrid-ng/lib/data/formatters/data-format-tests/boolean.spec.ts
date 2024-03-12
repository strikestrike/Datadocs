/// <reference types="mocha" />

import { equal } from 'assert';
import type { CellBooleanFormat } from '../../../types/data-format';
import type { ParserCellData } from '../../../types';
import { formatFormulaData, formatTableCellValue } from '../../data-format';

const testData: {
  input: ParserCellData;
  output: string;
  format: CellBooleanFormat['format'];
}[] = [
  {
    input: { value: true, dataType: 'boolean' },
    format: 'true|false',
    output: 'true',
  },
  {
    input: { value: false, dataType: 'boolean' },
    format: 'TRUE|FALSE',
    output: 'FALSE',
  },
  {
    input: { value: true, dataType: 'boolean' },
    format: 'True|False',
    output: 'True',
  },
  {
    input: { value: false, dataType: 'boolean' },
    format: 'yes|no',
    output: 'no',
  },
  {
    input: { value: true, dataType: 'boolean' },
    format: 'YES|NO',
    output: 'YES',
  },
  {
    input: { value: false, dataType: 'boolean' },
    format: '1|0',
    output: '0',
  },
];

const testTableData: {
  input: boolean;
  output: string;
  format: CellBooleanFormat['format'];
}[] = [
  {
    input: true,
    format: 'true|false',
    output: 'true',
  },
  {
    input: false,
    format: 'TRUE|FALSE',
    output: 'FALSE',
  },
  {
    input: false,
    format: 'True|False',
    output: 'False',
  },
  {
    input: true,
    format: 'yes|no',
    output: 'yes',
  },
  {
    input: true,
    format: 'YES|NO',
    output: 'YES',
  },
  {
    input: false,
    format: '1|0',
    output: '0',
  },
];

describe('test data format for boolean', () => {
  for (let i = 0; i < testData.length; i++) {
    const { input, output, format } = testData[i];
    it(`free form boolean ${input} with format ${format} should be ${output}`, () => {
      const result = formatFormulaData(
        input,
        {
          type: 'boolean',
          format,
        },
        { isRoot: true },
      );
      equal(result, output);
    });
  }

  for (let i = 0; i < testTableData.length; i++) {
    const { input, output, format } = testTableData[i];
    it(`table boolean ${input} with format ${format} should be ${output}`, () => {
      const result = formatTableCellValue(
        input,
        'boolean',
        {
          type: 'boolean',
          format,
        },
        { isRoot: true },
      );
      equal(result, output);
    });
  }
});
