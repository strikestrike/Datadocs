import type { CellIntervalFormat } from '../../../types/data-format';
import { getIntervalDefaultFormat } from '../util';
import { Interval } from './interval';
import type { IntervalLocale } from './IntervalLocale';
import { getIntervalLocaleData } from './IntervalLocale';

export * from './utils';

const DEFAULT_INTERVAL_FORMAT = getIntervalDefaultFormat();

export function intervalFormatter(
  duration: number,
  dataFormat: CellIntervalFormat = DEFAULT_INTERVAL_FORMAT,
  locale = 'en-US',
) {
  const interval = new Interval(duration);
  if (!dataFormat.format) dataFormat.format = DEFAULT_INTERVAL_FORMAT.format;
  const localeData = getIntervalLocaleData(locale);

  switch (dataFormat.format) {
    case 'ISO_FULL': {
      return toISOFullFormat(interval);
    }
    case 'ISO_WEEK': {
      return toISOWeekFormat(interval);
    }
    case 'INTERVAL_DATETIME': {
      return toISODateTimeFormat(interval, true);
    }
    case 'NORMAL_DATETIME': {
      return toISODateTimeFormat(interval, false);
    }
    case 'BIG_QUERY_LIKE': {
      return toBigQueryLikeFormat(interval);
    }
    case 'HUMANRIZE': {
      return toHumanrizeFormat(interval, dataFormat, localeData);
    }
    default: {
      return toISOFullFormat(interval);
    }
  }
}

// P1Y2M3DT1H2M3S
function toISOFullFormat(interval: Interval) {
  const dateParts: string[] = [];
  const timeParts: string[] = [];
  if (interval.hasYear()) dateParts.push(`${interval.years}Y`);
  if (interval.hasMonth()) dateParts.push(`${interval.months}M`);
  if (interval.hasDay()) dateParts.push(`${interval.days}D`);
  if (interval.hasHour()) timeParts.push(`${interval.hours}H`);
  if (interval.hasMinute()) timeParts.push(`${interval.minutes}M`);
  if (interval.hasSecond() || interval.hasMillisecond()) {
    const seconds = interval.seconds + interval.milliseconds / 1000;
    timeParts.push(`${parseFloat(seconds.toFixed(3))}S`);
  }
  if (!timeParts.length && !dateParts.length) {
    return `PT0S`;
  }
  let result = interval.getSign() + 'P' + dateParts.join('');
  if (timeParts.length > 0) result += 'T' + timeParts.join('');
  return result;
}

// P2W
function toISOWeekFormat(interval: Interval) {
  const parts: string[] = [];
  if (interval.weeks !== 0) parts.push(`${interval.weeks}W`);
  if (interval.weekHours !== 0) parts.push(`${interval.weekHours}H`);
  if (interval.weekMinutes !== 0) parts.push(`${interval.weekMinutes}M`);
  const seconds = interval.weekSeconds + interval.weekMilliseconds / 1000;
  if (seconds !== 0) parts.push(`${seconds}S`);

  if (!parts.length) return `P0S`;
  return interval.getSign() + 'P' + parts.join('');
}

// P0001-02-03T01:02:03 with separator
// 0001-02-03 01:02:03 without separator
function toISODateTimeFormat(interval: Interval, withSeparator: boolean) {
  const year = String(interval.years).padStart(4, '0');
  const month = String(interval.months).padStart(2, '0');
  const day = String(interval.days).padStart(2, '0');
  const hour = String(interval.hours).padStart(2, '0');
  const minute = String(interval.minutes).padStart(2, '0');
  const seconds = interval.seconds + interval.milliseconds / 1000;
  const secondTrailingZero = seconds < 10 ? '0' : '';
  const secondStr = secondTrailingZero + parseFloat(seconds.toFixed(3));
  const dayPart = !interval.isDayPartZero() ? `${year}-${month}-${day}` : '';
  const timePart = !interval.isTimePartZero()
    ? `${hour}:${minute}:${secondStr}`
    : '';

  if (!dayPart && !timePart) {
    return withSeparator ? 'PT00:00:00' : '00:00:00';
  }

  if (withSeparator) {
    const separator = timePart ? 'T' : '';
    return interval.getSign() + 'P' + dayPart + separator + timePart;
  } else {
    const parts = [];
    if (dayPart) parts.push(dayPart);
    if (timePart) parts.push(timePart);
    return parts.join(' ');
  }
}

// 10-1 2.01:02:03
function toBigQueryLikeFormat(interval: Interval) {
  const hasDayPart = !interval.isDayPartZero();
  const hasTimePart = !interval.isTimePartZero();

  if (!hasDayPart && !hasTimePart) return '00:00:00';

  const hour = String(interval.hours).padStart(2, '0');
  const minute = String(interval.minutes).padStart(2, '0');
  const seconds = interval.seconds + interval.milliseconds / 1000;
  const secondTrailingZero = seconds < 10 ? '0' : '';
  const secondStr = secondTrailingZero + parseFloat(seconds.toFixed(3));

  let result = '';

  if (hasDayPart) {
    if (interval.hasYear() || interval.hasMonth()) {
      result += interval.getSign() + `${interval.years}-${interval.months}`;
    }

    if (interval.hasDay() || result.length) {
      const separator = result.length ? ' ' : '';
      const sign = interval.hasDay() ? interval.getSign() : '';
      result += separator + sign + `${interval.days}`;
    }

    if (hasTimePart) result += '.';
  }

  if (hasTimePart) {
    result += interval.getSign() + `${hour}:${minute}:${secondStr}`;
  }
  return result;
}

function toHumanrizeFormat(
  interval: Interval,
  dataFormat: CellIntervalFormat,
  localeData: IntervalLocale,
) {
  const style = dataFormat.style ?? 'long';
  const hasSeparator = dataFormat.separator ?? false;
  const hasConjunction = dataFormat.conjunction ?? false;
  const hasDayPart = !interval.isDayPartZero();
  const hasTimePart = !interval.isTimePartZero();
  const sign = interval.getSign();
  const parts = [];

  // return 0 second
  if (!hasDayPart && !hasTimePart) {
    return localeData.getSecond(0, style);
  }

  if (interval.hasYear())
    parts.push(sign + localeData.getYear(interval.years, style));
  if (interval.hasMonth())
    parts.push(sign + localeData.getMonth(interval.months, style));
  if (interval.hasDay())
    parts.push(sign + localeData.getDay(interval.days, style));
  if (interval.hasHour())
    parts.push(sign + localeData.getHour(interval.hours, style));
  if (interval.hasMinute())
    parts.push(sign + localeData.getMinute(interval.minutes, style));
  if (interval.hasSecond() || interval.hasMillisecond()) {
    const seconds = interval.seconds + interval.milliseconds / 1000;
    parts.push(
      sign + localeData.getSecond(parseFloat(seconds.toFixed(3)), style),
    );
  }

  if (parts.length === 1) return parts[0];
  else if (parts.length === 2) {
    const conjunction = hasConjunction
      ? ` ${localeData.getConjunction()} `
      : ' ';
    return parts[0] + conjunction + parts[1];
  } else {
    const idx = parts.length - 1;
    const conjunction = hasConjunction ? `${localeData.getConjunction()} ` : '';
    parts[idx] = conjunction + parts[idx];
    const separator = hasSeparator ? ', ' : ' ';
    return parts.join(separator);
  }
}
