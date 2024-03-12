import {
  BooleanRegex,
  BytesRegex,
  Comma,
  GeoRegex,
  IntegerRegex,
  IntervalRegex,
  IntervalTimeRegex,
  NestedTypeRegex,
  ShortPointRegex,
  StringSingleQuoteRegex,
  TRUE,
  supportedLocaleList,
  tBoolean,
  tBytes,
  tDate,
  tDatetime,
  tDecimal,
  tFloat,
  tInteger,
  tInterval,
  tString,
  tTime,
  tTimeStamp,
} from "./freeform/constants";
import { LiteralParser } from "@datadocs/ddt/LiteralParser";
import {
  convertParserResultToGridData,
  getParserResult,
  transformToGridData,
} from ".";
import type { ParserFreeformMeta } from "./freeform/types";
import { ErrorNode } from "@datadocs/ast/Ast/ExpressionNodes";
import {
  MS_IN_DAY,
  createDuration,
  durationToMs,
} from "@datadocs/ddt/Types/Interval";
import { Locale } from "./freeform/locale";
import { ValueNode } from "@datadocs/ast/Ast/ExpressionNodes";
import type { CellNumberFormat } from "@datadocs/canvas-datagrid-ng";
import { RegexParser } from "./freeform/parser";

function inferCurrencyOrPercentageNumber(
  s: string,
  locale: Locale
): ParserFreeformMeta {
  if (s.length == 0) {
    return null;
  }
  const parser = new RegexParser(locale);

  const currencyOrPercentage = parser.getCurrencyOrPercentage();
  const currencyRegex = new RegExp(
    `^(((?<symbol1>${currencyOrPercentage})(?<num1>.*))|((?<num2>.*)(?<symbol2>${currencyOrPercentage})))$`
  );
  const match = s.match(currencyRegex);
  if (!match) return null;
  const { symbol1 = "", num1 = "", symbol2 = "", num2 = "" } = match.groups!;

  const num = (num1 || num2).trim();
  const symbol = symbol1 || symbol2;
  if (symbol) {
    const res = inferNumber(num, locale);
    if (!res) return null;
    if (symbol === "%") {
      switch (res.data.dataType) {
        case tInteger:
          {
            res.data.value = parseFloat(res.data.value.a) / 100;
            res.data.dataType = tFloat;
          }
          break;
        case tDecimal:
          {
            // res.value.b = res.value.b >= 0 ? res.value.b + 2 : res.value.b - 2;
            res.data.value.a = res.data.value.a / BigInt(100);
          }
          break;

        default:
          {
            res.data.value /= 100;
          }
          break;
      }
      res.format = {
        ...res.format,
        format: "percent",
        decimalPlaces: 2,
      } as CellNumberFormat;
    } else if (symbol === locale.numberCache.currencySymbol) {
      res.format = {
        ...res.format,
        format: "currency",
        decimalPlaces: 2,
        currency: "usd",
        symbol: symbol,
        position: symbol1 === symbol ? "head" : "tail",
      } as CellNumberFormat;
    }
    return res;
  }

  return null;
}

function inferNumber(s: string, locale: Locale): ParserFreeformMeta {
  if (s.length == 0) {
    return null;
  }
  let res = inferInt(s, locale);
  if (res) {
    return res;
  }
  res = inferDecimal(s, locale);
  if (res) {
    return res;
  }
  res = inferFloat(s, locale);
  if (res) {
    return res;
  }

  return null;
}

function inferInt(s: string, locale: Locale): ParserFreeformMeta {
  if (s.length == 0) {
    return null;
  }
  const parser = new RegexParser(locale);
  const integerRegex = new RegExp("^(" + IntegerRegex + ")$");
  const res: ParserFreeformMeta = {
    data: null,
    format: {
      type: "number",
      format: "default",
      thounsandSeparator: locale.numberCache.group,
      decimalSeparator: locale.numberCache.decimal,
      locale: locale.locale,
    },
  };
  if (integerRegex.test(s)) {
    try {
      const newS = s.replace(/\s/g, "");
      const result = LiteralParser.parseInt(newS);
      const gridData = transformToGridData(result.value, result);
      res.data = gridData;
      (res.format as CellNumberFormat).useGrouping = false;
      return res;
    } catch (error) {
      return null;
    }
  } else {
    const integerGroupRegexStr = parser.getIntegerGroupRegexStr();
    const integerGroupRegex = new RegExp("^(" + integerGroupRegexStr + ")$");
    if (integerGroupRegex.test(s)) {
      const newS = s.replace(
        new RegExp(`([${locale.numberCache.group}]|\\s)`, "g"),
        ""
      );
      try {
        const result = LiteralParser.parseInt(newS);
        const gridData = transformToGridData(result.value, result);
        res.data = gridData;
        (res.format as CellNumberFormat).useGrouping = true;
        return res;
      } catch (error) {
        return null;
      }
    }
  }
  return null;
}

