// // /// <reference types="mocha" />

import { equal } from 'assert';
import type { CellBytesFormat } from '../../../types/data-format';
import type { ParserCellData } from '../../../types';
import { formatFormulaData } from '../../data-format';
const encoder = new TextEncoder();

const testData: {
  input: ParserCellData;
  output: string;
  format: CellBytesFormat;
}[] = [
  {
    input: {
      dataType: 'bytes[]',
      value: [
        { value: encoder.encode('hello'), dataType: 'bytes' },
        { value: encoder.encode('world'), dataType: 'bytes' },
        { value: encoder.encode('there'), dataType: 'bytes' },
      ],
    },
    format: { type: 'bytes', format: 'utf8' },
    output: `[ b 'hello', b 'world', b 'there' ]`,
  },
  {
    input: {
      dataType: 'bytes[]',
      value: [
        {
          value: new Uint8Array([0x01, 0xa0, 0x7e, 0x00, 0x32]),
          dataType: 'bytes',
        },
        {
          value: new Uint8Array([0x01]),
          dataType: 'bytes',
        },
        {
          value: new Uint8Array([]),
          dataType: 'bytes',
        },
      ],
    },
    format: { type: 'bytes', format: 'hex' },
    output: `[ b '01a07e0032', b '01', b '' ]`,
  },
  {
    input: {
      dataType: 'bytes[]',
      value: [
        {
          value: encoder.encode('example data for base64 format'),
          dataType: 'bytes',
        },
      ],
    },
    format: { type: 'bytes', format: 'base64' },
    output: `[ b 'ZXhhbXBsZSBkYXRhIGZvciBiYXNlNjQgZm9ybWF0' ]`,
  },
];

describe('test data format for bytes list', () => {
  for (let i = 0; i < testData.length; i++) {
    const { input, output, format } = testData[i];
    it(`bytes ${input} with format ${format} should be ${output}`, () => {
      const result = formatFormulaData(input, format, { isRoot: true });
      equal(result, output);
    });
  }
});
