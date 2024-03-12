/**
 * Get Undo/Redo value key from rowIndex and columnIndex
 *
 * Example: getUndoRedoCellKey(10, 10) => '10__10'
 * @param rowIndex
 * @param columnIndex
 * @returns
 */
export function getUndoRedoCellKey(rowIndex: number, columnIndex: number) {
  return rowIndex + '__' + columnIndex;
}

/**
 * Get back rowIndex and columnIndex from key
 *
 * Example: undoRedoKeyToIndex('10__10') => [10, 10]
 * @param key
 * @returns A pair of [rowIndex, columnIndex]
 */
export function undoRedoKeyToIndex(key: string) {
  const parts = key.split('__');
  return [parseInt(parts[0]), parseInt(parts[1])];
}
