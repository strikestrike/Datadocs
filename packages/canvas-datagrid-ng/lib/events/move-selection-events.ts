import { checkRange } from '../merged-cells/util';

import { SELECTION_CONTEXT_TYPE_TABLE } from '../selections/constants';
import type { GridPrivateProperties } from '../types';
import { copyMethods } from '../util';

export default function loadGridMoveSelectionEventHandler(
  self: GridPrivateProperties,
) {
  copyMethods(new GridMoveSelectionEventHandler(self), self);
}

export class GridMoveSelectionEventHandler {
  constructor(private readonly self: GridPrivateProperties) {}

  selectionMove = (e: MouseEvent) => {
    const { self } = this;
    const { currentCell } = self;
    const selection = self.getPrimarySelection();

    // Because selection is easily startable with a cell click, this method
    // is prone receive dead events, as `stopSelectionMove` might fail to
    // unregister itself and this method due to events are sometimes prevented.
    if (!self.draggingItem || !self.selecting) {
      self.stopSelectionMove(e);
      return;
    }

    // We check if the event type is `mousedown` here because we want to update
    // the cursor if this is the first time this block has been invoked.
    if (
      (self.cellBoundaryCrossed || e.type === 'mousedown') &&
      (currentCell.isNormal || currentCell.isHeader)
    ) {
      if (selection.context?.type === SELECTION_CONTEXT_TYPE_TABLE) {
        const { target } = selection.context;
        self.setCursor(target === 'row' ? 'e-resize' : 's-resize');
      } else {
        self.setCursor(currentCell.isHeader ? self.cursorGrab : 'default');
      }

      // We start drag selecting not in `mousedown` but in `mousemove`, so just
      // update the cursor if the event type is `mousedown`.
      if (e.type !== 'mousedown') {
        self.dragSelect(currentCell.rowIndex, currentCell.columnIndex);
      }
    }
  };

  stopSelectionMove = (e: MouseEvent) => {
    const { self } = this;

    window.removeEventListener('mousemove', self.selectionMove, false);
    window.removeEventListener('mouseup', self.stopSelectionMove, false);

    self.selecting = undefined;
    if (self.commitSelections()) {
      self.redrawCommit();
    }
  };

  selectionHandleMove = (e: MouseEvent) => {
    const { self } = this;
    if (!self.fillOverlay) return;

    const pos = self.getLayerPos(e);
    const rowIndex = self.currentCell.rowIndex;
    const columnIndex = self.currentCell.columnIndex;
    const { selection } = self.fillOverlay;
    const isInColIndexes =
      columnIndex >= -1 &&
      selection.startColumn <= columnIndex &&
      selection.endColumn >= columnIndex;
    const isInRowIndexes =
      rowIndex >= -1 &&
      selection.startRow <= rowIndex &&
      selection.endRow >= rowIndex;
    const isInSelectionBounds = isInColIndexes && isInRowIndexes;

    // If we are in the selection bounds, allow user to change directions.
    if (isInSelectionBounds) {
      self.fillOverlay.lastInBoundsLocation = {
        x: pos.x,
        y: pos.y,
      };
    } else if (isInRowIndexes || isInColIndexes) {
      self.fillOverlay.direction = isInRowIndexes ? 'x' : 'y';
    } else if (
      self.fillOverlay.lastInBoundsLocation ||
      !self.fillOverlay.direction
    ) {
      const lastInBoundsLocation = self.fillOverlay.lastInBoundsLocation;
      self.fillOverlay.lastInBoundsLocation = undefined;

      const x = lastInBoundsLocation
        ? lastInBoundsLocation.x
        : self.currentCell.x - self.currentCell.width / 2;
      const y = lastInBoundsLocation
        ? lastInBoundsLocation.y
        : self.currentCell.y - self.currentCell.height / 2;
      const dx = Math.abs(pos.x - x);
      const dy = Math.abs(pos.y - y);

      if (dx > 5 || dy > 5) {
        self.fillOverlay.direction = dx > dy ? 'x' : 'y';
      }
    } else {
      // The Excel behavior where if user is closer to the opposite direction,
      // we switch to that direction.
      const { distance } = self.fillOverlay;
      const cX = columnIndex < selection.startColumn ? distance.x : distance.x0;
      const cY = rowIndex < selection.startRow ? distance.y : distance.y0;
      if (cX !== undefined && cY !== undefined) {
        const dx = Math.abs(cX - pos.x);
        const dy = Math.abs(cY - pos.y);
        if (dx !== dy) self.fillOverlay.direction = dx > dy ? 'x' : 'y';
      }
    }

    if (rowIndex >= 0) {
      self.fillOverlay.rowIndex = rowIndex;
    }
    if (columnIndex >= 0) {
      self.fillOverlay.columnIndex = columnIndex;
      const viewport = self.viewport;
      if (rowIndex === -1 && viewport.rows.size > 0 && viewport.rowsRange) {
        self.fillOverlay.rowIndex = viewport.rowsRange[0];
      }
    }

    self.fillOverlay.distance = {};
    self.requestRedraw('fillOverlay');
  };

