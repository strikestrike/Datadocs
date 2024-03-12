/// <reference types="mocha" />
import { equal } from 'assert';
import { intervalFormatter } from '../';
import type { CellIntervalFormat } from '../../../types/data-format';
import { dateTimeToMs, weekToMs } from './index';

const testData: {
  input: number;
  format: CellIntervalFormat['format'];
  moreOptions: Partial<CellIntervalFormat>;
  output: string;
  locale?: string;
}[] = [
  // ISO_FULL
  {
    // full
    input: dateTimeToMs(1, 1, 1, 1, 1, 1, 111),
    format: 'ISO_FULL',
    moreOptions: {},
    output: 'P1Y1M1DT1H1M1.111S',
  },
  {
    // omit year
    input: dateTimeToMs(0, 2, 3, 4, 5, 6),
    format: 'ISO_FULL',
    moreOptions: {},
    output: 'P2M3DT4H5M6S',
  },
  {
    // omit date part
    input: dateTimeToMs(0, 0, 0, 2, 3, 20),
    format: 'ISO_FULL',
    moreOptions: {},
    output: 'PT2H3M20S',
  },
  {
    // omit time part
    input: dateTimeToMs(100, 11, 10, 0, 0, 0),
    format: 'ISO_FULL',
    moreOptions: {},
    output: 'P100Y11M10D',
  },
  {
    // omit all
    input: dateTimeToMs(0, 0, 0, 0, 0, 0),
    format: 'ISO_FULL',
    moreOptions: {},
    output: 'PT0S',
  },
  {
    // with milliseconds
    input: dateTimeToMs(2, 3, 4, 0, 0, 0, 200),
    format: 'ISO_FULL',
    moreOptions: {},
    output: 'P2Y3M4DT0.2S',
  },
  {
    // negative
    input: dateTimeToMs(-2, -1, -3, -5, -25, -30),
    format: 'ISO_FULL',
    moreOptions: {},
    output: '-P2Y1M3DT5H25M30S',
  },

  // INTERVAL_DATETIME
  {
    // full
    input: dateTimeToMs(1, 1, 1, 1, 1, 1, 111),
    format: 'INTERVAL_DATETIME',
    moreOptions: {},
    output: 'P0001-01-01T01:01:01.111',
  },
  {
    // omit year
    input: dateTimeToMs(0, 2, 3, 4, 5, 6),
    format: 'INTERVAL_DATETIME',
    moreOptions: {},
    output: 'P0000-02-03T04:05:06',
  },
  {
    // omit date part
    input: dateTimeToMs(0, 0, 0, 2, 3, 20),
    format: 'INTERVAL_DATETIME',
    moreOptions: {},
    output: 'PT02:03:20',
  },
  {
    // omit time part
    input: dateTimeToMs(100, 11, 10, 0, 0, 0),
    format: 'INTERVAL_DATETIME',
    moreOptions: {},
    output: 'P0100-11-10',
  },
  {
    // omit all
    input: dateTimeToMs(0, 0, 0, 0, 0, 0),
    format: 'INTERVAL_DATETIME',
    moreOptions: {},
    output: 'PT00:00:00',
  },
  {
    // with milliseconds
    input: dateTimeToMs(2, 3, 4, 0, 0, 0, 200),
    format: 'INTERVAL_DATETIME',
    moreOptions: {},
    output: 'P0002-03-04T00:00:00.2',
  },
  {
    // negative
    input: dateTimeToMs(-2, -1, -3, -5, -25, -30, -20),
    format: 'INTERVAL_DATETIME',
    moreOptions: {},
    output: '-P0002-01-03T05:25:30.02',
  },

  // NORMAL_DATETIME
  {
    // full
    input: dateTimeToMs(1, 1, 1, 1, 1, 1, 111),
    format: 'NORMAL_DATETIME',
    moreOptions: {},
    output: '0001-01-01 01:01:01.111',
  },
  {
    // omit year
    input: dateTimeToMs(0, 2, 3, 4, 5, 6),
    format: 'NORMAL_DATETIME',
    moreOptions: {},
    output: '0000-02-03 04:05:06',
  },
  {
    // omit date part
    input: dateTimeToMs(0, 0, 0, 2, 3, 20),
    format: 'NORMAL_DATETIME',
    moreOptions: {},
    output: '02:03:20',
  },
  {
    // omit time part
    input: dateTimeToMs(100, 11, 10, 0, 0, 0),
    format: 'NORMAL_DATETIME',
    moreOptions: {},
    output: '0100-11-10',
  },
  {
    // omit all
    input: dateTimeToMs(0, 0, 0, 0, 0, 0),
    format: 'NORMAL_DATETIME',
    moreOptions: {},
    output: '00:00:00',
  },
  {
    // with milliseconds
    input: dateTimeToMs(2, 3, 4, 0, 0, 0, 200),
    format: 'NORMAL_DATETIME',
    moreOptions: {},
    output: '0002-03-04 00:00:00.2',
  },
  {
    // negative
    input: dateTimeToMs(-2, -1, -3, -5, -25, -30, -20),
    format: 'NORMAL_DATETIME',
    moreOptions: {},
    output: '0002-01-03 05:25:30.02',
  },

  // BIG_QUERY_LIKE
  {
    // full
    input: dateTimeToMs(1, 1, 1, 1, 1, 1, 111),
    format: 'BIG_QUERY_LIKE',
    moreOptions: {},
    output: '1-1 1.01:01:01.111',
  },
  {
    // omit year
    input: dateTimeToMs(0, 2, 3, 4, 5, 6),
    format: 'BIG_QUERY_LIKE',
    moreOptions: {},
    output: '0-2 3.04:05:06',
  },
  {
    // omit date part
    input: dateTimeToMs(0, 0, 0, 2, 3, 20),
    format: 'BIG_QUERY_LIKE',
    moreOptions: {},
    output: '02:03:20',
  },
  {
    // omit time part
    input: dateTimeToMs(100, 11, 10, 0, 0, 0),
    format: 'BIG_QUERY_LIKE',
    moreOptions: {},
    output: '100-11 10',
  },
  {
    // omit all
    input: dateTimeToMs(0, 0, 0, 0, 0, 0),
    format: 'BIG_QUERY_LIKE',
    moreOptions: {},
    output: '00:00:00',
  },
  {
    // with milliseconds
    input: dateTimeToMs(2, 3, 4, 0, 0, 0, 200),
    format: 'BIG_QUERY_LIKE',
    moreOptions: {},
    output: '2-3 4.00:00:00.2',
  },
  {
    // negative
    input: dateTimeToMs(-2, -1, -3, -5, -25, -30, -20),
    format: 'BIG_QUERY_LIKE',
    moreOptions: {},
    output: '-2-1 -3.-05:25:30.02',
  },

  // ISO_WEEK
  {
    // full
    input: weekToMs(1, 1, 1, 1, 111),
    format: 'ISO_WEEK',
    moreOptions: {},
    output: 'P1W1H1M1.111S',
  },
  {
    // omit week
    input: weekToMs(0, 1, 1, 1, 111),
    format: 'ISO_WEEK',
    moreOptions: {},
    output: 'P1H1M1.111S',
  },
  {
    // second only
    input: weekToMs(0, 0, 0, 1, 111),
    format: 'ISO_WEEK',
    moreOptions: {},
    output: 'P1.111S',
  },
  {
    // zero
    input: weekToMs(0, 0, 0, 0),
    format: 'ISO_WEEK',
    moreOptions: {},
    output: 'P0S',
  },
  {
    // negative
    input: weekToMs(-3, -5, -25, -30, -20),
    format: 'ISO_WEEK',
    moreOptions: {},
    output: '-P3W5H25M30.02S',
  },

  // HUMANRIZE
  {
    input: dateTimeToMs(2, 3, 4, 5, 6, 7, 200),
    format: 'HUMANRIZE',
    moreOptions: {
      style: 'long',
      conjunction: true,
      separator: true,
    },
    output: '2 years, 3 months, 4 days, 5 hours, 6 minutes, and 7.2 seconds',
  },
  {
    input: dateTimeToMs(-2, -3, -4, -5, -6, -7, -200),
    format: 'HUMANRIZE',
    moreOptions: {
      style: 'long',
      conjunction: true,
      separator: true,
    },
    output:
      '-2 years, -3 months, -4 days, -5 hours, -6 minutes, and -7.2 seconds',
  },
  {
    input: dateTimeToMs(0, 0, 0, 0, 6, 7, 200),
    format: 'HUMANRIZE',
    moreOptions: {
      style: 'long',
      conjunction: true,
      separator: true,
    },
    output: '6 minutes and 7.2 seconds',
  },
  {
    input: dateTimeToMs(0, 0, 0, 5, 6, 7, 200),
    format: 'HUMANRIZE',
    moreOptions: {
      style: 'long',
      conjunction: true,
      separator: true,
    },
    output: '5 hours, 6 minutes, and 7.2 seconds',
  },
  {
    input: dateTimeToMs(1, 2, 0, 0, 0, 7, 200),
    format: 'HUMANRIZE',
    moreOptions: {
      style: 'long',
      conjunction: true,
      separator: true,
    },
    output: '1 year, 2 months, and 7.2 seconds',
  },
  {
    input: dateTimeToMs(2, 0, 0, 0, 0, 0),
    format: 'HUMANRIZE',
    moreOptions: {
      style: 'long',
      conjunction: true,
      separator: false,
    },
    output: '2 years',
  },
  {
    input: dateTimeToMs(2, 1, 0, 0, 0, 0),
    format: 'HUMANRIZE',
    moreOptions: {
      style: 'long',
      conjunction: true,
      separator: false,
    },
    output: '2 years and 1 month',
  },
  {
    input: dateTimeToMs(2, 3, 4, 5, 6, 7, 200),
    format: 'HUMANRIZE',
    moreOptions: {
      style: 'short',
      conjunction: false,
      separator: true,
    },
    output: '2 yrs, 3 mths, 4 days, 5 hr, 6 min, 7.2 sec',
  },
  {
    input: dateTimeToMs(2, 3, 4, 5, 6, 7, 200),
    format: 'HUMANRIZE',
    moreOptions: {
      style: 'short',
      conjunction: false,
      separator: false,
    },
    output: '2 yrs 3 mths 4 days 5 hr 6 min 7.2 sec',
  },
  {
    input: dateTimeToMs(-2, -3, -4, -5, -6, -7, -200),
    format: 'HUMANRIZE',
    moreOptions: {
      style: 'short',
      conjunction: false,
      separator: false,
    },
    output: '-2 yrs -3 mths -4 days -5 hr -6 min -7.2 sec',
  },
  {
    input: dateTimeToMs(2, 3, 4, 5, 6, 7, 200),
    format: 'HUMANRIZE',
    moreOptions: {
      style: 'narrow',
      conjunction: false,
      separator: true,
    },
    output: '2y, 3m, 4d, 5h, 6m, 7.2s',
  },
  {
    input: dateTimeToMs(-2, -3, -4, -5, -6, -7, -200),
    format: 'HUMANRIZE',
    moreOptions: {
      style: 'narrow',
      conjunction: false,
      separator: true,
    },
    output: '-2y, -3m, -4d, -5h, -6m, -7.2s',
  },
  {
    input: dateTimeToMs(2, 3, 4, 5, 6, 7, 200),
    format: 'HUMANRIZE',
    moreOptions: {
      style: 'narrow',
      conjunction: false,
      separator: false,
    },
    output: '2y 3m 4d 5h 6m 7.2s',
  },
];

describe('test interval formatter', () => {
  for (let i = 0; i < testData.length; i++) {
    const data = testData[i];
    it(`${data.input}ms with pattern ${data.format} should be ${data.output}`, () => {
      const result = intervalFormatter(
        data.input,
        {
          type: 'interval',
          format: data.format,
          ...data.moreOptions,
        },
        data.locale,
      );
      equal(result, data.output);
    });
  }
});
