import type { GridInternalState } from '../state';
import { getSelectionStateFromCells } from './util';

const minCacheWidth = 100;
const minCacheHeight = 100;

const maxCacheWidth = 500;
const maxCacheHeight = 500;

const littleMore = 2;

type MinimumGridState = Pick<
  GridInternalState,
  | 'scrollIndexLeft'
  | 'scrollIndexTop'
  | 'width'
  | 'height'
  | 'style'
  | 'selections'
>;

const enum ExpandDirection {
  Left = 1,
  Top = 2,
  Right = 3,
  Bottom = 4,
}

function fillPartial(
  array: boolean[][],
  value: boolean | boolean[][],
  w: number,
  h: number,
  x = 0,
  y = 0,
) {
  if (Array.isArray(value)) {
    for (let yi = 0; yi < h; yi++, y++) {
      for (let xi = 0; xi < w; xi++, x++) {
        if (!Array.isArray(array[y])) array[y] = [];
        array[y][x] = value[yi] ? value[yi][xi] : false;
      }
    }
    return array;
  }
  for (let yi = 0; yi < h; yi++, y++) {
    for (let xi = 0; xi < w; xi++, x++) {
      if (!Array.isArray(array[y])) array[y] = [];
      array[y][x] = value;
    }
  }
  return array;
}

export class GridSelectionCache {
  all: boolean;
  each: boolean[][];

  /** columnViewIndex */
  startColumn: number;
  /** columnViewIndex */
  endColumn: number;

  startRow: number;
  endRow: number;

  width: number;
  height: number;

  pixelWidth: number;
  pixelHeight: number;

  constructor(private readonly gridState: MinimumGridState) {}

  private shouldInitCache = () => {
    // the cache is not initialized
    if (!Array.isArray(this.each)) return true;

    // current view is still in the cache
    const { scrollIndexLeft, scrollIndexTop, width, height } = this.gridState;
    if (
      scrollIndexLeft === this.startColumn &&
      scrollIndexTop === this.startRow &&
      width <= this.pixelWidth &&
      height <= this.pixelHeight
    )
      return false;

    // the cache is too large, it needs to be shrinked
    if (this.width > maxCacheWidth || this.height > maxCacheHeight) return true;

    return false;
  };

  private expandCache = (
    direction: ExpandDirection,
    size: number,
    newState: boolean | boolean[][],
  ) => {
    // if(!isValidDirection(direction)) return;

    if (typeof this.all === 'boolean') {
      // the selection state is still all selected or none
      if (newState === this.all) {
        switch (direction) {
          case ExpandDirection.Left:
            this.startColumn -= size;
            this.width += size;
            break;
          case ExpandDirection.Right:
            this.endColumn += size;
            this.width += size;
            break;
          case ExpandDirection.Top:
            this.startRow -= size;
            this.height += size;
            break;
          case ExpandDirection.Bottom:
            this.endRow += size;
            this.height += size;
            break;
        }
        return;
      }
      const oldState = this.all;
      this.all = undefined;
      this.each = fillPartial([], oldState, 0, 0, this.width, this.height);
    }
    // end of the condition "oldState and newState are all boolean"

    switch (direction) {
      case ExpandDirection.Left:
        // |----------|----------|
        // | newState | oldState |
        // |----------|----------|
        // |     /    |    /     |
        // |----------|----------|
        if (!Array.isArray(newState))
          newState = fillPartial([], newState, size, this.height, 0, 0);
        fillPartial(newState, this.each, this.width, this.height, size, 0);
        this.each = newState;
        this.startColumn -= size;
        this.width += size;
        break;
      case ExpandDirection.Right:
        // |----------|----------|
        // | oldState | newState |
        // |----------|----------|
        // |     /    |    /     |
        // |----------|----------|
        fillPartial(this.each, newState, size, this.height, this.width, 0);
        this.endColumn += size;
        this.width += size;
        break;
      case ExpandDirection.Top:
        // |----------|----------|
        // | newState |    /     |
        // |----------|----------|
        // | oldState |    /     |
        // |----------|----------|
        if (!Array.isArray(newState))
          newState = fillPartial([], newState, this.width, size, 0, 0);
        fillPartial(newState, this.each, this.width, this.height, size, 0);
        this.each = newState;
        this.startRow -= size;
        this.height += size;
        break;
      case ExpandDirection.Bottom:
        // |----------|----------|
        // | oldState |    /     |
        // |----------|----------|
        // | newState |    /     |
        // |----------|----------|
        fillPartial(this.each, newState, this.width, size, this.height, 0);
        this.endRow += size;
        this.height += size;
        break;
    }
  };

