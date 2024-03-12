import type {
  GridPrivateProperties,
  NormalCellDescriptor,
  ParserCellData,
  ColumnType,
  Struct,
  List,
  Decimal,
  CellDataFormatResult,
  MetaRun,
} from '../types';
import type {
  CellDataFormat,
  CellDatetimeTypeFormat,
  CellDateTypeFormat,
  CellGeographyFormat,
  CellIntervalFormat,
  CellJSONFormat,
  CellTimestampTypeFormat,
  CellTimeTypeFormat,
  CellStructChipFormatResult,
  CellStringFormat,
  CellDateTimeFormat,
  CellAccountingFormatResult,
  DataFormatOptions,
  DataFormatWithHyperlinkResult,
} from '../types/data-format';
import { DataType } from '../types';
import {
  booleanFormatter,
  stringFormatter,
  bytesFormatter,
  numberFormatter,
  dateTimeFormatter,
  intervalFormatter,
  geographyFormatter,
  jsonFormatter,
  dateTimeDefaultFormatter,
  isHyperlinkDataFormat,
  hyperlinkFormatter,
} from './formatters';

import { copyMethods } from '../util';
import {
  columnTypeToLongFormString,
  columnTypeToString,
  getBaseType,
} from '../utils/column-types';
import { getImplicitHyperlinkRuns } from '../utils/hyperlink';
// import wkx from 'wkx';
import { getTableFieldOrGroupHeader, getTableGroupHeader } from './table/util';

export default function loadGridDataFormat(self: GridPrivateProperties) {
  copyMethods(new GridDataFormat(self), self);
}

export class GridDataFormat {
  constructor(private readonly grid: GridPrivateProperties) {}

  /**
   * Transform free form parser data into multiple data format value
   * @param cell
   */
  formulaFormat = (cell: NormalCellDescriptor) => {
    const meta = cell.meta;
    if (!meta?.parserData) return;
    const dataFormat = cell.dataFormat || undefined;
    const formattedValue =
      formatFormulaData(meta.parserData, dataFormat, {
        isRoot: true,
        locale: this.grid.attributes.locale,
        showHyperlink: true,
      }) || ' ';

    if (typeof formattedValue === 'string') {
      cell.displayValue = formattedValue;
    } else if (formattedValue.type === 'accounting') {
      updateCellAccoutingFormat(cell, formattedValue);
    } else if (formattedValue.type === 'chip') {
      updateCellChipFormat(
        cell,
        [...formattedValue.value],
        formattedValue.chipsCount,
      );
    } else if (formattedValue.type === 'hyperlink') {
      updateCellHyperlinkFormat(cell, formattedValue);
    }

    if (
      !cell.textRotation &&
      ['int', 'float', 'decimal'].includes(meta.parserData.dataType)
    ) {
      cell.wrapMode = 'truncated';
    }

    return cell.displayValue;
  };

  /**
   * Handle data format for free form as hyperlink
   * @param cell
   */
  formulaHyperlinkFormat = (cell: NormalCellDescriptor) => {
    const { dataFormat, linkLabel } = cell;
    if (isHyperlinkDataFormat(dataFormat) && linkLabel) {
      return linkLabel;
    }

    // Fall back to normal formula format
    return this.formulaFormat(cell);
  };

  getFormatEditCellValue = (rowIndex: number, columnIndex: number): string => {
    const { grid } = this;
    const cell = grid.getVisibleCellByIndex(columnIndex, rowIndex);
    const locale = grid.attributes.locale;

    if (cell) {
      const columnType = cell?.valueType;
      if (!columnType || cell.isTableHeader) {
        return getDefaultEditCellValue(cell);
      }
      return formatTableCellValue(cell.value, columnType, cell.dataFormat, {
        isRoot: true,
        locale,
        formatString: true,
      }) as string;
    } else {
      const value = grid.dataSource.getCellValue(rowIndex, columnIndex);
      const table = grid.dataSource.getTableByIndex(rowIndex, columnIndex);
      if (!table || table.startRow === rowIndex) {
        return toString(value);
      }
      const header = getTableFieldOrGroupHeader(table, columnIndex);
      const group = getTableGroupHeader(table, rowIndex);
      const summaryContext =
        (group?.rowType === 'total' && group.summaryData[header.id]) ||
        undefined;
      const columnType = summaryContext?.dataType ?? header.type;
      return formatTableCellValue(
        summaryContext?.data ?? value,
        columnType,
        summaryContext?.fn?.format,
        {
          isRoot: true,
          locale,
          formatString: true,
        },
      ) as string;
    }
  };
}

