/// <reference types="mocha" />
import { equal } from 'assert';
import { dateTimeFormatter } from '../';

const testData: {
  input: string | Date;
  pattern: string;
  output: string;
  timeZone?: string;
  timeZoneOffset?: number;
  locale?: string;
}[] = [
  {
    input: '2023-1-1 8:01:02.432',
    pattern: 'MM/dd/yyyy HH:mm:ss.SS UTCZ',
    output: '01/01/2023 02:01:02.432 UTC-6',
    timeZoneOffset: 360,
  },
  {
    input: '2023-1-1 8:01:02.432',
    pattern: 'MM/dd/yyyy HH:mm:ss.SS UTCZ',
    output: '12/31/2022 22:01:02.432 UTC-10',
    timeZoneOffset: 600,
  },
  {
    input: '2023-1-1 14:01:02.432',
    pattern: 'MM/dd/yyyy HH:mm:ss.SS UTCZ',
    output: '01/02/2023 00:01:02.432 UTC+10',
    timeZoneOffset: -600,
  },
  {
    input: '2023-1-1 8:01:02',
    pattern: 'MM/dd/yyyy HH:mm:ss UTCZZ',
    output: '01/01/2023 00:31:02 UTC-07:30',
    timeZoneOffset: 450,
  },
  {
    input: '2023-1-1 8:01:02',
    pattern: 'MM/dd/yyyy HH:mm:ss UTCZZZ',
    output: '01/01/2023 12:31:02 UTC+0430',
    timeZoneOffset: -270,
  },
  {
    input: '2023-1-1 4:01:02',
    pattern: 'MM/dd/yyyy HH:mm:ss ZZZZ',
    output: '12/31/2022 20:01:02 PST',
    timeZone: 'America/Los_Angeles',
  },
  {
    input: '2023-1-1 4:01:02',
    pattern: 'MM/dd/yyyy HH:mm:ss ZZZZZ',
    output: '12/31/2022 20:01:02 Pacific Standard Time',
    timeZone: 'America/Los_Angeles',
  },
  {
    input: '2023-4-1 9:01:02',
    pattern: 'MM/dd/yyyy HH:mm:ss ZZZZ',
    output: '04/01/2023 02:01:02 PDT',
    timeZone: 'America/Los_Angeles',
  },
  {
    input: '2023-4-1 9:01:02',
    pattern: 'MM/dd/yyyy HH:mm:ss ZZZZZ',
    output: '04/01/2023 02:01:02 Pacific Daylight Time',
    timeZone: 'America/Los_Angeles',
  },
  {
    get input() {
      // new Date('0023-4-1') will produce invalid date
      const d = new Date(Date.UTC(23, 0, 1, 8, 1, 2, 23));
      d.setUTCFullYear(23);
      return d;
    },
    pattern: 'MM/dd/yyyy HH:mm:ss.S UTCZZZ',
    output: '01/01/0023 12:31:02.23 UTC+0430',
    timeZoneOffset: -270,
  },
  {
    get input() {
      const d = new Date(Date.UTC(22, 0, 1, 4, 1, 2, 234));
      d.setUTCFullYear(22);
      return d;
    },
    pattern: 'MM/dd/yyyy HH:mm:ss.SS UTCZZZ',
    output: '12/31/0021 23:31:02.234 UTC-0430',
    timeZoneOffset: 270,
  },
];

describe('test timestamp formatter', () => {
  for (let i = 0; i < testData.length; i++) {
    const data = testData[i];
    it(`${data.input} with pattern ${data.pattern} should be ${data.output}`, () => {
      const inputDate =
        typeof data.input !== 'string'
          ? data.input
          : new Date(data.input + ' UTC');
      const result = dateTimeFormatter(
        inputDate,
        {
          type: 'timestamp',
          format: data.pattern,
          timeZone: data.timeZone,
          timeZoneOffset: data.timeZoneOffset,
        },
        data.locale,
      );
      equal(data.output, result);
    });
  }
});
