import type {
  CellNumberAccountingFormat,
  CellNumberCurrencyFormat,
  CellNumberFormat,
  CellDataFormatResult,
} from '../../../types/data-format';
import { numberDefaultFormatter } from './default-formatter';
import { numberCurrencyFormatter } from './currency-formatter';
import { numberScientificFormatter } from './scientific-formatter';
import { numberPercentFormatter } from './percent-formatter';
import { numberAccountingFormatter } from './accounting-formatter';
import { getNumberDefaultFormat } from '../util';

const DEFAULT_NUMBER_FORMAT = getNumberDefaultFormat().format;

/**
 * Format a number
 * @param value Number to format
 * @param dataFormat Indicate which format to be used
 * @param formatString Indicate if return value should be a string or not
 */
export function numberFormatter(
  value: number | { a: bigint; b: number },
  dataFormat?: CellNumberFormat,
  formatString?: boolean,
): CellDataFormatResult {
  if (typeof value === 'number' && (!isFinite(value) || isNaN(value))) {
    return value.toString();
  }

  let format = dataFormat?.format;
  if (!format) format = DEFAULT_NUMBER_FORMAT;

  switch (format) {
    case 'default': {
      return numberDefaultFormatter(value, dataFormat);
    }
    case 'currency': {
      return numberCurrencyFormatter(
        value,
        dataFormat as CellNumberCurrencyFormat,
      );
    }
    case 'scientific': {
      return numberScientificFormatter(value, dataFormat);
    }
    case 'percent': {
      return numberPercentFormatter(value, dataFormat);
    }
    case 'accounting': {
      return numberAccountingFormatter(
        value,
        dataFormat as CellNumberAccountingFormat,
        formatString,
      );
    }
    default: {
      return 'null';
    }
  }
}