function inferDecimal(s: string, locale: Locale): ParserFreeformMeta {
  if (s.length == 0) {
    return null;
  }
  const parser = new RegexParser(locale);
  const res: ParserFreeformMeta = {
    data: null,
    format: {
      type: "number",
      format: "default",
      thounsandSeparator: locale.numberCache.group,
      decimalSeparator: locale.numberCache.decimal,
      locale: locale.locale,
    },
  };
  const decimalRegexStr = parser.getDecimalRegexStr();
  const decimalRegex = new RegExp("^(" + decimalRegexStr + ")$");
  if (decimalRegex.test(s)) {
    try {
      const newS = s
        .replace(/\s/g, "")
        .replace(`${locale.numberCache.decimal}`, ".");
      const result = LiteralParser.parseDecimal(newS);
      const gridData = transformToGridData(result.value, result);
      res.data = gridData;
      (res.format as CellNumberFormat).useGrouping = false;
      return res;
    } catch (error) {
      return null;
    }
  } else {
    const decimalGroupRegexStr = parser.getDecimalGroupRegexStr();
    const decimalCommaRegex = new RegExp("^(" + decimalGroupRegexStr + ")$");
    if (decimalCommaRegex.test(s)) {
      const newS = s
        .replace(new RegExp(`([${locale.numberCache.group}]|\\s)`, "g"), "")
        .replace(`${locale.numberCache.decimal}`, ".");
      try {
        const result = LiteralParser.parseDecimal(newS);
        const gridData = transformToGridData(result.value, result);
        res.data = gridData;
        (res.format as CellNumberFormat).useGrouping = true;
        return res;
      } catch (error) {
        return null;
      }
    }
  }
  return null;
}

function inferFloat(s: string, locale: Locale): ParserFreeformMeta {
  if (s.length == 0) {
    return null;
  }
  const parser = new RegexParser(locale);
  const res: ParserFreeformMeta = {
    data: null,
    format: {
      type: "number",
      format: "default",
      thounsandSeparator: locale.numberCache.group,
      decimalSeparator: locale.numberCache.decimal,
      locale: locale.locale,
    },
  };
  const floatRegexStr = parser.getFloatRegexStr();
  const decimalRegexStr = parser.getDecimalRegexStr();
  const floatRegex = new RegExp(
    "^(" + floatRegexStr + "|" + IntegerRegex + "|" + decimalRegexStr + ")$"
  );
  if (floatRegex.test(s)) {
    try {
      const newS = s
        .replace(/\s/g, "")
        .replace(`${locale.numberCache.decimal}`, ".");
      const result = LiteralParser.parseFloat(newS);
      const gridData = transformToGridData(result.value, result);
      res.data = gridData;
      (res.format as CellNumberFormat).useGrouping = false;
      return res;
    } catch (error) {
      return null;
    }
  } else {
    const floatGroupRegexStr = parser.getFloatGroupRegexStr();
    const integerGroupRegexStr = parser.getIntegerGroupRegexStr();
    const decimalGroupRegexStr = parser.getDecimalGroupRegexStr();
    const floatCommaRegex = new RegExp(
      "^(" +
        floatGroupRegexStr +
        "|" +
        integerGroupRegexStr +
        "|" +
        decimalGroupRegexStr +
        ")$"
    );
    if (floatCommaRegex.test(s)) {
      const newS = s
        .replace(new RegExp(`([${locale.numberCache.group}]|\\s)`, "g"), "")
        .replace(`${locale.numberCache.decimal}`, ".");
      try {
        const result = LiteralParser.parseFloat(newS);
        const gridData = transformToGridData(result.value, result);
        res.data = gridData;
        (res.format as CellNumberFormat).useGrouping = true;
        return res;
      } catch (error) {
        return null;
      }
    }
  }
  return null;
}

