import type {
  ColumnType,
  List,
  ParserCellData,
  Struct,
} from '@datadocs/canvas-datagrid-ng';
import { DataType } from '@datadocs/canvas-datagrid-ng';
import { dateTimeToMs } from '@datadocs/canvas-datagrid-ng/lib/data/formatters/interval-formatter/utils';
import { GridTypeName } from '@datadocs/canvas-datagrid-ng/lib/utils/column-types';

export function transformDuckDBValue(value: any, type: ColumnType) {
  if (typeof type === 'string') {
    return value;
  } else {
    // Return value if value is null
    if (value === null && type.typeId !== DataType.Variant) {
      return value;
    }

    switch (type.typeId) {
      case DataType.Decimal: {
        return bignumToNumber(value);
      }
      case DataType.Interval: {
        // console.log('debug here === interval value ==== ', { value, type });
        return value;
      }
      case DataType.Json: {
        try {
          return JSON.parse(value);
        } catch (error) {
          return value;
        }
      }
      case DataType.List: {
        const result = [];
        const elementType = (type as List).child.type;

        for (let i = 0; i < value.length; i++) {
          if (value.isValid(i)) {
            const element = transformDuckDBValue(value.get(i), elementType);
            result.push(element);
          } else {
            result.push(null);
          }
        }

        return result;
      }
      case DataType.Struct: {
        const data = value.toJSON();
        const result = {};

        for (const childType of (type as Struct).children) {
          result[childType.name] = transformDuckDBValue(
            data[childType.name],
            childType.type,
          );
        }

        return result;
      }
      case DataType.Variant: {
        if (value === null) {
          return { value: null, dataType: NULL };
        }
        // console.log('debug here ===== variant value ======= ', {
        //   raw: value.toJSON(),
        //   value: transformVariantValue(value.toJSON()),
        // });
        return transformVariantValue(value.toJSON());
      }
      default: {
        return value;
      }
    }
  }
}

const textEncoder = new TextEncoder();
const {
  BOOLEAN,
  STRING,
  INT,
  FLOAT,
  DECIMAL,
  DATE,
  DATETIME,
  TIME,
  TIMESTAMP,
  BYTES,
  JSON: JSON_TYPE,
  GEOGRAPHY,
  STRUCT,
  NULL,
  INTERVAL,
  VARIANT,
  // UNDEFINED,
} = GridTypeName;

export function transformVariantValue(data: {
  __type: string;
  __value: string;
  __info: string;
}): ParserCellData {
  const { __type: type, __value, __info } = data;
  const value = JSON.parse(__value);
  const typeInfo = JSON.parse(__info);

  function transformValue(value: any, type: string, typeInfo: any) {
    if (value === null) {
      return {
        value: value,
        dataType: duckdbVariantTypeToGridType(type),
      };
    }

    switch (type) {
      case 'BOOL': {
        return { value: value, dataType: BOOLEAN };
      }
      case 'STRING': {
        return { value: value, dataType: STRING };
      }
      case 'INT':
      case 'INT64': {
        return { value: value, dataType: INT };
      }
      case 'FLOAT':
      case 'FLOAT64': {
        return { value: value, dataType: FLOAT };
      }
      case 'NUMERIC': {
        return {
          value: getDecimalFromString(value),
          dataType: DECIMAL,
        };
      }
      case 'DATE': {
        return {
          value: getUTCDateFromString(value),
          dataType: DATE,
        };
      }
      case 'DATETIME': {
        return {
          value: getUTCDateFromString(value),
          dataType: DATETIME,
        };
      }
      case 'TIME': {
        // Note: 01 January, 1970 UTC has Date value zero, add it
        // as a workaround to use JS Date.
        return {
          value: getUTCDateFromString(`1970-01-01 ${value}`),
          dataType: TIME,
        };
      }
      case 'TIMESTAMP': {
        return {
          value: getUTCDateFromString(value),
          dataType: TIMESTAMP,
        };
      }
      case 'BYTES': {
        return {
          value: textEncoder.encode(atob(value)),
          dataType: BYTES,
        };
      }
      case 'JSON': {
        return { value: value, dataType: JSON_TYPE };
      }
      case 'GEOGRAPHY': {
        return { value: value, dataType: GEOGRAPHY };
      }
      case 'VARIANT': {
        return typeof typeInfo === 'string'
          ? transformValue(value, typeInfo, typeInfo)
          : transformNestedTypeValue(value, type, typeInfo);
      }
      case 'INTERVAL': {
        getIntervalValue(value);
        return {
          value: getIntervalValue(value),
          dataType: INTERVAL,
        };
      }
      case 'NULL': {
        return { value: null, dataType: NULL };
      }
      case 'STRUCT': {
        return transformNestedTypeValue(value, type, typeInfo);
      }
      default:
        if (type.endsWith('[]')) {
          const result = [];
          for (let i = 0; i < value.length; i++) {
            const childValue = value[i];
            const childType = type.slice(0, -2);
            if (typeInfo?.length) {
              const childTypeInfo = typeInfo[i];
              if (typeof childTypeInfo === 'string') {
                result.push(transformValue(value[i], childTypeInfo, null));
              } else {
                if (Array.isArray(childTypeInfo)) {
                  result.push(
                    transformNestedTypeValue(
                      childValue,
                      'VARIANT[]',
                      childTypeInfo,
                    ),
                  );
                } else {
                  result.push(
                    transformNestedTypeValue(
                      childValue,
                      'STRUCT',
                      childTypeInfo,
                    ),
                  );
                }
              }
            } else {
              result.push(transformValue(value[i], childType, null));
            }
          }

          return {
            value: result,
            dataType: duckdbVariantTypeToGridType(type),
          };
        }
        break;
    }
  }

  function transformNestedTypeValue(value: any, type: string, typeInfo: any) {
    if (Array.isArray(typeInfo)) {
      const result: ParserCellData = {
        value: [],
        dataType: duckdbVariantTypeToGridType(type),
      };
      // Array type
      for (let i = 0; i < typeInfo.length; i++) {
        const childType = typeInfo[i];
        const childValue = value[i];
        if (typeof childType === 'string') {
          result.value.push(transformValue(childValue, childType, null));
        } else {
          if (Array.isArray(childType)) {
            result.value.push(
              transformNestedTypeValue(childValue, 'VARIANT[]', childType),
            );
          } else {
            result.value.push(
              transformNestedTypeValue(childValue, 'STRUCT', childType),
            );
          }
        }
      }
      return result;
    } else {
      // Struct type
      const result: ParserCellData = {
        value: {},
        dataType: duckdbVariantTypeToGridType(type),
      };

      for (const key in typeInfo) {
        const childValue = value[key];
        const childType = typeInfo[key];
        if (typeof childType === 'string') {
          result.value[key] = transformValue(childValue, childType, null);
        } else {
          result.value[key] = Array.isArray(childType)
            ? transformNestedTypeValue(childValue, 'VARIANT[]', childType)
            : transformNestedTypeValue(childValue, 'STRUCT', childType);
        }
      }

      return result;
    }
  }

  return (
    transformValue(value, type, typeInfo) ?? {
      value: __value,
      dataType: STRING,
    }
  );
}

