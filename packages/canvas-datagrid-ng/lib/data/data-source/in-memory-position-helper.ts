import type { DataSourceBase } from './spec';
import type { InMemoryHiddenRangeStore } from './in-memory-hidden-range-store';
import type { SizesManager } from './sizes-manager';
import type { ScrollTarget, PositionHelper } from './types/position-helper';

export class InMemoryPositionHelper implements PositionHelper {
  readonly visibleScrollIndexes = { rowIndex: 0, columnIndex: 0 };

  constructor(
    private readonly dataSource: DataSourceBase,
    private readonly sizes: SizesManager,
    private readonly hiddenRowRanges: InMemoryHiddenRangeStore,
  ) {}

  getHidingRange = (index: number) => {
    return this.hiddenRowRanges.getHidingRange(index);
  };

  getHorizontalLastScrollTarget = (
    defaultColumnWidth: number,
    lastColumnIndex: number,
    trackWidth: number,
  ) => {
    let current = 0;
    for (let i = lastColumnIndex; i >= 0; i--) {
      current += this.sizes.getColumnWidth(i, defaultColumnWidth);
      if (current >= trackWidth) {
        return { index: i, pixel: Math.round(current - trackWidth) };
      }
    }
    return { index: 0, pixel: 0 };
  };

  getHorizontalScrollTargetForPixel = (
    defaultColumnWidth: number,
    frozenColumn: number,
    scrollLeft: number,
  ): ScrollTarget => {
    let index = frozenColumn;
    let pixel = 0;
    let done = false;

    const fillWithWidth = (width: number) => {
      const change = scrollLeft - pixel;
      index += Math.floor(change / width);
      pixel += change - (change % width);
    };

    let prev = frozenColumn;
    this.sizes.columns.records.forEachPair((currentIndex, record, _) => {
      const unsetIndexCount = currentIndex - prev;

      if (
        currentIndex < frozenColumn &&
        (record.endIndex === undefined || record.endIndex < frozenColumn)
      ) {
        return;
      }
      if (currentIndex < frozenColumn) {
        // If the frozen row is separating a collectively set height for a bunch
        // of rows, set the current index to the frozen row index and calculate
        // the added height from there.
        if (record.endIndex >= frozenColumn) {
          currentIndex = frozenColumn;
        } else {
          return;
        }
      }

      // Fill with default row height if there were rows between the
      // previous row and this row (both of which have custom heights).
      if (unsetIndexCount > 0) {
        const increase = defaultColumnWidth * unsetIndexCount;
        // If the resulting heights surpasses the scroll top break the loop
        // without adding anything. We will just fill the default heights
        // instead in `STAGE: Fill default heights`.
        if (pixel + increase > scrollLeft) return { break: true };

        index += unsetIndexCount;
        pixel += increase;
      }

      const size = record.data;
      const totalCount = 1 + (record.endIndex ?? currentIndex) - currentIndex;
      const totalSize = size * totalCount;
      if (pixel + totalSize > scrollLeft) {
        fillWithWidth(size);
        done = true;
        return { break: true };
      }
      pixel += totalSize;
      index += totalCount;

      prev = currentIndex + totalCount;
    });

    // STAGE: Fill default heights.
    // Custom heights didn't fully fill `pixel` and `index`, so find them by
    // filling remaining space with the default row height.
    if (!done) {
      fillWithWidth(defaultColumnWidth);
    }

    return { index, pixel: Math.floor(scrollLeft - pixel) };
  };

  getHorizontalScrollPixelForIndex = (
    defaultColumnWidth: number,
    frozenColumn: number,
    columnIndex: number,
    excludeFrozenColumns?: boolean,
    targetInclusive?: boolean,
  ): number => {
    if (!targetInclusive) columnIndex--;

    // If frozen columns are excluded and the given column index is frozen, return early.
    if (excludeFrozenColumns && columnIndex < frozenColumn) return 0;
    const { records } = this.sizes.columns;

    let scrollCacheX =
      defaultColumnWidth *
      (columnIndex - (excludeFrozenColumns ? frozenColumn : 0) + 1);
    records.forRange(0, columnIndex, true, (currentIndex, record, _) => {
      if (currentIndex < 0) return;
      if (excludeFrozenColumns && currentIndex < frozenColumn) {
        if (record.endIndex >= frozenColumn) {
          currentIndex = frozenColumn;
        } else {
          return;
        }
      }
      const total =
        1 +
        Math.min(columnIndex, record.endIndex ?? currentIndex) -
        currentIndex;
      const size = record.data * total;
      scrollCacheX += size - defaultColumnWidth * total;
    });
    return scrollCacheX;
  };