function inferBoolean(s: string): ParserFreeformMeta {
  if (s.length == 0) {
    return null;
  }
  const booleanRegex = new RegExp("^(" + BooleanRegex + ")$");
  if (booleanRegex.test(s)) {
    const trueRegex = new RegExp("^(" + TRUE + ")$");
    const res: ParserFreeformMeta = {
      data: { value: false, dataType: tBoolean },
    };
    if (trueRegex.test(s)) {
      res.data.value = true;
    }
    return res;
  }
  return null;
}

function inferGeo(s: string): ParserFreeformMeta {
  if (s.length == 0) {
    return null;
  }
  const geoRegex = new RegExp("^(" + GeoRegex + ")$");
  if (geoRegex.test(s)) {
    const text = "ST_GEOGFROM('" + s + "')";
    try {
      const { ast, errors } = getParserResult(text);
      if (!errors && !(ast.root instanceof ErrorNode)) {
        const parseRes = convertParserResultToGridData(ast.root);
        return { data: parseRes };
      } else {
        return null;
      }
    } catch (e) {
      return null;
    }
  } else {
    const shortPointRegex = new RegExp("^(" + ShortPointRegex + ")$");
    if (shortPointRegex.test(s)) {
      const shortPointMatchRegex = new RegExp(
        `^((?<num1>.*)${Comma}(?<num2>.*))`
      );
      const match = s.match(shortPointMatchRegex);
      if (!match) return null;
      let { num1 = "", num2 = "" } = match.groups!;
      num1 = num1.trim().replace(/\s/g, "");
      num2 = num2.trim().replace(/\s/g, "");
      const text = "ST_GEOGFROM('POINT(" + num1 + " " + num2 + ")')";
      try {
        const { ast, errors } = getParserResult(text);
        if (!errors && !(ast.root instanceof ErrorNode)) {
          const parseRes = convertParserResultToGridData(ast.root);
          return { data: parseRes };
        } else {
          return null;
        }
      } catch (e) {
        return null;
      }
    }
  }

  return null;
}

