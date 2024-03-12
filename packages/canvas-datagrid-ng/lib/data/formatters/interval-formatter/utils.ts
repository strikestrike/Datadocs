import {
  MS_IN_NONLEAP_YEAR,
  MS_IN_STANDARD_MONTH,
  MS_IN_DAY,
  MS_IN_HOUR,
  MS_IN_MINUTE,
  MS_IN_SECOND,
  MS_IN_WEEK,
} from './interval';

export function dateTimeToMs(
  years: number,
  months: number,
  days: number,
  hours: number,
  minutes: number,
  seconds: number,
  milliseconds = 0,
) {
  let duration = 0;
  duration += years * MS_IN_NONLEAP_YEAR;
  duration += months * MS_IN_STANDARD_MONTH;
  duration += days * MS_IN_DAY;
  duration += hours * MS_IN_HOUR;
  duration += minutes * MS_IN_MINUTE;
  duration += seconds * MS_IN_SECOND;
  duration += milliseconds;
  return duration;
}

export function weekToMs(
  weeks: number,
  hours: number,
  minutes: number,
  seconds: number,
  milliseconds = 0,
) {
  let duration = 0;
  duration += weeks * MS_IN_WEEK;
  duration += hours * MS_IN_HOUR;
  duration += minutes * MS_IN_MINUTE;
  duration += seconds * MS_IN_SECOND;
  duration += milliseconds;
  return duration;
}
