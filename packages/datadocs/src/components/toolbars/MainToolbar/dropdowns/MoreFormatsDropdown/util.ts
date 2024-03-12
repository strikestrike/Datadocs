// import { type Writable, writable, get } from "svelte/store";
import type {
  CellAccountingFormatResult,
  CellBooleanFormat,
  CellBytesFormat,
  CellDataFormat,
  CellDateTypeFormat,
  CellDatetimeTypeFormat,
  CellGeographyFormat,
  CellIntervalFormat,
  CellJSONFormat,
  CellNumberFormat,
  CellStringFormat,
  CellStructFormat,
  CellTimeTypeFormat,
  CellTimestampTypeFormat,
} from "@datadocs/canvas-datagrid-ng";
import {
  booleanFormatter,
  dateTimeFormatter,
  geographyFormatter,
  intervalFormatter,
  isHyperlinkDataFormat,
  jsonFormatter,
  numberFormatter,
  stringFormatter,
} from "@datadocs/canvas-datagrid-ng/lib/data/formatters/index";
import { getCurrentLocale } from "../../../../../app/store/store-toolbar";
import { Geometry } from "wkx";
import { getGrid } from "../../../../../app/store/grid/base";

export const FIRST_SELECTED_STRING_DATA = "context::firstStringData";

export function areFormatsEqual(a: CellDataFormat, b: CellDataFormat) {
  const keys = [...Object.keys(a), ...Object.keys(b)];

  for (const key of keys) {
    // Allow two object have different keys and ignore if their
    // value is null/undefined
    if (a[key] != b[key]) return false;
  }
  return true;
}

export function checkActiveFormat(a: CellDataFormat, b: CellDataFormat) {
  if (isHyperlinkDataFormat(a)) {
    return a?.type === b?.type && a?.format === b?.format;
  }

  return areFormatsEqual(a, b);
}

export function getBooleanFormatList(): CellBooleanFormat[] {
  return [
    { type: "boolean", format: "true|false" },
    { type: "boolean", format: "True|False" },
    { type: "boolean", format: "TRUE|FALSE" },
    { type: "boolean", format: "yes|no" },
    { type: "boolean", format: "Yes|No" },
    { type: "boolean", format: "YES|NO" },
    { type: "boolean", format: "1|0" },
  ];
}

export function getBytesFormatList(): CellBytesFormat[] {
  return [
    { type: "bytes", format: "utf8" },
    { type: "bytes", format: "base64" },
    { type: "bytes", format: "hex" },
  ];
}

export function getDateFormatList(): CellDateTypeFormat[] {
  const formats: string[] = [
    "M/d/yyyy", // 1/1/2023
    "M/d/yy", // 1/1/23
    "MMMM d, yyyy", // January 1, 2023
    "MMM d, yyyy", // Jan 1, 2023
    "ddd, MMM d, yyyy", // Wed, Jan 1, 2023
    "dddd, MMMM d, yyyy", // Wednesday, January 1, 2023
    "yyyy-MM-dd", // 2023-01-01
  ];
  return formats.map((format) => ({ type: "date", format }));
}

export function getDatetimeFormatList(): CellDatetimeTypeFormat[] {
  const formats: string[] = [
    "M/d/yyyy hh:mm:ss AM/PM",
    "M/d/yy hh:mm AM/PM",
    "M/d/yy HH:mm:ss",
    "M/d/yy HH:mm",
    "MMMM d, yyyy hh:mm AM/PM",
    "MMMM d, yyyy HH:mm",
    "MMM d, yyyy hh:mm AM/PM",
    "MMM d, yyyy HH:mm",
    "yyyy-MM-dd hh:mm:ss AM/PM",
    "yyyy-MM-dd HH:mm:ss",
  ];
  return formats.map((format) => ({ type: "datetime", format }));
}

