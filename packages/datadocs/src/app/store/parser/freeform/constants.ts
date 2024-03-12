import type { LocaleInfo } from "./types";

// type
export const tString = "string",
  tBoolean = "boolean",
  tInteger = "int",
  tFloat = "float",
  tDate = "date",
  tTime = "time",
  tDatetime = "datetime",
  tTimeStamp = "timestamp",
  tInterval = "interval",
  tBytes = "bytes",
  tListInteger = 24,
  tListFLoat = 25,
  tListDatetime = 27,
  tListDate = 28,
  tDecimal = "decimal",
  tListTime = 31,
  tListBoolean = 26,
  tListString = 23,
  tListBytes = 35,
  tListDecimal = 36,
  tStruct = 0,
  tListStruct = 0;

export const defaultDateSeparator: string[] = ["/", "-"];
export const supportedLocaleList: { [key: string]: LocaleInfo } = {
  en: {
    key: "en",
    name: "English (default)",
    currency: "USD",
    shortMeridiem: {
      am: "a",
      pm: "p",
    },
  },
  fr: {
    key: "fr",
    name: "French",
    currency: "EUR",
    shortMeridiem: {
      am: "a",
      pm: "p",
    },
    dateSeparator: [".", ","],
  },
  vi: {
    key: "vi",
    name: "Viet Nam",
    currency: "VND",
    shortMeridiem: {
      am: "s",
      pm: "c",
    },
    dateSeparator: [".", ","],
  },
};

// Tokens for regex parser
export const A = "[aA]";
export const B = "[bB]";
export const C = "[cC]";
export const D = "[dD]";
export const E = "[eE]";
export const F = "[fF]";
export const G = "[gG]";
export const H = "[hH]";
export const I = "[iI]";
export const J = "[jJ]";
export const K = "[kK]";
export const L = "[lL]";
export const M = "[mM]";
export const N = "[nN]";
export const O = "[oO]";
export const P = "[pP]";
export const Q = "[qQ]";
export const R = "[rR]";
export const S = "[sS]";
export const T = "[tT]";
export const U = "[uU]";
export const V = "[vV]";
export const W = "[wW]";
export const X = "[xX]";
export const Y = "[yY]";
export const Z = "[zZ]";

const USDOLAR = "[$]";
const EURO = "[€]";
const POUND = "[£]";
export const Percent = "[%]";
const Dot = "[.]";
const Colon = "[:]";
const Space = "\\s";
const SQuote = "'";
const DQuote = '"';
const OpenParen = "[(]";
const OpenBracket = "[[]";
const OpenBrace = "[{]";
const Minus = "[-]";

export const Comma = "[,]";

export const Digit = "[0-9]";
const HexDigit = "[0-9a-fA-F]";
export const Exponent = `(${E}[+-]?${Digit}+)`;
const Sign = "[+-]";
export const SignComponent = `(${Sign}(${Space})*)`;
const CommaInteger = `(${Comma}${Digit}{3}${Digit}*)`;
const POINT = `${P}${O}${I}${N}${T}`;
const LINESTRING = `${L}${I}${N}${E}${S}${T}${R}${I}${N}${G}`;
const POLYGON = `${P}${O}${L}${Y}${G}${O}${N}`;
const MULTIPOINT = `${M}${U}${L}${T}${I}${P}${O}${I}${N}${T}`;
const MULTILINESTRING = `${M}${U}${L}${T}${I}${L}${I}${N}${E}${S}${T}${R}${I}${N}${G}`;
const MULTIPOLYGON = `${M}${U}${L}${T}${I}${P}${O}${L}${Y}${G}${O}${N}`;
const GEOMETRYCOLLECTION = `${G}${E}${O}${M}${E}${T}${R}${Y}${C}${O}${L}${L}${E}${C}${T}${I}${O}${N}`;
const EMPTY = `${E}${M}${P}${T}${Y}`;
const GeometryType = `(${POINT}|${LINESTRING}|${POLYGON}|${MULTIPOINT}|${MULTILINESTRING}|${MULTIPOLYGON}|${GEOMETRYCOLLECTION})`;

export const TRUE = `(${T}${R}${U}${E})`;
export const FALSE = `(${F}${A}${L}${S}${E})`;
export const CurrencyOrPercentage = `(${USDOLAR}|${Percent}|${EURO}|${POUND})`;

export const hexRegex = `(${SignComponent}?[0]${X}${HexDigit}+)`;
export const IntegerRegex = `(${SignComponent}?${Digit}+)`;
export const IntegerCommaRegex = `(${SignComponent}?((${Digit}+)?${CommaInteger}+))`;
export const FloatRegex = `(${SignComponent}?((${Digit}+${Dot}${Digit}*)|(${Dot}?${Digit}+))(${Exponent}|${E}))`;
export const FloatCommaRegex = `(${IntegerCommaRegex}(${Dot}${Digit}*)?(${Exponent}|${E}))`;
export const DecimalRegex = `(${SignComponent}?((${Digit}+${Dot}${Digit}*)|(${Dot}${Digit}+)))`;
export const DecimalCommaRegex = `(${IntegerCommaRegex}${Dot}${Digit}*)`;
export const BooleanRegex = `(${TRUE}|${FALSE})`;
export const GeoRegex = `(${GeometryType})${Space}*(([(](.*)[)])|${EMPTY})`;
const CoordinateNumber = `(${DecimalRegex}|${IntegerRegex})`;
export const ShortPointRegex = `(${CoordinateNumber}${Space}*${Comma}${Space}*${CoordinateNumber})`;
export const IntervalTimeRegex = `(((?<hh2>(${Digit}+))(${Space})*(${Colon}(${Space})*(?<mm2>${Digit}+))?(${Space})*(${Colon}(${Space})*(?<ss2>${Digit}+))?(${Dot}(?<ff2>${Digit}{1,9}))?(?!${Digit}))(${I})?)`;
export const IntervalRegex = `(((?<years>(${Digit}+))${Minus}(?<months>(${Digit}+))${Space}*)?(?<days>(${Digit}+))(${Space})*((${Dot})(${Space})*(?<hh1>(${Digit}+))(${Space})*(${Colon}(${Space})*(?<mm1>${Digit}+))?(${Space})*(${Colon}(${Space})*(?<ss1>${Digit}+))?(${Dot}(?<ff1>${Digit}{1,9}))?(?!${Digit}))?(${I})?)`;
export const BytesRegex = `^(${B}((${SQuote}(?<str1>.*)${SQuote})|(${DQuote}(?<str2>.*)${DQuote})))$`;
export const StringSingleQuoteRegex = `^(${SQuote}(?<str>.*))$`;
export const NestedTypeRegex = `^((${OpenParen}|${OpenBracket}|${OpenBrace})(.*))$`;
