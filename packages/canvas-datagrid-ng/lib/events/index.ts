'use strict';

import type { EditCellDescriptor } from '../data/data-source/spec';
import type { SelectionDescriptor } from '../selections/types';
import { SelectionType } from '../selections/util';
import type { GridPrivateProperties, RangeDescriptor } from '../types';
import { copyMethods } from '../util';
import { resizeGrid } from './resize-grid';
import {
  findLastFreezableColumn,
  findLastFreezableRow,
  sanitizeRowsData,
} from './util';

type EventHandler = (event: Event) => void;

export default function loadGridEventHandler(self: GridPrivateProperties) {
  copyMethods(new GridEventHandler(self), self);
}

export class GridEventHandler {
  constructor(private readonly self: GridPrivateProperties) {}

  stopPropagation = (e: Event) => {
    e.stopPropagation();
  };

  /**
   * Adds an event listener to the given event.
   * @memberof canvasDatagrid
   * @name addEventListener
   * @method
   * @param {string} ev The name of the event to subscribe to.
   * @param {function} fn The event procedure to execute when the event is raised.
   */
  addEventListener = (ev: string, fn: EventHandler, ignoreRest?: any) => {
    const { self } = this;
    self.events[ev] = self.events[ev] || [];
    self.events[ev].unshift(fn);
  };

  /**
   * Removes the given listener function from the given event.  Must be an actual reference to the function that was bound.
   * @memberof canvasDatagrid
   * @name removeEventListener
   * @method
   * @param {string} ev The name of the event to unsubscribe from.
   * @param {function} fn The event procedure to execute when the event is raised.
   */
  removeEventListener = (ev: string, fn: EventHandler) => {
    const { self } = this;
    (self.events[ev] || []).forEach(function removeEachListener(sfn, idx) {
      if (fn === sfn) {
        self.events[ev].splice(idx, 1);
      }
    });
  };

  /**
   * Fires the given event, passing an event object to the event subscribers.
   * @memberof canvasDatagrid
   * @name dispatchEvent
   * @method
   * @param eventName The name of the event to dispatch.
   * @param e The event object.
   */
  dispatchEvent = (eventName: string, e: any) => {
    let defaultPrevented: boolean;
    function preventDefault() {
      defaultPrevented = true;
    }

    const { self } = this;
    if (!self.events[eventName]) return;
    self.events[eventName].forEach(function dispatchEachEvent(fn) {
      e.ctx = self.ctx;
      e.preventDefault = preventDefault;
      fn.apply(self.publicApi, [e]);
    });
    return defaultPrevented;
  };

  dispatchErrorEvent = (rawError: any, context: string) => {
    // This `try` statement make sure this method never throws an unexpected error;
    try {
      if (typeof rawError === 'string')
        return this.self.dispatchEvent('error', { message: rawError, context });
      if (rawError && typeof rawError.message === 'string')
        return this.self.dispatchEvent(
          'error',
          Object.assign(rawError, { context }),
        );
      return this.self.dispatchEvent('error', {
        message: rawError ? String(rawError) : 'Unknown Error',
        context,
      });
    } catch (error) {
      console.error(error);
    }
  };

  callProcess = async <T>(
    processInfo: string | { name: string; backdrop?: boolean },
    process: () => Promise<T>,
  ): Promise<{
    called?: boolean;
    error?: any;
    result?: T;
  }> => {
    const self = this.self;
    if (self.processing) return { called: false };

    let processName: string;
    let backdrop = true;
    if (typeof processInfo === 'string') {
      processName = processInfo;
    } else {
      processName = processInfo.name;
      if (typeof processInfo.backdrop === 'boolean')
        backdrop = processInfo.backdrop;
    }
    self.processing = processName;
    if (backdrop) self.showDimOverlay(true);

    let result: T;
    try {
      result = await process();
    } catch (error) {
      self.processing = '';
      self.dispatchErrorEvent(error, processName);
      self.hideDimOverlay();
      return { called: true, error };
    }

    self.processing = '';
    if (backdrop) self.hideDimOverlay();
    return { called: true, result };
  };

  resize = (drawAfterResize?: boolean) =>
    resizeGrid(this.self, drawAfterResize);

