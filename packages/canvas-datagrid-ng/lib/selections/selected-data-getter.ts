import { RangeResult } from '../range/result';
import type { RangeDescriptor } from '../types';
import type { GridPrivateProperties } from '../types/grid';
import { fillMatrix } from '../utils/array';
import { iterateLargeRegionWithFrame } from '../utils/region';
import { getSelectionStateFromCells } from './util';

export enum GetSelectedDataTrimRules {
  None = 0, //      000

  Beginning = 1, // 001
  Ending = 2, //    010
  Middle = 4, //    100

  BothEnds = 3, //  011
  All = 7, //       111
}

export type GetSelectedDataOptions = {
  /**
   * The max rows can be extracted (avoid freezing)
   */
  rowsLimit?: number;

  /**
   * The max columns can be extracted (avoid freezing)
   */
  colsLimit?: number;

  /**
   * how to trim the empty rows,
   * this option is very useful for extracting data when the user selects the whole row/column
   */
  rowsTrim?: GetSelectedDataTrimRules;

  /**
   * the frame/window size for this method to ask data from the data source
   */
  frameSize?: [rows: number, cols?: number];
};

export type EachItemOfSelectedData = {
  /** the formatted string from the original value */
  str: string;

  /** original value */
  value?: any;

  /** row span for the merged cell */
  rowSpan?: number;

  /** column span for the merged cell */
  colSpan?: number;
};

export type GetSelectedDataResult = {
  /**
   * A `null` item means that this place has not cell because
   * there is another merged cell covers this place
   */
  matrix: (EachItemOfSelectedData | null)[][];
};

const defaultGetSelectedDataOptions: Required<GetSelectedDataOptions> = {
  rowsLimit: 99999,
  colsLimit: 9999,
  rowsTrim: GetSelectedDataTrimRules.Ending,
  frameSize: [10],
};

/**
 *
 * @returns
 */
export const getSelectedData = (
  self: GridPrivateProperties,
  options?: Readonly<GetSelectedDataOptions>,
): GetSelectedDataResult | null => {
  const bounds = self.getSelectionBounds(true);
  if (!bounds) return null;

  /** extract all properties that this method needs from grid in here */
  const { selections, dataSource } = self;

  if (!options) options = defaultGetSelectedDataOptions;
  else options = Object.assign({}, defaultGetSelectedDataOptions, options);

  const { top, left } = bounds;
  let { bottom, right } = bounds;
  let height = bottom - top + 1;
  let width = right - left + 1;
  if (width > options.colsLimit) {
    width = Math.max(0, options.colsLimit);
    right = left + width;
  }
  if (height > options.rowsLimit) {
    height = Math.max(0, options.rowsLimit);
    bottom = top + height;
  }

  let [frameSizeX, frameSizeY] = options.frameSize;
  if (!Number.isInteger(frameSizeX) || frameSizeX <= 0) frameSizeX = width;
  if (!Number.isInteger(frameSizeY) || frameSizeY <= 0) frameSizeY = height;

  const range: RangeDescriptor = {
    startRow: bounds.top,
    startColumn: bounds.left,
    endRow: bounds.bottom,
    endColumn: bounds.right,
  };
  const mergedCells = new RangeResult(self.getMergedCellsForRange(range));

  let matrix: EachItemOfSelectedData[][] = [];
  iterateLargeRegionWithFrame(
    { top, left, right, bottom },
    {
      width: frameSizeX,
      height: frameSizeY,
    },
    (frame, offset) => {
      const range = {
        startRow: frame.top,
        endRow: frame.bottom,
        startColumn: frame.left,
        endColumn: frame.right,
      };
      const selectionState = getSelectionStateFromCells(selections, range);
      /** all cells in this area are not selected */
      if (selectionState === false) {
        fillMatrix(
          matrix,
          null,
          frame.width,
          frame.height,
          offset.left,
          offset.top,
        );
        return;
      }

      /** @todo get the hidden data also if the options assign to do it  */
      const { cells } = dataSource.getDataFrame(range);
      for (
        let offsetY = 0, matrixRowIndex = offset.top;
        offsetY < frame.height;
        offsetY++, matrixRowIndex++
      ) {
        if (!matrix[matrixRowIndex]) matrix[matrixRowIndex] = [];
        const matrixRow = matrix[matrixRowIndex];

        const stateRow =
          selectionState === true ? null : selectionState[offsetY];
        const cellsRow = cells[offsetY];

        const rowIndex = frame.top + offsetY;
        for (
          let offsetX = 0, matrixColIndex = offset.left;
          offsetX < frame.width;
          offsetX++, matrixColIndex++
        ) {
          if (selectionState !== true && !stateRow[offsetX]) {
            matrixRow[matrixColIndex] = null;
            continue;
          }

          let rowSpan: number;
          let colSpan: number;

          const colIndex = frame.left + offsetX;
          const merging = mergedCells.get(rowIndex, colIndex);
          if (merging) {
            // there is a merged cell in its left side or its top side
            if (
              merging.startRow !== rowIndex ||
              merging.startColumn !== colIndex
            ) {
              matrixRow[matrixColIndex] = null;
              continue;
            }

            rowSpan = merging.endRow - merging.startRow + 1;
            colSpan = merging.endColumn - merging.startColumn + 1;
          }

          const cell = cellsRow[offsetX];
          /** @todo, `str` and `value` */
          matrixRow[matrixColIndex] = {
            str: cell,
            value: cell,
            rowSpan,
            colSpan,
          };
        }
        // end of columns loop
      }
      // end of rows loop
    },
  );

  if (options.rowsTrim & GetSelectedDataTrimRules.Ending) {
    let endIndex = matrix.length;
    // y > 0 in here can make sure there is atleast one cell be copied
    for (let y = matrix.length - 1; y > 0; y--) {
      const rowData = matrix[y];
      const hasDataIndex = rowData.findIndex((it) => it && it.value);
      if (hasDataIndex >= 0) break;
      endIndex = y;
    }
    if (endIndex < matrix.length) matrix = matrix.slice(0, endIndex);
  }

  if (options.rowsTrim & GetSelectedDataTrimRules.Beginning) {
    let beginningIndex = 0;
    for (let y = 0; y < matrix.length - 1; y++) {
      const rowData = matrix[y];
      const hasDataIndex = rowData.findIndex((it) => it && it.value);
      if (hasDataIndex >= 0) break;
      beginningIndex = y;
    }
    if (beginningIndex > 0) matrix = matrix.slice(beginningIndex);
  }

  if (options.rowsTrim & GetSelectedDataTrimRules.Middle) {
    for (let y = 0; y < matrix.length && matrix.length > 1; y++) {
      const rowData = matrix[y];
      const hasDataIndex = rowData.findIndex((it) => it && it.value);
      if (hasDataIndex >= 0) continue;
      matrix.splice(y, 1);
    }
  }

  return { matrix };
};
