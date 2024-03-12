type IntervalUnitStyle = 'long' | 'short' | 'narrow';
type IntervalUnitLocale = {
  single: Record<IntervalUnitStyle, string>;
  plural: Record<IntervalUnitStyle, string>;
};
type IntervalUnit = 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second';

const localeDataCache: Record<string, IntervalLocale> = {};
export function getIntervalLocaleData(locale: string) {
  return (
    localeDataCache[locale] ??
    (localeDataCache[locale] = new IntervalLocale(locale))
  );
}

export class IntervalLocale {
  readonly locale: string;
  data: Record<IntervalUnit, IntervalUnitLocale> = {
    year: getDefaultUnitLocale(),
    month: getDefaultUnitLocale(),
    day: getDefaultUnitLocale(),
    hour: getDefaultUnitLocale(),
    minute: getDefaultUnitLocale(),
    second: getDefaultUnitLocale(),
  };

  conjunction: string;

  constructor(locale: string) {
    this.locale = locale;
    this.initLocaleData();
    this.initLocaleConjunction();
  }

  initLocaleData = () => {
    const units: IntervalUnit[] = [
      'year',
      'month',
      'day',
      'hour',
      'minute',
      'second',
    ];
    const styles: IntervalUnitStyle[] = ['long', 'short', 'narrow'];

    for (const unit of units) {
      for (const style of styles) {
        const intlNumberFormat = new Intl.NumberFormat(this.locale, {
          style: 'unit',
          unit,
          unitDisplay: style,
        });

        this.data[unit].single[style] = extractPart(
          intlNumberFormat,
          1,
          'unit',
        );
        this.data[unit].plural[style] = extractPart(
          intlNumberFormat,
          5,
          'unit',
        );
      }
    }
  };

  initLocaleConjunction = () => {
    const list = ['1', '2'];
    const formatter = new Intl.ListFormat(this.locale, {
      style: 'long',
      type: 'conjunction',
    });
    this.conjunction = formatter
      .formatToParts(list)
      .find((part) => part.type === 'literal')
      .value.trim();
  };

  isPlural = (value: number) => !(value === 1);

  getUnit = (value: number, unit: IntervalUnit, style: IntervalUnitStyle) => {
    const localeName = this.isPlural(value)
      ? this.data[unit].plural[style]
      : this.data[unit].single[style];
    const separator = style === 'narrow' ? '' : ' ';

    return String(value) + separator + localeName;
  };

  getYear = (year: number, style: IntervalUnitStyle) => {
    return this.getUnit(year, 'year', style);
  };

  getMonth = (month: number, style: IntervalUnitStyle) => {
    return this.getUnit(month, 'month', style);
  };

  getDay = (day: number, style: IntervalUnitStyle) => {
    return this.getUnit(day, 'day', style);
  };

  getHour = (hour: number, style: IntervalUnitStyle) => {
    return this.getUnit(hour, 'hour', style);
  };

  getMinute = (minute: number, style: IntervalUnitStyle) => {
    return this.getUnit(minute, 'minute', style);
  };

  getSecond = (second: number, style: IntervalUnitStyle) => {
    return this.getUnit(second, 'second', style);
  };

  getConjunction = () => this.conjunction;
}

function extractPart(intl: Intl.NumberFormat, value: number, type: string) {
  const parts = intl.formatToParts(value);
  return parts.find((part) => part.type.toLowerCase() === type.toLowerCase())
    .value;
}

function getDefaultUnitLocale() {
  return {
    single: {
      long: '',
      short: '',
      narrow: '',
    },
    plural: {
      long: '',
      short: '',
      narrow: '',
    },
  };
}
