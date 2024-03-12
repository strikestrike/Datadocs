/// <reference types="mocha" />

import { equal } from 'assert';
import { numberFormatter } from './index';

const currencyData: {
  input: number | { a: bigint; b: number };
  output: string;
  decimalPlaces?: number;
}[] = [
  {
    input: { a: 0n, b: 0 },
    output: '0.00e+0',
  },
  {
    input: { a: 0n, b: 9 },
    output: '0.00e+0',
  },
  {
    input: 1.235e10,
    output: '1.24e+10',
    decimalPlaces: 2,
  },
  {
    input: { a: 12345n, b: 8 },
    output: '1.235e-4',
    decimalPlaces: 3,
  },
  {
    input: { a: -12345n, b: 8 },
    output: '-1.235e-4',
    decimalPlaces: 3,
  },
  {
    input: { a: 12345n, b: 1 },
    output: '1.235e+3',
    decimalPlaces: 3,
  },
  // long decimal places
  {
    input: 1.11111111111111,
    output: '1.1111111111111100000000e+0',
    decimalPlaces: 22,
  },
  {
    input: -1.11111111111111,
    output: '-1.1111111111111100000000e+0',
    decimalPlaces: 22,
  },
  {
    input: { a: 111111111111111n, b: 13 },
    output: '1.1111111111111100000000e+1',
    decimalPlaces: 22,
  },
  {
    input: { a: -111111111111111n, b: 13 },
    output: '-1.1111111111111100000000e+1',
    decimalPlaces: 22,
  },
  {
    input: { a: 16666666666666n, b: 13 },
    output: '1.6666666667e+0',
    decimalPlaces: 10,
  },
  {
    input: { a: -19999999999999n, b: 13 },
    output: '-2.0000000000e+0',
    decimalPlaces: 10,
  },
  // Number of digits increase after rounding
  {
    input: { a: 999999999999999999n, b: 0 },
    output: '1.00000e+18',
    decimalPlaces: 5,
  },
  {
    input: { a: -999999999999999999n, b: 1 },
    output: '-1.0000e+17',
    decimalPlaces: 4,
  },
  {
    input: { a: 99999n, b: 20 },
    output: '1.00e-15',
    decimalPlaces: 2,
  },
];

describe('test number scientific formatter', () => {
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
        format: 'scientific',
        decimalPlaces,
      });
      equal(output, result);
    });
  }
});