export function getGeographyFormatList(): CellGeographyFormat[] {
  return [
    { type: "geography", format: "WKT" },
    { type: "geography", format: "JSON" },
    { type: "geography", format: "DMS" },
    { type: "geography", format: "DD" },
  ];
}

export function getIntervalFormatList(): CellIntervalFormat[] {
  return [
    {
      type: "interval",
      format: "ISO_FULL",
    },
    {
      type: "interval",
      format: "BIG_QUERY_LIKE",
    },
    {
      type: "interval",
      format: "INTERVAL_DATETIME",
    },
    {
      type: "interval",
      format: "NORMAL_DATETIME",
    },
    {
      type: "interval",
      format: "ISO_WEEK",
    },
    {
      type: "interval",
      format: "HUMANRIZE",
      style: "long",
      separator: true,
      conjunction: true,
    },
    {
      type: "interval",
      format: "HUMANRIZE",
      style: "short",
      separator: true,
      conjunction: false,
    },
    {
      type: "interval",
      format: "HUMANRIZE",
      style: "narrow",
      separator: false,
      conjunction: false,
    },
  ];
}

export function getJSONFormatList(): CellJSONFormat[] {
  return [
    { type: "json", format: "short" },
    { type: "json", format: "long" },
  ];
}

export function getNumberFormatList(): CellNumberFormat[] {
  return [
    { type: "number", format: "default" },
    { type: "number", format: "percent", decimalPlaces: 2 },
    { type: "number", format: "scientific", decimalPlaces: 2 },
    { type: "number", format: "currency", decimalPlaces: 2, currency: "usd" },
    { type: "number", format: "accounting", decimalPlaces: 2, currency: "usd" },
  ];
}

export function getStringFormatList(): CellStringFormat[] {
  return [
    { type: "string", format: "WithoutQuote" },
    { type: "string", format: "DoubleQuote" },
    { type: "string", format: "SingleQuote" },
    { type: "string", format: "Hyperlink" },
  ];
}

export type StructFormatOption = {
  value: CellStructFormat["format"];
  label: string;
};
export function getStructFormatOptions(): StructFormatOption[] {
  return [
    { value: "raw", label: "Raw" },
    { value: "chip", label: "Chip" },
  ];
}

export function getTimeFormatList(): CellTimeTypeFormat[] {
  const formats = [
    "h:mm:ss AM/PM",
    "h:mm AM/PM",
    "h:mm:ss am/pm",
    "h:mm:ss A/P",
    "h:mm:ss a/p",
    "hh:mm:ss AM/PM",
    "HH:mm:ss",
  ];
  return formats.map((format) => ({ type: "time", format }));
}

