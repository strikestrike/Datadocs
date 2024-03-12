import { parseExpression } from "@datadocs/ddc";
import type { ParserCellData } from "@datadocs/canvas-datagrid-ng";
import type { ArraySchema, StructSchema, Typed } from "@datadocs/common";
import { Type, typeOf } from "@datadocs/common";
import { type ExpressionNode, ValueNode } from "@datadocs/ast";
import { decodeVariant } from "@datadocs/ddt/Types/Variant";
import { GridTypeName } from "@datadocs/canvas-datagrid-ng/lib/utils/column-types";

export function getParserResult(
  expression: string,
  config: Parameters<typeof parseExpression>[1] = {}
) {
  return parseExpression(expression, {
    mode: "lax",
    comparisonAlwaysReturnsBool: true,
    closeUnfinishedTokens: true,
    ...config,
  });
}

export function convertParserResultToGridData(
  expression: ExpressionNode
): ParserCellData {
  const { metadata, typed } = expression;
  const value = expression instanceof ValueNode ? expression.value : null;

  return transformToGridData(value, typed, true);
}

export function transformToGridData(
  value: any,
  typed: Typed,
  isRoot = false
): ParserCellData {
  const typeName = typeOf(typed);
  const gridTypeName = parserToGridTypeName(typeName);

  if (value === null) {
    return { value: null, dataType: gridTypeName };
  }

  switch (typed.type) {
    case Type.BOOL: {
      return { value, dataType: gridTypeName };
    }
    case Type.INT: {
      // JS integer is only safe if inside the range (-9007199254740991, 9007199254740991)
      // The ddc int is bigger than that, so treat it as a decimal for accuracy
      return {
        value: { a: value.value, b: 0 },
        dataType: gridTypeName,
      };
    }
    case Type.FLOAT: {
      return { value, dataType: gridTypeName };
    }
    case Type.BYTES: {
      return {
        value: new Uint8Array(value as ArrayBuffer),
        dataType: gridTypeName,
      };
    }
    case Type.STRING:
    case Type.DATE:
    case Type.TIME:
    case Type.DATETIME:
    case Type.TIMESTAMP:
    case Type.INTERVAL:
    case Type.JSON: {
      return { value, dataType: gridTypeName };
    }
    case Type.DECIMAL: {
      // Move sign to a, same as ddc INT and database DECIMAL
      const isNegative = value.b < 0;
      let a = value.a.value;
      if (isNegative) a = -a;
      return {
        value: { a, b: Math.abs(value.b) },
        dataType: gridTypeName,
      };
    }
    case Type.GEO: {
      return {
        value: value.toWkb(),
        dataType: gridTypeName,
      };
    }
    case Type.VARIANT: {
      const decode = decodeVariant(value);
      return transformToGridData(decode.value, decode);
    }
    case Type.ARRAY: {
      const result = [];
      for (let i = 0; i < value.length; i++) {
        const child = transformToGridData(
          value[i],
          (typed.schema as ArraySchema).type
        );
        result.push(child);
      }
      return { value: result, dataType: gridTypeName };
    }
    case Type.STRUCT: {
      const result = {};
      const schema = (typed?.schema as StructSchema).fields || {};
      for (const key in schema) {
        if (Object.prototype.hasOwnProperty.call(schema, key)) {
          const childSchema = schema[key];
          const childValue = value[key];
          result[key] = transformToGridData(childValue, childSchema);
        }
      }
      return { value: result, dataType: gridTypeName };
    }
    case Type._NULL: {
      return { value: null, dataType: gridTypeName };
    }
    case Type._UNDEFINED: {
      return { value, dataType: gridTypeName };
    }
    default: {
      return null;
    }
  }
}

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
  INTERVAL,
  BYTES,
  JSON: JSON_TYPE,
  GEOGRAPHY,
  STRUCT,
  VARIANT,
  NULL,
  UNDEFINED,
} = GridTypeName;

function parserToGridTypeName(typeName: string): string {
  switch (typeName) {
    case "BOOL":
      return BOOLEAN;
    case "INTEGER":
    case "UINTEGER":
      return INT;
    case "FLOAT32":
    case "FLOAT":
      return FLOAT;
    case "STRING":
      return STRING;
    case "BYTES":
      return BYTES;
    case "DATE":
      return DATE;
    case "TIME":
      return TIME;
    case "DATETIME":
      return DATETIME;
    case "INTERVAL":
      return INTERVAL;
    case "JSON":
      return JSON_TYPE;
    case "GEOGRAPHY":
      return GEOGRAPHY;
    case "NULL":
      return NULL;
    case "VARIANT":
      return VARIANT;
    case "UNDEFINED":
      return UNDEFINED;
    default: {
      if (typeName.endsWith("[]")) {
        return (
          parserToGridTypeName(typeName.substring(0, typeName.length - 2)) +
          "[]"
        );
      } else if (typeName.startsWith("INT") || typeName.startsWith("UINT")) {
        return INT;
      } else if (typeName.startsWith("STRING")) {
        return STRING;
      } else if (typeName.startsWith("DECIMAL")) {
        return DECIMAL;
      } else if (typeName.startsWith("STRUCT")) {
        return STRUCT;
      } else if (typeName.startsWith("TIMESTAMP")) {
        return TIMESTAMP;
      }
      return UNDEFINED;
    }
  }
}
