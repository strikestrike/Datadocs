export function getDataTypeIcon(type: string, grayscale = false) {
  // console.log('debug here ======== getDataTypeIcon ===== ', type);
  return getIcon(type) + (grayscale ? "-grayscale" : "");
}

function getIcon(type: string) {
  switch (type) {
    case "array[]":
      return "data-type-array-array";
    case "bytes":
      return "data-type-binary";
    case "bytes[]":
      return "data-type-binary-array";
    case "boolean":
      return "data-type-boolean";
    case "boolean[]":
      return "data-type-boolean-array";
    case "date":
      return "data-type-date";
    case "date[]":
      return "data-type-date-array";
    case "datetime":
      return "data-type-datetime";
    case "datetime[]":
      return "data-type-datetime-array";
    case "decimal":
      return "data-type-decimal";
    case "decimal[]":
      return "data-type-decimal-array";
    case "float":
      return "data-type-float";
    case "float[]":
      return "data-type-float-array";
    case "geography":
      return "data-type-geography";
    case "geography[]":
      return "data-type-geography-array";
    case "int":
    case "number":
      return "data-type-integer";
    case "int[]":
    case "number[]":
      return "data-type-integer-array";
    case "interval":
      return "data-type-interval";
    case "interval[]":
      return "data-type-interval-array";
    case "json":
      return "data-type-json";
    case "json[]":
      return "data-type-json-array";
    case "string":
      return "data-type-string";
    case "string[]":
      return "data-type-string-array";
    case "struct":
      return "data-type-struct";
    case "struct[]":
      return "data-type-struct-array";
    case "time":
      return "data-type-time";
    case "time[]":
      return "data-type-time-array";
    case "timestamp":
      return "data-type-timestamp";
    case "timestamp[]":
      return "data-type-timestamp-array";
    case "variant":
      return "data-type-variant";
    case "variant[]":
      return "data-type-variant-array";
    default: {
      if (type.endsWith("[][]")) {
        return "data-type-array-array";
      }
    }
  }

  return "data-type-variant";
}