  /**
   * call this function in the beginning of the draw function
   */
  initCache = () => {
    // if (!this.shouldInitCache()) return;

    const grid = this.gridState;
    let width = Math.ceil(grid.width / grid.style.cellWidth);
    let height = Math.ceil(grid.height / grid.style.cellHeight);
    if (isNaN(width) || width < minCacheWidth) width = minCacheWidth;
    if (isNaN(height) || height < minCacheHeight) height = minCacheHeight;

    const startColumn = Math.max(grid.scrollIndexLeft - 10, 0);
    const endColumn = startColumn + width - 1;

    const startRow = Math.max(grid.scrollIndexTop - 10, 0);
    const endRow = startRow + height - 1;

    const selectionStates = getSelectionStateFromCells(grid.selections, {
      startRow,
      endRow,
      startColumn,
      endColumn,
    });
    if (typeof selectionStates === 'boolean') {
      this.all = selectionStates;
    } else {
      this.all = undefined;
      this.each = selectionStates;
    }

    this.startRow = startRow;
    this.startColumn = startColumn;
    this.endRow = endRow;
    this.endColumn = endColumn;
    this.width = width;
    this.height = height;
    this.pixelWidth = grid.width;
    this.pixelHeight = grid.height;
  };

  isCellSelected = (rowIndex: number, columnViewIndex: number) => {
    if (rowIndex < 0 || columnViewIndex < 0) return false;

    //#region expand cache
    if (columnViewIndex > this.endColumn) {
      const newEndColumn = columnViewIndex + littleMore;
      const newState = getSelectionStateFromCells(this.gridState.selections, {
        startRow: this.startRow,
        endRow: this.endRow,
        startColumn: this.endColumn + 1,
        endColumn: newEndColumn,
      });
      const size = newEndColumn - this.endColumn;
      this.expandCache(ExpandDirection.Right, size, newState);
    } else if (columnViewIndex < this.startColumn) {
      const newStartColumn = Math.max(columnViewIndex - littleMore, 0);
      const newState = getSelectionStateFromCells(this.gridState.selections, {
        startRow: this.startRow,
        endRow: this.endRow,
        startColumn: newStartColumn,
        endColumn: this.startColumn - 1,
      });
      const size = this.startColumn - newStartColumn;
      this.expandCache(ExpandDirection.Left, size, newState);
    }

    if (rowIndex > this.endRow) {
      const newEndRow = rowIndex + littleMore;
      const newState = getSelectionStateFromCells(this.gridState.selections, {
        startColumn: this.startColumn,
        endColumn: this.endColumn,
        startRow: this.endRow + 1,
        endRow: newEndRow,
      });
      const size = newEndRow - this.endRow;
      this.expandCache(ExpandDirection.Bottom, size, newState);
    } else if (rowIndex < this.startRow) {
      const newStartRow = Math.max(rowIndex - littleMore, 0);
      const newState = getSelectionStateFromCells(this.gridState.selections, {
        startColumn: this.startColumn,
        endColumn: this.endColumn,
        startRow: newStartRow,
        endRow: this.startRow - 1,
      });
      const size = this.startRow - newStartRow;
      this.expandCache(ExpandDirection.Top, size, newState);
    }
    //#endregion expand cache

    if (typeof this.all === 'boolean') return this.all;
    const rowIndexOffset = rowIndex - this.startRow;
    const columnIndexOffset = columnViewIndex - this.startColumn;
    return this.each[rowIndexOffset][columnIndexOffset] || false;
  };
}