function inferDatetime(
  text: string,
  locale: Locale,
  month_first = true
): ParserFreeformMeta {
  const dmy = []; // d/m/y tokens (1- or 2- digits)
  var where_year = -1; // if found definite year token - how many d/m/y were found before it
  var ampm: number, c: string;
  var yy: number,
    mm: number,
    HH: string,
    MM: string,
    SS: string,
    FF: string,
    meridiem: string,
    tz: string;

  var res = 0,
    tres: string;
  let ryear = 0,
    rmonth = 0,
    rday = 0;
  const listSeparator: string[] = [];
  let lastSeparator: string = null;
  const src = text.toLowerCase().trim().replace(/\s\s+/g, " ");
  if (!locale) {
    locale = new Locale(supportedLocaleList["en"]);
  }
  const parser = new RegexParser(locale);
  let inferedDate = false;
  let hasStrMonth = false;
  const rd = new RegExp(parser.getRegexString(), "g");
  var m: RegExpMatchArray;
  while ((m = rd.exec(src)) !== null) {
    let m_ = m[0];
    if (m[14] !== undefined) {
      // token is number
      const lng = m_.length;
      if (
        (lng === 4 || lng === 6) &&
        m.index > 0 &&
        ((c = src[m.index - 1]), c === "+" || c === "-") && // may be timezone offset -0100
        !(lng === 4 && m_ > "1500")
      ) {
        // though it also may be year. Limit offset to 1500 in the hopes that Samoa or Kiribati won't shift further east.
      } else {
        if (lng === 4) {
          // four digits is year
          if (yy !== undefined) return;
          yy = parseInt(m_, 10);
          where_year = dmy.length;
        } else if (lng < 3) {
          // found a d/m/y token
          const num = parseInt(m_, 10);
          if (
            num == 0 &&
            m.index > 0 &&
            ((c = src[m.index - 1]), c === " " || c === "t")
          ) {
            HH = m_;
            continue;
          }
          dmy.push(parseInt(m_, 10)); // length is 1 or 2
        } // wrong number of digits
        else return;
      }
      if (!inferedDate && lastSeparator !== null) {
        return null;
      }
      inferedDate = true;
      lastSeparator = null;
    } else if (m[1] !== undefined) {
      if (lastSeparator !== null) {
        return null;
      }
      // valid time sequence
      if (HH !== undefined) {
        if (
          ((c = src[m.index]), c === "+" || c === "-") &&
          m[11] === undefined &&
          m[13] === undefined
        ) {
          tz = m_.replace(/\s/g, "");
        } else {
          return;
        }
      } else {
        if (m[13] !== undefined) {
          HH = m[1];
          meridiem = m[13];
          meridiem = meridiem.toLowerCase();
          if (parser.isMeridiem(meridiem)) {
            if (parser.isPM(meridiem)) ampm = 1;
            else ampm = 0;
          } else {
            return null;
          }
        } else {
          [, HH, , , , MM, , SS, , FF, , meridiem] = m;
          if (meridiem !== undefined) {
            meridiem = meridiem.toLowerCase();
            if (parser.isMeridiem(meridiem)) {
              if (parser.isPM(meridiem)) ampm = 1;
              else ampm = 0;
            } else {
              return null;
            }
          }
        }
      }
    }
    // separator list
    else if (m[30] !== undefined) {
      if (lastSeparator !== null) {
        return null;
      }
      lastSeparator = m_;
      listSeparator.push(m_);
    } else if (m[32] !== undefined) {
      if (HH !== undefined) {
        tz = m_.replace(/\s/g, "");
      } else {
        return null;
      }
    } // a word
    else {
      m_ = m_.toLowerCase();
      if (m_ === "z" || m_ === "utc" || m_ === "gmt") tz = "Z";
      else if (m_ === "t") continue;
      else if (parser.isMonth(m_)) {
        hasStrMonth = true;
        const _mm = parser.getMonth(m_);
        if (_mm <= 0 || _mm > 12) return null;
        mm = _mm;
        if (!inferedDate && lastSeparator !== null) {
          return null;
        }
        inferedDate = true;
        lastSeparator = null;
      } else if (parser.isWeekday(m_)) {
        if (!inferedDate && lastSeparator !== null) {
          return null;
        }
        inferedDate = true;
        lastSeparator = null;
      } else {
        const timeZoneRegex = parser.getTimeZoneRegex();
        const match = m_.match(timeZoneRegex);
        if (match) {
          const { timezonename, offset } = match.groups;
          const timezone = parser.guessTimeZone(timezonename);
          if (timezone) {
            tz = offset;
          } else {
            return null;
          }
        } else {
          const timezone = parser.guessTimeZone(m_);
          if (timezone) {
            tz = timezone;
          } else {
            return null;
          }
        }
      }
    }
  }

  if (lastSeparator !== null) {
    return null;
  }

  var dmyi: number[][]; // possible indices in dmy for day, month, year in priority order
  // if (dmy.length > 0) {
  if (mm !== undefined) {
    // month in fixed position
    if (where_year < 0) {
      dmy.push(mm);
      if (dmy.length === 2) {
        dmyi = [
          [0, 1, 2],
          [2, 1, 0],
        ]; // "dy", "yd"
      } else {
        dmyi = [
          [0, 2, 1],
          [1, 2, 0],
        ]; // "dy", "yd"
      }
    } else {
      dmy.push(mm);
      dmy.push(yy);
      if (dmy.length === 2) {
        dmyi = [[2, 0, 1]]; // "d"
      } else {
        dmyi = [[0, 1, 2]]; // "d"
      }
    }
  } else {
    if (where_year < 0) {
      if (month_first)
        dmyi = [
          [1, 0, 2],
          [0, 1, 2],
          [2, 1, 0],
          [1, 2, 0],
          [2, 0, 1],
          [0, 2, 1],
        ];
      // "mdy", "dmy", "ymd", "ydm", "myd", "dym"
      else
        dmyi = [
          [0, 1, 2],
          [1, 0, 2],
          [2, 1, 0],
          [1, 2, 0],
          [2, 0, 1],
          [0, 2, 1],
        ]; // "dmy", "mdy", "ymd", "ydm", "myd", "dym"
    } else if (!month_first && where_year >= 2) {
      // month_first=False only applies when year is last
      dmy.push(yy);
      dmyi = [
        [0, 1, 2],
        [1, 0, 2],
      ]; // "dm", "md"
    } else {
      dmy.push(yy);
      if (dmy.length === 2) {
        dmyi = [[2, 0, 1]]; // "my", "ym"
      } else {
        dmyi = [
          [1, 0, 2],
          [0, 1, 2],
        ]; // "md", "dm"
      }
    }
  }

  if (!parser.validDateSeparator(listSeparator, hasStrMonth, dmy)) {
    return null;
  }

  if (dmy.length !== 3 && dmy.length !== 2) {
    // Handle for time
    if (dmy.length === 0 && HH !== undefined && tz === undefined) {
      tres = tTime;
      let hour = parseInt(HH, 10);
      if (hour >= 24 || hour < 0) return;
      if (ampm === 0) {
        if (hour === 12) hour = 0;
      } else if (ampm === 1) {
        if (hour < 12) hour += 12;
        else return;
      }
      const minute = MM === undefined ? 0 : parseInt(MM, 10);
      if (minute >= 60 || minute < 0) return;
      const second = SS === undefined ? 0 : parseInt(SS, 10);
      if (second >= 60 || second < 0) return;
      const ms = FF === undefined ? 0 : parseInt(FF, 10) / 10 ** FF.length;
      const us = isFinite(ms) ? parseFloat(((ms * 1000) % 1).toFixed(3)) : 0;
      // Extract the time component only.
      res +=
        Date.UTC(0, 0, 1, hour, minute, second, Math.floor(ms * 1000)) -
        Date.UTC(0, 0, 1);
      res += us;
      return { data: { dataType: tres, value: res } };
    }
    // wrong number of d/m/y tokens
    return;
  }

  for (const [id, im, iy] of dmyi) {
    // try all possible combinations of d/m/y
    let day = dmy[id],
      month = dmy[im],
      y = dmy[iy];
    if (y === undefined && iy === 2 && dmy.length === 2) {
      y = new Date().getFullYear();
    } else if (day === undefined && id === 2 && dmy.length === 2) {
      day = 1;
    }
    if (month === undefined || month == 0 || month > 12 || day == 0) continue;
    let max_day: number;
    if (month === 4 || month === 6 || month === 9 || month === 11) max_day = 30;
    else if (month === 2)
      max_day = y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0) ? 29 : 28;
    else max_day = 31;
    if (day > max_day) continue;
    if (y < 100) y += y < 68 ? 2000 : 1900;
    ryear = y;
    rmonth = month;
    rday = day;
    break;
  }
  tres = HH === undefined ? tDate : tz === undefined ? tDatetime : tTimeStamp;

  let offset = 0;
  if (tz) {
    try {
      offset = parseTimezoneOffset(tz);
    } catch (e) {
      return null;
    }
  }

  if (Math.abs(offset) >= MS_IN_DAY) return null;

  switch (tres) {
    case tTimeStamp:
    case tDatetime:
      {
        if (offset) {
          res -= offset;
        }
        let hour = parseInt(HH, 10);
        if (hour >= 24 || hour < 0) return;
        if (ampm === 0) {
          if (hour === 12) hour = 0;
        } else if (ampm === 1) {
          if (hour < 12) hour += 12;
          else return;
        }
        const minute = MM === undefined ? 0 : parseInt(MM, 10);
        if (minute >= 60 || minute < 0) return;
        const second = SS === undefined ? 0 : parseInt(SS, 10);
        if (second >= 60 || second < 0) return;
        const ms = FF === undefined ? 0 : parseInt(FF, 10) / 10 ** FF.length;
        const us = isFinite(ms) ? parseFloat(((ms * 1000) % 1).toFixed(3)) : 0;
        // Extract the time component only.
        res +=
          Date.UTC(0, 0, 1, hour, minute, second, Math.floor(ms * 1000)) -
          Date.UTC(0, 0, 1);
        res += us;
        if (ryear === 0 && rmonth === 0 && rday === 0) {
          return null;
        }
        const d = new Date(0);
        d.setUTCHours(0, 0, 0, 0);
        /* Only the month is 0-based! JS is a real mess. */
        d.setUTCFullYear(ryear, rmonth - 1, rday);
        res += d.getTime();
      }
      break;
    case tDate:
      {
        if (ryear === 0 && rmonth === 0 && rday === 0) {
          return null;
        }
        const d = new Date(0);
        d.setUTCHours(0, 0, 0, 0);
        /* Only the month is 0-based! JS is a real mess. */
        d.setUTCFullYear(ryear, rmonth - 1, rday);
        res += d.getTime();
      }
      break;
    default:
      {
      }
      break;
  }

  return { data: { dataType: tres, value: res } };
}

