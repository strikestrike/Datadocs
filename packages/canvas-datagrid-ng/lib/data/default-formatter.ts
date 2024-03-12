import type { FormatterFn, NormalCellDescriptor } from '../types';
import { DateUnit, TimeUnit } from '../types';
import {
  formatTableCellValue,
  updateCellChipFormat,
  updateCellAccoutingFormat,
  updateCellHyperlinkFormat,
} from '../data/data-format';
import { isHyperlinkDataFormat, stringFormatter } from '../data/formatters';

/**
 * processing data before running formatter
 * @param e
 * @returns
 */
const preProcessData = (e): { val: any; valType: string } => {
  if (e.cell.displayValue) {
    return { val: e.cell.displayValue, valType: 'string' };
  }
  const rawValue = e.cell.value;
  const val = rawValue !== undefined && rawValue !== null ? rawValue : '';
  const valType = typeof val;
  return {
    val,
    valType,
  };
};

/**
 * convert to mili second base on date unit
 * @param val
 * @param unit
 * @returns
 */
const getMiliSecondFromDateUnit = (
  val: number | bigint,
  unit: DateUnit,
): number => {
  let milisecond = 0;
  switch (unit) {
    case DateUnit.DAY:
      {
        milisecond = Number(val) * 24 * 60 * 60 * 1000;
      }
      break;
    default:
      {
        milisecond = Number(val);
      }
      break;
  }
  return milisecond;
};

/**
 * get mili second base on time unit
 * @param val
 * @param unit
 * @returns
 */
const getMiliSecondFromTimeUnit = (
  val: number | bigint,
  unit: TimeUnit,
): number => {
  let milisecond = 0;
  switch (unit) {
    case TimeUnit.MICROSECOND:
      {
        milisecond = Number(val) / 1000;
      }
      break;
    case TimeUnit.NANOSECOND:
      {
        milisecond = Number(val) / 1000;
      }
      break;
    case TimeUnit.SECOND:
      {
        milisecond = Number(val) * 1000;
      }
      break;
    default:
      {
        milisecond = Number(val);
      }
      break;
  }
  return milisecond;
};

// export const getDefaultFormatterForType = (type: ColumnType): FormatterFn => {
//   let formatter: FormatterFn = defaultFormatterForString;
//   switch (columnTypeToString(type)) {
//     case 'date': {
//       formatter = defaultFormatterForDate;
//       break;
//     }
//     case 'datetime': {
//       formatter = defaultFormatterForDateTime;
//       break;
//     }
//     case 'time': {
//       formatter = defaultFormatterForTime;
//       break;
//     }
//     case 'struct': {
//       formatter = defaultFormatterForStruct;
//       break;
//     }
//     case 'array': {
//       formatter = defaultFormatterForArray;
//       break;
//     }
//     case 'map': {
//       formatter = defaultFormatterForMap;
//       break;
//     }
//     default: {
//       formatter = defaultFormatterForString;
//       break;
//     }
//   }
//   return formatter;
// };

export const defaultFormatterForString: FormatterFn = (e) => {
  const cell = e.cell as NormalCellDescriptor;
  const format =
    cell?.dataFormat?.type === 'string' ? cell.dataFormat : undefined;

  if (isHyperlinkDataFormat(format) && cell.linkLabel) {
    return cell.linkLabel;
  }

  let { val: value, valType: dataType } = preProcessData(e);
  if (value === '') return value;
  if (dataType !== 'string') value = String(value);
  return stringFormatter(value, -1, format);
};

// export const defaultFormatterForVariant: FormatterFn = (e) => {
//   const data = preProcessData(e);
//   if (data.valType === 'object') {
//     const variantType = data.val['__type'] as string;
//     if (variantType.startsWith('STRUCT') || variantType.endsWith('[]')) {
//       return data.val['__value'];
//     }
//     return JSON.parse(data.val['__value']);
//   }
//   return data.val;
// };

// export const defaultFormatterForDate: FormatterFn = (e) => {
//   const data = preProcessData(e);
//   if (data.val instanceof Date) return data.val.toLocaleDateString();
//   if (data.valType === 'number' || data.valType === 'bigint') {
//     const milisecond = getMiliSecondFromDateUnit(
//       data.val,
//       (e.cell.type as Date_).unit,
//     );
//     return new Date(milisecond).toLocaleDateString();
//   }
//   return data.val;
// };

// export const defaultFormatterForDateTime: FormatterFn = (e) => {
//   const data = preProcessData(e);

//   if (data.val instanceof Date) return data.val.toISOString();
//   if (data.valType === 'number' || data.valType === 'bigint') {
//     const milisecond = getMiliSecondFromTimeUnit(
//       data.val,
//       (e.cell.type as DateTime).unit,
//     );
//     return new Date(milisecond).toISOString();
//   }
//   return data.val;
// };

