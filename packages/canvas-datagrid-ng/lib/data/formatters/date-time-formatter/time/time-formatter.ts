import type { CellTimeTypeFormat } from '../../../../types/data-format';
import { getTimeDefaultFormat } from '../../util';
import { formatDateTimeData } from '../format';

const DEFAULT_TIME_FORMAT = getTimeDefaultFormat().format;

export function formatTime(
  value: number | Date,
  dataFormat: CellTimeTypeFormat,
  locale: string,
): string {
  const pattern = dataFormat?.format ?? DEFAULT_TIME_FORMAT;
  return formatDateTimeData(value, pattern, locale);
}
