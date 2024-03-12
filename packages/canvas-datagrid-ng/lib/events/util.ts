'use strict';

import type {
  ParsedTableData,
  SanitizedRowsData,
  SanitizedRowItem,
} from '../clipboard/parse-clipboard-data';
import { gridDimensionKeys } from '../style/dimensions';
import type {
  CellDescriptor,
  CursorTarget,
  GridPrivateProperties,
  NormalCellDescriptor,
} from '../types';

/**
 * Checks if anything is being dragged, and if so whether it should use
 * auto-scroll zones.
 * @param {GridPrivateProperties} self
 * @returns {boolean} True if the item that is being dragged can use auto-scrolling.
 */
const isDraggedItemAutoScrollable = (self: GridPrivateProperties) => {
  return (
    self.attributes.autoScrollOnMousemove &&
    self.draggingItem !== undefined &&
    (self.draggingItem.isNormal ||
      self.draggingItem.isHeader ||
      self.draggingItem.nodeType === 'selection-handle') &&
    self.dragMode !== 'frozen-column-marker' &&
    self.dragMode !== 'frozen-row-marker' &&
    !/-resize/.test(self.dragMode)
  );
};

const isSupportedHtml = function (pasteValue) {
  // We need to match new lines in the HTML, .* won't match new line characters.
  // `s` regex modifier can't be used with `ecmaVersion === 2017`.
  // As a workaround using [\s\S]*. Fix when we upgrade `ecmaVersion`.
  const genericDiv = /(?:^(<meta[^>]*>)?[\s\S]*<div[^>]*>)/;
  const genericSpan = /(?:^(<meta[^>]*>)?[\s\S]*<span[^>]*>)/;
  const genericTable = /(?:^(<meta[^>]*>)?[\s\S]*<table[^>]*>)/; // Matches Google Sheets format clipboard data format too.
  const excelTable = /(?:<!--StartFragment-->[\s\S]*<tr[^>]*>)/;
  const excelTableRow = /(?:<!--StartFragment-->[\s\S]*<td[^>]*>)/;

  return [
    genericDiv,
    genericTable,
    genericSpan,
    excelTable,
    excelTableRow,
  ].some((expression) => expression.test(pasteValue));
};

const sanitizeRowsData = function (rows: ParsedTableData): SanitizedRowsData {
  const result: SanitizedRowsData = {
    data: [],
    rowsOffset: 0,
    colsSpannedLength: 0,
  };

  rows.forEach((row) => {
    const cells: SanitizedRowItem[] = [];
    let colOffset = 0;

    row.forEach((cell) => {
      if (!cell) {
        colOffset++;
        return;
      }

      cells.push(
        Object.assign(cell, {
          rowOffset: result.rowsOffset,
          columnOffset: colOffset,
        }),
      );
    });

    if (result.colsSpannedLength === 0 && row.length > 0) {
      result.colsSpannedLength = row.length;
    }

    if (cells.length > 0) {
      result.data.push(cells);
    } else {
      result.rowsOffset++;
    }
  });

  return result;
};

const findLastFreezableColumn = (self: GridPrivateProperties) => {
  const width =
    self.width -
    (self.scrollBox.horizontalTrackVisible ? self.style.scrollBarWidth : 0);
  let prevHeader: NormalCellDescriptor | undefined;
  for (const header of self.viewport.columnHeaders) {
    // If the current header exceeds the grid width, return the previous header
    // as the result.
    if (header.x + header.width > width) return header;
    prevHeader = header;
  }
  // If we haven't returned yet, it means all the headers were visible can
  // be frozen, so just return the last one.
  return prevHeader;
};

/**
 * Find the last freezable row cell from the already drawn row headers array.
 * @param {number} width The total width of the grid (usually `self.width`).
 * @param {NormalCellDescriptor[]} rowHeaders
 * @returns {NormalCellDescriptor} as the last freezable header or undefined.
 */
const findLastFreezableRow = (self: GridPrivateProperties) => {
  const height =
    self.height -
    (self.scrollBox.verticalTrackVisible ? self.style.scrollBarWidth : 0);
  let prevHeader: NormalCellDescriptor | undefined;
  for (const header of self.viewport.rowHeaders) {
    // If the current header exceeds the grid width, return the previous header
    // as the result.
    if (header.y + header.height > height) return header;
    prevHeader = header;
  }
  // If we haven't returned yet, it means all the headers were visible can
  // be frozen, so just return the last one.
  return prevHeader;
};

