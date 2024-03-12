import type { MergedCellDescriptor } from '../../types/cell';
import { MergeDirection } from '../../types/cell';
import type { RangeDescriptor } from '../../types/base-structs';
import { checkIfRangesIntersect, isInRange } from '../../range/util';
import type { OccupancyGraph } from '../reorder/occupancy-graph';
import type { MergedCellsManager } from './spec';

const checkIfIntersects = (
  desc: MergedCellDescriptor,
  startRow: number,
  startColumn: number,
  endRow: number,
  endColumn: number,
) =>
  !(
    desc.startRow > endRow ||
    desc.startColumn > endColumn ||
    desc.endRow < startRow ||
    desc.endColumn < startColumn
  );

export class DefaultMergedCellsManager implements MergedCellsManager {
  private records: MergedCellDescriptor[] = [];

  merge = (range: RangeDescriptor, direction: MergeDirection) => {
    const { startRow, startColumn, endRow, endColumn } = range;
    if (
      startRow > endRow ||
      startColumn > endColumn ||
      (direction === MergeDirection.Horizontal && startColumn === endColumn) ||
      (direction === MergeDirection.Vertical && startRow === endRow) ||
      (startRow === endRow && startColumn === endColumn)
    ) {
      return false;
    }
    this.unmergeRange(range);

    if (direction === MergeDirection.Horizontal) {
      for (let i = startRow; i <= endRow; i++) {
        this.records.push({
          startRow: i,
          endRow: i,
          startColumn,
          endColumn,
        });
      }
    } else if (direction === MergeDirection.Vertical) {
      for (let i = startColumn; i <= endColumn; i++) {
        this.records.push({
          startRow,
          endRow,
          startColumn: i,
          endColumn: i,
        });
      }
    } else {
      this.records.push({ startRow, startColumn, endRow, endColumn });
    }

    return true;
  };

  unmerge = (rowIndex: number, columnIndex: number) => {
    let i = 0;
    for (const desc of this.records) {
      if (isInRange(desc, rowIndex, columnIndex)) {
        this.records.splice(i, 1);
        return true;
      }
      i++;
    }
    return false;
  };

  unmergeRange = (range: RangeDescriptor) => {
    const unmergedCells: MergedCellDescriptor[] = [];
    this.records = this.records.filter((desc) => {
      if (checkIfRangesIntersect(desc, range)) {
        unmergedCells.push(desc);
        return false;
      }
      return true;
    });
    return unmergedCells;
  };

  checkBeforeMove = (
    range: RangeDescriptor,
    rowOffset: number,
    columnOffset: number,
  ) => {
    const targetRange: RangeDescriptor = {
      startRow: range.startRow + rowOffset,
      startColumn: range.startColumn + columnOffset,
      endRow: range.endRow + rowOffset,
      endColumn: range.endColumn + columnOffset,
    };
    for (const record of this.records) {
      if (
        !checkIfRangesIntersect(record, range) &&
        checkIfRangesIntersect(record, targetRange)
      ) {
        return false;
      }
    }
    return true;
  };

  checkBeforeReorder = (
    isRow: boolean,
    beginIndex: number,
    count: number,
    afterIndex?: number,
    occupancyGraph?: OccupancyGraph,
  ): boolean | number => {
    const endIndex = beginIndex + count - 1;
    let max: number | undefined;
    for (const desc of this.records) {
      const descStart = isRow ? desc.startRow : desc.startColumn;
      const descEnd = isRow ? desc.endRow : desc.endColumn;

      if (
        (beginIndex <= descStart && endIndex >= descEnd) ||
        (afterIndex === undefined &&
          (beginIndex > descEnd || endIndex < descStart)) ||
        (afterIndex > beginIndex &&
          (afterIndex < descStart || beginIndex > descEnd)) ||
        (afterIndex < beginIndex &&
          (afterIndex > descEnd || endIndex < descStart))
      ) {
        continue;
      }

      occupancyGraph?.add(descStart, descEnd);

      if (!(descEnd < beginIndex || descStart > endIndex)) {
        return false;
      } else if (
        afterIndex !== undefined &&
        afterIndex >= descStart &&
        afterIndex < descEnd
      ) {
        max =
          afterIndex > beginIndex
            ? Math.min(descStart - 1, max ?? afterIndex)
            : Math.max(descEnd + 1, max ?? afterIndex);
      }

      // If 'max' is in the reordering boundaries, consider that as if
      // the user hasn't moved the reordering overlay yet.
      if (max >= beginIndex && max <= endIndex) return false;
    }

    return max ?? true;
  };

