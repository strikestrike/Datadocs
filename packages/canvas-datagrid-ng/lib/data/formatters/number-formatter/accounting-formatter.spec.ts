/// <reference types="mocha" />

import { deepEqual } from 'assert';
import { numberFormatter } from './index';
import type {
  CurrencyType,
  CellDataFormatResult,
} from '../../../types/data-format';
import { ACCOUNTING_ZERO_VALUE } from './accounting-formatter';

const currencyData: {
  input: number | { a: bigint; b: number };
  output: CellDataFormatResult;
  decimalPlaces?: number;
  currency?: CurrencyType;
}[] = [
  // number
  {
    input: 0,
    output: {
      type: 'accounting',
      prefix: '$',
      value: ACCOUNTING_ZERO_VALUE,
    },
  },
  {
    input: 123,
    output: {
      type: 'accounting',
      prefix: '$',
      value: '123.00',
    },
  },
  {
    input: -123,
    output: {
      type: 'accounting',
      prefix: '$',
      value: '(123.00)',
    },
  },
  {
    input: 1123.45678,
    output: {
      type: 'accounting',
      prefix: '$',
      value: '1,123.46',
    },
  },
  {
    input: -1123.45678,
    output: {
      type: 'accounting',
      prefix: '$',
      value: '(1,123.46)',
    },
  },
  {
    input: 0.17777777777,
    output: {
      type: 'accounting',
      prefix: '$',
      value: '0.18',
    },
  },
  {
    input: -0.17777777777,
    output: {
      type: 'accounting',
      prefix: '$',
      value: '(0.18)',
    },
  },
  {
    input: -123456e20,
    output: {
      type: 'accounting',
      prefix: '$',
      value: '(12,345,600,000,000,000,000,000,000.00)',
    },
  },
  {
    input: 123456e20,
    output: {
      type: 'accounting',
      prefix: '$',
      value: '12,345,600,000,000,000,000,000,000.00',
    },
  },
  {
    input: 123456e-20,
    output: {
      type: 'accounting',
      prefix: '$',
      value: '0.00',
    },
  },
  {
    input: -123456e-20,
    output: {
      type: 'accounting',
      prefix: '$',
      value: '(0.00)',
    },
  },
  // number with custom decimal places
  {
    input: 0,
    output: {
      type: 'accounting',
      prefix: '$',
      value: ACCOUNTING_ZERO_VALUE,
    },
    decimalPlaces: 10,
  },
  {
    input: -123,
    output: {
      type: 'accounting',
      prefix: '$',
      value: '(123)',
    },
    decimalPlaces: 0,
  },
  {
    input: 0.17777777777,
    output: {
      type: 'accounting',
      prefix: '$',
      value: '0.1777777777700000000000000',
    },
    decimalPlaces: 25,
  },
  // decimal
  {
    input: { a: 0n, b: 0 },
    output: {
      type: 'accounting',
      prefix: '$',
      value: ACCOUNTING_ZERO_VALUE,
    },
  },
  {
    input: { a: 0n, b: 9 },
    output: {
      type: 'accounting',
      prefix: '$',
      value: ACCOUNTING_ZERO_VALUE,
    },
  },
  {
    input: { a: 123n, b: 0 },
    output: {
      type: 'accounting',
      prefix: '$',
      value: '123.00',
    },
  },
  {
    input: { a: -123n, b: 0 },
    output: {
      type: 'accounting',
      prefix: '$',
      value: '(123.00)',
    },
  },
  {
    input: { a: 112345678n, b: 5 },
    output: {
      type: 'accounting',
      prefix: '$',
      value: '1,123.46',
    },
  },
  {
    input: { a: -112345678n, b: 5 },
    output: {
      type: 'accounting',
      prefix: '$',
      value: '(1,123.46)',
    },
  },
  {
    input: { a: 123456n, b: 6 },
    output: {
      type: 'accounting',
      prefix: '$',
      value: '0.12',
    },
  },
  {
    input: { a: -123456n, b: 6 },
    output: {
      type: 'accounting',
      prefix: '$',
      value: '(0.12)',
    },
  },
  {
    input: { a: 17777777777n, b: 11 },
    output: {
      type: 'accounting',
      prefix: '$',
      value: '0.18',
    },
  },
  {
    input: { a: -17777777777n, b: 11 },
    output: {
      type: 'accounting',
      prefix: '$',
      value: '(0.18)',
    },
  },
  {
    input: { a: 123456n, b: 20 },
    output: {
      type: 'accounting',
      prefix: '$',
      value: '0.00',
    },
  },
  {
    input: { a: -123456n, b: 20 },
    output: {
      type: 'accounting',
      prefix: '$',
      value: '(0.00)',
    },
  },
  // decimal with custom decimal places
  {
    input: { a: 0n, b: 0 },
    output: {
      type: 'accounting',
      prefix: '$',
      value: ACCOUNTING_ZERO_VALUE,
    },
    decimalPlaces: 10,
  },
  {
    input: { a: 123n, b: 0 },
    output: {
      type: 'accounting',
      prefix: '$',
      value: '123',
    },
    decimalPlaces: 0,
  },
  {
    input: { a: -112345678n, b: 5 },
    output: {
      type: 'accounting',
      prefix: '$',
      value: '(1,123.457)',
    },
    decimalPlaces: 3,
  },
  {
    input: { a: 17777777777n, b: 11 },
    output: {
      type: 'accounting',
      prefix: '$',
      value: '0.1777777777700000000000000',
    },
    decimalPlaces: 25,
  },
  {
    input: { a: -17777777777n, b: 11 },
    output: {
      type: 'accounting',
      prefix: '$',
      value: '(0.1777777777700000000000000)',
    },
    decimalPlaces: 25,
  },
];

describe('test number accounting formatter', () => {
  for (let i = 0; i < currencyData.length; i++) {
    const { input, output, decimalPlaces, currency } = currencyData[i];
    const decimalPlacesDisplay = decimalPlaces ?? 'auto';
    const inputStr =
      typeof input === 'number'
        ? String(input)
        : `{a: ${input.a.toString()}n, b: ${input.b}}`;
    it(`number ${inputStr} with decimalPlaces ${decimalPlacesDisplay} should be ${output}`, () => {
      const result = numberFormatter(input, {
        type: 'number',
        format: 'accounting',
        decimalPlaces,
      });
      deepEqual(output, result);
    });
  }
});
