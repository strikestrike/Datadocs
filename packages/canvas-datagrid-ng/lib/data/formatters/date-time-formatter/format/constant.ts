/**
 * Tokens that will be used in format pattern
 *
 * Year:
 * - y:     The last digit of the year, like 3.
 * - yy:    The last two digits of the year, like 23.
 * - yyyy:  Full year with 4 digits, like 2023.
 *
 * Month:
 * - M:     Month as a number without leading zero, like 4
 * - MM:    Month as 2-digit numbers, like 04
 * - MMM:   Month in three letters, like Apr
 * - MMMM:  Month in full, like April
 *
 * Day:
 * - d:     Day as number without leading zero, like 6
 * - dd:    Day as 2-digit numbers, like 06
 *
 * Weekday:
 * - ddd:   Weekday in three letters, like Wed
 * - dddd:  Weekday in full, like Wednesday
 *
 * Hour:
 * - h: Hour from 1 to 12 (12-hour clock) without leading zero, like 6
 * - hh: Hour from 1 to 12 (12-hour clock) with leading zero, like 06
 * - H: Hour from 0 to 23 (24-hour clock) without leading zero, like 14
 * - HH: Hour from 0 to 23 (24-hour clock) with leading zero, like 14
 *
 * Minute:
 * - m: Minutes as a number from 0 to 59 without leading zero, like 9
 * - mm: Minutes as a number from 0 to 59 with leading zero, like 09
 *
 * Second:
 * - s: Seconds as a number from 0 to 59 without leading zero, like 9
 * - ss: Seconds as a number from 0 to 59 with leading zero, like 09
 *
 * Milisecond:
 * - S: Seconds as a number from 0 to 999 without leading zero, like 9
 * - SS: Seconds as a number from 0 to 999 with leading zero, like 009
 *
 * Meridiems
 * - AM/PM: Full meridiems, like AM, PM
 * - am/pm: Full lower case meridiems, like am, pm
 * - A/P: Upper case short meridiems, like A, P
 * - a/p: Lower case short meridiems, like a, p
 *
 * Time zone:
 * - Z: like +6
 * - ZZ: like +06:00
 * - ZZZ: like +0600
 * - ZZZZ: like PST
 * - ZZZZZ: like Pacific Standard Time
 */
export const DATE_TIME_FORMAT_TOKEN = {
  ONE_DIGIT_YEAR: 'y',
  TWO_DIGIT_YEAR: 'yy',
  FULL_YEAR: 'yyyy',

  NUMERIC_MONTH: 'M',
  TWO_DIGIT_MONTH: 'MM',
  SHORT_MONTH: 'MMM',
  LONG_MONTH: 'MMMM',

  NUMERIC_DATE: 'd',
  TWO_DIGIT_DATE: 'dd',

  SHORT_WEEKDAY: 'ddd',
  LONG_WEEKDAY: 'dddd',

  NUMERIC_12_HOUR: 'h',
  TWO_DIGIT_12_HOUR: 'hh',
  NUMERIC_24_HOUR: 'H',
  TWO_DIGIT_24_HOUR: 'HH',

  NUMERIC_MINUTE: 'm',
  TWO_DIGIT_MINUTE: 'mm',

  NUMERIC_SECOND: 's',
  TWO_DIGIT_SECOND: 'ss',

  NUMERIC_MILISECOND: 'S',
  THREE_DIGIT_MILISECOND: 'SS',

  FULL_MERIDIEMS: 'AM/PM',
  FULL_LOWER_MERIDIEMS: 'am/pm',
  SHORT_UPPER_MERIDIEMS: 'A/P',
  SHORT_LOWER_MERIDIEMS: 'a/p',

  NARROW_TIME_ZONE_OFFSET: 'Z',
  SHORT_TIME_ZONE_OFFSET: 'ZZ',
  TECHIE_TIME_ZONE_OFFSET: 'ZZZ',
  SHORT_TIME_ZONE_NAME: 'ZZZZ',
  LONG_TIME_ZONE_NAME: 'ZZZZZ',
};

export const DATE_TIME_TOKEN_REGEX =
  /\[([^\]]+)]|y{1,4}|M{1,4}|d{1,4}|h{1,2}|H{1,2}|m{1,2}|s{1,2}|S{1,2}|Z{1,5}|AM\/PM|am\/pm|A\/P|a\/p/g;

export const DEFAULT_LOCALE = 'en-US';

export type DateTimePart = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  miliseconds: number;
  weekday: number;
};

export const DEFAULT_FORMAT_DATETIME_INTL_OPTIONS: {
  [key: string]: Intl.DateTimeFormatOptions;
} = {
  date: { timeZone: 'UTC', year: 'numeric', day: 'numeric', month: 'numeric' },
  datetime: {
    dateStyle: 'short',
    timeStyle: 'medium',
    hour12: true,
    timeZone: 'UTC',
  },
  time: { timeStyle: 'medium', hour12: true, timeZone: 'UTC' },
};