function parseTimezoneOffset(tzString: string) {
  if (tzString === "Z") return 0;
  const match = /^(?<sign>[+-])?(?<hh>\d{1,2})(?:\:(?<mm>\d{1,2}))?Z?$/.exec(
    tzString
  );
  if (!match) {
    throw new Error(`Invalid timezone string`);
  }
  const sign = match.groups?.sign === "-" ? -1 : 1;
  const hh = parseInt(match.groups!.hh);
  if (hh > 12) {
    throw new Error(`Invalid timezone offset`);
  }
  const mm = match.groups?.mm ? parseInt(match.groups!.mm) : 0;
  return (Date.UTC(0, 0, 1, hh, mm, 0, 0) - Date.UTC(0, 0, 1)) * sign;
}

export function inferInterval(s: string): ParserFreeformMeta {
  if (s.length == 0) {
    return null;
  }
  const intervalRegex = new RegExp(`^(${IntervalRegex}|${IntervalTimeRegex})$`);
  const match = s.match(intervalRegex);
  if (!match) return null;
  const {
    years = "",
    months = "",
    days = "",
    hh1 = "",
    mm1 = "",
    ss1 = "",
    ff1 = "",
    hh2 = "",
    mm2 = "",
    ss2 = "",
    ff2 = "",
  } = match.groups;
  const hh = hh1 || hh2,
    mm = mm1 || mm2,
    ss = ss1 || ss2,
    ff = ff1 || ff2;
  if (!years && !months && !days && !hh && !mm && !ss && !ff) {
    return null;
  }
  const duration = createDuration();
  if (years) duration.years = parseInt(years);
  if (months) duration.months = parseInt(months);
  if (days) duration.days = parseInt(days);
  if (hh) duration.hours = parseInt(hh);
  if (mm) duration.minutes = parseInt(mm);
  if (ss) duration.seconds = parseInt(ss);
  if (ff) duration.seconds += parseInt(ff) / Math.pow(10, ff.length);
  try {
    const ms = durationToMs(duration);
    return { data: { value: ms, dataType: tInterval } };
  } catch (error) {
    return null;
  }
}

