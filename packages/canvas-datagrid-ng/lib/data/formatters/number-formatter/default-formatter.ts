import {
  trimFloatStringZero,
  formatNumberAsDecimal,
  formatNumberAsScientific,
  formatDecimalAsScientific,
  formatDecimalAsDecimal,
} from './utils';
import type { CellNumberFormat } from '../../../types/data-format';

const DEFAULT_EXPONENT_DECIMAL_PLACES = 5;
const DEFAULT_NORMAL_DECIMAL_PLACES = 8;

export function numberDefaultFormatter(
  value: number | { a: bigint; b: number },
  format?: CellNumberFormat,
): string {
  const trailingZeroDisplay = format?.decimalPlaces != null;

  if (typeof value === 'number') {
    const absValue = Math.abs(value);
    if (absValue >= 1e15 || (absValue <= 1e-5 && absValue > 0)) {
      const fractionDigits =
        format?.decimalPlaces ?? DEFAULT_EXPONENT_DECIMAL_PLACES;
      return trimFloatStringZero(
        formatNumberAsScientific(value, fractionDigits),
        trailingZeroDisplay,
      );
    } else {
      const fractionDigits =
        format?.decimalPlaces ?? DEFAULT_NORMAL_DECIMAL_PLACES;
      return trimFloatStringZero(
        formatNumberAsDecimal(value, fractionDigits),
        trailingZeroDisplay,
      );
    }
  } else {
    let { a, b } = value;
    const isNegative = a < 0n;
    if (isNegative) a = -a;
    const sign = isNegative ? '-' : '';
    const n = a.toString();
    const exp = n.length - b - 1;

    if (a !== 0n && (exp >= 15 || exp <= -5)) {
      const fractionDigits =
        format?.decimalPlaces ?? DEFAULT_EXPONENT_DECIMAL_PLACES;
      return trimFloatStringZero(
        formatDecimalAsScientific(value, fractionDigits),
        trailingZeroDisplay,
      );
    } else {
      const fractionDigits =
        format?.decimalPlaces ?? DEFAULT_NORMAL_DECIMAL_PLACES;
      const decimalStr = formatDecimalAsDecimal(
        { a, b },
        fractionDigits,
        false,
      );
      return sign + trimFloatStringZero(decimalStr, trailingZeroDisplay);
    }
  }
}
