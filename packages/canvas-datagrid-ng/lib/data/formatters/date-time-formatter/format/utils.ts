import { Locale } from './locale';
import { DEFAULT_LOCALE } from './constant';

const dateTimeLocaleMap: Record<string, Locale> = {};

export function getDateTimeLocaleData(locale: string) {
  if (!dateTimeLocaleMap[locale]) {
    dateTimeLocaleMap[locale] = new Locale(locale);
  }

  return dateTimeLocaleMap[locale];
}

const DEFAULT_LOCALE_DATA = getDateTimeLocaleData(DEFAULT_LOCALE);

/**
 * Get year string
 * @param year
 * @param style
 * @returns
 */
export function getYear(
  year: number,
  style: '1-digit' | '2-digit' | 'full',
): string {
  const yearStr = String(year).padStart(4, '0');
  switch (style) {
    case '1-digit': {
      return yearStr.slice(-1);
    }
    case '2-digit': {
      return yearStr.slice(-2);
    }
    default: {
      return yearStr;
    }
  }
}

/**
 * Get month string from month index
 * Note: Month index is ranged from 0 (January) to 11 (December)
 * @param monthIndex
 * @param style
 * @param locale
 * @returns
 */
export function getMonth(
  monthIndex: number,
  style: 'numeric' | '2-digit' | 'short' | 'long',
  locale: Locale = DEFAULT_LOCALE_DATA,
) {
  switch (style) {
    case 'numeric': {
      // like 1
      return String(monthIndex + 1);
    }
    case '2-digit': {
      // like 01
      return String(monthIndex + 1).padStart(2, '0');
    }
    case 'short': {
      // like Jan
      return locale.getMonth(monthIndex, 'short');
    }
    default: {
      // like January
      return locale.getMonth(monthIndex, 'long');
    }
  }
}

/**
 * Get day string
 * @param day
 * @param style
 * @returns
 */
export function getDate(day: number, style: 'numeric' | '2-digit') {
  let dayStr = String(day);
  if (style === '2-digit') {
    dayStr = dayStr.padStart(2, '0');
  }
  return dayStr;
}

/**
 * Get weekday string form weekday index
 * Note: Weekday index should range from 0 (Sunday) to 6 (Saturday)
 * @param weekday
 * @param style
 * @param locale
 * @returns
 */
export function getWeekday(
  weekday: number,
  style: 'short' | 'long',
  locale: Locale = DEFAULT_LOCALE_DATA,
) {
  return locale.getWeekday(weekday, style);
}

export function getHours(
  hour: number,
  type: 'numeric-12' | '2-digit-12' | 'numeric-24' | '2-digit-24',
): string {
  switch (type) {
    case 'numeric-12': {
      return String(hour % 12 === 0 ? 12 : hour % 12);
    }
    case '2-digit-12': {
      return String(hour % 12 === 0 ? 12 : hour % 12).padStart(2, '0');
    }
    case 'numeric-24': {
      return String(hour);
    }
    default: {
      return String(hour).padStart(2, '0');
    }
  }
}

export function getMinutes(
  minutes: number,
  type: 'number' | '2-digit',
): string {
  let minutesStr = String(minutes);
  if (type === '2-digit') {
    minutesStr = minutesStr.padStart(2, '0');
  }
  return minutesStr;
}

export function getSeconds(
  seconds: number,
  type: 'number' | '2-digit',
): string {
  let secondsStr = String(seconds);
  if (type === '2-digit') {
    secondsStr = secondsStr.padStart(2, '0');
  }
  return secondsStr;
}

export function getMiliseconds(
  miliseconds: number,
  type: 'number' | '3-digit',
): string {
  let milisecondsStr = String(miliseconds);
  if (type === '3-digit') {
    milisecondsStr = milisecondsStr.padStart(3, '0');
  }
  return milisecondsStr;
}

export function getMeridiems(
  hour: number,
  type: 'full' | 'full-lower' | 'short-upper' | 'short-lower',
  locale: Locale = DEFAULT_LOCALE_DATA,
) {
  return locale.getMeridiems(hour < 12, type);
}
