export const MS_IN_SECOND = 1000;
export const MS_IN_MINUTE = MS_IN_SECOND * 60;
export const MS_IN_HOUR = MS_IN_MINUTE * 60;
export const MS_IN_DAY = MS_IN_HOUR * 24;
export const DAYS_IN_WEEK = 7;
export const DAYS_IN_STANDARD_MONTH = 30;
export const DAYS_IN_NONLEAP_YEAR = 365;
export const MS_IN_NONLEAP_YEAR = DAYS_IN_NONLEAP_YEAR * MS_IN_DAY;
export const MS_IN_STANDARD_MONTH = DAYS_IN_STANDARD_MONTH * MS_IN_DAY;
export const MS_IN_WEEK = DAYS_IN_WEEK * MS_IN_DAY;

type IntervalSign = 'pos' | 'neg';

export class Interval {
  sign: IntervalSign = 'pos';
  duration = 0;

  years = 0;
  months = 0;
  days = 0;
  hours = 0;
  minutes = 0;
  seconds = 0;
  milliseconds = 0;

  weeks = 0;
  weekHours = 0;
  weekMinutes = 0;
  weekSeconds = 0;
  weekMilliseconds = 0;

  /**
   * @param duration millisecond
   */
  constructor(_duration: number) {
    let isNegative = false;
    if (_duration < 0) {
      isNegative = true;
      _duration = -_duration;
    }

    this.sign = isNegative ? 'neg' : 'pos';
    this.duration = _duration;

    this.years = Math.floor(_duration / MS_IN_NONLEAP_YEAR);
    _duration -= this.years * MS_IN_NONLEAP_YEAR;
    this.months = Math.floor(_duration / MS_IN_STANDARD_MONTH);
    _duration -= this.months * MS_IN_STANDARD_MONTH;
    this.days = Math.floor(_duration / MS_IN_DAY);
    _duration -= this.days * MS_IN_DAY;
    this.hours = Math.floor(_duration / MS_IN_HOUR);
    _duration -= this.hours * MS_IN_HOUR;
    this.minutes = Math.floor(_duration / MS_IN_MINUTE);
    _duration -= this.minutes * MS_IN_MINUTE;
    this.seconds = Math.floor(_duration / MS_IN_SECOND);
    this.milliseconds = _duration - this.seconds * MS_IN_SECOND;

    // Week format
    _duration = this.duration;
    this.weeks = Math.floor(_duration / MS_IN_WEEK);
    _duration -= this.weeks * MS_IN_WEEK;
    this.weekHours = Math.floor(_duration / MS_IN_HOUR);
    _duration -= this.weekHours * MS_IN_HOUR;
    this.weekMinutes = Math.floor(_duration / MS_IN_MINUTE);
    _duration -= this.weekMinutes * MS_IN_MINUTE;
    this.weekSeconds = Math.floor(_duration / MS_IN_SECOND);
    this.weekMilliseconds = _duration - this.weekSeconds * MS_IN_SECOND;
  }

  getSign = () => {
    return this.sign === 'neg' ? '-' : '';
  };

  hasYear = () => this.years !== 0;
  hasMonth = () => this.months !== 0;
  hasDay = () => this.days !== 0;
  hasHour = () => this.hours !== 0;
  hasMinute = () => this.minutes !== 0;
  hasSecond = () => this.seconds !== 0;
  hasMillisecond = () => this.milliseconds !== 0;
  isDayPartZero = () => !this.hasYear() && !this.hasMonth() && !this.hasDay();
  isTimePartZero = () =>
    !this.hasHour() &&
    !this.hasMinute() &&
    !this.hasSecond() &&
    !this.hasMillisecond();
}
