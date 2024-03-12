import type {
  CurrencyType,
  CellNumberAccountingFormat,
  CellDataFormatResult,
} from '../../../types/data-format';
import {
  formatNumberAsDecimal,
  formatDecimalAsDecimal,
  currencyInfoMap,
} from './utils';

const DEFAULT_DECIMAL_PLACES = 2;
const DEFAULT_CURRENCY: CurrencyType = 'usd';

function generateAccountingValue(
  value: string,
  notation: string,
  isNegative: boolean,
  formatString?: boolean,
): CellDataFormatResult {
  if (isNegative) value = `(${value})`;
  if (formatString) {
    if (value === ACCOUNTING_ZERO_VALUE) {
      value = ACCOUNTING_ZERO_VALUE_SHORT;
    }
    return notation + ' ' + value;
  } else {
    return { type: 'accounting', prefix: notation, value };
  }
}

const ACCOUNTING_ZERO_VALUE_SHORT = '-';
export const ACCOUNTING_ZERO_VALUE = ' -   ';

export function numberAccountingFormatter(
  value: number | { a: bigint; b: number },
  format?: CellNumberAccountingFormat,
  formatString?: boolean,
): CellDataFormatResult {
  const fractionDigits = format?.decimalPlaces ?? DEFAULT_DECIMAL_PLACES;
  const currency = format?.currency ?? DEFAULT_CURRENCY;
  const currencyNotation = currencyInfoMap[currency].notation;
  const accountingZero = generateAccountingValue(
    ACCOUNTING_ZERO_VALUE,
    currencyNotation,
    false,
    formatString,
  );

  if (typeof value === 'number') {
    if (value === 0) return accountingZero;
    const isNegative = value < 0;
    value = Math.abs(value);
    return generateAccountingValue(
      formatNumberAsDecimal(value, fractionDigits, true),
      currencyNotation,
      isNegative,
      formatString,
    );
  } else {
    let { a, b } = value;
    if (a === 0n) return accountingZero;
    const isNegative = a < 0n;
    if (isNegative) a = -a;
    const decimalStr = formatDecimalAsDecimal({ a, b }, fractionDigits, true);
    return generateAccountingValue(
      decimalStr,
      currencyNotation,
      isNegative,
      formatString,
    );
  }
}