// export const defaultFormatterForTime: FormatterFn = (e) => {
//   const data = preProcessData(e);

//   if (data.val instanceof Date) {
//     return data.val.toLocaleTimeString('en-US', {
//       timeZone: 'GMT',
//     });
//   }
//   if (data.valType === 'number' || data.valType === 'bigint') {
//     const milisecond = getMiliSecondFromTimeUnit(
//       data.val,
//       (e.cell.type as Time).unit,
//     );
//     return new Date(milisecond).toLocaleTimeString('en-US', {
//       timeZone: 'GMT',
//     });
//   }
//   return data.val;
// };

// export const defaultFormatterForStruct: FormatterFn = (e) => {
//   const data = preProcessData(e);

//   if (data.valType !== 'string' && data.val) {
//     const fields = (e.cell.type as Struct).children;
//     const result = {};
//     for (const field of fields) {
//       const formatter = getDefaultFormatterForType(field.type);
//       result[field.name] = formatter({
//         ...e,
//         cell: { ...e.cell, type: field.type, value: data.val[field.name] },
//       });
//     }
//     return result;
//   }
//   return data.val;
// };

// export const defaultFormatterForArray: FormatterFn = (e) => {
//   const data = preProcessData(e);

//   if (data.valType !== 'string' && data.val) {
//     const field = (e.cell.type as List).child;
//     const result = [];
//     for (const childVal of data.val) {
//       const formatter = getDefaultFormatterForType(field.type);
//       result.push(
//         formatter({
//           ...e,
//           cell: { ...e.cell, type: field.type, value: childVal },
//         }),
//       );
//     }
//     return result;
//   }
//   return data.val;
// };

// export const defaultFormatterForMap: FormatterFn = (e) => {
//   const data = preProcessData(e);

//   if (data.valType !== 'string' && data.val) {
//     const fields = (e.cell.type as Map_).children;
//     const result = {};
//     const jsonValues = data.val.toJSON();
//     for (const [key, value] of Object.entries(jsonValues)) {
//       const keyFormatter = getDefaultFormatterForType(fields[0].type);
//       const valueFormatter = getDefaultFormatterForType(fields[1].type);
//       result[
//         keyFormatter({
//           ...e,
//           cell: { ...e.cell, type: fields[0].type, value: key },
//         })
//       ] = valueFormatter({
//         ...e,
//         cell: { ...e.cell, type: fields[1].type, value: value },
//       });
//     }
//     return result;
//   }
//   return data.val;
// };

// export const defaultFormatterForNested: FormatterFn = (e) => {
//   const data = preProcessData(e);

//   if (data.valType !== 'string' && data.val) {
//     const formatter = getDefaultFormatterForType(e.cell.type as ColumnType);
//     const val = formatter(e);
//     if (val && typeof val !== 'string') return JSON.stringify(val);
//     return val;
//   }
//   return data.val;
// };

const defaultFormatterForDbType: FormatterFn = (e) => {
  const cell = e.cell as NormalCellDescriptor;
  if (isHyperlinkDataFormat(cell.dataFormat) && cell.linkLabel) {
    return cell.linkLabel;
  }

  if (cell.displayValue) return cell.displayValue;

  const value = cell.value !== undefined ? cell.value : '';
  if (typeof value !== 'string' && cell.valueType) {
    const result = formatTableCellValue(
      value,
      cell.valueType,
      cell.dataFormat,
      {
        isRoot: true,
        locale: cell.locale,
        showHyperlink: true,
      },
    );
    if (typeof result !== 'string') {
      if (result.type === 'chip') {
        updateCellChipFormat(cell, [...result.value], result.chipsCount);
      } else if (result.type === 'accounting') {
        return updateCellAccoutingFormat(cell, result);
      } else if (result.type === 'hyperlink') {
        return updateCellHyperlinkFormat(cell, result);
      }
    } else {
      return result;
    }
  }

  return value;
};

export const defaultFormatters = {
  string: defaultFormatterForString,
  rowHeaderCell: defaultFormatterForString,
  headerCell: defaultFormatterForString,
  number: defaultFormatterForString,
  html: defaultFormatterForString,
  map: defaultFormatterForDbType,
  variant: defaultFormatterForDbType,
  null: defaultFormatterForDbType,
  boolean: defaultFormatterForDbType,
  int: defaultFormatterForDbType,
  float: defaultFormatterForDbType,
  decimal: defaultFormatterForDbType,
  bytes: defaultFormatterForDbType,
  date: defaultFormatterForDbType,
  time: defaultFormatterForDbType,
  datetime: defaultFormatterForDbType,
  timestamp: defaultFormatterForDbType,
  interval: defaultFormatterForDbType,
  geography: defaultFormatterForDbType,
  struct: defaultFormatterForDbType,
  json: defaultFormatterForDbType,
  array: defaultFormatterForDbType,
};
