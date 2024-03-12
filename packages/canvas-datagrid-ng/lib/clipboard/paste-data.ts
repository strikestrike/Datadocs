import { isSupportedHtml } from '../events/util';
import type { GridPrivateProperties } from '../types/grid';
import type { EditCellDescriptor } from '../data/data-source/spec';
import type { SelectionDescriptor } from '../selections/types';
import type { ParsedTableData } from './parse-clipboard-data';
import { parseClipboardData } from './parse-clipboard-data';
import type { PasteType } from './spec';
import { isOnlyOneCellInTheMatrix } from './utils';
import {
  getSelectionBounds,
  getSelectionStateFromCells,
  SelectionType,
} from '../selections/util';
import { getRectangleSize, iterateLargeRegionWithFrame } from '../utils/region';
import type { MergedCellDescriptor } from '../types';

const warningsForUnsupportedHtml = [
  'Unrecognized HTML format. HTML must be a simple table, e.g.: <table><tr><td>data</td></tr></table>.',
  'Data with the mime type text/html not in this format will not be imported as row data.',
].join('\n');

// const debug = (...msg) => void msg;
const debug = (...msg) => console.log('pasteData >', ...msg);

/**
 * @todo support paste type: value only, style only ....
 * @param pasteValue
 */
export function pasteData(
  this: GridPrivateProperties,
  pasteValue: string,
  mimeType: string,
  selections?: SelectionDescriptor[],
  pasteType?: PasteType,
) {
  if (mimeType === 'text/html' && !isSupportedHtml(pasteValue)) {
    console.warn(warningsForUnsupportedHtml);
    return;
  }

  const clipboardRows = parseClipboardData(pasteValue, mimeType);
  if (!clipboardRows || clipboardRows.length === 0) return;
  debug(clipboardRows);

  // analyze clipboard data
  const pasteOnlyOneCell = isOnlyOneCellInTheMatrix(clipboardRows);
  const pasteRowsLen = clipboardRows.length;
  const pasteColsLen = clipboardRows[0].length;
  const pasteSize = { width: pasteColsLen, height: pasteRowsLen };

  // analyze paste location
  const { pasteBehaviour, dataSource, mergeCells } = this;
  const dsState = dataSource.state;
  const selectionBounds = getSelectionBounds(selections, {
    rows: dsState.rows,
    columns: dsState.cols,
    defaults: [-1, -1],
  });
  if (selectionBounds.bottom === -1) return;
  const boundSize = getRectangleSize(selectionBounds);

  let repeat = false;
  // guess repeat times
  if (
    boundSize.width > pasteSize.width ||
    boundSize.height > pasteSize.height
  ) {
    repeat = true;

    const repeatY = Math.ceil(boundSize.height / pasteSize.height);
    if (repeatY > pasteBehaviour.maxRepeatTimes) repeat = false;
    else {
      const repeatX = Math.ceil(boundSize.width / pasteSize.width);
      if (repeatY * repeatX > pasteBehaviour.maxRepeatTimes) repeat = false;
    }
  }

  const selTypeStat = {
    [SelectionType.Cells]: 0,
    [SelectionType.Rows]: 0,
    [SelectionType.Columns]: 0,
    [SelectionType.UnselectedCells]: 0,
  };
  const baseSelType = selections[0].type;
  let areAllSelTypeSame = true;
  for (let i = 0; i < selections.length; i++) {
    const t = selections[i].type;
    selTypeStat[t]++;
    if (baseSelType !== t) areAllSelTypeSame = false;
  }

  // paste data into a invalid selection area
  if (
    !pasteOnlyOneCell &&
    selTypeStat[SelectionType.Rows] > 0 &&
    selTypeStat[SelectionType.Columns] > 0
  )
    return;

  /**
   * @todo optimize the strategy for calculating the frame size
   * We can provide this capacity to the data source.
   * So they can optimize for their storage structure
   */
  let frameSize: typeof boundSize;
  if (boundSize.width > 50) {
    frameSize = { width: 200, height: 1 };
  } else {
    frameSize = { width: 50, height: 5 };
  }

  let areaForClipboardData = selectionBounds;
  if (!repeat) {
    //
    // use current selection as a base point but not a area
    // just imagine that the user paste a 10x10 data into the grid when he is focused on one cell.
    let currSelAsBasePoint = false;
    if (areAllSelTypeSame) {
      switch (baseSelType) {
        case SelectionType.Cells:
          currSelAsBasePoint = boundSize.width === 1 && boundSize.height === 1;
          break;
        case SelectionType.Rows:
        case SelectionType.Columns:
          currSelAsBasePoint =
            selections.length === 1 &&
            (pasteSize.width > boundSize.width ||
              pasteSize.height > boundSize.height);
          break;
      }
    }

    if (currSelAsBasePoint) {
      const baseSel = selections[0];
      const base = {
        left: baseSel.startColumn || 0,
        top: baseSel.startRow || 0,
      };
      const modification = repeatDataIntoALargeArea(
        clipboardRows,
        pasteSize,
        base,
        {
          ...base,
          right: base.left + pasteSize.width - 1,
          bottom: base.top + pasteSize.height - 1,
        },
        true,
      );
      commitModification(modification);
      return;
    } else {
      areaForClipboardData = {
        left: selectionBounds.left,
        top: selectionBounds.top,
        right: selectionBounds.left + pasteSize.width - 1,
        bottom: selectionBounds.top + pasteSize.height - 1,
      };
    }
  }

  iterateLargeRegionWithFrame(
    areaForClipboardData,
    frameSize,
    (frame, offset) => {
      const range = {
        startRow: frame.top,
        endRow: frame.bottom,
        startColumn: frame.left,
        endColumn: frame.right,
      };
      const selectionState = getSelectionStateFromCells(selections, range);
      const modification = repeatDataIntoALargeArea(
        clipboardRows,
        pasteSize,
        selectionBounds,
        frame,
        selectionState,
      );
      commitModification(modification);
    },
  );
  return;

  function commitModification(
    modification: RepeatDataIntoALargeAreaResult | null,
  ) {
    if (!modification) return;
    const { merge, edits } = modification;
    debug(
      `merging ${merge.length} merged group and editing ${edits.length} cells`,
    );
    for (let i = 0; i < merge.length; i++) mergeCells(merge[i]);
    dataSource.editCells(edits);
  }
}

