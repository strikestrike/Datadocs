import { formatNumberAsScientific, formatDecimalAsScientific } from './utils';
import type { CellNumberFormat } from '../../../types/data-format';

const DEFAULT_EXPONENT_DECIMAL_PLACES = 2;

export function numberScientificFormatter(
  value: number | { a: bigint; b: number },
  format?: CellNumberFormat,
): string {
  const fractionDigits =
    format?.decimalPlaces ?? DEFAULT_EXPONENT_DECIMAL_PLACES;
  if (typeof value === 'number') {
    return formatNumberAsScientific(value, fractionDigits);
  } else {
    if (value.a === 0n) return formatNumberAsScientific(0, fractionDigits);
    return formatDecimalAsScientific(value, fractionDigits);
  }
}
