/// <reference types="mocha" />
import { equal } from 'assert';
import { dateTimeFormatter } from '../';

const testData: {
  input: string;
  pattern: string;
  output: string;
  locale?: string;
}[] = [
  // h:mm:ss AM/PM
  {
    input: '2023-1-1 0:01:02',
    pattern: 'h:mm:ss AM/PM',
    output: '12:01:02 AM',
  },
  {
    input: '2023-1-1 6:00:01',
    pattern: 'h:mm:ss AM/PM',
    output: '6:00:01 AM',
  },
  {
    input: '2023-1-1 12:01:19',
    pattern: 'h:mm:ss AM/PM',
    output: '12:01:19 PM',
  },
  {
    input: '2023-1-1 15:25:37',
    pattern: 'h:mm:ss AM/PM',
    output: '3:25:37 PM',
  },
  {
    input: '2023-1-1 19:43:52',
    pattern: 'h:mm:ss AM/PM',
    output: '7:43:52 PM',
  },
  {
    input: '2023-1-1 23:59:59',
    pattern: 'h:mm:ss AM/PM',
    output: '11:59:59 PM',
  },
  // H:mm:ss
  {
    input: '2023-1-1 0:01:02',
    pattern: 'HH:mm:ss',
    output: '00:01:02',
  },
  {
    input: '2023-1-1 6:00:01',
    pattern: 'H:mm:ss',
    output: '6:00:01',
  },
  {
    input: '2023-1-1 12:01:19',
    pattern: 'H:mm:ss',
    output: '12:01:19',
  },
  {
    input: '2023-1-1 15:25:37',
    pattern: 'HH:mm:ss',
    output: '15:25:37',
  },
  {
    input: '2023-1-1 19:43:52',
    pattern: 'H:mm:ss',
    output: '19:43:52',
  },
  {
    input: '2023-1-1 23:59:59',
    pattern: 'H:mm:ss',
    output: '23:59:59',
  },
  // h:m:s AM/PM
  {
    input: '2023-1-1 0:01:02',
    pattern: 'h:m:s AM/PM',
    output: '12:1:2 AM',
  },
  {
    input: '2023-1-1 6:00:01',
    pattern: 'h:m:s AM/PM',
    output: '6:0:1 AM',
  },
  {
    input: '2023-1-1 12:01:19',
    pattern: 'h:m:s AM/PM',
    output: '12:1:19 PM',
  },
  {
    input: '2023-1-1 15:25:03',
    pattern: 'h:m:s AM/PM',
    output: '3:25:3 PM',
  },
  // h:mm AM/PM
  {
    input: '2023-1-1 7:30:01',
    pattern: 'h:mm AM/PM',
    output: '7:30 AM',
  },
  {
    input: '2023-1-1 17:15:19',
    pattern: 'h:mm AM/PM',
    output: '5:15 PM',
  },
  // full meridiems lower case
  {
    input: '2023-1-1 7:30:01',
    pattern: 'h:mm am/pm',
    output: '7:30 am',
  },
  {
    input: '2023-1-1 17:15:19',
    pattern: 'h:mm am/pm',
    output: '5:15 pm',
  },
  // short meridiems upper case
  {
    input: '2023-1-1 8:30:01',
    pattern: 'h:mm:ss A/P',
    output: '8:30:01 A',
  },
  {
    input: '2023-1-1 17:20:00',
    pattern: 'h:mm A/P',
    output: '5:20 P',
  },
  // short meridiems lower case
  {
    input: '2023-1-1 8:30:01',
    pattern: 'h:mm:ss a/p',
    output: '8:30:01 a',
  },
  {
    input: '2023-1-1 18:06:00',
    pattern: 'h:mm a/p',
    output: '6:06 p',
  },
  // Vi locale
  {
    input: '2023-1-1 7:30:01',
    pattern: 'h:mm AM/PM',
    output: '7:30 SA',
    locale: 'vi',
  },
  {
    input: '2023-1-1 17:15:19',
    pattern: 'h:mm AM/PM',
    output: '5:15 CH',
    locale: 'vi',
  },
  {
    input: '2023-1-1 8:30:01',
    pattern: 'h:mm am/pm',
    output: '8:30 sa',
    locale: 'vi',
  },
  {
    input: '2023-1-1 14:15:19',
    pattern: 'h:mm am/pm',
    output: '2:15 ch',
    locale: 'vi',
  },
  {
    input: '2023-1-1 8:30:01',
    pattern: 'h:mm:ss A/P',
    output: '8:30:01 S',
    locale: 'vi',
  },
  {
    input: '2023-1-1 17:20:00',
    pattern: 'h:mm A/P',
    output: '5:20 C',
    locale: 'vi',
  },
  {
    input: '2023-1-1 8:30:01',
    pattern: 'h:mm:ss a/p',
    output: '8:30:01 s',
    locale: 'vi',
  },
  {
    input: '2023-1-1 18:06:00',
    pattern: 'h:mm a/p',
    output: '6:06 c',
    locale: 'vi',
  },
];

describe('test time formatter', () => {
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
