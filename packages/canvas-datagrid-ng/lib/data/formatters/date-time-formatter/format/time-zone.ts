import { DEFAULT_LOCALE } from './constant';
import type { DateTimePart } from './constant';
import { extractPart } from './locale';

const dateReg = /(\d+)\/(\d+)\/(\d+)[^\d]*(\d+):(\d+):(\d+)/; // 12/19/2020, 19:23:16
const dtfCache: Record<string, Intl.DateTimeFormat> = {};
export function convertTimeZoneNameToOffset(timeZoneName: string, date: Date) {
  let dtf = dtfCache[timeZoneName];
  if (!dtf) {
    const intlOptions: Intl.DateTimeFormatOptions = {
      hourCycle: 'h23',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      timeZone: timeZoneName,
    };
    dtf = Intl.DateTimeFormat(DEFAULT_LOCALE, intlOptions);
    dtfCache[timeZoneName] = dtf;
  }
  const dateStr = dtf.format(date);
  const tokens = dateReg.exec(dateStr);
  const year = parseInt(tokens[3]),
    month = parseInt(tokens[1]) - 1,
    day = parseInt(tokens[2]),
    hours = parseInt(tokens[4]),
    minutes = parseInt(tokens[5]),
    seconds = parseInt(tokens[6]);
  const zoneDate = new Date(
    Date.UTC(year, month, day, hours, minutes, seconds),
  );
  // years between 0 and 99 are interpreted as 19XX, tackle it
  if (year >= 0 && year < 100) {
    zoneDate.setUTCFullYear(year);
  }
  return Math.floor((date.getTime() - zoneDate.getTime()) / (1000 * 60));
}

export function getDateTimePartWithTimeZoneOffset(
  date: Date,
  offset: number,
): DateTimePart {
  const newDate =
    offset === 0 ? date : new Date(date.getTime() - offset * 60 * 1000);

  return {
    year: newDate.getUTCFullYear(),
    month: newDate.getUTCMonth(),
    day: newDate.getUTCDate(),
    hour: newDate.getUTCHours(),
    minute: newDate.getUTCMinutes(),
    second: newDate.getUTCSeconds(),
    miliseconds: newDate.getUTCMilliseconds(),
    weekday: newDate.getUTCDay(),
  };
}

export function formatTimeZoneOffset(
  offset: number,
  style: 'short' | 'narrow' | 'techie',
) {
  const hours = Math.trunc(Math.abs(offset / 60)),
    minutes = Math.trunc(Math.abs(offset % 60)),
    sign = offset > 0 ? '-' : '+';

  switch (style) {
    case 'short':
      return `${sign}${String(hours).padStart(2, '0')}:${String(
        minutes,
      ).padStart(2, '0')}`;
    case 'narrow':
      return `${sign}${hours}${minutes > 0 ? `:${minutes}` : ''}`;
    case 'techie':
      return `${sign}${String(hours).padStart(2, '0')}${String(
        minutes,
      ).padStart(2, '0')}`;
    default:
      throw new Error(`Value format ${style} is not supported`);
  }
}

const timeZoneNameDtfCache: Record<string, Intl.DateTimeFormat> = {};
export function formatTimeZoneName(
  date: Date,
  name: string,
  style: 'short' | 'long',
  locale: string = DEFAULT_LOCALE,
) {
  const key = `${name}_${style}_${locale}`;
  let dtf = timeZoneNameDtfCache[key];

  if (!dtf) {
    const intlOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      timeZone: name,
      timeZoneName: style,
    };

    dtf = Intl.DateTimeFormat(locale, intlOptions);
    timeZoneNameDtfCache[key] = dtf;
  }

  return extractPart(dtf, date, 'timeZoneName');
}