export function updateCellChipFormat(
  cell: NormalCellDescriptor,
  chips: Array<string>,
  chipsCount: number,
) {
  cell.displayValue = ' ';
  cell.chips = [...chips];
  cell.chipsCount = chipsCount;
}

export function updateCellAccoutingFormat(
  cell: NormalCellDescriptor,
  formattedValue: CellAccountingFormatResult,
) {
  const indentSpace = !cell.textRotation ? '  ' : '';
  cell.prefixValue = formattedValue.prefix;
  cell.displayValue = formattedValue.value + indentSpace;
  return cell.displayValue;
}

export function updateCellHyperlinkFormat(
  cell: NormalCellDescriptor,
  formattedValue: DataFormatWithHyperlinkResult,
) {
  cell.displayValue = formattedValue.value;
  if (formattedValue.linkRuns?.length > 0) {
    cell.linkRuns = formattedValue.linkRuns;
    cell.inferLink = true;
  }
  return cell.displayValue;
}

/**
 * A fallback string convertor for formatter
 */
function toString(value: any): string {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch (error) {
      // noop
    }
  }
  return String(value);
}

function addBytesNotation(value: string) {
  return `b '${value}'`;
}

function addIntervalNotation(value: string, type: 'SHORT' | 'LONG') {
  if (type === 'SHORT') {
    return `${value}i`;
  } else {
    return `INTERVAL "${value}"`;
  }
}

const MS_IN_SECOND = 1000;
const MS_IN_MINUTE = MS_IN_SECOND * 60;
const MS_IN_HOUR = MS_IN_MINUTE * 60;
const MS_IN_DAY = MS_IN_HOUR * 24;
const DAYS_IN_STANDARD_MONTH = 30;
const DAYS_IN_NONLEAP_YEAR = 365;
const MS_IN_NONLEAP_YEAR = DAYS_IN_NONLEAP_YEAR * MS_IN_DAY;
const MS_IN_STANDARD_MONTH = DAYS_IN_STANDARD_MONTH * MS_IN_DAY;

/**
 * @deprecated this function is marked as deprecated and intervalFormatter should
 * be used for interval type data format.
 */
export function canonicalFromInterval(ms: number): string {
  const years = Math.floor(ms / MS_IN_NONLEAP_YEAR);
  ms -= years * MS_IN_NONLEAP_YEAR;
  const months = Math.floor(ms / MS_IN_STANDARD_MONTH);
  ms -= months * MS_IN_STANDARD_MONTH;
  const days = Math.floor(ms / MS_IN_DAY);
  ms -= days * MS_IN_DAY;
  const hours = Math.floor(ms / MS_IN_HOUR);
  ms -= hours * MS_IN_HOUR;
  const minutes = Math.floor(ms / MS_IN_MINUTE);
  ms -= minutes * MS_IN_MINUTE;
  const seconds = Math.floor(ms / MS_IN_SECOND);
  ms -= seconds * MS_IN_SECOND;
  const dateParts = [`${years}Y`, `${months}M`, `${days}D`].filter(
    (s) => !s.match(/^[0]+\w$/),
  );
  const timeParts = [
    `${hours}H`,
    `${minutes}M`,
    `${parseFloat((seconds + ms / 1000).toFixed(6))}S`,
  ].filter((s) => !s.match(/^[0]+\w$/));
  return `P${dateParts
    .concat(timeParts.length ? ['T', ...timeParts] : [])
    .join('')}`;
}

export function canonicalFromNull(): string {
  // Note: showing empty cell if its value is null
  return ' ';
}

function wrapDoubleQuote(value: string) {
  return '"' + value + '"';
}

/**
 * Check if a cell data format can be applied for cell value.
 * For example, we can't use number format on boolean cell, but
 * can use on int[]/float[] cell.
 *
 * @param dataType cell data type
 * @param dataFormat cell data format
 * @returns true if data format is valid, otherwise false
 */
export function validateCellDataFormat(
  dataType: string,
  dataFormat: CellDataFormat,
) {
  // Empty data format is valid to all type
  if (!dataFormat) return true;

  const baseType = getBaseType(dataType);
  let keepDataFormat = false;

  switch (baseType) {
    case 'boolean': {
      keepDataFormat = dataFormat.type === 'boolean';
      break;
    }
    case 'string': {
      keepDataFormat = dataFormat.type === 'string';
      break;
    }
    case 'int':
    case 'float':
    case 'decimal':
    case 'number': {
      keepDataFormat = dataFormat.type === 'number';
      break;
    }
    case 'time': {
      keepDataFormat = dataFormat.type === 'time';
      break;
    }
    case 'date': {
      keepDataFormat = dataFormat.type === 'date';
      break;
    }
    case 'datetime': {
      keepDataFormat = dataFormat.type === 'datetime';
      break;
    }
    case 'timestamp': {
      keepDataFormat = dataFormat.type === 'timestamp';
      break;
    }
    case 'interval': {
      keepDataFormat = dataFormat.type === 'interval';
      break;
    }
    case 'bytes': {
      keepDataFormat = dataFormat.type === 'bytes';
      break;
    }
    case 'geography': {
      keepDataFormat = dataFormat.type === 'geography';
      break;
    }
    case 'json': {
      keepDataFormat = dataFormat.type === 'json';
      break;
    }
    case 'struct': {
      keepDataFormat = dataFormat.type === 'struct';
      break;
    }
    default:
      break;
  }

  return keepDataFormat;
}

