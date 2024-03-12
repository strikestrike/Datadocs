import type { MetaRun } from './style';

export type CellDataFormat =
  | CellBooleanFormat
  | CellStringFormat
  | CellNumberFormat
  | CellDateTimeFormat
  | CellIntervalFormat
  | CellBytesFormat
  | CellGeographyFormat
  | CellJSONFormat
  | CellStructFormat;

export type CellBooleanFormat = {
  type: 'boolean';
  format:
    | 'true|false'
    | 'True|False'
    | 'TRUE|FALSE'
    | 'yes|no'
    | 'Yes|No'
    | 'YES|NO'
    | '1|0';
};

export type CellStringFormat =
  | {
      type: 'string';
      format: 'SingleQuote' | 'DoubleQuote' | 'WithoutQuote';
    }
  | CellHyperlinkFormat;

export type CellHyperlinkFormat = {
  type: 'string';
  format: 'Hyperlink';
  /**
   * Indicate where the `label` or `ref` of the `Hyperlink` come from,
   * including:
   * + `lcolumn`: Use a table `string` column as `label`
   * + `lformula`: Use `formula` as `label`
   * + `ltext`: Use a `text` as `label`
   * + `lempty`: Unspecified `label`
   * + `rcolumn`: Use a table `string` column as `ref`
   * + `rformula`: Use `formula` as `ref`
   * + `rtext`: Use a `text` as `ref`
   * + `rempty`: Unspecified `ref`
   */
  style?:
    | 'lcolumn'
    | 'lformula'
    | 'ltext'
    | 'rcolumn'
    | 'rformula'
    | 'rtext'
    | 'lempty'
    | 'rempty';
  /**
   * Hyperlink ref/label value
   */
  value?: string;
};

export type CurrencyType = 'usd' | 'euro' | 'pounds';

export type NumberFormatExtra = {
  thounsandSeparator?: string;
  decimalSeparator?: string;
  useGrouping?: boolean;
  symbol?: string;
  position?: 'head' | 'tail';
  locale?: string;
};

export type CellNumberGeneralFormat = {
  type: 'number';
  format: 'default' | 'percent' | 'scientific';
  decimalPlaces?: number;
} & NumberFormatExtra;

export type CellNumberCurrencyFormat = {
  type: 'number';
  format: 'currency';
  decimalPlaces?: number;
  currency?: CurrencyType;
} & NumberFormatExtra;

export type CellNumberAccountingFormat = {
  type: 'number';
  format: 'accounting';
  decimalPlaces?: number;
  currency?: CurrencyType;
} & NumberFormatExtra;

export type CellNumberFormat =
  | CellNumberGeneralFormat
  | CellNumberCurrencyFormat
  | CellNumberAccountingFormat;

export type CellDateTypeFormat = {
  type: 'date';
  format?: string;
};

export type CellTimeTypeFormat = {
  type: 'time';
  format?: string;
};

export type CellDatetimeTypeFormat = {
  type: 'datetime';
  format?: string;
};

export type CellTimestampTypeFormat = {
  type: 'timestamp';
  format?: string;
  timeZone?: string;
  timeZoneOffset?: number;
};

export type CellDateTimeFormat =
  | CellDateTypeFormat
  | CellTimeTypeFormat
  | CellDatetimeTypeFormat
  | CellTimestampTypeFormat;

export type CellIntervalFormat = {
  type: 'interval';
  format?:
    | 'ISO_FULL'
    | 'ISO_WEEK'
    | 'INTERVAL_DATETIME'
    | 'NORMAL_DATETIME'
    | 'BIG_QUERY_LIKE'
    | 'HUMANRIZE';
  style?: 'long' | 'short' | 'narrow';
  separator?: boolean;
  conjunction?: boolean;
};

export type CellBytesFormat = {
  type: 'bytes';
  format?: 'hex' | 'utf8' | 'base64';
};

export type CellGeographyFormat = {
  type: 'geography';
  format?: 'WKT' | 'JSON' | 'DD' | 'DMS';
};

export type CellJSONFormat = {
  type: 'json';
  format?: 'short' | 'long';
};

export type CellStructFormat = {
  type: 'struct';
  format?: 'raw' | 'chip';
  /** Display field to show in chip format */
  display?: string[];
  /** Field that contains image to display in Chip layover */
  image?: string[];
};

/**
 * Extra options for doing data-format. It will be convenient
 * for adding new features to the data-format process.
 */
export type DataFormatOptions = {
  /**
   * Whether the data-format is at the root of value or not
   */
  isRoot?: boolean;
  /**
   * The localization should be applied. E.g. en-US
   */
  locale?: string;
  /**
   * If true, the result of data-format should be a string
   */
  formatString?: boolean;
  /**
   * Indicate the current data is in an array
   */
  isArrayChild?: boolean;
  /**
   * If true, try to get the link inside string leaf of Struct, Array, JSON. It
   * will be disabled if {@link DataFormatOptions.formatString } is true.
   */
  showHyperlink?: boolean;
};

export type CellDataFormatResult =
  | string
  | CellAccountingFormatResult
  | CellStructChipFormatResult
  | DataFormatWithHyperlinkResult;

export type CellAccountingFormatResult = {
  type: 'accounting';
  prefix: string;
  value: string;
};
export type CellStructChipFormatResult = {
  type: 'chip';
  value: string[];
  chipsCount: number;
};

export type DataFormatWithHyperlinkResult = {
  type: 'hyperlink';
  value: string;
  linkRuns: MetaRun[];
};

export type CellDetailTypeData = string | StructDetailTypeData;

export type StructDetailTypeData = {
  type: 'struct';
  children: { key: string; dataType: CellDetailTypeData }[];
};

export type SelectionDataTypeListInformation = {
  types: string[];
  /** contain information of first encounter cell of each types */
  firstCells: Partial<
    Record<CellDataFormat['type'], { rowIndex: string; columnIndex: string }>
  >;
  firstStruct: {
    rowIndex: number;
    columnIndex: number;
    typeData: StructDetailTypeData;
  };
  firstString: {
    rowIndex: number;
    columnIndex: number;
    value: string;
  };
};