/**
 * Finds the first visible cell for an ongoing dragging operation if one exits
 * and if the given coordinates point outside the scroll box, which in that
 * case, we use `scrollIndexTop`, `scrollIndexLeft`, `scrollIndexBottom`, and
 * `scrollIndexRight` to find the right visible cell.
 *
 * Note that if an axis has frozen area, we don't do approximation for it, since
 * if the user leaves scrollBox, the first thing they will touch is that frozen
 * area.
 * @param {GridPrivateProperties} self
 * @param {number} x Axis coordinate of the cursor.
 * @param {number} y Axis coordinate of the cursor.
 * @returns {any} The nearest cell or undefined if nothing is being dragged.
 */
const getApproximateCell = (
  self: GridPrivateProperties,
  x: number,
  y: number,
): CursorTarget | undefined => {
  if (!isDraggedItemAutoScrollable(self)) return;

  const checkCell = (cell: CellDescriptor) =>
    cell.isNormal || (self.draggingItem.isHeader && cell.isHeader);
  const pointingCell = self.getCellAt(x, y, checkCell);
  const { cursor, dragContext, cell } = pointingCell;
  if (checkCell(cell)) return pointingCell;

  const { horizontalTrack, verticalTrack } = self.scrollBox.entities;
  let rowIndex: number | undefined;
  let columnIndex: number | undefined;

  if (y < verticalTrack.y && self.frozenRow === 0) {
    rowIndex = self.scrollIndexTop;
  } else if (y > verticalTrack.y + verticalTrack.height) {
    rowIndex = self.scrollIndexBottom;
  }

  if (x < horizontalTrack.x && self.frozenColumn === 0) {
    columnIndex = self.scrollIndexLeft;
  } else if (x > horizontalTrack.x + horizontalTrack.width) {
    columnIndex = self.scrollIndexRight;
  }

  const result = self.visibleCells.find(
    (cell) =>
      checkCell(cell) &&
      (rowIndex === cell.rowIndex ||
        (y >= cell.y && x <= cell.y + cell.height) ||
        // This will only work because visible cells are stored
        // in reverse order.
        (rowIndex === undefined && y >= cell.y + cell.height)) &&
      (columnIndex === cell.columnIndex ||
        (x >= cell.x && x <= cell.x + cell.width) ||
        // This will only work because visible cells are stored
        // in reverse order.
        (columnIndex === undefined && x >= cell.x + cell.width)),
  );
  if (result) return { cursor, dragContext, cell: result };
  if (cell) return pointingCell;
};

const updateScalableDimensions = (self: GridPrivateProperties) => {
  for (const key of gridDimensionKeys) {
    const value = self.style[key];
    // Skip unscalable ones.
    if (value === 0) continue;
    // Have limit so that we don't get '0'.
    self.style.scaled[key] =
      value > 0 ? Math.max(1, self.dp(value)) : Math.min(-1, self.dp(value));
  }
};

/**
 * Only allow the scrolling to happen on the axis that is faster, and allow
 * the other axis to move only when it is above a certain speed limit.
 * @param self
 * @param x Horizontal scroll value.
 * @param y Vertical scroll value.
 * @returns The sanitized values.
 */
const sanitizeScrollValues = (
  self: GridPrivateProperties,
  x: number,
  y: number,
) => {
  const { touchScrollMinimumSpeedLimit } = self.attributes;
  const ax = Math.abs(x);
  const ay = Math.abs(y);
  return {
    x: ax > ay || ax > touchScrollMinimumSpeedLimit ? x : 0,
    y: ay > ax || ay > touchScrollMinimumSpeedLimit ? y : 0,
  };
};

const applyScrollEasing = (
  self: GridPrivateProperties,
  totalIterations: number,
  currentIteration: number,
  startValue: number,
) => {
  return (
    startValue -
    startValue *
      self.easingFunctions[self.attributes.touchEasingMethod](
        currentIteration / totalIterations,
      )
  );
};

export {
  findLastFreezableColumn,
  findLastFreezableRow,
  getApproximateCell,
  isDraggedItemAutoScrollable,
  isSupportedHtml,
  sanitizeRowsData,
  updateScalableDimensions,
  sanitizeScrollValues,
  applyScrollEasing,
};