export function getTimestampFormatList(): CellTimestampTypeFormat[] {
  return [
    {
      type: "timestamp",
      format: "M/d/yyyy hh:mm:ss AM/PM UTCZZ",
    },
    {
      type: "timestamp",
      format: "M/d/yyyy hh:mm:ss AM/PM ZZ",
      timeZoneOffset: 510,
    },
    {
      type: "timestamp",
      format: "M/d/yyyy HH:mm:ss ZZZZZ",
      timeZone: "America/Los_Angeles",
    },
    {
      type: "timestamp",
      format: "M/d/yyyy hh:mm:ss AM/PM UTCZZZ",
      timeZoneOffset: 300,
    },
    {
      type: "timestamp",
      format: "M/d/yyyy hh:mm:ss AM/PM UTCZ",
      timeZoneOffset: -420,
    },
    {
      type: "timestamp",
      format: "M/d/yyyy hh:mm AM/PM",
      timeZoneOffset: 0,
    },
    //
    {
      type: "timestamp",
      format: "MMMM d, yyyy hh:mm:ss AM/PM ZZ",
      timeZoneOffset: 510,
    },
    {
      type: "timestamp",
      format: "MMMM d, yyyy HH:mm:ss ZZZZZ",
      timeZone: "America/Los_Angeles",
    },
    {
      type: "timestamp",
      format: "MMMM d, yyyy hh:mm:ss AM/PM UTCZZZ",
      timeZoneOffset: 300,
    },
    {
      type: "timestamp",
      format: "MMMM d, yyyy hh:mm:ss AM/PM UTCZ",
      timeZoneOffset: -420,
    },
    {
      type: "timestamp",
      format: "MMMM d, yyyy hh:mm AM/PM",
      timeZoneOffset: 0,
    },
    //
    {
      type: "timestamp",
      format: "MMM d, yyyy hh:mm:ss AM/PM ZZ",
      timeZoneOffset: 510,
    },
    {
      type: "timestamp",
      format: "MMM d, yyyy HH:mm:ss ZZZZZ",
      timeZone: "America/Los_Angeles",
    },
    {
      type: "timestamp",
      format: "MMM d, yyyy hh:mm:ss AM/PM UTCZZZ",
      timeZoneOffset: 300,
    },
    {
      type: "timestamp",
      format: "MMM d, yyyy hh:mm:ss AM/PM UTCZ",
      timeZoneOffset: -420,
    },
    {
      type: "timestamp",
      format: "MMM d, yyyy hh:mm AM/PM",
      timeZoneOffset: 0,
    },
    //
    {
      type: "timestamp",
      format: "yyyy-MM-dd hh:mm:ss AM/PM ZZ",
      timeZoneOffset: 510,
    },
    {
      type: "timestamp",
      format: "yyyy-MM-dd HH:mm:ss ZZZZZ",
      timeZone: "America/Los_Angeles",
    },
    {
      type: "timestamp",
      format: "yyyy-MM-dd hh:mm:ss AM/PM UTCZZZ",
      timeZoneOffset: 300,
    },
    {
      type: "timestamp",
      format: "yyyy-MM-dd hh:mm:ss AM/PM UTCZ",
      timeZoneOffset: -420,
    },
    {
      type: "timestamp",
      format: "yyyy-MM-dd hh:mm AM/PM",
      timeZoneOffset: 0,
    },
  ];
}

export function getDataTypeFormatList(dataType: string): CellDataFormat[] {
  switch (dataType) {
    case "boolean": {
      return getBooleanFormatList();
    }
    case "string": {
      return getStringFormatList();
    }
    case "bytes": {
      return getBytesFormatList();
    }
    case "number": {
      return getNumberFormatList();
    }
    case "date": {
      return getDateFormatList();
    }
    case "time": {
      return getTimeFormatList();
    }
    case "datetime": {
      return getDatetimeFormatList();
    }
    case "timestamp": {
      return getTimestampFormatList();
    }
    case "interval": {
      return getIntervalFormatList();
    }
    case "geography": {
      return getGeographyFormatList();
    }
    case "json": {
      return getJSONFormatList();
    }
    // don't handle struct here, because it's different from other menus and
    // need to be done separately
    case "struct":
    default: {
      return [];
    }
  }
}

export function isValidMenuType(dataType: string) {
  const menuTypeList = [
    "boolean",
    "string",
    "bytes",
    "number",
    "int",
    "float",
    "decimal",
    "date",
    "time",
    "datetime",
    "timestamp",
    "interval",
    "geography",
    "json",
    "struct",
  ];
  return menuTypeList.includes(dataType);
}

export type TypeDisplayData = {
  displayValue: string;
  hint: string;
};

function addDefaultText(value) {
  return value + " (Default)";
}

function getDisplayDataForBoolean(
  format: CellBooleanFormat,
  isDefault: boolean
): TypeDisplayData {
  let displayValue = "";
  const falseText = booleanFormatter(false, format);
  const trueText = booleanFormatter(true, format);
  const separator = `<span class="text-[12px] text-dark-300 opacity-20 font-normal">&nbsp;/&nbsp</span>`;
  displayValue = trueText + separator + falseText;
  if (isDefault) {
    displayValue = addDefaultText(displayValue);
  }
  return { displayValue, hint: "" };
}

