import type { TableSummaryFn } from '../../types';
import { DataType, type ColumnType } from '../../types/column-types';

export const BooleanAggregationFnList = <const>[
  'Unchecked',
  'Checked',
  'PercentUnchecked',
  'PercentChecked',
];

export const NullableValueAggregationFnList = <const>[
  'Empty',
  'Filled',
  'Unique',
  'PercentEmpty',
  'PercentFilled',
  'PercentUnique',
];

export const NumberAggregationFnList = <const>[
  'Sum',
  'Average',
  'Median',
  'Min',
  'Max',
  'Range',
  'StandardDeviation',
  'Histogram',
];

export type BooleanAggregationFn = (typeof BooleanAggregationFnList)[number];

export type NullableValueAggregationFn =
  (typeof NullableValueAggregationFnList)[number];

export type NumberAggregationFn =
  | NullableValueAggregationFn
  | (typeof NumberAggregationFnList)[number];

export type StringAggregationFn = NullableValueAggregationFn;

export type AggregationFnType =
  | BooleanAggregationFn
  | StringAggregationFn
  | NumberAggregationFn
  | NullableValueAggregationFn;

export const AggregationFnNames: Readonly<Record<AggregationFnType, string>> = {
  Unchecked: 'Unchecked',
  Checked: 'Checked',
  PercentUnchecked: 'Percent Unchecked',
  PercentChecked: 'Percent Chekced',

  Empty: 'Empty',
  Filled: 'Filled',
  Unique: 'Unique',
  PercentEmpty: 'Percent Empty',
  PercentFilled: 'Percent Filled',
  PercentUnique: 'Percent Unique',

  Sum: 'Sum',
  Average: 'Average',
  Median: 'Median',
  Min: 'Min',
  Max: 'Max',
  Range: 'Range',
  StandardDeviation: 'Standard Deviation',
  Histogram: 'Histogram',
};

export const TABLE_SUMMARY_FN_COUNT: TableSummaryFn = {
  name: 'count',
  title: 'Count',
  shortenedTitle: 'Count',
  format: {
    type: 'number',
    format: 'default',
    decimalPlaces: 0,
  },
  getAsSql(field: string) {
    return `COUNT(${field} IS NOT NULL)`;
  },
};

export const TABLE_SUMMARY_FN_UNIQUE: TableSummaryFn = {
  name: 'unique',
  title: 'Unique',
  shortenedTitle: 'Unique',
  format: {
    type: 'number',
    format: 'default',
    decimalPlaces: 0,
  },
  getAsSql(field: string) {
    return `COUNT(DISTINCT ${field})`;
  },
};

export const TABLE_SUMMARY_FN_PERCENT_FILLED: TableSummaryFn = {
  name: 'percent_filled',
  title: 'Percent Filled',
  shortenedTitle: 'Filled',
  format: {
    type: 'number',
    format: 'percent',
    decimalPlaces: 0,
  },
  getAsSql(field: string) {
    return `COUNT(CASE WHEN ${field} IS NOT NULL THEN 1 END) / COUNT(1)`;
  },
};

export const TABLE_SUMMARY_FN_PERCENT_EMPTY: TableSummaryFn = {
  name: 'percent_empty',
  title: 'Percent Empty',
  shortenedTitle: 'Empty',
  format: {
    type: 'number',
    format: 'percent',
    decimalPlaces: 0,
  },
  getAsSql(field: string) {
    return `COUNT(CASE WHEN ${field} IS NULL THEN 1 END) / COUNT(1)`;
  },
};

export const TABLE_SUMMARY_FN_NUMB_SUM: TableSummaryFn = {
  name: 'sum',
  title: 'Sum',
  shortenedTitle: 'Sum',
  format: {
    type: 'number',
    format: 'default',
  },
  getAsSql(field: string) {
    return `SUM(${field})`;
  },
};

export const TABLE_SUMMARY_FN_NUMB_AVERAGE: TableSummaryFn = {
  name: 'average',
  title: 'Average',
  shortenedTitle: 'Avg',
  format: {
    type: 'number',
    format: 'default',
  },
  getAsSql(field: string) {
    return `AVG(${field})`;
  },
};

export const TABLE_SUMMARY_FN_NUMB_MIN: TableSummaryFn = {
  name: 'min',
  title: 'Min',
  shortenedTitle: 'Min',
  format: {
    type: 'number',
    format: 'default',
  },
  getAsSql(field: string) {
    return `MIN(${field})`;
  },
};

export const TABLE_SUMMARY_FN_NUMB_MAX: TableSummaryFn = {
  name: 'max',
  title: 'Max',
  shortenedTitle: 'Max',
  format: {
    type: 'number',
    format: 'default',
  },
  getAsSql(field: string) {
    return `MAX(${field})`;
  },
};

