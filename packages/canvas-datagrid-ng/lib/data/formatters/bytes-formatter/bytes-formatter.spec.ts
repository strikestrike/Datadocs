/// <reference types="mocha" />
import { strictEqual } from 'assert';
import type { CellBytesFormat } from '../../../types/data-format';
import { bytesFormatter } from './bytes-formatter';

const ELLIPISS = '…';

const testData: {
  input: string;
  output: string;
  limit?: number;
  format: CellBytesFormat['format'];
}[] = [
  // utf8
  {
    input: 'this some test for byte format',
    format: 'utf8',
    output: 'this some test for byte format',
    limit: -1,
  },
  {
    input: 'hello world',
    format: 'utf8',
    output: 'hello w' + ELLIPISS,
    limit: 7,
  },
  {
    input: '1 năm, 2 tháng, 3 ngày, 1 giờ, 2 phút, và 3 giây',
    format: 'utf8',
    output: '1 năm, 2 tháng, 3 ngày, 1 giờ, 2 phút, và 3 giây',
    limit: -1,
  },
  {
    input: '1 năm, 2 tháng, 3 ngày, 1 giờ, 2 phút, và 3 giây',
    format: 'utf8',
    output: '1 năm, 2 tháng,' + ELLIPISS,
    limit: 15,
  },

  // base 64
  {
    input: 'example data for base64 format',
    format: 'base64',
    output: 'ZXhhbXBsZSBkYXRhIGZvciBiYXNlNjQgZm9ybWF0',
    limit: -1,
  },
  {
    input: 'example data for base64 format',
    format: 'base64',
    output: 'ZXhhbXBsZSBkYXRhIGZv' + ELLIPISS,
    limit: 20,
  },
  {
    input: '1 năm, 2 tháng, 3 ngày, 1 giờ, 2 phút, và 3 giây',
    format: 'base64',
    output:
      'MSBuxINtLCAyIHRow6FuZywgMyBuZ8OgeSwgMSBnaeG7nSwgMiBwaMO6dCwgdsOgIDMgZ2nDonk=',
    limit: -1,
  },
];

const testHexData: {
  input: Uint8Array;
  output: string;
  limit?: number;
  format: CellBytesFormat['format'];
}[] = [
  {
    input: new Uint8Array([0x01, 0xa0, 0x7e, 0x00, 0x32]),
    format: 'hex',
    limit: -1,
    output: '01a07e0032',
  },
  {
    input: new Uint8Array([
      0x11, 0xaa, 0x7e, 0x8c, 0x32, 0xaa, 0x7e, 0x8c, 0x32, 0xaa, 0x7e, 0x8c,
      0x32,
    ]),
    format: 'hex',
    limit: 15,
    output: '11aa7e8c32aa7e8' + ELLIPISS,
  },
  {
    input: new Uint8Array([
      0x11, 0xaa, 0x00, 0x8c, 0x32, 0x0a, 0x7e, 0x8c, 0x32, 0xaa, 0x7e, 0x8c,
      0x02,
    ]),
    format: 'hex',
    limit: -1,
    output: '11aa008c320a7e8c32aa7e8c02',
  },
];

describe('test string formatter', () => {
  const encoder = new TextEncoder();
  for (let i = 0; i < testData.length; i++) {
    const { input, output, format, limit } = testData[i];
    it(`string ${input} with format ${format} should be ${output}`, () => {
      const result = bytesFormatter(encoder.encode(input), limit, {
        type: 'bytes',
        format,
      });
      strictEqual(result, output);
    });
  }

  for (let i = 0; i < testHexData.length; i++) {
    const { input, output, format, limit } = testHexData[i];
    it(`Array [${input}] with format ${format} should be ${output}`, () => {
      const result = bytesFormatter(input, limit, { type: 'bytes', format });
      strictEqual(result, output);
    });
  }
});
