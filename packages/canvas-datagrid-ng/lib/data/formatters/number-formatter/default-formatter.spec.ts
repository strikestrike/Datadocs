/// <reference types="mocha" />

import { deepStrictEqual } from 'assert';
import type { CellNumberFormat } from '../../../types/data-format';
import { numberFormatter } from './index';

const currencyData: {
  input: number | { a: bigint; b: number };
  output: string;
  decimalPlaces?: number;
}[] = [
  // number
  {
    input: 0,
    output: '0',
  },
  {
    input: 123,
    output: '123',
  },
  {
    input: -123,
    output: '-123',
  },
  {
    input: 1.234e10,
    output: '12340000000',
  },
  {
    input: -1.234e10,
    output: '-12340000000',
  },
  {
    input: 1.234e50,
    output: '1.234e+50',
  },
  {
    input: -1.234e50,
    output: '-1.234e+50',
  },
  {
    input: 1.234e-50,
    output: '1.234e-50',
  },
  {
    input: -1.234e-50,
    output: '-1.234e-50',
  },
  {
    input: 1.66666666666666,
    output: '1.66666667',
  },
  // float infinite
  {
    input: Infinity,
    output: 'Infinity',
  },
  {
    input: -Infinity,
    output: '-Infinity',
  },
  // number with custom decimal places
  {
    input: 12,
    output: '12.000',
    decimalPlaces: 3,
  },
  {
    input: 12.345678,
    output: '12.3',
    decimalPlaces: 1,
  },
  {
    input: 12.345678,
    output: '12.346',
    decimalPlaces: 3,
  },
  {
    input: 12.99996,
    output: '13.00',
    decimalPlaces: 2,
  },
  {
    input: 1.999999999,
    output: '2.00000000',
    decimalPlaces: 8,
  },
  {
    input: 1.777777777777,
    output: '1.77777778',
    decimalPlaces: 8,
  },
  // decimal
  {
    input: { a: 0n, b: 0 },
    output: '0',
  },
  {
    input: { a: 12345n, b: 2 },
    output: '123.45',
  },
  {
    input: { a: -12345n, b: 2 },
    output: '-123.45',
  },
  {
    input: { a: 1n, b: 8 },
    output: '1e-8',
  },
  {
    input: { a: 123456789123456789123456789n, b: 1 },
    output: '1.23457e+25',
  },
  {
    input: { a: 166666666666666n, b: 14 },
    output: '1.66666667',
  },
  {
    input: { a: 999999999999999999n, b: 0 },
    output: '1e+18',
  },
  // decimal with custom decimal places
  {
    input: { a: 0n, b: 0 },
    output: '0.00',
    decimalPlaces: 2,
  },
  {
    input: { a: 0n, b: 9 },
    output: '0.00',
    decimalPlaces: 2,
  },
  {
    input: { a: 12345n, b: 0 },
    output: '12345.00',
    decimalPlaces: 2,
  },
  {
    input: { a: 12345n, b: 3 },
    output: '12.3',
    decimalPlaces: 1,
  },
  {
    // small decimal 1e-8
    input: { a: 1n, b: 8 },
    output: '1.00e-8',
    decimalPlaces: 2,
  },
  {
    // small decimal 1e-8
    input: { a: 1n, b: 8 },
    output: '1e-8',
    decimalPlaces: 0,
  },
  {
    // big decimal
    input: { a: 123456789123456789n, b: 1 },
    output: '1.2346e+16',
    decimalPlaces: 4,
  },
  {
    // big decimal
    input: { a: 123456789123456789n, b: 1 },
    output: '1e+16',
    decimalPlaces: 0,
  },
  {
    input: { a: 123456789n, b: 7 },
    output: '12.35',
    decimalPlaces: 2,
  },
  {
    input: { a: 123456789n, b: 4 },
    output: '12346',
    decimalPlaces: 0,
  },

  // long decimal places
  {
    input: 1111.1111111111,
    output: '1111.11111111110000000000',
    decimalPlaces: 20,
  },
  {
    input: -1111.1111111111,
    output: '-1111.1111111111000000000000000',
    decimalPlaces: 25,
  },
  {
    input: 1.777777777777e50,
    output: '1.77777777777700000000e+50',
    decimalPlaces: 20,
  },
  {
    input: -1.777777777777e50,
    output: '-1.7777777777770000000000000e+50',
    decimalPlaces: 25,
  },
  {
    input: 1.777777777777e-50,
    output: '1.77777777777700000000e-50',
    decimalPlaces: 20,
  },
  {
    input: -1.777777777777e-50,
    output: '-1.77777777777700000000e-50',
    decimalPlaces: 20,
  },
  {
    input: 123,
    output: '123',
    decimalPlaces: null,
  },
];

describe('test number default formatter', () => {
  for (let i = 0; i < currencyData.length; i++) {
    const { input, output, decimalPlaces } = currencyData[i];
    const decimalPlacesDisplay = decimalPlaces ?? 'auto';
    const inputStr =
      typeof input === 'number'
        ? String(input)
        : `{a: ${input.a.toString()}n, b: ${input.b}}`;
    it(`number ${inputStr} with decimalPlaces ${decimalPlacesDisplay} should be ${output}`, () => {
      const result = numberFormatter(input, {
        type: 'number',
        format: 'default',
        decimalPlaces,
      });
      deepStrictEqual(output, result);
    });
  }
});