function getDisplayDataForBytes(
  format: CellBytesFormat,
  isDefault: boolean
): TypeDisplayData {
  let displayValue = "";
  switch (format.format) {
    case "utf8": {
      displayValue = "Utf8";
      break;
    }
    case "base64": {
      displayValue = "Base64";
      break;
    }
    case "hex": {
      displayValue = "Hex";
      break;
    }
    default: {
      displayValue = "";
    }
  }

  if (isDefault) {
    displayValue = addDefaultText(displayValue);
  }
  return { displayValue, hint: "" };
}

function getDisplayDataForDate(
  format: CellDateTypeFormat,
  isDefault: boolean
): TypeDisplayData {
  const date = new Date(Date.UTC(2023, 0, 1));
  let displayValue: string = dateTimeFormatter(
    date,
    format,
    getCurrentLocale().locale
  );
  if (isDefault) {
    displayValue = addDefaultText(displayValue);
  }
  return { displayValue, hint: "" };
}

function getDisplayDataForDatetime(
  format: CellDatetimeTypeFormat,
  isDefault: boolean
): TypeDisplayData {
  const date = new Date(Date.UTC(2023, 0, 1, 13, 2, 3, 100));
  let displayValue: string = dateTimeFormatter(
    date,
    format,
    getCurrentLocale().locale
  );
  if (isDefault) {
    displayValue = addDefaultText(displayValue);
  }
  return { displayValue, hint: "" };
}

function getDisplayDataForGeography(
  format: CellGeographyFormat,
  isDefault: boolean
): TypeDisplayData {
  const defaultPoint = "POINT (-24.082778 40.866389)";
  let displayValue: string = geographyFormatter(
    Geometry.parse(defaultPoint).toWkb(),
    format
  );
  if (isDefault) {
    displayValue = addDefaultText(displayValue);
  }
  return { displayValue, hint: "" };
}

function getDisplayDataForInterval(
  format: CellIntervalFormat,
  isDefault: boolean
): TypeDisplayData {
  let displayValue: string = intervalFormatter(
    36982923000,
    format,
    getCurrentLocale().locale
  );
  if (isDefault) {
    displayValue = addDefaultText(displayValue);
  }
  return { displayValue, hint: "" };
}

function getDisplayDataForJSON(
  format: CellJSONFormat,
  isDefault: boolean
): TypeDisplayData {
  const sampleJSONObject = { x: 1 };
  let displayValue = jsonFormatter(sampleJSONObject, format, true);
  if (isDefault) {
    displayValue = addDefaultText(displayValue);
  }
  return { displayValue, hint: "" };
}

function getDisplayDataForString(
  format: CellStringFormat,
  isDefault: boolean
): TypeDisplayData {
  const hint = stringFormatter("hello", -1, format);
  let displayValue: string;
  switch (format.format) {
    case "DoubleQuote": {
      displayValue = "Double Quotes";
      break;
    }
    case "SingleQuote": {
      displayValue = "Single Quote";
      break;
    }
    case "WithoutQuote": {
      displayValue = "Without Quotes";
      break;
    }
    case "Hyperlink": {
      displayValue = "Hyperlink";
      break;
    }
    default: {
      displayValue = "";
    }
  }

  if (isDefault) {
    displayValue = addDefaultText(displayValue);
  }
  return { displayValue, hint };
}

function getDisplayDataForTime(
  format: CellTimeTypeFormat,
  isDefault: boolean
): TypeDisplayData {
  const date = new Date(Date.UTC(2023, 0, 1, 13, 2, 3, 100));
  let displayValue: string = dateTimeFormatter(
    date,
    format,
    getCurrentLocale().locale
  );
  if (isDefault) {
    displayValue = addDefaultText(displayValue);
  }
  return { displayValue, hint: "" };
}

