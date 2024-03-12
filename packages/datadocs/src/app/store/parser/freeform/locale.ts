import {
  Digit,
  E,
  Exponent,
  Percent,
  SignComponent,
  defaultDateSeparator,
} from "./constants";
import type { LocaleInfo } from "./types";

let intlDTCache = {};
function getCachedDTF(locString: string, opts = {}): Intl.DateTimeFormat {
  const key = JSON.stringify([locString, opts]);
  let dtf = intlDTCache[key];
  if (!dtf) {
    dtf = new Intl.DateTimeFormat(locString, opts);
    intlDTCache[key] = dtf;
  }
  return dtf;
}

let intlNumCache = {};
function getCachedINF(locString: string, opts = {}) {
  const key = JSON.stringify([locString, opts]);
  let inf = intlNumCache[key];
  if (!inf) {
    inf = new Intl.NumberFormat(locString, opts);
    intlNumCache[key] = inf;
  }
  return inf;
}

function mapMonths(f: Function) {
  const ms = [];
  for (let i = 0; i < 12; i++) {
    const dt = Date.UTC(2016, i, 1);
    ms.push(f(dt));
  }
  return ms;
}

function mapWeekdays(f: Function) {
  const ms = [];
  for (let i = 1; i <= 7; i++) {
    const dt = Date.UTC(2016, 11, 13 + i);
    ms.push(f(dt));
  }
  return ms;
}

function parseLocaleString(localeStr: string): string[] {
  const xIndex = localeStr.indexOf("-x-");
  if (xIndex !== -1) {
    localeStr = localeStr.substring(0, xIndex);
  }

  const uIndex = localeStr.indexOf("-u-");
  if (uIndex === -1) {
    return [localeStr];
  } else {
    let options: Intl.ResolvedDateTimeFormatOptions;
    let selectedStr: string;
    try {
      options = getCachedDTF(localeStr).resolvedOptions();
      selectedStr = localeStr;
    } catch (e) {
      const smaller = localeStr.substring(0, uIndex);
      options = getCachedDTF(smaller).resolvedOptions();
      selectedStr = smaller;
    }

    const { numberingSystem, calendar } = options;
    return [selectedStr, numberingSystem, calendar];
  }
}

export type MeridiemType = {
  am: string;
  pm: string;
};

export type MonthCache = {
  short?: string[];
  long?: string[];
};

export type WeekdayCache = {
  short?: string[];
  long?: string[];
};

export type NumberCache = {
  currencySymbol: string;
  group: string;
  decimal: string;
};

export class Locale {
  locale: string;
  monthsCache: MonthCache = null;
  weekdaysCache: WeekdayCache = null;
  meridiemCache: MeridiemType = null;
  shortMeridiem: MeridiemType = null;
  numberCache: NumberCache = null;
  listDateSeparator: string[] = null;

  constructor(localeInfo: LocaleInfo) {
    const [parsedLocale] = parseLocaleString(localeInfo.key);
    this.locale = parsedLocale;
    if (localeInfo && localeInfo.shortMeridiem) {
      this.shortMeridiem = localeInfo.shortMeridiem;
    }
    this.monthsCache = null;
    this.meridiemCache = null;

    // Initialize months Cache
    this.months("short");
    this.months("long");

    // Initialize weekdays cache
    this.weekdays("short");
    this.weekdays("long");

    // Initialize meridiem Cache
    this.meridiems();

    this.numberFormatter({ style: "currency", currency: localeInfo.currency });

    if (localeInfo.dateSeparator) {
      this.listDateSeparator = [
        ...defaultDateSeparator,
        ...localeInfo.dateSeparator,
      ];
    } else {
      this.listDateSeparator = [...defaultDateSeparator];
    }
  }

  static resetCache() {
    intlDTCache = {};
    intlNumCache = {};
  }

  months(length: string) {
    if (!this.monthsCache) {
      this.monthsCache = {};
    }
    if (!this.monthsCache[length]) {
      const intl = { month: length, timeZone: "UTC" };
      this.monthsCache[length] = mapMonths((dt: Date) =>
        this.extract(dt, intl, "month").toLowerCase()
      );
    }
    return this.monthsCache[length];
  }

  weekdays(length: string) {
    if (!this.weekdaysCache) {
      this.weekdaysCache = {};
    }
    if (!this.weekdaysCache[length]) {
      const intl = { weekday: length, timeZone: "UTC" };
      this.weekdaysCache[length] = mapWeekdays((dt: Date) =>
        this.extract(dt, intl, "weekday").toLowerCase()
      );
    }
    return this.weekdaysCache[length];
  }

  meridiems(): MeridiemType {
    if (!this.meridiemCache) {
      const intl = { hour: "numeric", hourCycle: "h12", timeZone: "UTC" };
      const meridiems = [
        new Date(Date.UTC(2016, 11, 13, 9)),
        new Date(Date.UTC(2016, 11, 13, 19)),
      ].map((dt: Date) => this.extract(dt, intl, "dayperiod").toLowerCase());
      if (meridiems) {
        this.meridiemCache = { pm: meridiems[1], am: meridiems[0] };
      }
    }
    return this.meridiemCache;
  }

  formatToParts(dtf: Intl.DateTimeFormat, dt: Date) {
    const parts = dtf.formatToParts(dt);
    return parts;
  }

  extract(
    dt: Date,
    intlOpts: any,
    field: string,
    forceLocale: string = null
  ): any {
    const dtf = getCachedDTF(forceLocale || this.locale, intlOpts);
    const results = this.formatToParts(dtf, dt);
    const matching = results.find((m) => m.type.toLowerCase() === field);
    return matching ? matching.value : null;
  }

  numberFormatter(opts = {}): NumberCache {
    if (!this.numberCache) {
      this.numberCache = {
        currencySymbol: null,
        group: null,
        decimal: null,
      };
      const numf = getCachedINF(this.locale, opts),
        results = numf.formatToParts(1000.23);
      for (const item of results) {
        if (item.type === "currency") {
          this.numberCache.currencySymbol = item.value;
        } else if (item.type === "group") {
          this.numberCache.group = item.value;
        } else if (item.type === "decimal") {
          this.numberCache.decimal = item.value;
        }
      }
      if (!this.numberCache.decimal) {
        const numf = getCachedINF(this.locale, { style: "decimal" }),
          results = numf.formatToParts(1.23);
        for (const item of results) {
          if (item.type === "decimal") {
            this.numberCache.decimal = item.value;
          }
        }
      }
    }
    return this.numberCache;
  }

  getListDateSeparator(): string[] {
    return [...this.listDateSeparator];
  }

  getTimeZone(str: string): string {
    const intl = { timeZone: str, timeStyle: "long", dateStyle: "full" };
    let timeZoneName = this.extract(
      new Date(Date.UTC(2020, 11, 20, 13, 0, 0)),
      intl,
      "timezonename",
      "en-GB"
    );
    return timeZoneName;
  }
}