export type RepeatDataIntoALargeAreaResult = {
  edits: EditCellDescriptor[];
  merge: MergedCellDescriptor[];
};

export function repeatDataIntoALargeArea(
  data: ParsedTableData,
  dataSize: { width: number; height: number },
  base: { left: number; top: number },
  area: { left: number; top: number; right: number; bottom: number },
  selectionState: boolean[][] | boolean,
): RepeatDataIntoALargeAreaResult | null {
  if (selectionState === false) return;

  const edits: EditCellDescriptor[] = [];
  const merge: MergedCellDescriptor[] = [];

  const initDataY = (area.top - base.top) % dataSize.height;
  const initDataX = (area.left - base.left) % dataSize.width;
  const nextDataY = (currY: number) => (++currY >= dataSize.height ? 0 : currY);
  const nextDataX = (currX: number) => (++currX >= dataSize.width ? 0 : currX);

  for (
    let gridRowIndex = area.top, dataY = initDataY, offsetY = 0;
    gridRowIndex <= area.bottom;
    gridRowIndex++, dataY = nextDataY(dataY), offsetY++
  ) {
    const areAllSelected = selectionState === true;
    let rowSelState: boolean[];
    if (!areAllSelected) rowSelState = selectionState[offsetY];

    const dataRow = data[dataY];
    if (!dataRow) continue;

    for (
      let gridColIndex = area.left, dataX = initDataX, offsetX = 0;
      gridColIndex <= area.right;
      gridColIndex++, dataX = nextDataX(dataX), offsetX++
    ) {
      const dataCell = dataRow[dataX];
      if (!dataCell) continue;
      if (!areAllSelected && !rowSelState[offsetX]) continue;

      const { value, rowSpan, columnSpan } = dataCell;
      edits.push({
        row: gridRowIndex,
        column: gridColIndex,
        value: value.map((line) => line.value).join('\n'),
      });
      if (
        Number.isInteger(rowSpan) &&
        Number.isInteger(columnSpan) &&
        (rowSpan > 1 || columnSpan > 1)
      ) {
        merge.push({
          startColumn: gridColIndex,
          startRow: gridRowIndex,
          endColumn: gridColIndex + columnSpan - 1,
          endRow: gridRowIndex + rowSpan - 1,
        });
      }
    }
  }

  if (edits.length === 0 && merge.length === 0) return;
  return { edits, merge };
}