/**
 * Convert decimal string to bigint with precision. Not use parseFloat
 * because the number will probaly lose its precision.
 * @param value
 * @returns
 */
function getDecimalFromString(value: string) {
  let a: string;
  let b = 0;

  const [integerPart, fractionalPart] = value.split('.');

  if (fractionalPart) {
    a = integerPart + fractionalPart;
    b = fractionalPart.length;
  } else {
    a = integerPart;
  }

  return { a: BigInt(a), b: b };
}

export function getUTCDateFromString(value: string) {
  return new Date(`${value} UTC`).getTime();
}

const fraction = /(-?\d+)(?:[.,](\d{1,9}))?/;
const durationDate = /(?:(-?\d+)Y)?(?:(-?\d+)M)?(?:(-?\d+)W)?(?:(-?\d+)D)?/;
const durationTime = new RegExp(
  `(?:${fraction.source}H)?(?:${fraction.source}M)?(?:${fraction.source}S)?`,
);
const duration = new RegExp(
  `^([+\u2212-])?P${durationDate.source}(?:T(?!$)${durationTime.source})?$`,
  'i',
);
/**
 * Get Interval value from Interval string, which is used in data-format
 * @param value
 * @returns
 */
function getIntervalValue(value: string) {
  const match = duration.exec(value);

  if (!match) {
    return null;
  }
  const years = parseInt(match[2] ?? '0');
  const months = parseInt(match[3] ?? '0');
  // const weeks = parseInt(match[4] ?? '0');
  const days = parseInt(match[5] ?? '0');
  const hours = parseFloat((match[6] ?? '0') + '.' + (match[7] ?? '0'));
  const minutes = parseFloat((match[8] ?? '0') + '.' + (match[9] ?? '0'));
  const seconds = parseFloat((match[10] ?? '0') + '.' + (match[11] ?? '0'));

  // console.log('debug here ==== ', `P${years}Y${months}M${weeks}W${days}DT${hours}H${minutes}M${seconds}S`);
  return dateTimeToMs(years, months, days, hours, minutes, seconds);
}

function duckdbVariantTypeToGridType(type: string) {
  switch (type) {
    case 'BOOL': {
      return BOOLEAN;
    }
    case 'INT':
    case 'INT64': {
      return INT;
    }
    case 'FLOAT':
    case 'FLOAT64': {
      return FLOAT;
    }
    case 'NUMERIC': {
      return DECIMAL;
    }
    case 'STRING': {
      return STRING;
    }
    case 'BYTES': {
      return BYTES;
    }
    case 'DATE': {
      return DATE;
    }
    case 'TIME': {
      return TIME;
    }
    case 'DATETIME': {
      return DATETIME;
    }
    case 'TIMESTAMP': {
      return TIMESTAMP;
    }
    case 'INTERVAL': {
      return INTERVAL;
    }
    case 'NULL': {
      return NULL;
    }
    case 'JSON': {
      return JSON_TYPE;
    }
    case 'STRUCT': {
      return STRUCT;
    }
    default: {
      if (type?.endsWith?.('[]')) {
        return duckdbVariantTypeToGridType(type.slice(0, -2)) + '[]';
      }
      return VARIANT;
    }
  }
}

/**
 * Convert Uint32Array (apache arrow) to BigInt
 * It is use for decimal value decoding
 * @param bn
 * @returns
 */
export function bignumToNumber(bn: any) {
  const { buffer, byteOffset, length, signed } = bn;
  const words = new BigUint64Array(buffer, byteOffset, length / 2);
  const negative =
    signed && words[words.length - 1] & (BigInt(1) << BigInt(63));
  let number = negative ? BigInt(1) : BigInt(0);
  let i = BigInt(0);
  if (!negative) {
    for (const word of words) {
      number += word * (BigInt(1) << (BigInt(64) * i++));
    }
  } else {
    const resultLow = BigInt.asUintN(64, ~words[0] + BigInt(1));
    let resultHigh = ~words[1];
    if (!resultLow) {
      resultHigh = resultHigh + BigInt(1);
    }
    number =
      BigInt.asUintN(128, resultHigh * (BigInt(1) << BigInt(64))) + resultLow;
    number *= BigInt(-1);
  }
  return number;
}
