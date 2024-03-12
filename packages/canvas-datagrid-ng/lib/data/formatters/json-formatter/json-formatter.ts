import type { CellJSONFormat } from '../../../types/data-format';
import { numberFormatter } from '../number-formatter';
import { booleanFormatter } from '../boolean-formatter';
import { stringFormatter } from '../string-formatter';
import { getJsonDefaultFormat } from '../util';

const DEFAULT_JSON_FORMAT = getJsonDefaultFormat().format;

export function jsonFormatter(
  value: any,
  dataFormat?: CellJSONFormat,
  isRoot = false,
) {
  const format = dataFormat?.format ?? DEFAULT_JSON_FORMAT;
  const prefix = format === 'long' ? 'JSON ' : '';
  return prefix + formatJson(value, format, isRoot);
}

const SPACE = ' ';
const SEPARATOR = ', ';

function formatJson(
  value: any,
  format: CellJSONFormat['format'],
  isRoot: boolean,
) {
  // In case of short format, we need to add space after { [
  // and before ] } to distinguish json string from array/object
  const spaceWhenNeeded = isRoot && format === 'short' ? SPACE : '';

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return '[' + spaceWhenNeeded + ']';
    }

    let arrayResult = '[' + spaceWhenNeeded;
    for (const v of value) {
      arrayResult += formatJson(v, format, false) + SEPARATOR;
    }
    return arrayResult.slice(0, -SEPARATOR.length) + spaceWhenNeeded + ']';

    // return (
    //   '[' +
    //   spaceWhenNeeded +
    //   value.map((v) => formatJson(v, format, false)).join(', ') +
    //   spaceWhenNeeded +
    //   ']'
    // );
  }

  switch (typeof value) {
    case 'boolean': {
      return booleanFormatter(value);
    }
    case 'number': {
      return numberFormatter(value);
    }
    case 'string': {
      return isRoot && format === 'short' ? value : wrapDoubleQuote(value);
    }
    case 'object': {
      if (value === null) return 'null';

      let objectResult = '{' + spaceWhenNeeded;
      let hasProperty = false;
      for (const key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          objectResult +=
            wrapDoubleQuote(key) +
            ':' +
            SPACE +
            formatJson(value[key], format, false) +
            SEPARATOR;
          hasProperty = true;
        }
      }
      if (hasProperty) {
        return objectResult.slice(0, -SEPARATOR.length) + spaceWhenNeeded + '}';
      } else {
        return objectResult + '}';
      }
    }
    case 'undefined': {
      return 'undefined';
    }
    default: {
      return typeof value?.toString === 'function'
        ? value.toString()
        : JSON.stringify(value);
    }
  }
}

function wrapDoubleQuote(value: string) {
  return '"' + value + '"';
}