/**
 * Find active field for table Struct Chip format.
 *
 * @param value
 * @param dataType
 * @param field
 * @param fallbackFirstNode If true, in case there is no active field, take the first leaf node.
 * @returns
 */
export function findTableStructActiveField(
  value: any,
  dataType: Struct,
  field: string[],
  fallbackFirstNode = true,
) {
  function getFirstLeafNode(value: any, dataType: Struct) {
    if (!fallbackFirstNode) return null;

    const firstChild = dataType.children[0];
    if (firstChild) {
      if (columnTypeToString(firstChild.type) === 'struct') {
        return getFirstLeafNode(
          value[firstChild.name],
          firstChild.type as Struct,
        );
      } else {
        return {
          childValue: value[firstChild.name],
          childType: firstChild.type,
        };
      }
    }
  }

  if (!field || field.length === 0) {
    return getFirstLeafNode(value, dataType);
  } else {
    const fieldLength = field.length;
    let isValid = true;
    let currentValue = value;
    let currentType = dataType;

    for (let i = 0; i < fieldLength; i++) {
      const childType = currentType.children.find(
        (child) => child.name === field[i],
      );

      if (!childType) {
        isValid = false;
        break;
      }

      if (i < fieldLength - 1) {
        if (!(columnTypeToString(childType.type) === 'struct')) {
          isValid = false;
          break;
        } else {
          currentValue = currentValue[field[i]];
          currentType = childType.type as Struct;
        }
      } else {
        if (columnTypeToString(childType.type) === 'struct') {
          isValid = false;
          break;
        } else {
          currentValue = currentValue[field[i]];
          currentType = childType.type as any;
        }
      }
    }

    return isValid
      ? { childValue: currentValue, childType: currentType }
      : getFirstLeafNode(value, dataType);
  }
}

/**
 * Find active field for free form cells that have Struct Chip format.
 *
 * @param parserData
 * @param field
 * @param fallbackFirstNode If true, in case there is no active field, take the first leaf node.
 * @returns
 */
export function findFreeFormStructActiveField(
  parserData: ParserCellData,
  field: string[],
  fallbackFirstNode = true,
): ParserCellData {
  function getFirstLeafNode(value: any) {
    if (!fallbackFirstNode) return null;

    for (const key in value) {
      const child: ParserCellData = value[key];
      return child.dataType === 'struct'
        ? getFirstLeafNode(child.value)
        : child;
    }
  }

  if (!field || field.length === 0) {
    return getFirstLeafNode(parserData.value);
  } else {
    const fieldLength = field.length;
    let isValid = true;
    let current = parserData;

    for (let i = 0; i < fieldLength; i++) {
      current = current.value[field[i]];

      if (i < fieldLength - 1) {
        if (!current || current.dataType !== 'struct') {
          isValid = false;
          break;
        }
      } else {
        if (!current || current.dataType === 'struct') {
          isValid = false;
          break;
        }
      }
    }

    return isValid ? current : getFirstLeafNode(parserData.value);
  }
}

function shiftLinkRunsByOffset(linkRuns: MetaRun[], offset: number): MetaRun[] {
  if (!(linkRuns?.length > 0)) {
    return [];
  }

  linkRuns.forEach((run) => {
    run.startOffset += offset;
    run.endOffset += offset;
  });

  return linkRuns;
}

const SPACE = ' ';
const SEPARATOR = ', ';
const ELLIPISS_TEXT = '…';
/**
 * In case we have Array or Struct which produce formatted value with
 * 10,000 chars, reduce it to around 2,000. Most of the time we will have
 * full formatted value because 2,000 is quite a big number.
 */
const MAX_CHAR_COUNT = 2000;

/**
 * Format a table cell
 *
 * @param value Value of cell
 * @param dataType Type of cell
 * @param isRoot Indicate if the data is at top level
 * @param dataFormat Data type format
 * @param locale The localization of format
 * @param formatString Indicate if the result should only be string
 * @param isArrayChild
 * @returns
 */