function getDisplayDataForTimestamp(
  format: CellTimestampTypeFormat,
  isDefault: boolean
): TypeDisplayData {
  const date = new Date(Date.UTC(2023, 0, 1, 13, 2, 3, 100));
  let displayValue: string = dateTimeFormatter(
    date,
    format,
    getCurrentLocale().locale
  );
  if (isDefault) {
    displayValue = addDefaultText(displayValue);
  }
  return { displayValue, hint: "" };
}

function getDisplayDataForNumber(format: CellNumberFormat): TypeDisplayData {
  let displayValue = "";
  let hint = "";

  switch (format.format) {
    case "default": {
      displayValue = "Default";
      // hint = "123.45";
      hint = numberFormatter(123.45, format) as string;
      break;
    }
    case "percent": {
      displayValue = "Percent";
      // hint = "12.12%";
      hint = numberFormatter(0.1212, format) as string;
      break;
    }
    case "scientific": {
      displayValue = "Scientific";
      // hint = "1.23e+4";
      hint = numberFormatter(12345, format) as string;
      break;
    }
    case "currency": {
      displayValue = "Currency";
      // hint = "$1,000.24";
      hint = numberFormatter(1000.24, format) as string;
      break;
    }
    case "accounting": {
      displayValue = "Accounting";
      // hint = "$(1,000.24)";
      const accounting = numberFormatter(
        -1000.24,
        format
      ) as CellAccountingFormatResult;
      hint = accounting.prefix + accounting.value;
      break;
    }
    default: {
      displayValue = "";
      hint = "";
    }
  }

  return { displayValue, hint };
}

export function getDisplayDataForType(
  dataType: string,
  dataFormat: CellDataFormat,
  isDefault: boolean
): TypeDisplayData {
  switch (dataType) {
    case "boolean": {
      return getDisplayDataForBoolean(
        dataFormat as CellBooleanFormat,
        isDefault
      );
    }
    case "bytes": {
      return getDisplayDataForBytes(dataFormat as CellBytesFormat, isDefault);
    }
    case "date": {
      return getDisplayDataForDate(dataFormat as CellDateTypeFormat, isDefault);
    }
    case "datetime": {
      return getDisplayDataForDatetime(
        dataFormat as CellDatetimeTypeFormat,
        isDefault
      );
    }
    case "geography": {
      return getDisplayDataForGeography(
        dataFormat as CellGeographyFormat,
        isDefault
      );
    }
    case "interval": {
      return getDisplayDataForInterval(
        dataFormat as CellIntervalFormat,
        isDefault
      );
    }
    case "json": {
      return getDisplayDataForJSON(dataFormat as CellJSONFormat, isDefault);
    }
    case "number":
    case "int":
    case "float":
    case "decimal": {
      return getDisplayDataForNumber(dataFormat as CellNumberFormat);
    }
    case "string": {
      return getDisplayDataForString(dataFormat as CellStringFormat, isDefault);
    }
    case "time": {
      return getDisplayDataForTime(dataFormat as CellTimeTypeFormat, isDefault);
    }
    case "timestamp": {
      return getDisplayDataForTimestamp(
        dataFormat as CellTimestampTypeFormat,
        isDefault
      );
    }
    default: {
      return { displayValue: "", hint: "" };
    }
  }
}

/**
 * Getting style of hint text for showing in data-format menu, for example the
 * Hyperlink item should have underline style and different text color.
 * @param format
 * @returns
 */
export function getHintTextStyle(format: CellDataFormat): string {
  let style = "";

  if (isHyperlinkDataFormat(format)) {
    const linkStyle = getGrid().getLinkDefaultStyle();
    if (linkStyle.textColor) {
      style += `color: ${linkStyle.textColor};`;
    }
    if (linkStyle.isUnderline) {
      style += "text-decoration: underline;";
    }
  }

  return style;
}