  freezeMove = (e: MouseEvent) => {
    const { self } = this;
    if (
      self.dispatchEvent('freezemoving', {
        NativeEvent: e,
        cell: self.currentCell,
      })
    ) {
      return;
    }
    const viewport = self.viewport;
    const pos = self.getLayerPos(e);
    const { frozenMarkerWidth } = self.style.scaled;

    self.ignoreNextClick = true;

    if (self.dragMode === 'frozen-column-marker') {
      self.freezeMarkerPosition.pos = pos.x;
      const lastCell = findLastFreezableColumn(self);
      const leftAreaWidth = self.getLeftAreaWidth();
      if (pos.x < leftAreaWidth) {
        // The cursor is inside the row header, so set the index to 0 and snap
        // the active marker.
        self.freezeMarkerPosition.cellPos = 0;
        self.freezeMarkerPosition.index = 0;
        self.freezeMarkerPosition.snapIndicator = true;
      } else if (lastCell && pos.x > lastCell.x) {
        // The cursor goes beyond the last freezable columns, so limit it.
        self.freezeMarkerPosition.cellPos = lastCell.x;
        self.freezeMarkerPosition.index = lastCell.columnIndex;
        self.freezeMarkerPosition.snapIndicator = true;
      } else {
        // The cursor is over the cells that are freezable, so find the cell
        // that the cursor is on.
        const onCell = viewport.columnHeaders.find(
          (cell) =>
            // The cursor is on the first half of the cell, so pick this one.
            (cell.x <= pos.x &&
              cell.x + (cell.width - frozenMarkerWidth) / 2 >= pos.x) ||
            // The cursor is on the second half of the cell, so pick it instead,
            // assuming the previous cell didn't match.
            cell.x >= pos.x,
        );
        if (onCell) {
          const firstVisibleColumn = self.getFirstColumnIndex();
          // We have a cell that the cursor is on, so we will use it.
          self.freezeMarkerPosition.cellPos = onCell.x;
          // If the current column is the first visible one, meaning there are
          // hidden columns that come before it, consider that the user
          // disabling the frozen columns.
          self.freezeMarkerPosition.index =
            onCell.columnIndex === firstVisibleColumn ? 0 : onCell.columnIndex;
          self.freezeMarkerPosition.snapIndicator = false;
        }
      }
    } else if (self.dragMode === 'frozen-row-marker') {
      self.freezeMarkerPosition.pos = pos.y;
      const lastCell = findLastFreezableRow(self);
      const topAreaHeight = self.getTopAreaHeight();
      if (pos.y < topAreaHeight) {
        // The cursor is inside the column header, so set the index to 0 and
        // snap the active marker.
        self.freezeMarkerPosition.cellPos = 0;
        self.freezeMarkerPosition.index = 0;
        self.freezeMarkerPosition.snapIndicator = true;
      } else if (lastCell && pos.y > lastCell.y) {
        // The cursor goes beyond the last freezable columns, so limit it.
        self.freezeMarkerPosition.cellPos = lastCell.y;
        self.freezeMarkerPosition.index = lastCell.rowIndex;
        self.freezeMarkerPosition.snapIndicator = true;
      } else {
        // The cursor is over the cells that are freezable, so find the cell
        // that the cursor is on.
        const onCell = viewport.rowHeaders.find(
          (cell) =>
            // The cursor is on the first half of the cell, so pick this one.
            (cell.y <= pos.y &&
              cell.y + (cell.height - frozenMarkerWidth) / 2 >= pos.y) ||
            // The cursor is on the second half of the cell, so pick it instead,
            // assuming the previous cell didn't match.
            cell.y >= pos.y,
        );
        if (onCell) {
          // We have a cell that the cursor is on, so we will use it.
          self.freezeMarkerPosition.cellPos = onCell.y;
          self.freezeMarkerPosition.index = onCell.rowIndex;
          self.freezeMarkerPosition.snapIndicator = false;
        }
      }
    }

    self.requestRedraw('scroll');
  };