  getVerticalLastScrollTarget = (
    defaultRowHeight: number,
    lastRowIndex: number,
    trackHeight: number,
  ) => {
    const hiddenRowIterator = this.hiddenRowRanges.iterator(true);
    let current = 0;
    for (let i = lastRowIndex; i >= 0; i--) {
      const hidingRange = hiddenRowIterator.getHidingRange(i);
      if (hidingRange) {
        i = hidingRange.start;
        continue;
      }

      current += this.sizes.getRowHeight(i, defaultRowHeight);
      if (current >= trackHeight) {
        return { index: i, pixel: Math.round(current - trackHeight) };
      }
    }
    return { index: 0, pixel: 0 };
  };

  getVerticalScrollTargetForPixel = (
    defaultRowHeight: number,
    frozenRow: number,
    scrollTop: number,
  ): ScrollTarget => {
    let index = frozenRow;
    let pixel = 0;

    const fillWithHeight = (height: number, maxIndex: number) => {
      const change = scrollTop - pixel;
      const indexChange = Math.floor(change / height);
      if (index + indexChange <= maxIndex) {
        index += indexChange;
        pixel += change - (change % height);
        return true;
      }
      pixel += height * (maxIndex - index + 1);
      index = maxIndex;
      return false;
    };

    const calculate = (prev: number, maxIndex: number): boolean => {
      const firstRecord = this.sizes.rows.records.getPairOrNextLower(prev);
      const start = firstRecord?.[1]?.endIndex >= prev ? firstRecord[0] : prev;
      const entries = this.sizes.rows.records.entries(start);

      index = prev;

      for (const entry of entries) {
        let currentIndex = Math.max(entry[0], index);
        const record = entry[1];
        const unsetIndexCount = currentIndex - prev;

        if (
          currentIndex < frozenRow &&
          (record.endIndex === undefined || record.endIndex < frozenRow)
        ) {
          return;
        }
        if (currentIndex < frozenRow) {
          // If the frozen row is separating a collectively set height for a bunch
          // of rows, set the current index to the frozen row index and calculate
          // the added height from there.
          if (record.endIndex >= frozenRow) {
            currentIndex = frozenRow;
          } else {
            continue;
          }
        }

        // Fill with default row height if there were rows between the
        // previous row and this row (both of which have custom heights).
        if (unsetIndexCount > 0) {
          const increase = defaultRowHeight * unsetIndexCount;
          // If the resulting heights surpasses the scroll top break the loop
          // without adding anything. We will just fill the default heights
          // instead in `STAGE: Fill default heights`.
          if (
            pixel + increase > scrollTop ||
            index + unsetIndexCount > maxIndex
          ) {
            break;
          }

          index += unsetIndexCount;
          pixel += increase;
        }

        const endIndex = Math.min(record.endIndex ?? currentIndex, maxIndex);
        const size = record.data;
        const totalCount = 1 + endIndex - currentIndex;
        const totalSize = size * totalCount;
        if (pixel + totalSize > scrollTop) {
          if (fillWithHeight(size, maxIndex)) return true;
        }
        pixel += totalSize;
        index += totalCount;

        prev = currentIndex + totalCount;

        if (endIndex === maxIndex) break;
      }

      // STAGE: Fill default heights.
      // Custom heights didn't fully fill `pixel` and `index`, so find them by
      // filling remaining space with the default row height.
      return fillWithHeight(defaultRowHeight, maxIndex);
    };

    let done = false;
    let previous = frozenRow;

    if (this.hiddenRowRanges.size > 0) {
      for (const [from, data] of this.hiddenRowRanges.entries(0)) {
        if (data.end < previous) continue;
        if (calculate(previous, from - 1)) {
          done = true;
          break;
        }

        // The next index might also be hidden, so try to skip it.
        previous = data.end + 1;
      }
    }

    if (!done) {
      calculate(previous, this.dataSource.state.rows - 1);
    }

    return { index, pixel: Math.floor(scrollTop - pixel) };
  };

