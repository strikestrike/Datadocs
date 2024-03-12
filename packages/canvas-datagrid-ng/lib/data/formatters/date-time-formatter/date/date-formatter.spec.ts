/// <reference types="mocha" />
import { equal } from 'assert';
import { dateTimeFormatter } from '../';

const testData: {
  input: string;
  pattern: string;
  output: string;
  locale?: string;
}[] = [
  // M/d/yyyy
  {
    input: '2023-1-1',
    pattern: 'M/d/yyyy',
    output: '1/1/2023',
  },
  {
    input: '2023-1-15',
    pattern: 'M/d/yyyy',
    output: '1/15/2023',
  },
  {
    input: '2023-1-31',
    pattern: 'M/d/yyyy',
    output: '1/31/2023',
  },
  {
    input: '2023-2-28',
    pattern: 'M/d/yyyy',
    output: '2/28/2023',
  },

  // "M/d/yy"
  {
    input: '2023-3-1',
    pattern: 'M/d/yy',
    output: '3/1/23',
  },
  {
    input: '2023-3-31',
    pattern: 'M/d/yy',
    output: '3/31/23',
  },
  {
    input: '2023-4-12',
    pattern: 'M/d/yy',
    output: '4/12/23',
  },

  // "MMMM d, yyyy"
  {
    input: '2023-4-24',
    pattern: 'MMMM d, yyyy',
    output: 'April 24, 2023',
  },
  {
    input: '2023-5-1',
    pattern: 'MMMM d, yyyy',
    output: 'May 1, 2023',
  },
  {
    input: '2023-5-10',
    pattern: 'MMMM d, yyyy',
    output: 'May 10, 2023',
  },

  // "MMM d, yyyy"
  {
    input: '2023-6-1',
    pattern: 'MMM d, yyyy',
    output: 'Jun 1, 2023',
  },
  {
    input: '2023-6-27',
    pattern: 'MMM d, yyyy',
    output: 'Jun 27, 2023',
  },
  {
    input: '2023-7-1',
    pattern: 'MMM d, yyyy',
    output: 'Jul 1, 2023',
  },

  // "ddd, MMM d, yyyy"
  {
    input: '2023-7-14',
    pattern: 'ddd, MMM d, yyyy',
    output: 'Fri, Jul 14, 2023',
  },
  {
    input: '2023-7-29',
    pattern: 'ddd, MMM d, yyyy',
    output: 'Sat, Jul 29, 2023',
  },
  {
    input: '2023-8-3',
    pattern: 'ddd, MMM d, yyyy',
    output: 'Thu, Aug 3, 2023',
  },

  // "dddd, MMMM d, yyyy"
  {
    input: '2023-9-2',
    pattern: 'dddd, MMMM d, yyyy',
    output: 'Saturday, September 2, 2023',
  },
  {
    input: '2023-9-19',
    pattern: 'dddd, MMMM d, yyyy',
    output: 'Tuesday, September 19, 2023',
  },
  {
    input: '2023-10-20',
    pattern: 'dddd, MMMM d, yyyy',
    output: 'Friday, October 20, 2023',
  },

  // "yyyy-MM-dd"
  {
    input: '2023-11-1',
    pattern: 'yyyy-MM-dd',
    output: '2023-11-01',
  },
  {
    input: '2023-11-21',
    pattern: 'yyyy-MM-dd',
    output: '2023-11-21',
  },
  {
    input: '2023-12-8',
    pattern: 'yyyy-MM-dd',
    output: '2023-12-08',
  },
  {
    input: '2024-1-5',
    pattern: 'yyyy-MM-dd',
    output: '2024-01-05',
  },

  // Locale Vi
  {
    input: '2024-2-20',
    pattern: 'dddd, MMMM d, yyyy',
    output: 'Thứ Ba, Tháng 2 20, 2024',
    locale: 'vi',
  },
  {
    input: '2024-12-20',
    pattern: 'dddd, MMMM d, yyyy',
    output: 'Thứ Sáu, Tháng 12 20, 2024',
    locale: 'vi',
  },
  {
    input: '2024-3-08',
    pattern: 'ddd, MMM d, yyyy',
    output: 'Th 6, Thg 3 8, 2024',
    locale: 'vi',
  },
  {
    input: '2024-11-07',
    pattern: 'ddd, MMM d, yyyy',
    output: 'Th 5, Thg 11 7, 2024',
    locale: 'vi',
  },
  {
    input: '2024-5-5',
    pattern: 'dddd, d MMMM yyyy',
    output: 'Chủ Nhật, 5 Tháng 5 2024',
    locale: 'vi',
  },
];

describe('test date formatter', () => {
  for (let i = 0; i < testData.length; i++) {
    const data = testData[i];
    it(`${data.input} with pattern ${data.pattern} should be ${data.output}`, () => {
      const result = dateTimeFormatter(
        new Date(data.input + ' UTC'),
        {
          type: 'date',
          format: data.pattern,
        },
        data.locale,
      );
      equal(result, data.output);
    });
  }
});
