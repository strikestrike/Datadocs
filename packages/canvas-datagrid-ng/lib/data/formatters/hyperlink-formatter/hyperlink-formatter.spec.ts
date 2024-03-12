/// <reference types="mocha" />

import { deepStrictEqual } from 'assert';
import { hyperlinkFormatter } from './hyperlink-formatter';

const testData: Array<{
  input: string;
  expect: ReturnType<typeof hyperlinkFormatter>;
}> = [
  {
    input: 'There is no link in this text 1234.567',
    expect: 'There is no link in this text 1234.567',
  },
  {
    input: 'https://abc.xyz',
    expect: {
      type: 'hyperlink',
      value: 'https://abc.xyz',
      linkRuns: [
        {
          startOffset: 0,
          endOffset: 15,
          ref: 'https://abc.xyz',
        },
      ],
    },
  },
  {
    input: 'Google https://google.com.',
    expect: {
      type: 'hyperlink',
      value: 'Google https://google.com.',
      linkRuns: [
        {
          startOffset: 7,
          endOffset: 25,
          ref: 'https://google.com',
        },
      ],
    },
  },
  {
    input:
      'https://google.com and Google Sheets https://docs.google.com/spreadsheets',
    expect: {
      type: 'hyperlink',
      value:
        'https://google.com and Google Sheets https://docs.google.com/spreadsheets',
      linkRuns: [
        {
          startOffset: 0,
          endOffset: 18,
          ref: 'https://google.com',
        },
        {
          startOffset: 37,
          endOffset: 73,
          ref: 'https://docs.google.com/spreadsheets',
        },
      ],
    },
  },
];

describe('test hyperlink formatter', () => {
  for (let i = 0; i < testData.length; i++) {
    const { input, expect } = testData[i];
    it(`Text input: '${input}'`, () => {
      const output = hyperlinkFormatter(input);
      deepStrictEqual(output, expect);
    });
  }
});
