import type { GridPrivateProperties } from './types';
import { copyMethods } from './util';

export default function loadGridSizeHelper(self: GridPrivateProperties) {
  copyMethods(new GridSizeHelper(self), self);
}

export class GridSizeHelper {
  constructor(private readonly self: GridPrivateProperties) {}

  /**
   * Calculate the scroll position for the given row index.
   *
   * This method is designed to work with only a small amount of visible row
   * data where the number of rows doesn't surpass 10k.
   * @param rowIndex
   * @param excludeFrozenRows Whether to exclude frozen rows when calculating the scroll position.
   * @param targetInclusive Include the height of the target cell.
   * @returns The scroll position for the given row index, or '0' if `rowIndex` is frozen and `excludeFrozenRows` is true.
   */
  getScrollCacheY = (
    rowIndex: number,
    excludeFrozenRows?: boolean,
    targetInclusive?: boolean,
  ): number => {
    // console.log('getScrollCacheY(' + rowIndex + ') ' + (window['__invokeCount'] = (window['__invokeCount'] || 0) + 1));
    const { self } = this;
    return self.dataSource.positionHelper.getVerticalScrollPixelForIndex(
      self.style.cellHeight,
      self.frozenRow,
      rowIndex,
      excludeFrozenRows,
      targetInclusive,
    );
  };

  /**
   * Calculate the scroll position for the given column index.
   *
   * This method is designed to work with only a small amount of visible row
   * data where the number of rows doesn't surpass 10k.
   * @param columnIndex
   * @param excludeFrozenColumns Whether to exclude frozen columns when calculating the scroll position.
   * @param targetInclusive Include the width of the target cell.
   * @returns The scroll position for the given column index, or '0' if `columnIndex` is frozen and `excludeFrozenColumns` is true.
   */
  getScrollCacheX = (
    columnIndex: number,
    excludeFrozenColumns?: boolean,
    targetInclusive?: boolean,
  ): number => {
    const { self } = this;
    return self.dataSource.positionHelper.getHorizontalScrollPixelForIndex(
      self.style.cellWidth,
      self.frozenColumn,
      columnIndex,
      excludeFrozenColumns,
      targetInclusive,
    );
  };

  /**
   * @returns dataHeight
   */
  initializeAllRowsHeight = (rows?: number) => {
    const { self } = this;
    if (isNaN(rows)) rows = self.dataSource.state.rows || 0;
    let dataHeight = rows > 0 ? this.getScrollCacheY(rows - 1, true, true) : 0;

    const defaultRowHeight = self.style.cellHeight;
    if (self.attributes.showNewRow) dataHeight += defaultRowHeight;
    if (self.attributes.snapToRow) dataHeight += defaultRowHeight;
    return dataHeight;
  };

  /**
   * @returns dataWidth
   */
  initializeAllColumnsWidth = (columns?: number) => {
    const { self } = this;
    if (isNaN(columns)) columns = self.dataSource.state.cols || 0;
    return columns > 0 ? this.getScrollCacheX(columns - 1, true, true) : 0;
  };
}
