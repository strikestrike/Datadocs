import type { CellIndex } from '../../../types';
import type { HiddenRange } from './hidden-range-store';

/**
 * @see PositionHelper.getHorizontalScrollTargetForPixel
 * @see PositionHelper.getVerticalScrollTargetForPixel
 */
export type ScrollTarget = {
  /**
   * The target index that that the given pixel points to.
   */
  index: number;

  /**
   * The leftover pixel from the given pixel for the target index.
   */
  pixel: number;
};

export interface PositionHelper {
  getHidingRange(index: number): HiddenRange | undefined;

  getHorizontalLastScrollTarget(
    defaultColumnWidth: number,
    lastColumnIndex: number,
    trackWidth: number,
  ): ScrollTarget;

  getHorizontalScrollTargetForPixel(
    defaultColumnWidth: number,
    frozenColumn: number,
    scrollLeft: number,
  ): ScrollTarget;

  getHorizontalScrollPixelForIndex(
    defaultColumnWidth: number,
    frozenColumn: number,
    columnIndex: number,
    excludeFrozenColumns?: boolean,
    targetInclusive?: boolean,
  ): number;

  getVerticalLastScrollTarget(
    defaultRowHeight: number,
    lastRowIndex: number,
    trackHeight: number,
  ): ScrollTarget;

  getVerticalScrollTargetForPixel(
    defaultRowHeight: number,
    frozenRow: number,
    scrollTop: number,
  ): ScrollTarget;

  getVerticalScrollPixelForIndex(
    defaultRowHeight: number,
    frozenRow: number,
    rowIndex: number,
    excludeFrozenRows?: boolean,
    targetInclusive?: boolean,
  ): number;

  getPercentageAsVerticalScrollIndex(
    totalScrollableIndexCount: number,
    amount: number,
  ): number;

  getVerticalScrollIndexAsPercentage(
    totalScrollableIndexCount: number,
    index: number,
  ): number;

  /**
   * Last scrollable row index that has data.
   */
  getMinScrollableRowIndex(): number;

  /**
   * Last scrollable column index that has data.
   */
  getMinScrollableColumnIndex(): number;

  getVisibleRowIndex(baseIndex: number, change: number, max?: number): number;

  hasHiddenRows(fromIndex: number, toIndex: number);

  isRowHidden(index: number): boolean;

  shiftHorizontalPositionByPixels(
    defaultColumnWidth: number,
    frozenColumn: number,
    currentIndex: number,
    currentPixel: number,
    changeInPixels: number,
  ): ScrollTarget;

  shiftVerticalPositionByPixels(
    defaultRowHeight: number,
    frozenRow: number,
    currentIndex: number,
    currentPixel: number,
    changeInPixels: number,
  ): ScrollTarget;

  getHiddenRowCount(until?: number): number;
}