export function formatTableCellValue(
  value: any,
  dataType: ColumnType,
  dataFormat?: CellDataFormat,
  options?: DataFormatOptions,
): CellDataFormatResult {
  const { isRoot, locale, formatString, isArrayChild } = options ?? {};
  const showHyperlink = options?.showHyperlink && !formatString;

  if (
    value === null &&
    (typeof dataType === 'string' || dataType.typeId !== DataType.Json)
  )
    return isRoot ? '' : 'null';

  if (typeof dataType === 'string') {
    switch (dataType) {
      case 'string': {
        if (isRoot) {
          const format = dataFormat?.type === 'string' ? dataFormat : undefined;
          return stringFormatter(value, -1, format);
        }
        const format: CellStringFormat =
          dataFormat?.type === 'string'
            ? dataFormat
            : { type: 'string', format: 'DoubleQuote' };
        const formattedValue = stringFormatter(value, -1, format);

        return showHyperlink
          ? hyperlinkFormatter(formattedValue)
          : formattedValue;
      }
      case 'boolean': {
        const format = dataFormat?.type === 'boolean' ? dataFormat : undefined;
        return booleanFormatter(value, format);
      }
      case 'int': {
        const format = dataFormat?.type === 'number' ? dataFormat : undefined;
        if (typeof value === 'bigint') {
          return numberFormatter(
            { a: value, b: 0 },
            format,
            !isRoot || formatString,
          );
        } else {
          return numberFormatter(value, format, !isRoot || formatString);
        }
      }
      case 'float': {
        const format = dataFormat?.type === 'number' ? dataFormat : undefined;
        return numberFormatter(value, format, !isRoot || formatString);
      }
      case 'date': {
        const format =
          dataFormat?.type === 'date'
            ? dataFormat
            : ({ type: 'date' } as CellDateTypeFormat);
        return dateTimeFormatter(value, format, locale);
      }
      case 'bytes': {
        const format = dataFormat?.type === 'bytes' ? dataFormat : undefined;
        return addBytesNotation(bytesFormatter(value, -1, format));
      }
      default: {
        break;
      }
    }
  } else {
    switch (dataType.typeId) {
      case DataType.List: {
        if (isRoot && dataFormat) {
          const type = columnTypeToLongFormString(dataType);
          if (!validateCellDataFormat(type, dataFormat)) {
            dataFormat = undefined;
          }
        }

        if (
          isRoot &&
          dataFormat?.type === 'struct' &&
          dataFormat?.format === 'chip'
        ) {
          const formattedValue: CellStructChipFormatResult = {
            type: 'chip',
            value: [],
            chipsCount: value.length,
          };
          if (value.length > 0) {
            const childType = (dataType as List).child.type;
            for (let i = 0; i < value.length; i++) {
              const formattedStruct = formatTableCellValue(
                value[i],
                childType,
                dataFormat,
                {
                  isRoot: false,
                  locale,
                  formatString: false,
                  isArrayChild: true,
                  showHyperlink: false,
                },
              ) as CellStructChipFormatResult;

              if (formattedStruct?.value?.length > 0) {
                formattedValue.value.push(formattedStruct.value[0]);
              }

              // Only need to do format for the first struct
              break;
            }
          }

          return formattedValue;
        }

        const linkRuns: MetaRun[] = [];
        const applyCharLimit = isRoot === true;
        const spaceWhenNeeded = isRoot ? SPACE : '';
        let formattedArray = '[' + spaceWhenNeeded;
        let childIndex = 0;
        if (value.length > 0) {
          const childType = (dataType as List).child.type;
          for (let i = 0; i < value.length; i++) {
            const formattedValue = formatTableCellValue(
              value[i],
              childType,
              dataFormat,
              {
                isRoot: false,
                locale,
                formatString,
                isArrayChild: true,
                showHyperlink,
              },
            );

            if (typeof formattedValue === 'string') {
              formattedArray += formattedValue + SEPARATOR;
            } else if (formattedValue.type === 'hyperlink') {
              linkRuns.push(
                ...shiftLinkRunsByOffset(
                  formattedValue.linkRuns,
                  formattedArray.length,
                ),
              );
              formattedArray += formattedValue.value + SEPARATOR;
            }

            childIndex = i;
            if (applyCharLimit && formattedArray.length > MAX_CHAR_COUNT) {
              break;
            }
          }

          formattedArray = formattedArray.slice(0, -SEPARATOR.length);
          if (childIndex < value.length - 1) {
            formattedArray += ',' + ELLIPISS_TEXT;
          }
          formattedArray += spaceWhenNeeded;
        }
        formattedArray += ']';

        return linkRuns.length > 0
          ? { type: 'hyperlink', value: formattedArray, linkRuns }
          : formattedArray;
      }
      case DataType.Struct: {
        if (
          formatString ||
          !(
            (isRoot || isArrayChild) &&
            dataFormat &&
            dataFormat.type === 'struct' &&
            dataFormat.format === 'chip'
          )
        ) {
          const linkRuns: MetaRun[] = [];
          const applyCharLimit = isRoot === true;
          const spaceWhenNeeded = isRoot ? SPACE : '';
          const childrenType = (dataType as Struct).children;
          let childIndex = 0;
          if (childrenType.length > 0) {
            let formattedStruct = '{' + spaceWhenNeeded;
            for (const childType of childrenType) {
              const formattedValue = formatTableCellValue(
                value[childType.name],
                childType.type,
                dataFormat,
                {
                  isRoot: false,
                  locale,
                  showHyperlink,
                },
              );

              if (typeof formattedValue === 'string') {
                formattedStruct +=
                  wrapDoubleQuote(childType.name) +
                  ':' +
                  SPACE +
                  formattedValue +
                  SEPARATOR;
              } else if (formattedValue.type === 'hyperlink') {
                formattedStruct +=
                  wrapDoubleQuote(childType.name) + ':' + SPACE;
                linkRuns.push(
                  ...shiftLinkRunsByOffset(
                    formattedValue.linkRuns,
                    formattedStruct.length,
                  ),
                );
                formattedStruct += formattedValue.value + SEPARATOR;
              }

              childIndex += 1;
              if (applyCharLimit && formattedStruct.length > MAX_CHAR_COUNT) {
                break;
              }
            }

            formattedStruct = formattedStruct.slice(0, -SEPARATOR.length);
            if (childIndex < childrenType.length - 1) {
              formattedStruct += ',' + ELLIPISS_TEXT;
            }
            formattedStruct += spaceWhenNeeded + '}';

            return linkRuns.length > 0
              ? { type: 'hyperlink', value: formattedStruct, linkRuns }
              : formattedStruct;
          } else {
            return '{' + spaceWhenNeeded + '}';
          }
        } else {
          const field = dataFormat.display;
          const { childType, childValue } = findTableStructActiveField(
            value,
            dataType as Struct,
            field,
          );
          const chipText =
            childType === 'string'
              ? childValue
              : (formatTableCellValue(childValue, childType, dataFormat, {
                  isRoot: false,
                  locale,
                  showHyperlink: false,
                }) as string);

          return { type: 'chip', value: [chipText], chipsCount: 1 };
        }
      }
      case DataType.Float: {
        const format = dataFormat?.type === 'number' ? dataFormat : undefined;
        return numberFormatter(
          value,
          format,
          !isRoot || formatString,
        ) as string;
      }
      case DataType.Date: {
        const format =
          dataFormat?.type === 'date'
            ? dataFormat
            : ({ type: 'date' } as CellDateTypeFormat);
        return dateTimeFormatter(value, format, locale);
      }
      case DataType.Time: {
        if (typeof value === 'bigint') {
          value = Number(value / 1000n);
        } else {
          value = value / 1000;
        }
        const format =
          dataFormat?.type === 'time'
            ? dataFormat
            : ({ type: 'time' } as CellTimeTypeFormat);
        return dateTimeFormatter(value, format, locale);
      }
      case DataType.DateTime: {
        const format =
          dataFormat?.type === 'datetime'
            ? dataFormat
            : ({ type: 'datetime' } as CellDatetimeTypeFormat);
        return dateTimeFormatter(value, format, locale);
      }
      case DataType.Timestamp: {
        const format =
          dataFormat?.type === 'timestamp'
            ? dataFormat
            : ({ type: 'timestamp' } as CellTimestampTypeFormat);
        return dateTimeFormatter(value, format, locale);
      }
      case DataType.Bytes: {
        const format = dataFormat?.type === 'bytes' ? dataFormat : undefined;
        return addBytesNotation(bytesFormatter(value, -1, format));
      }
      case DataType.Decimal: {
        const scale = (dataType as Decimal).scale;
        const format = dataFormat?.type === 'number' ? dataFormat : undefined;
        return numberFormatter(
          { a: value, b: scale },
          format,
          !isRoot || formatString,
        );
      }
      case DataType.Interval: {
        if (typeof value === 'bigint') {
          value = Number(value / 1000n);
        } else {
          value = value / 1000;
        }
        const format =
          dataFormat?.type === 'interval'
            ? dataFormat
            : ({ type: 'interval' } as CellIntervalFormat);
        return intervalFormatter(value, format, locale);
      }
      case DataType.Geography: {
        const format =
          dataFormat?.type === 'geography'
            ? dataFormat
            : ({ type: 'geography' } as CellGeographyFormat);
        return geographyFormatter(value, format);
      }
      case DataType.Json: {
        const format =
          dataFormat?.type === 'json'
            ? dataFormat
            : ({ type: 'json' } as CellJSONFormat);
        const formattedValue = jsonFormatter(value, format, isRoot);

        return showHyperlink
          ? hyperlinkFormatter(formattedValue)
          : formattedValue;
      }
      case DataType.Variant: {
        // const variantType = value['__type'] as string;
        // if (variantType.startsWith('STRUCT') || variantType.endsWith('[]')) {
        //   return value['__value'];
        // }
        // let _value = String(value['__value']);
        // if (_value.startsWith('"') && _value.endsWith('"')) {
        //   _value = _value.substring(1, _value.length - 1);
        // }
        // return _value;
        return formatFormulaData(value, dataFormat, {
          isRoot,
          locale,
          formatString,
          isArrayChild,
          showHyperlink,
        });
      }
      case DataType.Null: {
        return '';
      }
      default: {
        break;
      }
    }
  }

  return 'undefined' || String(value);
}

