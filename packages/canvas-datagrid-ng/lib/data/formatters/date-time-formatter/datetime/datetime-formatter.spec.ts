/// <reference types="mocha" />
import { equal } from 'assert';
import { dateTimeFormatter } from '../';

const testData: {
  input: string;
  pattern: string;
  output: string;
  locale?: string;
}[] = [
  {
    input: '2023-1-1 00:01:02',
    pattern: 'MM/dd/yyyy HH:mm:ss',
    output: '01/01/2023 00:01:02',
  },
  {
    input: '2022-1-15 21:12:02',
    pattern: 'M/d/yyyy HH:mm:ss',
    output: '1/15/2022 21:12:02',
  },
  {
    input: '2021-2-11 21:12:02',
    pattern: 'M/d/yyyy h:mm AM/PM',
    output: '2/11/2021 9:12 PM',
  },
  {
    input: '2021-2-11 21:02:02',
    pattern: 'MM/d/yyyy HH:mm',
    output: '02/11/2021 21:02',
  },
  {
    input: '2023-7-14 21:00:00',
    pattern: 'ddd, MMM d, yyyy h:mm A/P',
    output: 'Fri, Jul 14, 2023 9:00 P',
  },
  {
    input: '2023-9-2 21:02:02',
    pattern: 'dddd, MMMM d, yyyy HH:mm',
    output: 'Saturday, September 2, 2023 21:02',
  },
  {
    input: '2023-6-27 00:01:02',
    pattern: 'MMM d, yyyy HH:mm:ss',
    output: 'Jun 27, 2023 00:01:02',
  },

  // locale vi
  {
    input: '2024-2-20 21:12:02',
    pattern: 'dddd, MMMM d, yyyy hh:mm:ss a/p',
    output: 'Thứ Ba, Tháng 2 20, 2024 09:12:02 c',
    locale: 'vi',
  },
  {
    input: '2024-3-08 1:12:02',
    pattern: 'ddd, MMM d, yyyy h:m:s AM/PM',
    output: 'Th 6, Thg 3 8, 2024 1:12:2 SA',
    locale: 'vi',
  },
  {
    input: '2024-5-5 21:02:21',
    pattern: 'dddd, d MMMM yyyy h a/p',
    output: 'Chủ Nhật, 5 Tháng 5 2024 9 c',
    locale: 'vi',
  },
];

describe('test datetime formatter', () => {
  for (let i = 0; i < testData.length; i++) {
    const data = testData[i];
    it(`${data.input} with pattern ${data.pattern} should be ${data.output}`, () => {
      const result = dateTimeFormatter(
        new Date(data.input + ' UTC'),
        {
          type: 'datetime',
          format: data.pattern,
        },
        data.locale,
      );
      equal(result, data.output);
    });
  }
});
