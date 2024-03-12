export class Locale {
  readonly locale: string;

  // Month string
  private shortMonths: Record<number, string> = {};
  private longMonths: Record<number, string> = {};

  // Weekday string
  private shortWeekdays: Record<number, string> = {};
  private longWeekdays: Record<number, string> = {};

  // Meridiem
  private meridiems: Record<number, string> = {};
  private shortLowerCaseMeridiems: Record<number, string> = {};
  private shortUpperCaseMeridiems: Record<number, string> = {};

  constructor(locale: string) {
    this.locale = locale;
    this.initMonths();
    this.initWeekdays();
    this.initMeridiem();
  }

  initMonths() {
    const shortMonthFormat = Intl.DateTimeFormat(this.locale, {
      month: 'short',
      timeZone: 'UTC',
    });
    const longMonthFormat = Intl.DateTimeFormat(this.locale, {
      month: 'long',
      timeZone: 'UTC',
    });

    for (let i = 0; i < 12; i++) {
      const date = Date.UTC(2023, i);
      this.shortMonths[i] = shortMonthFormat.format(date);
      this.longMonths[i] = longMonthFormat.format(date);
    }
  }

  initWeekdays() {
    const shortWeekdayFormat = Intl.DateTimeFormat(this.locale, {
      weekday: 'short',
      timeZone: 'UTC',
    });
    const longWeekdayFormat = Intl.DateTimeFormat(this.locale, {
      weekday: 'long',
      timeZone: 'UTC',
    });

    for (let i = 1; i < 8; i++) {
      const date = new Date(Date.UTC(2023, 1, i));
      const weekday = date.getUTCDay();
      this.shortWeekdays[weekday] = shortWeekdayFormat.format(date);
      this.longWeekdays[weekday] = longWeekdayFormat.format(date);
    }
  }

  initMeridiem() {
    const morning = new Date(Date.UTC(2023, 3, 27, 9));
    const afternoon = new Date(Date.UTC(2023, 3, 27, 19));
    const intl = Intl.DateTimeFormat(this.locale, {
      hour: 'numeric',
      hour12: true,
      timeZone: 'UTC',
    });

    // Full meridiems
    this.meridiems[0] = extractPart(intl, morning, 'dayperiod');
    this.meridiems[1] = extractPart(intl, afternoon, 'dayperiod');
    // Short lower case meridiems
    this.shortLowerCaseMeridiems[0] = this.meridiems[0]
      .substring(0, 1)
      .toLowerCase();
    this.shortLowerCaseMeridiems[1] = this.meridiems[1]
      .substring(0, 1)
      .toLowerCase();
    // Short upper case meridiems
    this.shortUpperCaseMeridiems[0] = this.meridiems[0]
      .substring(0, 1)
      .toUpperCase();
    this.shortUpperCaseMeridiems[1] = this.meridiems[1]
      .substring(0, 1)
      .toUpperCase();
  }

  getMonth(month: number, style: 'short' | 'long') {
    return style === 'short' ? this.shortMonths[month] : this.longMonths[month];
  }

  getWeekday(weekday: number, style: 'short' | 'long') {
    return style === 'short'
      ? this.shortWeekdays[weekday]
      : this.longWeekdays[weekday];
  }

  getMeridiems(
    isAM: boolean,
    type: 'full' | 'full-lower' | 'short-upper' | 'short-lower',
  ) {
    const index = isAM ? 0 : 1;
    switch (type) {
      case 'short-lower': {
        return this.shortLowerCaseMeridiems[index];
      }
      case 'short-upper': {
        return this.shortUpperCaseMeridiems[index];
      }
      case 'full-lower': {
        return this.meridiems[index].toLowerCase();
      }
      default: {
        return this.meridiems[index];
      }
    }
  }
}

export function extractPart(
  intl: Intl.DateTimeFormat,
  date: Date,
  type: string,
) {
  const parts = intl.formatToParts(date);
  return parts.find((part) => part.type.toLowerCase() === type.toLowerCase())
    .value;
}

export function formatDateTime(intl: Intl.DateTimeFormat, date: Date): string {
  return intl.format(date);
}
