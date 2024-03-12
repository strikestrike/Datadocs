import { DataType as GridDataType } from '@datadocs/canvas-datagrid-ng/lib/types/column-types';
import type {
  ColumnType,
  Field as GridField,
} from '@datadocs/canvas-datagrid-ng/lib/types/column-types';
import { DateUnit, TimeUnit, IntervalUnit, Precision } from 'apache-arrow/enum';

const defaultDecimalPrecision = 38;
const defaultDecimalScale = 0;
const defaultDecimalBitWidth = 128;

/**
 * Convert DuckDB data type name (E.g., "VARHCAR") to grid type descriptor
 * @see https://duckdb.org/docs/sql/data_types/overview.html
 * @see getGridTypeFromArrowType
 * @param duckdbType
 * @returns
 */
export function getGridTypeFromDatabaseType(dbType: string): ColumnType {
  switch (dbType) {
    case 'NULL': {
      return {
        typeId: GridDataType.Null,
      };
    }
    case 'BOOLEAN': {
      return 'boolean';
    }
    case 'VARCHAR': {
      return 'string';
    }
    case 'DATE': {
      return {
        typeId: GridDataType.Date,
        unit: DateUnit.DAY,
      };
    }
    case 'TIMESTAMP': {
      return {
        typeId: GridDataType.DateTime,
        unit: TimeUnit.MICROSECOND,
      };
    }
    case 'TIMESTAMP WITH TIME ZONE': {
      return {
        typeId: GridDataType.Timestamp,
        unit: TimeUnit.MICROSECOND,
      };
    }
    case 'TINYINT':
    case 'SMALLINT':
    case 'UTINYINT':
    case 'USMALLINT':
    case 'UINTEGER':
    case 'UBIGINT':
    case 'BIGINT':
    case 'INTEGER': {
      return 'int';
    }
    case 'FLOAT': {
      return {
        typeId: GridDataType.Float,
        precision: Precision.SINGLE,
      };
    }
    case 'DOUBLE': {
      return {
        typeId: GridDataType.Float,
        precision: Precision.DOUBLE,
      };
    }
    case 'HUGEINT': {
      return {
        typeId: GridDataType.Decimal,
        precision: defaultDecimalPrecision,
        scale: defaultDecimalScale,
        bitWidth: defaultDecimalBitWidth,
      };
    }
    case 'TIME': {
      return {
        typeId: GridDataType.Time,
        unit: TimeUnit.NANOSECOND,
      };
    }
    case 'INTERVAL': {
      return {
        typeId: GridDataType.Interval,
        unit: IntervalUnit.DAY_TIME,
      };
    }
    case 'BLOB': {
      return {
        typeId: GridDataType.Bytes,
      };
    }
    case 'JSON': {
      return {
        typeId: 18,
      };
    }
    case 'VARIANT': {
      return {
        typeId: 19,
      };
    }
    case 'GEOGRAPHY': {
      return {
        typeId: 20,
      };
    }
    default: {
      if (dbType.length > 2 && dbType.substring(dbType.length - 2) === '[]') {
        return {
          typeId: GridDataType.List,
          child: {
            name: 'f',
            type: getGridTypeFromDatabaseType(
              dbType.substring(0, dbType.length - 2),
            ),
          },
        };
      } else if (dbType.startsWith('DECIMAL')) {
        const numbers = dbType.match(/\d+/g);
        if (numbers.length === 2) {
          return {
            typeId: GridDataType.Decimal,
            precision: parseInt(numbers[0]),
            scale: parseInt(numbers[1]),
            bitWidth: defaultDecimalBitWidth,
          };
        }
      } else if (dbType.startsWith('STRUCT')) {
        const structs = parserParametersInString(dbType, 7);
        const childrenTypes: GridField[] = [];
        for (const struct of structs) {
          childrenTypes.push(parseStringToDataField(struct));
        }
        return {
          typeId: GridDataType.Struct,
          children: childrenTypes,
        };
      } else if (dbType.startsWith('MAP')) {
        const maps = parserParametersInString(dbType, 4);
        if (maps.length === 2) {
          return {
            typeId: GridDataType.Map,
            children: [
              {
                name: 'key',
                type: getGridTypeFromDatabaseType(maps[0]),
              },
              {
                name: 'value',
                type: getGridTypeFromDatabaseType(maps[1]),
              },
            ],
          };
        }
      }
      return 'string';
    }
  }
}

/**
 * Function to parsing parameters in string
 * @param text
 * @param start
 * @returns
 */
export function parserParametersInString(
  text: string,
  start: number,
): string[] {
  start = !start ? 0 : start;
  var subGroups = 0;
  var parameters = [];
  var param = '';
  for (var i = start, len = text.length; i < len; i++) {
    var letter = text[i];
    if (letter === '(') {
      param += letter;
      subGroups++;
      continue;
    }
    if (letter === ')' && subGroups != 0) {
      param += letter;
      subGroups--;
      continue;
    }
    if (letter === ')' && subGroups == 0) {
      parameters.push(param);
      break;
    }

    if (letter === ',' && subGroups == 0) {
      parameters.push(param);
      param = '';
      continue;
    }

    if (letter == ' ' && param.length === 0) {
      continue;
    }
    param += letter;
  }

  return parameters;
}

/**
 * Parsing string to data field
 * @param str
 * @returns
 */
export function parseStringToDataField(str: string): GridField {
  var subGroups = 0;
  var startIndex = 0;
  for (var i = str.length - 1; i >= 0; i--) {
    var letter = str[i];
    if (letter === ')') {
      subGroups++;
      continue;
    }
    if (letter === '(' && subGroups != 0) {
      subGroups--;
      continue;
    }

    if (letter == ' ' && subGroups === 0) {
      startIndex = i;
      break;
    }
  }

  let name = str.substring(0, startIndex);
  try {
    const updatedName = JSON.parse(name);
    if (typeof updatedName === 'string') {
      name = updatedName;
    }
  } catch (error) {
    // Do nothing
  }
  const type = getGridTypeFromDatabaseType(str.substring(startIndex + 1));

  return {
    name: name,
    displayname: name,
    type: type,
  };
}
