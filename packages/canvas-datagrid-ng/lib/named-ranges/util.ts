import type { SelectionDescriptor } from '../selections/types';
import { SelectionType } from '../selections/util';
import { alphaToInteger, integerToAlpha } from '../util';
import { NAMED_RANGE_PATTERN, NAMED_RANGE_PATTERN_FRIENDLY } from './constants';

export const getSelectionAsRangeString = (
  selection: SelectionDescriptor,
  friendly = false,
) => {
  const columnName1 = integerToAlpha(selection.startColumn).toUpperCase();
  const columnName2 = integerToAlpha(selection.endColumn).toUpperCase();
  const row1 = selection.startRow + 1;
  const row2 = selection.endRow + 1;
  const prefix = friendly ? '' : '$';

  if (selection.type === SelectionType.Columns) {
    return `${prefix}${columnName1}:${prefix}${columnName2}`;
  } else if (selection.type === SelectionType.Rows) {
    return `${prefix}${row1}:${prefix}${row2}`;
  } else if (columnName1 !== columnName2 || row1 !== row2) {
    return `${prefix}${columnName1}${row1}:${prefix}${columnName2}${row2}`;
  }

  return `${prefix}${columnName1}${row1}`;
};

export const getSelectionsAsRangeString = (
  selections: SelectionDescriptor[],
  friendly = false,
) =>
  selections
    .map((selection) => {
      return getSelectionAsRangeString(selection, friendly);
    })
    .join(',');

/**
 * Get selection from a range string.
 * @param range To get the selection from.
 * @param friendly Friendly mode consider the range to be free of $ signs.
 * @param cellsOnly Don't match row/column selections.
 * @returns The selection if successfully parsed, or undefined on failure.
 */
export const getSelectionFromRange = (
  range: string,
  friendly = false,
  cellsOnly = false,
): SelectionDescriptor => {
  // range should like 'A10:B20' -> ['A','10','B','20']
  const match = matchRange(range, friendly);
  if (!match || !match.groups) {
    console.warn("cell range must be written in the format 'A1:B2' or 'C3'");
    return;
  }
  const col1 = match.groups['c1'];
  const col2 = match.groups['c2'];
  const row1 = match.groups['r1'];
  const row2 = match.groups['r2'];

  if (col1 && col2 && row1 && row2) {
    return {
      type: SelectionType.Cells,
      startRow: parseInt(row1) - 1,
      startColumn: alphaToInteger(col1),
      endRow: parseInt(row2) - 1,
      endColumn: alphaToInteger(col2),
    };
  } else if (col1 && row1 && !col2 && !row2) {
    const startRow = parseInt(row1) - 1;
    const startColumn = alphaToInteger(col1);
    return {
      type: SelectionType.Cells,
      startRow,
      startColumn,
      endRow: startRow,
      endColumn: startColumn,
    };
  } else if (col1 && col2 && !row1 && !row2) {
    return {
      type: SelectionType.Columns,
      startColumn: alphaToInteger(col1),
      endColumn: alphaToInteger(col2),
    };
  } else if (row1 && row2 && !col1 && !col2) {
    return {
      type: SelectionType.Rows,
      startRow: parseInt(row1) - 1,
      endRow: parseInt(row2) - 1,
    };
  }
};

export const matchRange = (
  range: string,
  friendly = false,
): RegExpMatchArray | null => {
  return range
    .toLocaleUpperCase()
    .match(friendly ? NAMED_RANGE_PATTERN_FRIENDLY : NAMED_RANGE_PATTERN);
};