  stopFreezeMove = (e: MouseEvent) => {
    const { self } = this;
    const { freezeMarkerPosition } = self;

    window.removeEventListener('mousemove', self.freezeMove, false);
    window.removeEventListener('mouseup', self.stopFreezeMove, false);
    self.freezeMarkerPosition = undefined;

    if (!freezeMarkerPosition || freezeMarkerPosition.index === undefined) {
      return;
    }

    if (self.dragMode === 'frozen-row-marker') {
      self.frozenRow = freezeMarkerPosition.index;
    } else if (self.dragMode === 'frozen-column-marker') {
      self.frozenColumn = freezeMarkerPosition.index;
    }

    if (
      self.dispatchEvent('endfreezemove', {
        NativeEvent: e,
        cell: self.currentCell,
      })
    ) {
      self.frozenRow = self.startFreezeMove.rowIndex;
      self.frozenColumn = self.startFreezeMove.columnIndex;
      self.draw(true);
      return;
    }
    self.draw(true);
    self.resize();

    if (self.dragMode === 'frozen-row-marker') {
      self.gotoCell(undefined, 0);
    } else if (self.dragMode === 'frozen-column-marker') {
      self.gotoCell(0, undefined);
    }
  };

  /**
   * Gets the horizontal adjacent cells as well as first/last based on column visibility.
   * @param {number} [columnIndex] The column index the adjacent cells will be based upon.  Defaults to the column index of the active cell if not given.
   * @returns Returns the indexes of the first and last columns and of the column on the left and right.
   */
  getAdjacentCells = (columnIndex?: number) => {
    const { self } = this;
    const s = self.getSchema();
    const o: {
      first?: number;
      last?: number;
      left?: number;
      right?: number;
    } = {};
    columnIndex = columnIndex ?? self.activeCell.columnIndex;
    for (let x = 0; x < s.length; x += 1) {
      const i = x;
      if (!s[i].hidden) {
        if (o.first === undefined) {
          o.first = x;
          o.left = x;
        }
        o.last = x;
        if (x > columnIndex && o.right === undefined) {
          o.right = x;
        }
        if (x < columnIndex) {
          o.left = x;
        }
      }
    }
    if (o.right === undefined) {
      o.right = o.last;
    }
    return o;
  };