  contains = (rowIndex: number, columnIndex) => {
    for (const desc of this.records) {
      if (isInRange(desc, rowIndex, columnIndex)) return true;
    }
    return false;
  };

  containsInRange = (range: RangeDescriptor) => {
    for (const desc of this.records) {
      if (checkIfRangesIntersect(desc, range)) {
        return true;
      }
    }
    return false;
  };

  get = (rowIndex: number, columnIndex: number) => {
    for (const desc of this.records) {
      if (isInRange(desc, rowIndex, columnIndex)) return desc;
    }
  };

  getForRange = (range: RangeDescriptor, result?: MergedCellDescriptor[]) => {
    if (!result) result = [];
    for (const desc of this.records) {
      if (!checkIfRangesIntersect(desc, range)) continue;
      result.push(desc);
    }
    return result;
  };

  insertRows = (afterIndex: number, count: number) =>
    this.insert(true, afterIndex, count);

  insertColumns = (afterIndex: number, count: number) =>
    this.insert(false, afterIndex, count);

  private insert = (isRow: boolean, afterIndex: number, count: number) => {
    for (const desc of this.records) {
      const index = isRow ? desc.startRow : desc.startColumn;
      if (afterIndex >= index) continue;

      if (isRow) {
        desc.startRow += count;
      } else {
        desc.startColumn += count;
      }
    }
  };

  move = (range: RangeDescriptor, rowOffset: number, columnOffset: number) => {
    const records: MergedCellDescriptor[] = [];
    for (const desc of this.records) {
      if (checkIfRangesIntersect(desc, range)) {
        desc.startRow += rowOffset;
        desc.startColumn += columnOffset;
        desc.endRow += rowOffset;
        desc.endColumn += columnOffset;
      } else if (
        checkIfIntersects(
          desc,
          range.startRow + rowOffset,
          range.startColumn + columnOffset,
          range.endRow + rowOffset,
          range.endColumn + columnOffset,
        )
      ) {
        // Delete this merged cell since it is not being moved and is on the
        // target position.
        continue;
      }

      records.push(desc);
    }

    this.records = records;
  };

  reorderColumns = (beginIndex: number, count: number, afterIndex: number) =>
    this.reorder(beginIndex, count, afterIndex, false);

  reorderRows = (beginIndex: number, count: number, afterIndex: number) =>
    this.reorder(beginIndex, count, afterIndex, true);

  private reorder = (
    beginIndex: number,
    count: number,
    afterIndex: number,
    isRow: boolean,
  ) => {
    const endIndex = beginIndex + count - 1;
    const isAscending = afterIndex > beginIndex;
    const affectedStart = isAscending ? endIndex + 1 : afterIndex + 1;
    const affectedEnd = isAscending ? afterIndex : beginIndex - 1;

    for (const desc of this.records) {
      const descStart = isRow ? desc.startRow : desc.startColumn;
      const descEnd = isRow ? desc.endRow : desc.endColumn;

      if (affectedStart <= descStart && affectedEnd >= descEnd) {
        // Move the descriptor if it is affected by the move but is not inside
        // selection.
        const diff = isAscending ? -count : count;
        if (isRow) {
          desc.startRow += diff;
          desc.endRow += diff;
        } else {
          desc.startColumn += diff;
          desc.endColumn += diff;
        }
      } else if (beginIndex <= descStart && endIndex >= descEnd) {
        // Move the descriptor if its fully covered by the selection.
        const diff = isAscending
          ? afterIndex - endIndex
          : afterIndex + 1 - beginIndex;
        if (isRow) {
          desc.startRow += diff;
          desc.endRow += diff;
        } else {
          desc.startColumn += diff;
          desc.endColumn += diff;
        }
      }
    }
  };
}
