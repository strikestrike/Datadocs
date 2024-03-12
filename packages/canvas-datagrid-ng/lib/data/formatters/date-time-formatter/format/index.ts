import type { Locale } from './locale';
import { formatDateTime } from './locale';
import type { DateTimePart } from './constant';
import { DEFAULT_FORMAT_DATETIME_INTL_OPTIONS } from './constant';
import {
  DATE_TIME_FORMAT_TOKEN as TOKEN,
  DATE_TIME_TOKEN_REGEX as TOKEN_REGEX,
} from './constant';
import {
  getDateTimeLocaleData,
  getYear,
  getMonth,
  getDate,
  getWeekday,
  getHours,
  getMinutes,
  getSeconds,
  getMeridiems,
  getMiliseconds,
} from './utils';
import {
  // getDateTimePartWithTimeZoneName,
  convertTimeZoneNameToOffset,
  getDateTimePartWithTimeZoneOffset,
  formatTimeZoneOffset,
  formatTimeZoneName,
} from './time-zone';

export * from './constant';
export * from './utils';

const defaultDtfCache: Record<string, Intl.DateTimeFormat> = {};
export function formatDefaultDateTime(
  value: number | Date,
  type: string,
  locale: string,
): string {
  const key = `default_${type}_${locale}`;
  let dtf = defaultDtfCache[key];

  if (!dtf) {
    const intlOptions: Intl.DateTimeFormatOptions =
      DEFAULT_FORMAT_DATETIME_INTL_OPTIONS[type] || {};

    dtf = Intl.DateTimeFormat(locale, intlOptions);
    defaultDtfCache[key] = dtf;
  }
  const date = new Date(value);
  return formatDateTime(dtf, date);
}

export function formatDateTimeData(
  value: number | Date,
  pattern: string,
  locale: string,
  timeZone?: {
    name: string;
    offset: number;
  },
) {
  const useTimeZoneOffset = !timeZone?.name;
  let timeZoneOffset = timeZone?.offset ?? 0;
  const timeZoneName = timeZone?.name || 'UTC';
  const date = new Date(value);
  if (!useTimeZoneOffset) {
    timeZoneOffset = convertTimeZoneNameToOffset(timeZone.name, date);
  }
  const dateTimePart = getDateTimePartWithTimeZoneOffset(date, timeZoneOffset);
  const localeData = getDateTimeLocaleData(locale);
  return pattern.replace(TOKEN_REGEX, (token, $1) => {
    return (
      $1 ||
      getTokenValue(
        token,
        date,
        dateTimePart,
        { name: timeZoneName, offset: timeZoneOffset },
        localeData,
      )
    );
  });
}

export function getTokenValue(
  token: string,
  date: Date,
  datePart: DateTimePart,
  timeZone: {
    name: string;
    offset: number;
  },
  localeData: Locale,
) {
  switch (token) {
    // Year
    case TOKEN.ONE_DIGIT_YEAR: {
      return getYear(datePart.year, '1-digit');
    }
    case TOKEN.TWO_DIGIT_YEAR: {
      return getYear(datePart.year, '2-digit');
    }
    case TOKEN.FULL_YEAR: {
      return getYear(datePart.year, 'full');
    }

    // Month
    case TOKEN.NUMERIC_MONTH: {
      return getMonth(datePart.month, 'numeric', localeData);
    }
    case TOKEN.TWO_DIGIT_MONTH: {
      return getMonth(datePart.month, '2-digit', localeData);
    }
    case TOKEN.SHORT_MONTH: {
      return getMonth(datePart.month, 'short', localeData);
    }
    case TOKEN.LONG_MONTH: {
      return getMonth(datePart.month, 'long', localeData);
    }

    // Day
    case TOKEN.NUMERIC_DATE: {
      return getDate(datePart.day, 'numeric');
    }
    case TOKEN.TWO_DIGIT_DATE: {
      return getDate(datePart.day, '2-digit');
    }

    // Weekday
    case TOKEN.SHORT_WEEKDAY: {
      return getWeekday(datePart.weekday, 'short', localeData);
    }
    case TOKEN.LONG_WEEKDAY: {
      return getWeekday(datePart.weekday, 'long', localeData);
    }

    // Hours
    case TOKEN.NUMERIC_12_HOUR: {
      return getHours(datePart.hour, 'numeric-12');
    }
    case TOKEN.TWO_DIGIT_12_HOUR: {
      return getHours(datePart.hour, '2-digit-12');
    }
    case TOKEN.NUMERIC_24_HOUR: {
      return getHours(datePart.hour, 'numeric-24');
    }
    case TOKEN.TWO_DIGIT_24_HOUR: {
      return getHours(datePart.hour, '2-digit-24');
    }

    // Minutes
    case TOKEN.NUMERIC_MINUTE: {
      return getMinutes(datePart.minute, 'number');
    }
    case TOKEN.TWO_DIGIT_MINUTE: {
      return getMinutes(datePart.minute, '2-digit');
    }

    // Seconds
    case TOKEN.NUMERIC_SECOND: {
      return getSeconds(datePart.second, 'number');
    }
    case TOKEN.TWO_DIGIT_SECOND: {
      return getSeconds(datePart.second, '2-digit');
    }

    // Miliseconds
    case TOKEN.NUMERIC_MILISECOND: {
      return getMiliseconds(datePart.miliseconds, 'number');
    }
    case TOKEN.THREE_DIGIT_MILISECOND: {
      return getMiliseconds(datePart.miliseconds, '3-digit');
    }

    // Meridiems
    case TOKEN.FULL_MERIDIEMS: {
      return getMeridiems(datePart.hour, 'full', localeData);
    }
    case TOKEN.FULL_LOWER_MERIDIEMS: {
      return getMeridiems(datePart.hour, 'full-lower', localeData);
    }
    case TOKEN.SHORT_UPPER_MERIDIEMS: {
      return getMeridiems(datePart.hour, 'short-upper', localeData);
    }
    case TOKEN.SHORT_LOWER_MERIDIEMS: {
      return getMeridiems(datePart.hour, 'short-lower', localeData);
    }

    // Time zone
    case TOKEN.NARROW_TIME_ZONE_OFFSET: {
      return formatTimeZoneOffset(timeZone.offset, 'narrow');
    }
    case TOKEN.SHORT_TIME_ZONE_OFFSET: {
      return formatTimeZoneOffset(timeZone.offset, 'short');
    }
    case TOKEN.TECHIE_TIME_ZONE_OFFSET: {
      return formatTimeZoneOffset(timeZone.offset, 'techie');
    }
    case TOKEN.SHORT_TIME_ZONE_NAME: {
      return formatTimeZoneName(
        date,
        timeZone.name,
        'short',
        localeData.locale,
      );
    }
    case TOKEN.LONG_TIME_ZONE_NAME: {
      return formatTimeZoneName(date, timeZone.name, 'long', localeData.locale);
    }

    default: {
      return token;
    }
  }
}
