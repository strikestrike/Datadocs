import type { CellBooleanFormat } from '../../../types/data-format';
import { getBooleanDefaultFormat } from '../util';

const DEFAULT_BOOLEAN_FORMAT = getBooleanDefaultFormat().format;

export function booleanFormatter(
  value: boolean,
  dataFormat?: CellBooleanFormat,
) {
  const format = dataFormat?.format ?? DEFAULT_BOOLEAN_FORMAT;

  switch (format) {
    case 'true|false': {
      return value ? 'true' : 'false';
    }
    case 'True|False': {
      return value ? 'True' : 'False';
    }
    case 'TRUE|FALSE': {
      return value ? 'TRUE' : 'FALSE';
    }
    case 'yes|no': {
      return value ? 'yes' : 'no';
    }
    case 'Yes|No': {
      return value ? 'Yes' : 'No';
    }
    case 'YES|NO': {
      return value ? 'YES' : 'NO';
    }
    case '1|0': {
      return value ? '1' : '0';
    }
    default: {
      return value ? 'true' : 'false';
    }
  }
}