export const TABLE_SUMMARY_FN_BOOL_PERCENT_TRUE: TableSummaryFn = {
  name: 'percent_true',
  title: 'Percent True',
  shortenedTitle: 'True',
  format: {
    type: 'number',
    format: 'percent',
  },
  getAsSql(field: string) {
    return `COUNT(CASE WHEN ${field} THEN 1 END) / COUNT(1)`;
  },
};

export const TABLE_SUMMARY_FN_BOOL_PERCENT_FALSE: TableSummaryFn = {
  name: 'percent_false',
  title: 'Percent False',
  shortenedTitle: 'False',
  format: {
    type: 'number',
    format: 'percent',
  },
  getAsSql(field: string) {
    return `COUNT(CASE WHEN ${field} == false THEN 1 END) / COUNT(1)`;
  },
};

export const TABLE_SUMMARY_FN_BOOL_TRUE: TableSummaryFn = {
  name: 'is_true',
  title: 'True',
  shortenedTitle: 'True',
  format: {
    type: 'number',
    format: 'default',
  },
  getAsSql(field: string) {
    return `COUNT(CASE WHEN ${field} THEN 1 END)`;
  },
};

export const TABLE_SUMMARY_FN_BOOL_FALSE: TableSummaryFn = {
  name: 'is_false',
  title: 'False',
  shortenedTitle: 'False',
  format: {
    type: 'number',
    format: 'default',
  },
  getAsSql(field: string) {
    return `COUNT(CASE WHEN ${field} == false THEN 1 END)`;
  },
};

export const TABLE_SUMMARY_FN_LIST_DEFAULT: TableSummaryFn[] = [
  TABLE_SUMMARY_FN_COUNT,
  TABLE_SUMMARY_FN_UNIQUE,
  TABLE_SUMMARY_FN_PERCENT_FILLED,
  TABLE_SUMMARY_FN_PERCENT_EMPTY,
];

export const TABLE_SUMMARY_FN_LIST_NUMBER: TableSummaryFn[] = [
  TABLE_SUMMARY_FN_NUMB_SUM,
  TABLE_SUMMARY_FN_NUMB_AVERAGE,
  TABLE_SUMMARY_FN_NUMB_MIN,
  TABLE_SUMMARY_FN_NUMB_MAX,
  ...TABLE_SUMMARY_FN_LIST_DEFAULT,
];

export const TABLE_SUMMARY_FN_LIST_BOOLEAN: TableSummaryFn[] = [
  ...TABLE_SUMMARY_FN_LIST_DEFAULT,
  TABLE_SUMMARY_FN_BOOL_PERCENT_TRUE,
  TABLE_SUMMARY_FN_BOOL_PERCENT_FALSE,
  TABLE_SUMMARY_FN_BOOL_TRUE,
  TABLE_SUMMARY_FN_BOOL_FALSE,
];

export const TABLE_SUMMARY_FN_LIST_DATE_VARIANT: TableSummaryFn[] = [
  TABLE_SUMMARY_FN_NUMB_MIN,
  TABLE_SUMMARY_FN_NUMB_MAX,
  ...TABLE_SUMMARY_FN_LIST_DEFAULT,
];

export const TABLE_SUMMARY_FN_LIST_ALL: TableSummaryFn[] = [
  ...TABLE_SUMMARY_FN_LIST_DEFAULT,
  TABLE_SUMMARY_FN_NUMB_SUM,
  TABLE_SUMMARY_FN_NUMB_AVERAGE,
  TABLE_SUMMARY_FN_NUMB_MIN,
  TABLE_SUMMARY_FN_NUMB_MAX,
  TABLE_SUMMARY_FN_BOOL_PERCENT_TRUE,
  TABLE_SUMMARY_FN_BOOL_PERCENT_FALSE,
  TABLE_SUMMARY_FN_BOOL_TRUE,
  TABLE_SUMMARY_FN_BOOL_FALSE,
];

export const getAggregationFnByName = (
  name: string,
): TableSummaryFn | undefined => {
  return TABLE_SUMMARY_FN_LIST_ALL.find((fn) => fn.name === name);
};

export const getAggregationFnsForColumnType = (
  columnType: ColumnType,
): TableSummaryFn[] => {
  switch (columnType) {
    case 'int':
    case 'number':
    case 'float':
      return TABLE_SUMMARY_FN_LIST_NUMBER;
    case 'boolean':
      return TABLE_SUMMARY_FN_LIST_BOOLEAN;
    case 'date':
      return TABLE_SUMMARY_FN_LIST_DATE_VARIANT;
  }
  if (typeof columnType === 'object') {
    switch (columnType.typeId) {
      case DataType.Float:
      case DataType.Decimal:
        return TABLE_SUMMARY_FN_LIST_NUMBER;
      case DataType.Date:
      case DataType.DateTime:
      case DataType.Time:
      case DataType.Timestamp:
        return TABLE_SUMMARY_FN_LIST_DATE_VARIANT;
    }
  }

  return TABLE_SUMMARY_FN_LIST_DEFAULT;
};
