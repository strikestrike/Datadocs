import type { CellStringFormat } from '../../../types/data-format';
import { getStringDefaultFormat } from '../util';

const DEFAULT_STRING_FORMAT = getStringDefaultFormat().format;
const ELLIPISS_TEXT = '…';

export function stringFormatter(
  value: string,
  limit = 36,
  dataFormat?: CellStringFormat,
) {
  let format = dataFormat?.format;
  if (!format) {
    format = DEFAULT_STRING_FORMAT;
  }

  if (limit > 0 && value.length > limit) {
    value = value.substring(0, limit) + ELLIPISS_TEXT;
  }

  switch (format) {
    case 'WithoutQuote': {
      return value;
    }
    case 'DoubleQuote': {
      return `"${value}"`;
    }
    case 'SingleQuote': {
      return `'${value}'`;
    }
    case 'Hyperlink': {
      return value;
    }
    default: {
      return value;
    }
  }
}
