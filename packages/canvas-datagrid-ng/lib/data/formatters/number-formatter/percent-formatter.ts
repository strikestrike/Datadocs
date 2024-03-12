import type { CellNumberFormat } from '../../../types/data-format';
import { getIntlFractionDigits, formatDecimalAsDecimal } from './utils';

const DEFAULT_DECIMAL_PLACES = 2;
const percentFormatMap: Record<number | string, Intl.NumberFormat> = {};

export function numberPercentFormatter(
  value: number | { a: bigint; b: number },
  format?: CellNumberFormat,
): string {
  const fractionDigits = format?.decimalPlaces ?? DEFAULT_DECIMAL_PLACES;

  if (typeof value === 'number') {
    return numberFormatAsPercent(value, fractionDigits);
  } else {
    let { a, b } = value;
    const isNegative = a < 0n;
    const sign = isNegative ? '-' : '';
    if (isNegative) a = -a;
    a *= 100n;
    const decimalStr = formatDecimalAsDecimal({ a, b }, fractionDigits, false);
    return sign + decimalStr + '%';
  }
}

function getPercentFormat(fractionDigits: number): Intl.NumberFormat {
  const key = fractionDigits;
  if (!percentFormatMap[key]) {
    percentFormatMap[key] = Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
      useGrouping: false,
    });
  }
  return percentFormatMap[key];
}

function numberFormatAsPercent(value: number, decimalPlaces: number) {
  const fractionDigits = getIntlFractionDigits(decimalPlaces);
  const additionalTrailingZero = Math.max(decimalPlaces - fractionDigits, 0);
  const trailingZero = '0'.repeat(additionalTrailingZero);
  return getPercentFormat(fractionDigits)
    .format(value)
    .replace('%', trailingZero + '%');
}
