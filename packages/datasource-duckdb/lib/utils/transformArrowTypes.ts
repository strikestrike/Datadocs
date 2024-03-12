import { Type } from 'apache-arrow/enum';
import type {
  Time,
  Timestamp,
  Date_,
  Struct,
  Interval,
  Decimal,
  List,
  Float,
  Map_,
  DataType as ArrowDataType,
} from 'apache-arrow/type';
import type {
  ColumnType,
  Struct as GridStruct,
  Field as GridField,
} from '@datadocs/canvas-datagrid-ng/lib/types/column-types';
import { DataType as GridDataType } from '@datadocs/canvas-datagrid-ng/lib/types/column-types';

/**
 * Convert DuckDB (apache-arrow) Data Type to Grid Column Type
 */
export function getGridTypeFromArrowType(type: ArrowDataType): ColumnType {
  switch (type.typeId) {
    case Type.Int: {
      return 'int';
    }
    case Type.Float: {
      return {
        typeId: GridDataType.Float,
        precision: (type as Float).precision,
      };
    }
    case Type.Binary: {
      return 'bytes';
    }
    case Type.Uint8: {
      return 'string';
    }
    case Type.Bool: {
      return 'boolean';
    }
    case Type.Decimal: {
      return {
        typeId: GridDataType.Decimal,
        precision: (type as Decimal).precision,
        scale: (type as Decimal).scale,
        bitWidth: (type as Decimal).bitWidth,
      };
    }
    case Type.Date: {
      return {
        typeId: GridDataType.Date,
        unit: (type as Date_).unit,
      };
    }
    case Type.Time: {
      return {
        typeId: GridDataType.Time,
        unit: (type as Time).unit,
      };
    }
    case Type.Timestamp: {
      return {
        typeId: GridDataType.DateTime,
        unit: (type as Timestamp).unit,
      };
    }
    case Type.Interval: {
      return {
        typeId: GridDataType.Interval,
        unit: (type as Interval).unit,
      };
    }
    case Type.List: {
      const gridType: ColumnType = {
        typeId: GridDataType.List,
        child: null,
      };

      const f = (type as List).valueField;
      gridType.child = {
        name: f.name,
        type: getGridTypeFromArrowType(f.type),
      };
      return gridType;
    }
    case Type.Struct: {
      const gridType: ColumnType = {
        typeId: GridDataType.Struct,
        children: [],
      };

      (type as Struct).children.forEach((f) => {
        (gridType as GridStruct).children.push({
          name: f.name,
          type: getGridTypeFromArrowType(f.type),
        });
      });
      return gridType;
    }
    case Type.Map: {
      const gridType: ColumnType = {
        typeId: GridDataType.Map,
        children: [],
      };

      const maps: GridField[] = [];

      (type as Map_).children.forEach((f) => {
        maps.push({
          name: f.name,
          type: getGridTypeFromArrowType(f.type),
        });
      });

      gridType.children = (maps[0].type as GridStruct).children;

      return gridType;
    }

    default: {
      return 'string';
    }
  }
}

/**
 * @debug DEBUG ONLY
 */
export function guessDBTypeFromArrowType(colType: ArrowDataType): string {
  const valType = typeof colType;
  if (valType === 'object' && (colType as any).typeId) {
    switch ((colType as any).typeId) {
      case Type.Null: {
        return 'NULL';
      }
      case Type.Float: {
        return 'FLOAT';
      }

      case Type.Binary: {
        return 'BLOB';
      }

      case Type.Decimal: {
        return `DECIMAL(${(colType as Decimal).precision},${
          (colType as Decimal).scale
        })`;
      }

      case Type.Date: {
        return `DATE`;
      }

      case Type.Time: {
        return `TIME`;
      }

      case Type.Timestamp: {
        return `TIMESTAMP`;
      }

      case Type.Interval: {
        return `INTERVAL`;
      }

      // case Type.List: {
      //   return `${guessDBTypeFromArrowType((colType as List).child.type)}[]`;
      // }

      // case Type.Struct: {
      //   return `STRUCT(${(colType as Struct).children
      //     .map((f) => `${f.name} ${columnTypeToFullString(f.type)}`)
      //     .join(`, `)})`;
      // }

      // case Type.Map: {
      //   return `MAP(${(colType as Map_).children
      //     .map((f) => `${columnTypeToFullString(f.type)}`)
      //     .join(`, `)})`;
      // }

      // case Type.JSON: {
      //   return `JSON`;
      // }

      // case Type.Variant: {
      //   return `VARIANT`;
      // }

      // case Type.Geography: {
      //   return 'GEOGRAPHY';
      // }
    }
  }
  return 'TEXT';
}
