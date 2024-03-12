import type { CellTimestampTypeFormat } from '../../../../types/data-format';
import { getTimestampDefaultFormat } from '../../util';
import { formatDateTimeData } from '../format';

const DEFAULT_TIMESTAMP_FORMAT = getTimestampDefaultFormat().format;

export function formatTimestamp(
  value: number | Date,
  dataFormat: CellTimestampTypeFormat,
  locale: string,
): string {
  const pattern = dataFormat?.format ?? DEFAULT_TIMESTAMP_FORMAT;
  return formatDateTimeData(value, pattern, locale, {
    name: dataFormat?.timeZone,
    offset: dataFormat?.timeZoneOffset,
  });
}