  /**
   * Move the active cell with 'Tab' or 'Enter' key.
   *
   * With 'Enter' key, this will move the active cell one row below or above
   * depending on shift key, and with 'Tab' key, the movement will be made
   * horizontally.
   *
   * When the selection are boundaries are reached, this will move the active
   * cell to the beginning, end, next column, or row depending on 'Shift' and
   * the key.
   *
   * If the active cell is the only selection, this will move the selection in
   * the grid but will not jump to next row if the end of the column is reached,
   * or vice versa.
   * @param {boolean} [shiftKey] Shift key is pressed.
   * @param {boolean} [enterKey] Use 'Enter' key instead of 'Tab'.
   * @returns True if the active cell was successfully moved.
   */
  moveActiveCell = (shiftKey?: boolean, enterKey?: boolean) => {
    const { self } = this;
    const dataState = self.dataSource.state;
    const { rowIndex, columnIndex } = self.activeCell;
    const sel = self.activeSelection ?? self.getPrimarySelection();
    const adjacentCells = self.getAdjacentCells(columnIndex);
    const changeInRow = shiftKey
      ? self.getVisibleRowIndex(rowIndex, -1)
      : self.getVisibleRowIndex(rowIndex, 1);
    const adjCol = shiftKey ? adjacentCells.left : adjacentCells.right;
    const changeInCol =
      adjCol === undefined || adjCol === columnIndex
        ? columnIndex + (shiftKey ? -1 : 1)
        : adjCol;
    const minGridRow = 0;
    const maxGridRow = dataState.rows - 1;
    const minGridColumn = adjacentCells.first;
    const maxGridColumn = adjacentCells.last;

    let nextSelection: SelectionDescriptor = undefined;
    if (self.selections.length > 1) {
      const currentSelectionIndex = self.selections.indexOf(sel);
      const lastSelectionIndex = self.selections.length - 1;

      let nextIndex = -1;
      if (currentSelectionIndex === 0 && shiftKey) {
        nextIndex = lastSelectionIndex;
      } else if (currentSelectionIndex === lastSelectionIndex && !shiftKey) {
        nextIndex = 0;
      } else if (currentSelectionIndex !== -1) {
        nextIndex = currentSelectionIndex + (shiftKey ? -1 : 1);
      }

      if (nextIndex >= 0) {
        nextSelection = self.selections[nextIndex];
      }
    }

    // Check if we are not in a navigatable selection.
    if (
      !sel ||
      (sel.startRow === sel.endRow &&
        sel.startColumn === sel.endColumn &&
        sel.type === SelectionType.Cells &&
        !nextSelection)
    ) {
      if (enterKey) {
        if (changeInRow >= minGridRow && changeInRow <= maxGridRow) {
          self.selectCell(changeInRow, columnIndex);
          return true;
        }
      } else {
        if (changeInCol >= minGridColumn && changeInCol <= maxGridColumn) {
          self.selectCell(rowIndex, changeInCol);
          return true;
        }
      }
      return false;
    }

    const minRow = sel.startRow ?? minGridRow;
    const maxRow = sel.endRow ?? maxGridRow;
    const minColumn = sel.startColumn ?? minGridColumn;
    const maxColumn = sel.endColumn ?? maxGridColumn;
    const colHasRoom = changeInCol >= minColumn && changeInCol <= maxColumn;
    const rowHasRoom = changeInRow >= minRow && changeInRow <= maxRow;

    // In 'Enter' mode, we move vertically, or horizontally if otherwise.
    if (enterKey && rowHasRoom) {
      self.setActiveCell(columnIndex, changeInRow);
    } else if (enterKey && colHasRoom) {
      self.setActiveCell(changeInCol, shiftKey ? maxRow : minRow);
    } else if (!enterKey && colHasRoom) {
      self.setActiveCell(changeInCol, rowIndex);
    } else if (!enterKey && rowHasRoom) {
      self.setActiveCell(shiftKey ? maxColumn : minColumn, changeInRow);
    } else {
      if (nextSelection) {
        self.activeSelection = nextSelection;
        const nextCell = shiftKey
          ? self.getBottomRightCellOfSelection(nextSelection)
          : self.getTopLeftCellOfSelection(nextSelection);
        self.setActiveCell(nextCell.columnIndex, nextCell.rowIndex);
      } else if (shiftKey) {
        self.setActiveCell(maxColumn, maxRow);
      } else {
        self.setActiveCell(minColumn, minRow);
      }
    }

    return true;
  };

  /**
   * Move with Enter key.
   *
   * If the current cell wasn't being edited, and it has data, begin editing it,
   * and if it doesn't have data or is already being edited, move to the next
   * cell, check if it has data, and if true, begin editing it also.
   * @param {boolean} shiftKey Whether Shift is pressed.
   * @param {boolean} [wasEditing] Whether we were already editing the active cell.
   */
  moveWithEnter = (shiftKey: boolean, wasEditing?: boolean) => {
    const { self } = this;
    let { rowIndex, columnIndex } = self.activeCell;

    self.requestRedraw('selection');

    // If the current cell wasn't being edited, and it has data, begin editing
    // it.
    if (!wasEditing && self.getCellData(rowIndex, columnIndex)) {
      self.beginEditAt(columnIndex, rowIndex);
    } else if (self.moveActiveCell(shiftKey, true)) {
      rowIndex = self.activeCell.rowIndex;
      columnIndex = self.activeCell.columnIndex;
      // We have moved to the next cell, now check if it has data, and if so,
      // begin editing it.
      if (self.getCellData(rowIndex, columnIndex)) {
        self.beginEditAt(columnIndex, rowIndex);
      }
      self.scrollIntoView(columnIndex, rowIndex, true);
    }
    self.redrawCommit();
  };

  focus = (e: FocusEvent) => {
    // const { self } = this;
    // self.setPassive(false);
  };

  blur = (e: FocusEvent) => {
    // const { self } = this;
    // self.setPassive(true);
  };

