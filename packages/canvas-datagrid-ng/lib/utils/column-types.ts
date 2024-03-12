import type {
  ColumnType,
  Decimal,
  List,
  Map_,
  Struct,
} from '../types/column-types';
import { DataType } from '../types/column-types';

/**
 * get short string of column type
 * @todo move to the outside of `types` directory
 * @param colType
 * @returns
 */
export const columnTypeToString = (colType: ColumnType): string => {
  const valType = typeof colType;
  if (valType === 'object' && (colType as any).typeId) {
    switch ((colType as any).typeId) {
      case DataType.Null: {
        return 'null';
      }

      case DataType.Float: {
        return 'float';
      }

      case DataType.Bytes: {
        return 'bytes';
      }

      case DataType.Decimal: {
        return 'decimal';
      }

      case DataType.Date: {
        return 'date';
      }

      case DataType.Time: {
        return 'time';
      }

      case DataType.DateTime: {
        return 'datetime';
      }

      case DataType.Timestamp: {
        return 'timestamp';
      }

      case DataType.Interval: {
        return 'interval';
      }

      case DataType.List: {
        return 'array';
      }

      case DataType.Struct: {
        return 'struct';
      }

      case DataType.Map: {
        return 'map';
      }

      case DataType.Json: {
        return 'json';
      }

      case DataType.Variant: {
        return 'variant';
      }

      case DataType.Geography: {
        return 'geography';
      }

      default:
        String(valType);
    }
  }

  return String(colType);
};

/**
 * Get full string of column type
 * @param colType
 * @returns
 */
export const columnTypeToFullString = (colType: ColumnType): string => {
  const valType = typeof colType;
  if (valType === 'object' && (colType as any).typeId) {
    switch ((colType as any).typeId) {
      case DataType.Null: {
        return 'NULL';
      }

      case DataType.Float: {
        return 'FLOAT';
      }

      case DataType.Bytes: {
        return 'BYTES';
      }

      case DataType.Decimal: {
        return `DECIMAL(${(colType as Decimal).precision},${
          (colType as Decimal).scale
        })`;
      }

      case DataType.Date: {
        return `DATE`;
      }

      case DataType.Time: {
        return `TIME`;
      }

      case DataType.DateTime: {
        return `DATETIME`;
      }

      case DataType.Timestamp: {
        return `TIMESTAMP`;
      }

      case DataType.Interval: {
        return `INTERVAL`;
      }

      case DataType.List: {
        return `${columnTypeToFullString((colType as List).child.type)}[]`;
      }

      case DataType.Struct: {
        return `STRUCT(${(colType as Struct).children
          .map((f) => `${f.name} ${columnTypeToFullString(f.type)}`)
          .join(`, `)})`;
      }

      case DataType.Map: {
        return `MAP(${(colType as Map_).children
          .map((f) => `${columnTypeToFullString(f.type)}`)
          .join(`, `)})`;
      }

      case DataType.Json: {
        return `JSON`;
      }

      case DataType.Variant: {
        return `VARIANT`;
      }

      case DataType.Geography: {
        return 'GEOGRAPHY';
      }

      default:
        String(valType).toUpperCase();
    }
  }

  return String(colType).toUpperCase();
};

/**
 * Convert column type to short form but only count first level.
 * Some examples:
 * - decimal[]
 * - [][]
 * @param colType
 */
export function columnTypeToShortFormString(colType: ColumnType): string {
  let type: string;
  if (typeof colType !== 'string' && colType.typeId === DataType.List) {
    const childType = columnTypeToString((colType as List).child.type);
    type = childType + '[]';
  } else {
    type = columnTypeToString(colType);
  }
  return type;
}

/**
 * Convert column type to full string and take all child type into account.
 * Some examples:
 * - boolean[]
 * - int[][][][]
 * - struct[][]
 * @param colType
 * @returns
 */
export function columnTypeToLongFormString(colType: ColumnType): string {
  let type: string;
  if (typeof colType !== 'string' && colType.typeId === DataType.List) {
    const childType = columnTypeToLongFormString((colType as List).child.type);
    type = childType + '[]';
  } else {
    type = columnTypeToString(colType);
  }
  return type;
}

/**
 * Get base type of a type. If type is an array, it base type should be
 * type of its child. For example:
 * - Base type of `int[]` is `int`
 * - Base type of `boolean[][]` is boolean[]
 *
 * @param type Type of cell
 * @returns Base type
 */
export function getBaseType(type: string): string {
  if (type?.endsWith('[]')) {
    type = type.slice(0, -2);
  }

  return type;
}

/**
 * Transform type with int|float|decimal to number,
 * @param type
 * @returns
 */
export function transformNumberType(type: string) {
  return type
    .replace(/decimal/g, 'number')
    .replace(/float/g, 'number')
    .replace(/int(?!erval)/g, 'number');
}

/**
 * Grid type names that will be used in cell value for defining
 * its type.
 */
export const GridTypeName = {
  BOOLEAN: 'boolean',
  STRING: 'string',
  INT: 'int',
  FLOAT: 'float',
  DECIMAL: 'decimal',

  DATE: 'date',
  TIME: 'time',
  DATETIME: 'datetime',
  TIMESTAMP: 'timestamp',
  INTERVAL: 'interval',

  BYTES: 'bytes',
  JSON: 'json',
  GEOGRAPHY: 'geography',
  VARIANT: 'variant',
  STRUCT: 'struct',
  UNDEFINED: 'undefined',
  NULL: 'null',
};
