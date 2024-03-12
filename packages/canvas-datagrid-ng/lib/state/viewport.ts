import type { NormalCellDescriptor } from '../types';

/** An internal type shortcut */
type Range = [number, number];

/**
 * The state of current visible viewport.
 * It shows the information of each row and column that is currently visible.
 */
export interface GridViewportState {
  /**
   * The range of visible rows, given by their lowest and highest index.
   */
  rowsRange: [lo: number, hi: number];
  /**
   * The range of visible columns, given by their lowest and highest index.
   */
  columnsRange: [lo: number, hi: number];

  /**
   * A Set that contains the indexes of all currently visible rows.
   */
  rows: Set<number>;

  /**
   * An object where the keys are the visible row indexes and the values are their respective heights.
   */
  rowHeights: { [rowViewIndex: number]: number };

  /**
   * All visible row header cells
   */
  rowHeaders: NormalCellDescriptor[];

  /**
   * All visible column header cells
   */
  columnHeaders: NormalCellDescriptor[];
}

export class GridViewportStateManager implements GridViewportState {
  rowsRange = null as Range;
  columnsRange = null as Range;

  rows = new Set<number>();
  rowHeights = {};

  rowHeaders = [];
  columnHeaders = [];

  /**
   * A Map associating row index and row header cell.
   * It is designed for quickly locating the row header.
   * @see getRowHeader
   */
  private _rowHeaders = new Map<number, NormalCellDescriptor>();
  /**
   * A Map associating column index and column header cell.
   * It is designed for quickly locating the column header.
   * @see getColumnHeader
   */
  private _columnHeaders = new Map<number, NormalCellDescriptor>();

  /**
   * Reset all viewport state before drawing the grid
   */
  readonly reset = () => {
    this.rowsRange = null as Range;
    this.columnsRange = null as Range;
    this.rows = new Set<number>();
    this.rowHeights = {};
    this.rowHeaders = [];
    this.columnHeaders = [];
    this._rowHeaders = new Map();
    this._columnHeaders = new Map();
  };

  /**
   * Add a visible cell descriptor into the state.
   * This method is usually called in `pushVisibleCell` before drawing a cell
   */
  readonly addCell = (cell: NormalCellDescriptor) => {
    const { rowIndex, columnIndex, isRowHeader, isColumnHeader } = cell;
    if (rowIndex >= 0) {
      if (!this.rowsRange) {
        this.rowsRange = [rowIndex, rowIndex];
      } else if (rowIndex < this.rowsRange[0]) {
        this.rowsRange[0] = rowIndex;
      } else if (rowIndex > this.rowsRange[1]) {
        this.rowsRange[1] = rowIndex;
      }
    }
    if (columnIndex >= 0) {
      if (!this.columnsRange) {
        this.columnsRange = [columnIndex, columnIndex];
      } else if (columnIndex < this.columnsRange[0]) {
        this.columnsRange[0] = columnIndex;
      } else if (columnIndex > this.columnsRange[1]) {
        this.columnsRange[1] = columnIndex;
      }
    }
    if (isRowHeader) {
      this.rowHeaders.push(cell);
      this._rowHeaders.set(cell.rowIndex, cell);
    }
    if (isColumnHeader) {
      this.columnHeaders.push(cell);
      this._columnHeaders.set(cell.columnIndex, cell);
    }
    this.rows.add(rowIndex);
  };

  readonly setRowHeight = (rowViewIndex: number, height: number) => {
    this.rowHeights[rowViewIndex] = height;
  };

  readonly getRowHeader = (rowIndex: number): NormalCellDescriptor => {
    return this._rowHeaders.get(rowIndex);
  };
  readonly getColumnHeader = (columnIndex: number): NormalCellDescriptor => {
    return this._columnHeaders.get(columnIndex);
  };
}
