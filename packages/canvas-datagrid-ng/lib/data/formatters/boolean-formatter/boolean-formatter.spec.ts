/// <reference types="mocha" />

import { deepStrictEqual } from 'assert';
import type { CellBooleanFormat } from '../../../types/data-format';
import { booleanFormatter } from './boolean-formatter';

const testData: {
  input: boolean;
  output: string;
  format: CellBooleanFormat['format'];
}[] = [
  // true|false
  {
    input: true,
    format: 'true|false',
    output: 'true',
  },
  {
    input: false,
    format: 'true|false',
    output: 'false',
  },
  // TRUE|FALSE
  {
    input: true,
    format: 'TRUE|FALSE',
    output: 'TRUE',
  },
  {
    input: false,
    format: 'TRUE|FALSE',
    output: 'FALSE',
  },
  // True|False
  {
    input: true,
    format: 'True|False',
    output: 'True',
  },
  {
    input: false,
    format: 'True|False',
    output: 'False',
  },
  // yes|no
  {
    input: true,
    format: 'yes|no',
    output: 'yes',
  },
  {
    input: false,
    format: 'yes|no',
    output: 'no',
  },
  // Yes|No
  {
    input: true,
    format: 'Yes|No',
    output: 'Yes',
  },
  {
    input: false,
    format: 'Yes|No',
    output: 'No',
  },
  // YES|NO
  {
    input: true,
    format: 'YES|NO',
    output: 'YES',
  },
  {
    input: false,
    format: 'YES|NO',
    output: 'NO',
  },
  // 1|0
  {
    input: true,
    format: '1|0',
    output: '1',
  },
  {
    input: false,
    format: '1|0',
    output: '0',
  },

  // default format
  {
    input: true,
    format: undefined,
    output: 'true',
  },
  {
    input: false,
    format: undefined,
    output: 'false',
  },
];

describe('test boolean formatter', () => {
  for (let i = 0; i < testData.length; i++) {
    const { input, output, format } = testData[i];
    it(`boolean ${input} with format ${format} should be ${output}`, () => {
      const result = booleanFormatter(input, { type: 'boolean', format });
      deepStrictEqual(output, result);
    });
  }
});
