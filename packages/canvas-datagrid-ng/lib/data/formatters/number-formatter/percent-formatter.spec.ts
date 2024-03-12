/// <reference types="mocha" />

import { equal } from 'assert';
import { numberFormatter } from './index';

const currencyData: {
  input: number | { a: bigint; b: number };
  output: string;
  decimalPlaces?: number;
}[] = [
  // number
  {
    input: 0,
    output: '0.00%',
  },
  {
    input: 123,
    output: '12300.00%',
  },
  {
    input: -123,
    output: '-12300.00%',
  },
  {
    input: 1123.45678,
    output: '112345.68%',
  },
  {
    input: -1123.45678,
    output: '-112345.68%',
  },
  {
    input: 0.123456,
    output: '12.35%',
  },
  {
    input: -0.123456,
    output: '-12.35%',
  },
  {
    input: 0.17777777777,
    output: '17.78%',
  },
  {
    input: -0.17777777777,
    output: '-17.78%',
  },
  {
    input: -123456e20,
    output: '-1234560000000000000000000000.00%',
  },
  {
    input: 123456e20,
    output: '1234560000000000000000000000.00%',
  },
  {
    input: -123456e20,
    output: '-1234560000000000000000000000.00%',
  },
  {
    input: 123456e-20,
    output: '0.00%',
  },
  {
    input: -123456e-20,
    output: '-0.00%',
  },
  // number with custom decimal places
  {
    input: 0,
    output: '0.0000000000%',
    decimalPlaces: 10,
  },
  {
    input: -123,
    output: '-12300%',
    decimalPlaces: 0,
  },
  {
    input: 1123.456789,
    output: '112345.679%',
    decimalPlaces: 3,
  },
  {
    input: 0.123456,
    output: '12.35%',
    decimalPlaces: 2,
  },
  {
    input: 0.17777777777,
    output: '17.7777777770000000000000000%',
    decimalPlaces: 25,
  },
  {
    input: -123456e20,
    output: '-1234560000000000000000000000.0%',
    decimalPlaces: 1,
  },
  {
    input: 0.123456e-10,
    output: '0.0000000012%',
    decimalPlaces: 10,
  },
  // decimal
  {
    input: { a: 0n, b: 0 },
    output: '0.00%',
  },
  {
    input: { a: 0n, b: 9 },
    output: '0.00%',
  },
  {
    input: { a: 123n, b: 0 },
    output: '12300.00%',
  },
  {
    input: { a: -123n, b: 0 },
    output: '-12300.00%',
  },
  {
    input: { a: 112345678n, b: 5 },
    output: '112345.68%',
  },
  {
    input: { a: -112345678n, b: 5 },
    output: '-112345.68%',
  },
  {
    input: { a: 123456n, b: 6 },
    output: '12.35%',
  },
  {
    input: { a: -123456n, b: 6 },
    output: '-12.35%',
  },
  {
    input: { a: 17777777777n, b: 11 },
    output: '17.78%',
  },
  {
    input: { a: -17777777777n, b: 11 },
    output: '-17.78%',
  },
  {
    input: { a: 123456n, b: 20 },
    output: '0.00%',
  },
  {
    input: { a: -123456n, b: 20 },
    output: '-0.00%',
  },
  // decimal with custom decimal places
  {
    input: { a: 0n, b: 0 },
    output: '0.0000000000%',
    decimalPlaces: 10,
  },
  {
    input: { a: 123n, b: 0 },
    output: '12300%',
    decimalPlaces: 0,
  },
  {
    input: { a: -112345678n, b: 5 },
    output: '-112345.678%',
    decimalPlaces: 3,
  },
  {
    input: { a: 123456n, b: 6 },
    output: '12.35%',
    decimalPlaces: 2,
  },
  {
    input: { a: 17777777777n, b: 11 },
    output: '17.7777777770000000000000000%',
    decimalPlaces: 25,
  },
  {
    input: { a: -17777777777n, b: 11 },
    output: '-17.7777777770000000000000000%',
    decimalPlaces: 25,
  },
];

describe('test number percent formatter', () => {
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
        format: 'percent',
        decimalPlaces,
      });
      equal(output, result);
    });
  }
});
