import type {
  CurrencyType,
  CellNumberCurrencyFormat,
} from '../../../types/data-format';
import {
  formatNumberAsDecimal,
  formatDecimalAsDecimal,
  currencyInfoMap,
} from './utils';

const DEFAULT_DECIMAL_PLACES = 2;
const DEFAULT_CURRENCY: CurrencyType = 'usd';

export function numberCurrencyFormatter(
  value: number | { a: bigint; b: number },
  format?: CellNumberCurrencyFormat,
): string {
  const fractionDigits = format?.decimalPlaces ?? DEFAULT_DECIMAL_PLACES;
  const currency = format?.currency ?? DEFAULT_CURRENCY;
  const currencyNotation = currencyInfoMap[currency].notation;

  if (typeof value === 'number') {
    const isNegative = value < 0;
    const sign = isNegative ? '-' : '';
    value = Math.abs(value);
    return (
      sign +
      currencyNotation +
      formatNumberAsDecimal(value, fractionDigits, true)
    );
  } else {
    let { a, b } = value;
    const isNegative = a < 0n;
    if (isNegative) a = -a;
    const sign = isNegative ? '-' : '';
    const decimalStr = formatDecimalAsDecimal({ a, b }, fractionDigits, true);
    return sign + currencyNotation + decimalStr;
  }
}