  insert = ({
    rows = [],
    startRowIndex = 0,
    startColumnIndex = 0,
    minRowsLength = 0,
    minColumnsLength = 0,
    reverseRows = false,
    reverseColumns = false,
    clearSelections = false,
    alwaysFilling = false,
    direction = 'both',
    suppressEvent = false,
  }) => {
    const { self } = this;
    const sanitizedRows = sanitizeRowsData(rows);
    rows = sanitizedRows.data;

    const schema = self.getSchema();
    const rowsSpannedLength = rows.length + sanitizedRows.rowsOffset;
    const colsSpannedLength = sanitizedRows.colsSpannedLength;
    const diffRow = minRowsLength % rowsSpannedLength;
    const diffCol = minColumnsLength % colsSpannedLength;
    const userData = {};

    let rowExtent = 0,
      colExtent = 0;

    if (diffRow > 0 || diffCol > 0) {
      rows.forEach((row, rowIndex) => {
        let colExtentTmp = 0;

        row.forEach((cell, colIndex) => {
          const rowOffset = cell.rowOffset || 0,
            colOffset = cell.columnOffset || 0,
            rowSpan = cell.rowSpan || 1,
            colSpan = cell.columnSpan || 1;

          if (
            rowIndex + rowOffset < diffRow &&
            rowSpan - 1 - rowOffset > rowExtent
          ) {
            rowExtent = rowSpan - 1 - rowOffset - (diffRow - 1 - rowIndex);
          }

          if (
            colIndex + colOffset < diffCol &&
            colSpan - 1 - colOffset > colExtentTmp
          ) {
            colExtentTmp = colSpan - 1 - colOffset - (diffCol - 1 - colIndex);
          }
        });

        if (colExtentTmp > colExtent) colExtent = colExtentTmp;
      });
    }

    const rowsLength = Math.max(rowsSpannedLength, minRowsLength + rowExtent);
    const colsLength = Math.max(
      colsSpannedLength,
      minColumnsLength + colExtent,
    );
    const fillCellCallback = self.attributes.fillCellCallback;
    const filledCells = [];

    self.unmergeCells({
      startColumn: startColumnIndex - (reverseColumns ? colExtent : 0),
      startRow: startRowIndex - (reverseRows ? rowExtent : 0),
      endColumn:
        startRowIndex + colsLength - 1 - (reverseColumns ? colExtent : 0),
      endRow: startRowIndex + rowsLength - 1 - (reverseRows ? rowExtent : 0),
    });

    if (clearSelections) self.clearSelections();

    let rowsOffset = 0,
      fillingPosition = -1,
      fillingRowPosition = -1;

    for (let i = 0, rowPos = 0; i < rowsLength; i++, rowPos++) {
      if (rowPos >= rowsSpannedLength) {
        rowPos = 0;
        rowsOffset += rowsSpannedLength;
      }

      const cells = rows[rowPos];
      if (!cells || cells.length <= 0) continue;
      const fillingRow = rowsOffset > 0;

      let columnsOffset = 0,
        fillingColumnPosition = -1;

      if (alwaysFilling || fillingRow) fillingRowPosition++;

      for (let j = 0, cellPos = 0; j < colsLength; j++, cellPos++) {
        if (cellPos >= colsSpannedLength) {
          cellPos = 0;
          columnsOffset += colsSpannedLength;
        }

        const cell = cells[cellPos];
        if (!cell) continue;

        const rowOffset = cell.rowOffset || 0;
        const columnOffset = cell.columnOffset || 0;
        const rowSpan = Math.max((cell.rowSpan || 0) - 1, 0);
        const colSpan = Math.max((cell.columnSpan || 0) - 1, 0);

        const cellRowPos = rowsOffset + rowPos + rowOffset;
        const rowPosition = reverseRows
          ? rowsLength - rowExtent - cellRowPos - 1
          : cellRowPos;

        const cellColumnPos = columnsOffset + cellPos + columnOffset;
        const fillingColumn = columnsOffset > 0;
        const colPosition = reverseColumns
          ? colsLength - colExtent - cellColumnPos - 1
          : cellColumnPos;

        if (alwaysFilling || fillingColumn) fillingColumnPosition++;
        if (alwaysFilling || fillingRow || fillingColumn) fillingPosition++;

        let rowIndex = startRowIndex + rowPosition,
          columnIndex = startColumnIndex + colPosition;

        if (rowSpan > 0 || colSpan > 0) {
          const bounds: RangeDescriptor = {
            startColumn: !reverseColumns
              ? columnIndex
              : Math.max(columnIndex - colSpan, 0),
            startRow: !reverseRows ? rowIndex : Math.max(rowIndex - rowSpan, 0),
            endColumn: !reverseColumns ? columnIndex + colSpan : columnIndex,
            endRow: !reverseRows ? rowIndex + rowSpan : rowIndex,
          };

          self.mergeCells(bounds);

          if (
            rowIndex !== bounds.startRow ||
            columnIndex !== bounds.startColumn
          ) {
            rowIndex = bounds.startRow;
            columnIndex = bounds.startColumn;
          }
        }

        const realRowIndex = rowIndex; // self.orders.rows.getRealIndex(rowIndex);
        const realColumnIndex = columnIndex;
        const column = schema[realColumnIndex];

        if (!column) {
          console.warn('Paste data exceeded grid bounds. Skipping.');
          continue;
        }

        const dataKey = column.dataKey;
        const cellData = cell?.value.map((item) => item.value).join('') ?? '';
        const existingRowData = self.dataSource.deprecated_getRowData(rowIndex);
        const newRowData = { ...existingRowData };
        const edit: EditCellDescriptor[] = [];
        const existingCellData = existingRowData[dataKey];

        if (
          fillCellCallback &&
          (fillingColumn || fillingRow || alwaysFilling)
        ) {
          let fillingRowLength = alwaysFilling ? rowsLength : -1;
          let fillingColumnLength = alwaysFilling ? colsLength : -1;

          if (!alwaysFilling) {
            if (fillingRow) fillingRowLength = rowsLength - rowsSpannedLength;

            if (fillingColumn)
              fillingColumnLength = colsLength - colsSpannedLength;
          }

          const newCellData = fillCellCallback({
            rows: rows,
            direction: direction,
            rowData: existingRowData,
            existingRowData: existingRowData,
            rowIndex: realRowIndex,
            rowOffset: rowPos,
            cells: cells,
            reversed: direction === 'horizontal' ? reverseColumns : reverseRows,
            isFillingRow: fillingRow || alwaysFilling,
            fillingRowPosition,
            fillingRowLength,
            column: column,
            columnIndex: columnIndex,
            columnOffset: cellPos,
            newCellData: cellData,
            existingCellData: existingCellData,
            isFillingColumn: fillingColumn || alwaysFilling,
            fillingColumnPosition,
            fillingColumnLength,
            fillingPosition,
            userData,
          });
          newRowData[dataKey] = newCellData;
          edit.push({ row: rowIndex, column: columnIndex, value: newCellData });
        } else if (cellData !== undefined && cellData !== null) {
          newRowData[dataKey] = cellData;
          edit.push({ row: rowIndex, column: columnIndex, value: cellData });
        }

        if (alwaysFilling || fillingRow || fillingColumn) {
          filledCells.push([
            realRowIndex,
            columnIndex,
            self.getBoundRowIndexFromViewRowIndex(realRowIndex),
            columnIndex,
            // self.getBoundColumnIndexFromViewColumnIndex(columnIndex),
          ]);
        }

        self.dragSelect(realRowIndex, columnIndex, undefined, undefined, true);

        // self.dataSource.editCells
        if (edit.length > 0) self.dataSource.editCells(edit);
      }
    }

    if (!suppressEvent && (filledCells.length > 0 || alwaysFilling)) {
      self.dispatchEvent('afterfill', {
        filledCells: filledCells,
      });
    }
  };

  /**
   * Redraw the frame after we get a `loadingdone` event from
   * {@link document.fonts}.
   *
   * We are doing this because the grid doesn't exactly use CSS styling and,
   * when a font is loaded lazily, it is unable to react due to caching.
   */
  fontsloadingdone = (_: FontFaceSetLoadEvent) => {
    const { self } = this;
    self.requestRedraw('all');
    self.redrawCommit();
  };
}
