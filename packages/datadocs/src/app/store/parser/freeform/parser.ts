import { Digit, E, Exponent, Percent, SignComponent } from "./constants";
import type { Locale } from "./locale";

export class RegexParser {
  locale: Locale = null;
  constructor(locale: Locale) {
    this.locale = locale;
  }

  getRegexString(): string {
    const meridiemText = this.getMeridiemRegexText();
    const shortMonthsRegexString = this.getMonthsRegexString("short");
    const longMonthsRegexString = this.getMonthsRegexString("long");
    const shortWeekdaysRegexString = this.getWeekdaysRegexString("short");
    const longWeekdaysRegexString = this.getWeekdaysRegexString("long");
    return `[+-]?\\s*(\\d\\d?)((\\s*(:\\s*(\\d\\d?))\\s*(:\\s*(\\d\\d?))?([.](\\d{1,9}))?(?!\\d)\\s*((${meridiemText})(?![a-yA-Y]))?)|\\s*((${meridiemText})(?![a-yA-y])))|(\\d+)|(${longMonthsRegexString})|(${shortMonthsRegexString})|(${longWeekdaysRegexString})|(${shortWeekdaysRegexString})|((utc|gmt|pst8pdt|mst7mdt|cst6cdt|est5edt)([+-]\\s*(\\d\\d?)(:\\s*(\\d\\d?))?)?|t|z)|([a-zA-Z]+)([+-]\\s*(\\d\\d?)(:\\s*(\\d\\d?))?)?|([.]|[,]|[/]|[-])|([+-]\\s*(\\d\\d?))|([^\\s])`;
  }

  getMeridiemRegexText(): string {
    let meridiemText = "";
    const meridiem = this.locale.meridiems();
    if (meridiem) {
      meridiemText = `${meridiem.pm}|${meridiem.am}`;
    }

    if (this.locale.shortMeridiem) {
      if (meridiemText.length !== 0) {
        meridiemText += "|";
      }

      meridiemText += `${this.locale.shortMeridiem.pm}|${this.locale.shortMeridiem.am}`;
    }

    return meridiemText;
  }

  getPMRegexString(): string {
    let meridiemText = "";
    const meridiem = this.locale.meridiems();
    if (meridiem) {
      meridiemText = `${meridiem.pm}`;
    }

    if (this.locale.shortMeridiem) {
      if (meridiemText.length !== 0) {
        meridiemText += "|";
      }

      meridiemText += `${this.locale.shortMeridiem.pm}`;
    }

    return meridiemText;
  }

  getMonthsRegexString(length: string): string {
    const months = this.locale.months(length);
    let textRegex = "";
    if (months) {
      textRegex = [...months]
        .reverse()
        .map((m: string) => m.replace(" ", "\\s"))
        .join("|");
    }

    return textRegex;
  }

  getWeekdaysRegexString(length: string): string {
    const weekdays = this.locale.weekdays(length);
    let textRegex = "";
    if (weekdays) {
      textRegex = [...weekdays]
        .reverse()
        .map((m: string) => m.replace(" ", "\\s"))
        .join("|");
    }

    return textRegex;
  }

  isMeridiem(m: string): boolean {
    const meridiemText = this.getMeridiemRegexText();
    return new RegExp(`(${meridiemText})$`, "i").test(m);
  }

  isPM(input: string): boolean {
    const meridiemPMText = this.getPMRegexString();
    return new RegExp(`(${meridiemPMText})$`, "i").test(input);
  }

  isMonth(input: string): boolean {
    const i = input.toLowerCase();
    const longMonths = this.locale.months("long");
    const shortMonths = this.locale.months("short");
    return longMonths.includes(i) || shortMonths.includes(i);
  }

  isWeekday(input: string): boolean {
    const i = input.toLowerCase();
    const longWeekdays = this.locale.weekdays("long");
    const shortWeekdays = this.locale.weekdays("short");
    return longWeekdays.includes(i) || shortWeekdays.includes(i);
  }

  getMonth(input: string): number {
    const i = input.toLowerCase();
    const longMonths = this.locale.months("long");
    const shortMonths = this.locale.months("short");
    let index = longMonths.indexOf(i);
    if (index === -1) {
      index = shortMonths.indexOf(i);
    }

    return index + 1;
  }

  validDateSeparator(
    listSeparator: string[],
    hasStrMonth: boolean,
    dmy: any[]
  ): boolean {
    let listDateSeparator = this.locale.getListDateSeparator();
    if (hasStrMonth) {
      listDateSeparator.push(",");
    }
    if (dmy.length === 2) {
      if (listSeparator.length == 1) {
        if (!listDateSeparator.includes(listSeparator[0])) {
          return false;
        }
      }
    } else if (dmy.length == 3) {
      if (hasStrMonth) {
        for (const separator of listSeparator) {
          if (!listDateSeparator.includes(separator)) {
            return false;
          }
        }
      } else if (listSeparator.length == 2) {
        if (listSeparator[0] !== listSeparator[1]) {
          return false;
        } else if (!listDateSeparator.includes(listSeparator[0])) {
          return false;
        }
      } else if (listSeparator.length == 1) {
        if (!listDateSeparator.includes(listSeparator[0])) {
          return false;
        }
      }
    }
    return true;
  }

  getIntegerGroupRegexStr(): string {
    const groupSymbol = this.locale.numberCache.group;
    const groupInteger = `([${groupSymbol}]${Digit}{3}${Digit}*)`.replace(
      /\s/,
      "\\s"
    );
    return `(${SignComponent}?((${Digit}+)?${groupInteger}+))`;
  }

  getDecimalRegexStr(): string {
    return `(${SignComponent}?((${Digit}+[${this.locale.numberCache.decimal}]${Digit}*)|([${this.locale.numberCache.decimal}]${Digit}+)))`;
  }

  getDecimalGroupRegexStr(): string {
    const integerGroupRegexStr = this.getIntegerGroupRegexStr();
    return `(${integerGroupRegexStr}[${this.locale.numberCache.decimal}]${Digit}*)`;
  }

  getFloatRegexStr(): string {
    return `(${SignComponent}?((${Digit}+[${this.locale.numberCache.decimal}]${Digit}*)|(${this.locale.numberCache.decimal}?${Digit}+))(${Exponent}|${E}))`;
  }

  getFloatGroupRegexStr(): string {
    const integerGroupRegexStr = this.getIntegerGroupRegexStr();
    return `(${integerGroupRegexStr}([${this.locale.numberCache.decimal}]${Digit}*)?(${Exponent}|${E}))`;
  }

  getCurrencyOrPercentage(): string {
    return `([${this.locale.numberCache.currencySymbol}]|${Percent})`;
  }

  getTimeZoneRegex(): RegExp {
    return new RegExp(
      "^(((?<timezonename>(([a-zA-Z]+)|pst8pdt|mst7mdt|cst6cdt|est5edt))(?<offset>([+-]\\s*(\\d\\d?)(:\\s*(\\d\\d?))?))))$"
    );
  }

  guessTimeZone(str: string): string {
    try {
      let timeZoneName = this.locale.getTimeZone(str);
      if (!timeZoneName) {
        return null;
      }
      timeZoneName = timeZoneName.toLowerCase();
      const match = /^(?<zone>(utc|gmt))(?<offset>(.*))$/.exec(timeZoneName);
      if (!match) {
        return null;
      }
      const { offset } = match.groups;
      return offset === "" ? "+0" : offset;
    } catch (error) {
      return null;
    }
  }
}
