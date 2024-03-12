import type { ColumnType, GridHeader } from '../../types';
import { integerToAlpha } from '../../util';

export function guessColumnSchemas(rows: any[], sample = 1) {
  let columns: GridHeader[] = [];
  if (rows.length > 0) {
    const samples = rows.slice(0, sample);
    const columnNames = Object.keys(rows[0]);
    const usedId = new Set<string>();
    columns = columnNames.map((key, index) =>
      guessColumnSchema(key, index, samples, usedId),
    );
  }
  return columns;
}

export function guessColumnSchema(
  columnName: string,
  originalColumnIndex: number,
  sampleRows: any[],
  usedId?: Set<string>,
): GridHeader {
  let type: ColumnType = 'string';
  for (let row = 0; row < sampleRows.length; row++) {
    const sampleRow = sampleRows[row];
    if (!sampleRow) continue;

    const sampleCell = sampleRow[columnName];
    if (sampleCell === undefined || sampleCell === null) continue;

    switch (typeof sampleCell) {
      case 'number':
        type = 'number';
        break;
      // ...
    }
    break;
  }
  const columnNameAsInt = parseInt(columnName, 10);
  let id = columnName;
  if (usedId) {
    for (let suffix = 0; usedId.has(id); suffix++)
      id = columnName + '_' + suffix;
    usedId.add(id);
  }
  return {
    dataKey: columnName,
    id,
    title: isNaN(columnNameAsInt)
      ? columnName
      : integerToAlpha(columnNameAsInt).toUpperCase(),
    originalColumnIndex,
    columnIndex: originalColumnIndex,
    columnViewIndex: originalColumnIndex,
    type,
  };
}