  stopSelectionHandleMove = (e?: Event) => {
    const { self } = this;
    if (!self.fillOverlay) {
      return false;
    }

    self.ignoreNextClick = true;

    window.removeEventListener('mousemove', self.selectionHandleMove, false);
    window.removeEventListener('mouseup', self.stopSelectionHandleMove, false);

    const overlay = self.fillOverlay;
    self.fillOverlay = undefined;
    const bounds = overlay.selection;
    const boundsRowLength = bounds.endRow + 1 - bounds.startRow;
    const boundsColLength = bounds.endColumn + 1 - bounds.startColumn;

    if (overlay.rowIndex >= 0 && overlay.columnIndex >= 0) {
      const boundsOld = { ...bounds };
      const isVertical = overlay.direction === 'y';
      const isHorizontal = overlay.direction === 'x';

      let startRow,
        rowLength,
        startColumn,
        columnLength,
        reverseVertically = false,
        reverseHorizontally = false;

      if (isVertical) {
        if (overlay.rowIndex < bounds.startRow) {
          bounds.startRow = overlay.rowIndex;
          reverseVertically = true;
        } else if (overlay.rowIndex > bounds.endRow) {
          bounds.endRow = overlay.rowIndex;
        }

        startRow =
          bounds.startRow < boundsOld.startRow
            ? bounds.startRow
            : boundsOld.endRow + 1;
        rowLength =
          bounds.startRow < boundsOld.startRow
            ? boundsOld.startRow - bounds.startRow
            : bounds.endRow - boundsOld.endRow;
        startColumn = boundsOld.startColumn;
        columnLength = boundsColLength;
      } else if (isHorizontal) {
        if (overlay.columnIndex < bounds.startColumn) {
          bounds.startColumn = overlay.columnIndex;
          reverseHorizontally = true;
        } else if (overlay.columnIndex > bounds.endColumn) {
          bounds.endColumn = overlay.columnIndex;
        }

        startColumn =
          bounds.startColumn < boundsOld.startColumn
            ? bounds.startColumn
            : boundsOld.endColumn + 1;
        columnLength =
          bounds.startColumn < boundsOld.startColumn
            ? boundsOld.startColumn - bounds.startColumn
            : bounds.endColumn - boundsOld.endColumn;
        startRow = boundsOld.startRow;
        rowLength = boundsRowLength;
      }

      if (
        checkRange(bounds) &&
        (bounds.startColumn < boundsOld.startColumn ||
          bounds.startRow < boundsOld.startRow ||
          bounds.endColumn > boundsOld.endColumn ||
          bounds.endRow > boundsOld.endRow)
      ) {
        const rows = self.getTableData(
          boundsOld.startRow,
          boundsOld.startColumn,
          Math.min(rowLength, boundsRowLength),
          Math.min(columnLength, boundsColLength),
        );

        self.insert({
          rows: rows,
          startRowIndex: startRow,
          startColumnIndex: startColumn,
          minRowsLength: rowLength,
          minColumnsLength: columnLength,
          reverseRows: reverseVertically,
          reverseColumns: reverseHorizontally,
          clearSelections: false,
          alwaysFilling: true,
          direction: isHorizontal ? 'horizontal' : 'vertical',
        });

        self.draw();
      }
    }

    return true;
  };
}