export function inferBytes(s: string): ParserFreeformMeta {
  if (s.length == 0) {
    return null;
  }

  const bytesRegex = new RegExp(BytesRegex);
  if (bytesRegex.test(s)) {
    const res = LiteralParser.parseBytes(s);

    return { data: { value: res.value, dataType: tBytes } };
  }
  return null;
}

export function inferSingleQuoteString(s: string): ParserFreeformMeta {
  if (s.length == 0) {
    return null;
  }

  const singleQuoteRegex = new RegExp(StringSingleQuoteRegex);
  const match = s.match(singleQuoteRegex);
  if (!match) return null;
  const { str = "" } = match.groups;

  if (!str) {
    return null;
  }

  return { data: { value: str, dataType: tString } };
}

export function inferParsingNestedTypes(s: string): ParserFreeformMeta {
  if (s.length == 0) {
    return null;
  }

  const nestedTypeRegex = new RegExp(NestedTypeRegex);
  if (nestedTypeRegex.test(s)) {
    try {
      const { ast, errors } = getParserResult(s);
      if (
        !errors &&
        !(ast.root instanceof ErrorNode) &&
        ast.root instanceof ValueNode
      ) {
        const parseRes = convertParserResultToGridData(ast.root);
        return { data: parseRes };
      } else {
        return null;
      }
    } catch (e) {
      return null;
    }
  }
}

export function parseStringToGridData(
  value: string,
  locale: Locale = null
): ParserFreeformMeta {
  const fiLocale = new Locale({ key: "fi", name: "Finland", currency: "EUR" });
  if (!locale) {
    locale = new Locale(supportedLocaleList["en"]);
  }
  const s = value.trim();
  if (s.length > 0) {
    let res: ParserFreeformMeta = inferSingleQuoteString(s);
    if (res) return res;
    res = inferNumber(s, locale);
    if (res) return res;
    res = inferCurrencyOrPercentageNumber(s, locale);
    if (res) return res;
    res = inferBoolean(s);
    if (res) return res;
    res = inferGeo(s);
    if (res) return res;
    res = inferDatetime(s, locale);
    if (res) return res;
    res = inferInterval(s);
    if (res) return res;
    res = inferBytes(s);
    if (res) return res;
    res = inferParsingNestedTypes(s);
    if (res) return res;
    res;
  }
  return { data: { value, dataType: tString } };
}
