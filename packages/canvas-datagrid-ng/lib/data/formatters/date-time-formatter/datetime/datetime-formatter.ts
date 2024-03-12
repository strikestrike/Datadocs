import type { CellDatetimeTypeFormat } from '../../../../types/data-format';
import { getDatetimeDefaultFormat } from '../../util';
import { formatDateTimeData } from '../format';

const DEFAULT_DATETIME_FORMAT = getDatetimeDefaultFormat().format;

export function formatDatetime(
  value: number | Date,
  dataFormat: CellDatetimeTypeFormat,
  locale: string,
): string {
  const pattern = dataFormat?.format ?? DEFAULT_DATETIME_FORMAT;
  return formatDateTimeData(value, pattern, locale);
}
