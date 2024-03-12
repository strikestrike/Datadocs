/**
 * Because there may exist merged cell in the matrix is the reason why there is this method
 * Eg:
 * ```
 * |----------------|------|
 * | MergedCell 2x2 : NULL |
 * |- - - - - - - - |- - - |
 * |      NULL      : NULL |
 * |----------------|------|
 * Or:
 * |------|
 * | cell |
 * |------|
 * ```
 */
export function isOnlyOneCellInTheMatrix(
  matrix: {
    rowSpan?: number;
    colSpan?: number;
    columnSpan?: number;
  }[][],
): boolean {
  if (matrix.length === 1 && matrix[0].length === 1) return true;
  const firstCell = matrix[0][0];

  if (typeof firstCell.rowSpan === 'number') {
    if (firstCell.rowSpan !== matrix.length) return false;
  } else {
    return false;
  }

  if (typeof firstCell.colSpan === 'number') {
    if (firstCell.colSpan !== matrix[0].length) return false;
  } else if (typeof firstCell.columnSpan === 'number') {
    if (firstCell.columnSpan !== matrix[0].length) return false;
  } else {
    return false;
  }

  return true;
}