/**
 * Format free form cell parser data
 *
 * @param parserData
 * @param isRoot Indicate if the data is at top level
 * @param dataFormat Data type format
 * @param locale The localization of format
 * @param formatString Indicate if the result should only be string
 * @param isArrayChild
 * @returns
 */
export function formatFormulaData(
  parserData: ParserCellData,
  dataFormat?: CellDataFormat,
  options?: DataFormatOptions,
): CellDataFormatResult {
  if (!parserData) return '';
  const { value, dataType } = parserData;
  const { isRoot, locale, formatString, isArrayChild } = options ?? {};
  const showHyperlink = options?.showHyperlink && !formatString;

  if (value === null && dataType !== 'json') {
    return !isRoot ? 'null' : canonicalFromNull();
  } else if (value === '' || value === undefined) {
    if (isRoot) return '';
  }

  switch (dataType) {
    case 'boolean': {
      const format = dataFormat?.type === 'boolean' ? dataFormat : undefined;
      return booleanFormatter(value, format);
    }
    case 'int':
    case 'float':
    case 'decimal': {
      const format = dataFormat?.type === 'number' ? dataFormat : undefined;
      return numberFormatter(value, format, !isRoot || formatString);
    }
    case 'string': {
      if (isRoot) {
        // String value at root shouldn't be affected by showHyperlink
        const format = dataFormat?.type === 'string' ? dataFormat : undefined;
        return stringFormatter(value, -1, format);
      }

      const format: CellStringFormat =
        dataFormat?.type === 'string'
          ? dataFormat
          : { type: 'string', format: 'DoubleQuote' };
      const formattedValue = stringFormatter(value, -1, format);

      return showHyperlink
        ? hyperlinkFormatter(formattedValue)
        : formattedValue;
    }
    case 'bytes': {
      const format = dataFormat?.type === 'bytes' ? dataFormat : undefined;
      return addBytesNotation(bytesFormatter(value, -1, format));
    }
    case 'date': {
      const format =
        dataFormat?.type === 'date'
          ? dataFormat
          : ({ type: 'date' } as CellDateTypeFormat);
      return dateTimeFormatter(value, format, locale);
    }
    case 'time': {
      const format =
        dataFormat?.type === 'time'
          ? dataFormat
          : ({ type: 'time' } as CellTimeTypeFormat);
      return dateTimeFormatter(value, format, locale);
    }
    case 'datetime': {
      const format =
        dataFormat?.type === 'datetime'
          ? dataFormat
          : ({ type: 'datetime' } as CellDatetimeTypeFormat);
      return dateTimeFormatter(value, format, locale);
    }
    case 'timestamp': {
      const format =
        dataFormat?.type === 'timestamp'
          ? dataFormat
          : ({ type: 'timestamp' } as CellTimestampTypeFormat);
      return dateTimeFormatter(value, format, locale);
    }
    case 'interval': {
      const format =
        dataFormat?.type === 'interval'
          ? dataFormat
          : ({ type: 'interval' } as CellIntervalFormat);
      return intervalFormatter(value, format, locale);
    }
    case 'json': {
      const format =
        dataFormat?.type === 'json'
          ? dataFormat
          : ({ type: 'json' } as CellJSONFormat);
      const formattedValue = jsonFormatter(value, format, isRoot);

      return showHyperlink
        ? hyperlinkFormatter(formattedValue)
        : formattedValue;
    }
    case 'geography': {
      const format =
        dataFormat?.type === 'geography'
          ? dataFormat
          : ({ type: 'geography' } as CellGeographyFormat);
      return geographyFormatter(value, format);
    }
    case 'null': {
      return canonicalFromNull();
    }
    case 'struct': {
      if (
        !formatString &&
        (isRoot || isArrayChild) &&
        dataFormat &&
        dataFormat.type === 'struct' &&
        dataFormat.format === 'chip'
      ) {
        const field = dataFormat.display;
        const activeField = findFreeFormStructActiveField(parserData, field);
        const chipText =
          activeField?.dataType === 'string'
            ? activeField.value
            : (formatFormulaData(activeField, undefined, {
                isRoot: false,
                locale,
                showHyperlink: false,
              }) as string);

        return { type: 'chip', value: [chipText], chipsCount: 1 };
      }

      const linkRuns: MetaRun[] = [];
      const applyCharLimit = isRoot === true;
      const spaceWhenNeeded = isRoot ? SPACE : '';
      let hasProperty = false;
      let isTooLong = false;
      let hasNextKey = false;
      let formattedStruct = '{' + spaceWhenNeeded;
      for (const key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          if (isTooLong) {
            hasNextKey = true;
            break;
          }
          const formattedValue = formatFormulaData(value[key], undefined, {
            isRoot: false,
            formatString,
            locale,
            showHyperlink,
          });

          if (typeof formattedValue === 'string') {
            formattedStruct +=
              wrapDoubleQuote(key) + ':' + SPACE + formattedValue + SEPARATOR;
          } else if (formattedValue.type === 'hyperlink') {
            formattedStruct += wrapDoubleQuote(key) + ':' + SPACE;
            linkRuns.push(
              ...shiftLinkRunsByOffset(
                formattedValue.linkRuns,
                formattedStruct.length,
              ),
            );
            formattedStruct += formattedValue.value + SEPARATOR;
          }

          hasProperty = true;

          if (applyCharLimit && formattedStruct.length > MAX_CHAR_COUNT) {
            isTooLong = true;
          }
        }
      }

      if (hasProperty) {
        formattedStruct = formattedStruct.slice(0, -SEPARATOR.length);
        if (hasNextKey) {
          formattedStruct += ',' + ELLIPISS_TEXT;
        }
        formattedStruct += spaceWhenNeeded + '}';
      } else {
        formattedStruct += '}';
      }

      return linkRuns.length > 0
        ? { type: 'hyperlink', value: formattedStruct, linkRuns }
        : formattedStruct;
    }
    default: {
      if (dataType?.endsWith('[]')) {
        // Root level of Array type should determine if CellDataFormat is valid or not
        if (
          isRoot &&
          dataFormat &&
          !validateCellDataFormat(dataType, dataFormat)
        ) {
          dataFormat = undefined;
        }

        if (
          isRoot &&
          dataFormat?.type === 'struct' &&
          dataFormat?.format === 'chip'
        ) {
          const formattedValue: CellStructChipFormatResult = {
            type: 'chip',
            value: [],
            chipsCount: value.length,
          };

          for (let i = 0; i < value.length; i++) {
            const formattedStruct = formatFormulaData(value[i], dataFormat, {
              isRoot: false,
              locale,
              formatString: false,
              isArrayChild: true,
              showHyperlink: false,
            }) as CellStructChipFormatResult;

            if (formattedStruct?.value?.length > 0) {
              formattedValue.value.push(formattedStruct.value[0]);
            }

            // Only need to do format for the first struct
            break;
          }

          return formattedValue;
        }

        const applyCharLimit = isRoot === true;
        const spaceWhenNeeded = isRoot ? SPACE : '';
        const linkRuns: MetaRun[] = [];
        let formattedArray = '[' + spaceWhenNeeded;
        let childIndex = 0;
        if (value.length > 0) {
          for (let i = 0; i < value.length; i++) {
            const formattedValue = formatFormulaData(value[i], dataFormat, {
              isRoot: false,
              formatString,
              locale,
              isArrayChild: true,
              showHyperlink,
            });

            if (typeof formattedValue === 'string') {
              formattedArray += formattedValue + SEPARATOR;
            } else if (formattedValue.type === 'hyperlink') {
              linkRuns.push(
                ...shiftLinkRunsByOffset(
                  formattedValue.linkRuns,
                  formattedArray.length,
                ),
              );
              formattedArray += formattedValue.value + SEPARATOR;
            }

            childIndex = i;
            if (applyCharLimit && formattedArray.length > MAX_CHAR_COUNT) {
              break;
            }
          }

          formattedArray = formattedArray.slice(0, -SEPARATOR.length);
          if (childIndex < value.length - 1) {
            formattedArray += ',' + ELLIPISS_TEXT;
          }
          formattedArray += spaceWhenNeeded;
        }
        formattedArray += ']';

        return linkRuns.length > 0
          ? { type: 'hyperlink', value: formattedArray, linkRuns }
          : formattedArray;
      }
      return '';
    }
  }
}

