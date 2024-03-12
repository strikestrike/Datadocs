import type { CurrencyType } from '../../../types/data-format';

export function trimFloatStringZero(str: string, trailingZeroDisplay = false) {
  // If there is no floating point, or showing trailing zero display
  // should keep the number intact and remove . if it is at the end
  // of number
  if (trailingZeroDisplay || str.indexOf('.') === -1) {
    return str;
  }

  const values = str.split('e');
  let n = values[0];
  n = n.replace(/(0*)$/, '');
  n = n.endsWith('.') ? n.substring(0, n.length - 1) : n;
  if (n === '0') return n;
  values[0] = n;
  return values.join('e');
}

export function roundBigInt(value: bigint, digits: number) {
  const divisor = 10n ** BigInt(digits);
  const quotient = value / divisor;
  const leftOver = value - quotient * divisor;
  if (leftOver >= divisor / 2n) {
    // round up
    return (quotient + 1n) * divisor;
  } else {
    // round down
    return quotient * divisor;
  }
}

export function getIntlFractionDigits(decimalPlaces: number) {
  // Intl only accept up to 20 fraction digits
  const MIN_INTL_FRACTION_DIGITS = 0;
  const MAX_INTL_FRACTION_DIGITS = 20;
  return Math.min(
    Math.max(decimalPlaces, MIN_INTL_FRACTION_DIGITS),
    MAX_INTL_FRACTION_DIGITS,
  );
}

// Decimal number format
const decimalFormatMap: Record<number | string, Intl.NumberFormat> = {};

export function getDecimalFormat(
  fractionDigits: number,
  useGrouping = false,
  locale = 'en-US',
): Intl.NumberFormat {
  const key = locale + (useGrouping ? '-group-' : '-') + fractionDigits;
  if (!decimalFormatMap[key]) {
    decimalFormatMap[key] = new Intl.NumberFormat(locale, {
      style: 'decimal',
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
      useGrouping,
    });
  }
  return decimalFormatMap[key];
}

export function formatDecimalAsScientific(
  value: { a: bigint; b: number },
  fractionDigits: number,
) {
  let { a, b } = value;
  const isNegative = a < 0n;
  if (isNegative) a = -a;
  const sign = isNegative ? '-' : '';
  const str = a.toString();
  let exp = str.length - b - 1;
  const maxFraction = str.length - 1;
  let result: string;
  if (maxFraction > fractionDigits) {
    const roundedValue = roundBigInt(a, maxFraction - fractionDigits);
    const roundedStr = roundedValue.toString();
    result = roundedStr[0] + '.' + roundedStr.substring(1, fractionDigits + 1);
    if (roundedStr.length > str.length) {
      // Rounded number has more digits (such as 999 => 1000), so we need to
      // increase the exp one unit
      exp += 1;
    }
  } else {
    const trailingZero = '0'.repeat(fractionDigits - maxFraction);
    result = str[0] + '.' + str.substring(1) + trailingZero;
  }
  if (result.endsWith('.')) result = result.substring(0, result.length - 1);
  return sign + result + (exp >= 0 ? 'e+' : 'e-') + Math.abs(exp).toString();
}

/**
 * Format decimal value to decimal style
 * Note: this function only work with positive decimal
 */
export function formatDecimalAsDecimal(
  value: { a: bigint; b: number },
  fractionDigits: number,
  useGrouping = false,
) {
  const { a, b } = value;
  let n = a;
  if (b > fractionDigits) {
    n = roundBigInt(a, b - fractionDigits);
  }
  const divisor = 10n ** BigInt(b);
  const integerPart = n / divisor;
  let integerStr: string;
  let fractionStr = (n - integerPart * divisor).toString();
  if (useGrouping) {
    const format = getDecimalFormat(0, true);
    integerStr = format.format(integerPart);
  } else {
    integerStr = integerPart.toString();
  }

  if (fractionStr.length < b) {
    fractionStr = '0'.repeat(b - fractionStr.length) + fractionStr;
  }
  fractionStr = fractionStr.substring(0, fractionDigits);
  if (fractionStr.length < fractionDigits) {
    fractionStr += '0'.repeat(fractionDigits - fractionStr.length);
  }
  if (fractionStr.length > 0) fractionStr = '.' + fractionStr;
  return integerStr + fractionStr;
}

export function formatNumberAsDecimal(
  value: number,
  decimalPlaces: number,
  useGrouping = false,
) {
  const fractionDigits = getIntlFractionDigits(decimalPlaces);
  const trailingZero = '0'.repeat(Math.max(decimalPlaces - fractionDigits, 0));
  return (
    getDecimalFormat(fractionDigits, useGrouping).format(value) + trailingZero
  );
}

// Scientific number format
const scientificFormatMap: Record<number | string, Intl.NumberFormat> = {};

function getScientificFormat(fractionDigits: number): Intl.NumberFormat {
  if (!scientificFormatMap[fractionDigits]) {
    scientificFormatMap[fractionDigits] = new Intl.NumberFormat('en-US', {
      notation: 'scientific',
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
      useGrouping: false,
    });
  }
  return scientificFormatMap[fractionDigits];
}

export function formatNumberAsScientific(value: number, decimalPlaces: number) {
  const fractionDigits = getIntlFractionDigits(decimalPlaces);
  const trailingZero = '0'.repeat(Math.max(decimalPlaces - fractionDigits, 0));
  let result = getScientificFormat(fractionDigits).format(value);
  if (result.includes('E-')) {
    result = result.replace('E', trailingZero + 'e');
  } else {
    result = result.replace('E', trailingZero + 'e+');
  }
  return result;
}

export const currencyInfoMap: Record<
  CurrencyType,
  {
    currency: string;
    notation: string;
  }
> = {
  usd: { currency: 'USD', notation: '$' },
  euro: { currency: 'EUR', notation: '€' },
  pounds: { currency: 'GBP', notation: '£' },
};
