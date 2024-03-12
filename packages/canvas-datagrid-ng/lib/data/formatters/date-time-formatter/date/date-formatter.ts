import type { CellDateTimeFormat } from '../../../../types/data-format';
import { getDateDefaultFormat } from '../../util';
import { formatDateTimeData } from '../format';

const DEFAULT_DATE_FORMAT = getDateDefaultFormat().format;

export function formatDate(
  value: number | Date,
  dataFormat: CellDateTimeFormat,
  locale: string,
): string {
  const pattern = dataFormat?.format ?? DEFAULT_DATE_FORMAT;
  return formatDateTimeData(value, pattern, locale);
}
