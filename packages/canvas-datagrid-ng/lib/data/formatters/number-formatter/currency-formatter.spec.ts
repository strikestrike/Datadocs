/// <reference types="mocha" />

import { deepStrictEqual, equal } from 'assert';
import type {
  CurrencyType,
  CellNumberCurrencyFormat,
} from '../../../types/data-format';
import { numberFormatter } from './index';

const currencyData: {
  input: number | { a: bigint; b: number };
  output: string;
  currency: CurrencyType;
  decimalPlaces?: number;
}[] = [
  {
    input: 0,
    output: '$0.00',
    currency: 'usd',
  },
  {
    input: -0.0012345,
    output: '-$0.00',
    currency: 'usd',
  },
  {
    input: 123,
    output: '$123.00',
    currency: 'usd',
  },
  {
    input: -123,
    output: '-$123.00',
    currency: 'usd',
  },
  {
    input: 1.234e10,
    output: '$12,340,000,000.00',
    currency: 'usd',
  },
  {
    input: -1.234e10,
    output: '-$12,340,000,000.00',
    currency: 'usd',
  },
  {
    input: 1.234e50,
    output:
      '$123,400,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000.00',
    currency: 'usd',
  },
  {
    input: -1.234e50,
    output:
      '-$123,400,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000.00',
    currency: 'usd',
  },
  {
    input: { a: 12345n, b: 2 },
    output: '$123.45',
    currency: 'usd',
  },
  {
    input: { a: -12345n, b: 2 },
    output: '-$123.45',
    currency: 'usd',
  },
  {
    input: { a: 1111n, b: 0 },
    output: '$1,111.00',
    currency: 'usd',
  },
  {
    input: { a: 1n, b: 4 },
    output: '$0.00',
    currency: 'usd',
  },
  {
    input: { a: 1111000000n, b: 8 },
    output: '$11.11',
    currency: 'usd',
  },

  // Euro
  {
    input: 1.234e5,
    output: '€123,400.00',
    currency: 'euro',
  },
  {
    input: -1.234e5,
    output: '-€123,400.00',
    currency: 'euro',
  },

  // Pounds
  {
    input: 11.234,
    output: '£11.23',
    currency: 'pounds',
  },
  {
    input: -11.234,
    output: '-£11.23',
    currency: 'pounds',
  },
  {
    input: Infinity,
    output: 'Infinity',
    currency: 'pounds',
  },
  {
    input: -Infinity,
    output: '-Infinity',
    currency: 'pounds',
  },

  // currency with custom decimal places
  {
    input: { a: 0n, b: 0 },
    output: '$0',
    currency: 'usd',
    decimalPlaces: 0,
  },
  {
    input: { a: 0n, b: 9 },
    output: '$0',
    currency: 'usd',
    decimalPlaces: 0,
  },
  {
    input: { a: -12345n, b: 7 },
    output: '-$0.00',
    currency: 'usd',
    decimalPlaces: 2,
  },
  {
    input: 123,
    output: '$123.000000',
    currency: 'usd',
    decimalPlaces: 6,
  },
  {
    input: 123.45678,
    output: '$123.457',
    currency: 'usd',
    decimalPlaces: 3,
  },
  {
    input: 0.999999,
    output: '$1.000',
    currency: 'usd',
    decimalPlaces: 3,
  },
  {
    input: 1.77777777,
    output: '$2',
    currency: 'usd',
    decimalPlaces: 0,
  },
  {
    input: { a: 12345n, b: 4 },
    output: '$1.235',
    currency: 'usd',
    decimalPlaces: 3,
  },
  {
    input: { a: -1234567n, b: 5 },
    output: '-$12.3457',
    currency: 'usd',
    decimalPlaces: 4,
  },
  {
    input: { a: 12345n, b: 3 },
    output: '$12',
    currency: 'usd',
    decimalPlaces: 0,
  },
  {
    input: { a: 12345n, b: 10 },
    output: '$0.0000012',
    currency: 'usd',
    decimalPlaces: 7,
  },
  {
    input: { a: 123456789123456789n, b: 4 },
    output: '$12,345,678,912,345.679',
    currency: 'usd',
    decimalPlaces: 3,
  },
  // long decimal places
  {
    input: 1111.1111111111,
    output: '$1,111.11111111110000000000',
    currency: 'usd',
    decimalPlaces: 20,
  },
  {
    input: 1111.999999999999,
    output: '$1,111.9999999999990000000000000',
    currency: 'usd',
    decimalPlaces: 25,
  },
];

describe('test number currency formatter', () => {
  for (let i = 0; i < currencyData.length; i++) {
    const { input, output, currency, decimalPlaces } = currencyData[i];
    const decimalPlacesDisplay = decimalPlaces ?? 'auto';
    const inputStr =
      typeof input === 'number'
        ? String(input)
        : `{a: ${input.a.toString()}n, b: ${input.b}}`;
    it(`number ${inputStr} with format ${currency} and decimalPlaces ${decimalPlacesDisplay} should be ${output}`, () => {
      const result = numberFormatter(input, {
        type: 'number',
        format: 'currency',
        currency,
        decimalPlaces,
      });
      equal(output, result);
    });
  }
});
