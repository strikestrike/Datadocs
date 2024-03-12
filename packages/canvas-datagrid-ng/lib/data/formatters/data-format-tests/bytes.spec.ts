// // /// <reference types="mocha" />

import { equal } from 'assert';
import type { CellBytesFormat } from '../../../types/data-format';
import { DataType, type ParserCellData } from '../../../types';
import { formatFormulaData, formatTableCellValue } from '../../data-format';
const encoder = new TextEncoder();

const testData: {
  input: ParserCellData;
  output: string;
  format: CellBytesFormat;
}[] = [
  {
    input: { value: encoder.encode('hello'), dataType: 'bytes' },
    format: { type: 'bytes', format: 'utf8' },
    output: `b 'hello'`,
  },
  {
    input: {
      value: new Uint8Array([0x01, 0xa0, 0x7e, 0x00, 0x32]),
      dataType: 'bytes',
    },
    format: { type: 'bytes', format: 'hex' },
    output: `b '01a07e0032'`,
  },
  {
    input: {
      value: encoder.encode('example data for base64 format'),
      dataType: 'bytes',
    },
    format: { type: 'bytes', format: 'base64' },
    output: `b 'ZXhhbXBsZSBkYXRhIGZvciBiYXNlNjQgZm9ybWF0'`,
  },
];

const testTableData: {
  input: Uint8Array;
  output: string;
  format: CellBytesFormat;
}[] = [
  {
    input: encoder.encode('hello'),
    format: { type: 'bytes', format: 'utf8' },
    output: `b 'hello'`,
  },
  {
    input: new Uint8Array([0x01, 0xa0, 0x7e, 0x00, 0x32]),
    format: { type: 'bytes', format: 'hex' },
    output: `b '01a07e0032'`,
  },
  {
    input: encoder.encode('example data for base64 format'),
    format: { type: 'bytes', format: 'base64' },
    output: `b 'ZXhhbXBsZSBkYXRhIGZvciBiYXNlNjQgZm9ybWF0'`,
  },
];

describe('test data format for bytes', () => {
  for (let i = 0; i < testData.length; i++) {
    const { input, output, format } = testData[i];
    it(`bytes ${input} with format ${format} should be ${output}`, () => {
      const result = formatFormulaData(input, format, { isRoot: true });
      equal(result, output);
    });
  }

  const byteType = { typeId: DataType.Bytes };
  for (let i = 0; i < testTableData.length; i++) {
    const { input, output, format } = testTableData[i];
    it(`table bytes ${input} with format ${format} should be ${output}`, () => {
      const result = formatTableCellValue(input, byteType, format, {
        isRoot: true,
      });
      equal(result, output);
    });
  }
});
