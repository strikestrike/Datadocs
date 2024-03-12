import type {
  IntervalDescriptor,
  RangeDescriptor,
  SkippedRangeDescriptor,
} from '../types/base-structs';
import type { GridHeader } from '../types/column-header';

export const getSkipsFromNumbers = (numbers: number[]) => {
  if (
    numbers.length <= 0 ||
    numbers[numbers.length - 1] - numbers[0] + 1 <= numbers.length
  ) {
    return [];
  }
  const result: [number, number][] = [];
  let previous = numbers[0];
  for (const item of numbers) {
    if (item - previous > 1) {
      result.push([previous + 1, item - 1]);
    }
    previous = item;
  }
  return result;
};

export const getSkipsFromArray = <T>(
  items: T[],
  mapper: (item: T) => number,
) => {
  if (
    items.length <= 0 ||
    mapper(items[items.length - 1]) - mapper(items[0]) + 1 <= items.length
  ) {
    return [];
  }
  const result: [number, number][] = [];
  let previous = mapper(items[0]);
  for (const item of items) {
    const numberItem = mapper(item);
    if (numberItem - previous > 1) {
      result.push([previous + 1, numberItem - 1]);
    }
    previous = numberItem;
  }
  return result;
};

export const filterColumnsWithSparseRange = (
  columns: GridHeader[],
  sparseRange?: IntervalDescriptor[],
) => {
  if (!sparseRange) return columns;
  return columns.filter(
    (column) =>
      !sparseRange.find(
        ([start, end]) =>
          start <= column.columnIndex && end >= column.columnIndex,
      ),
  );
};

export const isInRange = (
  table: RangeDescriptor,
  rowIndex: number,
  columnIndex: number,
) =>
  !(
    table.startRow > rowIndex ||
    table.startColumn > columnIndex ||
    table.endRow < rowIndex ||
    table.endColumn < columnIndex
  );

export const checkIfRangesIntersect = (
  range1: RangeDescriptor,
  range2: RangeDescriptor,
) =>
  !(
    range1.startRow > range2.endRow ||
    range1.endRow < range2.startRow ||
    range1.startColumn > range2.endColumn ||
    range1.endColumn < range2.startColumn
  );

/**
 * Trims the start and end of the range descriptor if they are already skipped.
 *
 * Note that the first and last item on the skips array should be ordered and
 * should not be out of bounds.
 * @param desc To trim.
 */
export const trimSkippedRangeDescriptor = (desc: SkippedRangeDescriptor) => {
  const { skippedRows: rows, skippedColumns: columns } = desc;
  if (rows?.length > 0) {
    const beginning = rows[0];
    const end = rows[rows.length - 1];
    if (beginning[0] <= desc.startRow && beginning[1] >= desc.startRow) {
      desc.startRow = Math.max(desc.startRow, beginning[1]);
    }
    if (end[1] >= desc.endRow && end[0] <= desc.endRow) {
      desc.endRow = Math.min(desc.endRow, end[0]);
    }
  }
  if (columns?.length > 0) {
    const beginning = columns[0];
    const end = columns[columns.length - 1];
    if (beginning[0] <= desc.startColumn && beginning[1] >= desc.startColumn) {
      desc.startColumn = Math.max(desc.startColumn, beginning[1]);
    }
    if (end[1] >= desc.endColumn && end[0] <= desc.endColumn) {
      desc.endColumn = Math.min(desc.endColumn, end[0]);
    }
  }
  if (desc.startRow > desc.endRow || desc.startColumn > desc.endColumn) {
    throw new Error('Range error');
  }
};

/**
 * Check if the given range fully contains the other range.
 * @param biggerRange That should contain the smaller range.
 * @param smallerRange That the bigger range should contain.
 * @returns True if the bigger range fully contains the smaller range.
 */
export const checkIfRangeFullyContainsRange = (
  biggerRange: RangeDescriptor,
  smallerRange: RangeDescriptor,
) =>
  biggerRange.startRow <= smallerRange.startRow &&
  biggerRange.startColumn <= smallerRange.startColumn &&
  biggerRange.endRow >= smallerRange.endRow &&
  biggerRange.endColumn >= smallerRange.endColumn;

/**
 * Get the difference between the base range and the smaller range.
 *
 * This might produce multiple ranges if the diff range is growing from multiple
 * sides.
 * @param baseRange To avoid.
 * @param diffRange To get the diff for.
 * @see checkIfRangeFullyContainsRange
 */
export const getRangeDiff = (
  baseRange: RangeDescriptor,
  diffRange: RangeDescriptor,
) => {
  // Please notice that only one side is expected to load the corners, meaning
  // when the smaller range is growing to the left and the top, only the
  // horizontal sides are going to load the corner difference.
  const results: RangeDescriptor[] = [];
  if (diffRange.startRow < baseRange.startRow) {
    results.push({
      startRow: diffRange.startRow,
      endRow: baseRange.startRow - 1,
      startColumn: Math.min(diffRange.startColumn, baseRange.startColumn),
      endColumn: Math.max(diffRange.endColumn, baseRange.endColumn),
    });
  }
  if (diffRange.endRow > baseRange.endRow) {
    results.push({
      startRow: baseRange.endRow + 1,
      endRow: diffRange.endRow,
      startColumn: Math.min(diffRange.startColumn, baseRange.startColumn),
      endColumn: Math.max(diffRange.endColumn, baseRange.endColumn),
    });
  }
  if (diffRange.startColumn < baseRange.startColumn) {
    results.push({
      startRow: baseRange.startRow,
      endRow: baseRange.endRow,
      startColumn: diffRange.startColumn,
      endColumn: baseRange.startColumn - 1,
    });
  }
  if (diffRange.endColumn > baseRange.endColumn) {
    results.push({
      startRow: baseRange.startRow,
      endRow: baseRange.endRow,
      startColumn: baseRange.endRow + 1,
      endColumn: diffRange.endRow,
    });
  }
  return results;
};

export const getIntersectingRangeArea = (
  range1: RangeDescriptor,
  range2: RangeDescriptor,
): RangeDescriptor | undefined => {
  if (!checkIfRangesIntersect(range1, range2)) return;
  return {
    startRow: Math.max(range1.startRow, range2.startRow),
    startColumn: Math.max(range1.startColumn, range2.startColumn),
    endRow: Math.min(range1.endRow, range2.endRow),
    endColumn: Math.min(range1.endColumn, range2.endColumn),
  };
};

/**
 * Grow the first range with the other range.
 * @param grow To grow.
 * @param range To grow with.
 */
export const growRange = (grow: RangeDescriptor, range: RangeDescriptor) => {
  grow.startRow = Math.min(grow.startRow, range.startRow);
  grow.startColumn = Math.min(grow.startColumn, range.startColumn);
  grow.endRow = Math.max(grow.endRow, range.endRow);
  grow.endColumn = Math.max(grow.endColumn, range.endColumn);
};

export const areRangesEqual = (
  range1: RangeDescriptor,
  range2: RangeDescriptor,
) =>
  (range1 && range1 == range2) ||
  (range1.startRow === range2.startRow &&
    range1.startColumn === range2.startColumn &&
    range1.endRow === range2.endRow &&
    range1.endColumn === range2.endColumn);