  getVerticalScrollPixelForIndex = (
    defaultRowHeight: number,
    frozenRow: number,
    rowIndex: number,
    excludeFrozenRows?: boolean,
    targetInclusive?: boolean,
  ): number => {
    if (!targetInclusive) rowIndex--;

    // If frozen rows are excluded and the given row index is frozen, return early.
    if (excludeFrozenRows && rowIndex < frozenRow) return 0;

    let scrollCacheY =
      defaultRowHeight * (rowIndex - (excludeFrozenRows ? frozenRow : 0) + 1);

    const consumeCustomSizes = (from: number, end: number) => {
      let start = from;
      const inclusive = this.sizes.rows.getRecord(from);
      if (inclusive) start = inclusive.startIndex ?? from;

      const entries = this.sizes.rows.records.entries(start);
      for (const pair of entries) {
        let currentIndex = Math.max(pair[0], from);
        const record = pair[1];

        if (currentIndex < 0) return;
        if (excludeFrozenRows && currentIndex < frozenRow) {
          if (record.endIndex >= frozenRow) {
            currentIndex = frozenRow;
          } else {
            continue;
          }
        }

        const endIndex = Math.min(end, record.endIndex ?? currentIndex);
        const total = 1 + endIndex - currentIndex;
        if (total > 0) {
          const size = record.data * total;
          scrollCacheY += size - defaultRowHeight * total;
        }
      }
    };

    let previous = 0;
    this.hiddenRowRanges.forRange(0, rowIndex, true, (start, end) => {
      if (excludeFrozenRows && end < frozenRow) return;
      const change =
        Math.min(end, rowIndex) -
        (excludeFrozenRows ? Math.max(frozenRow, start) : start) +
        1;
      scrollCacheY -= defaultRowHeight * change;
      if (previous <= start - 1) {
        consumeCustomSizes(previous, Math.min(start - 1, rowIndex));
      }
      previous = end + 1;
    });

    if (previous < rowIndex) {
      consumeCustomSizes(previous, rowIndex);
    }

    return scrollCacheY;
  };

  getPercentageAsVerticalScrollIndex = (
    totalScrollableIndexCount: number,
    amount: number,
  ) => {
    amount = Math.min(Math.max(amount, 0), 1);

    const target = Math.floor(totalScrollableIndexCount * amount);
    let consumed = 0;
    let start = 0;

    for (const [from, data] of this.hiddenRowRanges.entries()) {
      if (from <= start) continue;

      consumed += from - start + 1;
      if (consumed >= target) {
        return from - (consumed - target);
      }

      start = data.end + 1;
    }

    return start + (target - consumed);
  };

  getVerticalScrollIndexAsPercentage = (
    totalScrollableIndexCount: number,
    index: number,
  ) => {
    let amount = index;
    for (const [from, data] of this.hiddenRowRanges.entries()) {
      if (from > index) break;
      amount -= Math.min(data.end, index) - from + 1;
    }

    return amount / totalScrollableIndexCount;
  };

  getVisibleRowIndex = (baseIndex: number, change: number, max?: number) => {
    return this.hiddenRowRanges.getVisibleIndex(baseIndex, change, max);
  };

  getMinScrollableRowIndex = () => {
    return this.visibleScrollIndexes.rowIndex;
  };

  getMinScrollableColumnIndex = () => {
    return this.visibleScrollIndexes.columnIndex;
  };

  hasHiddenRows = (fromIndex: number, toIndex: number) =>
    this.hiddenRowRanges.hasHidden(fromIndex, toIndex);

  isRowHidden = (index: number) => this.hiddenRowRanges.isHidden(index);

  shiftHorizontalPositionByPixels = (
    defaultColumnWidth: number,
    frozenColumn: number,
    currentIndex: number,
    currentPixel: number,
    changeInPixels: number,
  ) => {
    let index = currentIndex;
    let pixel = currentPixel + changeInPixels;
    while (
      pixel !== 0 &&
      index >= frozenColumn &&
      (pixel > 0 || index > frozenColumn)
    ) {
      const size = this.sizes.getColumnWidth(
        index - (pixel < 0 ? 1 : 0),
        defaultColumnWidth,
      );
      if (pixel < 0) {
        pixel += size;
        index--;
      } else if (pixel > size) {
        pixel -= size;
        index++;
      } else {
        break;
      }
    }

    return { index, pixel };
  };

  shiftVerticalPositionByPixels = (
    defaultRowHeight: number,
    frozenRow: number,
    currentIndex: number,
    currentPixel: number,
    changeInPixels: number,
  ) => {
    const hiddenRanges = this.hiddenRowRanges.iterator(changeInPixels < 0);

    let index = currentIndex;
    let pixel = currentPixel + changeInPixels;
    while (
      pixel !== 0 &&
      index >= frozenRow &&
      (pixel > 0 || index > frozenRow)
    ) {
      const targetIndex = index - (pixel < 0 ? 1 : 0);
      const size = this.sizes.getRowHeight(targetIndex, defaultRowHeight);
      const hiddenRange = hiddenRanges.getHidingRange(targetIndex);
      if (pixel < 0) {
        if (hiddenRange) {
          index = hiddenRange.start;
        } else {
          pixel += size;
          index--;
        }
      } else if (pixel > size) {
        if (hiddenRange) {
          index = hiddenRange.end + 1;
        } else {
          pixel -= size;
          index++;
        }
      } else {
        break;
      }
    }

    return { index, pixel };
  };

  getHiddenRowCount(until?: number): number {
    return this.hiddenRowRanges.getHiddenIndexCount(until);
  }
}
