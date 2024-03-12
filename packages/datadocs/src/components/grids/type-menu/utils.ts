export function convertDataTypeToDisplayName(dataType: string) {
  return dataType
    .replace(/bytes/g, "Bytes")
    .replace(/boolean/g, "Boolean")
    .replace(/date(?!time)/g, "Date")
    .replace(/datetime/g, "Datetime")
    .replace(/decimal/g, "Decimal")
    .replace(/float/g, "Float")
    .replace(/geography/g, "Geography")
    // need to look ahead to see if it is interval or int
    .replace(/int(?!erval)/g, "Integer")
    .replace(/interval/g, "Interval")
    .replace(/json/g, "JSON")
    .replace(/string/g, "String")
    .replace(/struct/g, "Struct")
    .replace(/time(?!stamp)/g, "Time")
    .replace(/timestamp/g, "Timestamp")
    .replace(/variant/g, "Variant");
}