const defaultNestedDateTimeFormat: { [key: string]: CellDateTimeFormat } = {
  date: {
    type: 'date',
    format: 'yyyy-MM-dd',
  },
  datetime: {
    type: 'datetime',
    format: 'yyyy-MM-ddThh:mm:ss',
  },
  timestamp: {
    type: 'timestamp',
    format: 'yyyy-MM-ddThh:mm:ss',
  },
  time: {
    type: 'time',
    format: 'hh:mm:ss',
  },
};

function getDefaultEditValue(
  parserData: ParserCellData,
  locale: string,
  cellFormat: CellDataFormat,
  isRoot = true,
): string {
  if (!parserData) return '';
  const { value, dataType } = parserData;
  switch (dataType) {
    case 'string': {
      if (isRoot) {
        return value;
      } else {
        return wrapDoubleQuote(value);
      }
    }

    case 'boolean': {
      return formatTableCellValue(value, dataType, undefined, {
        isRoot: true,
        locale,
      }) as string;
    }

    case 'int':
    case 'float':
    case 'decimal': {
      const dataFormat = cellFormat;
      if (dataFormat && dataFormat.format === 'percent') {
        let updatedValue: any;
        if (dataType == 'float') {
          updatedValue = value * 100;
        } else {
          updatedValue = {
            a: value.a * 100n,
            b: value.b,
          };
        }
        return (numberFormatter(updatedValue, undefined) as string) + '%';
      }
      return numberFormatter(value, undefined) as string;
    }

    case 'date':
    case 'datetime':
    case 'time':
    case 'timestamp': {
      if (isRoot) {
        return dateTimeDefaultFormatter(value, dataType, locale);
      } else {
        return (
          dataType.toUpperCase() +
          ' ' +
          wrapDoubleQuote(
            dateTimeFormatter(
              value,
              defaultNestedDateTimeFormat[dataType],
              locale,
            ) + (dataType === 'timestamp' ? 'Z' : ''),
          )
        );
      }
    }

    case 'interval': {
      return addIntervalNotation(
        intervalFormatter(
          value,
          { type: 'interval', format: isRoot ? 'BIG_QUERY_LIKE' : 'ISO_FULL' },
          locale,
        ),
        isRoot ? 'SHORT' : 'LONG',
      );
    }

    case 'geography': {
      const geography = geographyFormatter(value, { type: 'geography' });
      if (isRoot) {
        return geography;
      } else {
        return 'ST_GEOGFROM(' + wrapDoubleQuote(geography) + ')';
      }
    }

    case 'bytes': {
      return `b'${bytesFormatter(value, -1, undefined)}'`;
    }

    case 'json': {
      return jsonFormatter(value, undefined, true);
    }

    case 'struct': {
      const spaceWhenNeeded = SPACE + SPACE;
      let hasProperty = false;
      let formattedStruct = '{' + spaceWhenNeeded;
      for (const key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          formattedStruct +=
            wrapDoubleQuote(key) +
            ':' +
            SPACE +
            getDefaultEditValue(value[key], locale, cellFormat, false) +
            SEPARATOR;
          hasProperty = true;
        }
      }
      if (hasProperty) {
        return (
          formattedStruct.slice(0, -SEPARATOR.length) + spaceWhenNeeded + '}'
        );
      } else {
        return formattedStruct + '}';
      }
    }

    default: {
      if (dataType?.endsWith('[]')) {
        if (value.length > 0) {
          const children = [];
          for (let i = 0; i < value.length; i++) {
            children.push(
              getDefaultEditValue(value[i], locale, cellFormat, false),
            );
          }
          return `[${children.join(', ')}]`;
        } else {
          return '[]';
        }
      }
      return null;
    }
  }
}

function getDefaultEditCellValue(cell: NormalCellDescriptor): string {
  const value = cell.meta?.parserData?.value || cell.value;
  const dataType = cell.meta?.parserData?.dataType;
  if (value === null || !dataType) return value ?? '';

  if (cell.value && cell.value.startsWith('=')) {
    return cell.value ?? '';
  }

  if (typeof dataType === 'string') {
    switch (dataType) {
      case 'string': {
        return cell.value ?? '';
      }

      default: {
        return (
          (getDefaultEditValue(
            cell.meta?.parserData,
            cell.locale,
            cell.dataFormat,
            true,
          ) ||
            cell.value) ??
          ''
        );
      }
    }
  }
  return cell.value ?? '';
}
