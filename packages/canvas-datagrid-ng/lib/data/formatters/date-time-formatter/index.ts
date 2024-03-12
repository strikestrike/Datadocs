import type { CellDateTimeFormat } from '../../../types/data-format';
import { formatDate } from './date/date-formatter';
import { formatTime } from './time/time-formatter';
import { formatDatetime } from './datetime/datetime-formatter';
import {
  DEFAULT_LOCALE,
  formatDefaultDateTime,
  getDateTimeLocaleData,
  getTokenValue,
} from './format';
import { formatTimestamp } from './timestamp/timestamp-formatter';
import { DATE_TIME_FORMAT_TOKEN as TOKEN } from './format/constant';

export * from './format';

/**
 * Format Date, DateTime, Time and Timestamp type
 */
export function dateTimeFormatter(
  value: number | Date,
  dataFormat: CellDateTimeFormat,
  locale: string = DEFAULT_LOCALE,
): string {
  switch (dataFormat.type) {
    case 'date': {
      return formatDate(value, dataFormat, locale);
    }
    case 'time': {
      return formatTime(value, dataFormat, locale);
    }
    case 'datetime': {
      return formatDatetime(value, dataFormat, locale);
    }
    case 'timestamp': {
      return formatTimestamp(value, dataFormat, locale);
    }
    default: {
      throw new Error(`Data format is not supported.`);
    }
  }
}

export function dateTimeDefaultFormatter(
  value: number | Date,
  type: string,
  locale: string = DEFAULT_LOCALE,
): string {
  switch (type) {
    case 'date':
    case 'time': {
      return formatDefaultDateTime(value, type, locale);
    }
    case 'datetime': {
      return (
        formatDefaultDateTime(value, 'date', locale) +
        ' ' +
        formatDefaultDateTime(value, 'time', locale)
      );
    }
    case 'timestamp': {
      const date = new Date(value);
      const timeZoneOffset = 0;
      const timeZoneName = 'UTC';
      const localeData = getDateTimeLocaleData(locale);
      return (
        dateTimeDefaultFormatter(value, 'datetime', locale) +
        ' ' +
        getTokenValue(
          TOKEN.SHORT_TIME_ZONE_NAME,
          date,
          null,
          {
            name: timeZoneName,
            offset: timeZoneOffset,
          },
          localeData,
        ) +
        getTokenValue(
          TOKEN.SHORT_TIME_ZONE_OFFSET,
          date,
          null,
          {
            name: timeZoneName,
            offset: timeZoneOffset,
          },
          localeData,
        )
      );
    }
    default: {
      throw new Error(`Data format is not supported.`);
    }
  }
}
