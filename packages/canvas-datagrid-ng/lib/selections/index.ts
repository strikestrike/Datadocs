'use strict';

import type {
  GridHeader,
  GridPrivateProperties,
  GridSchemaItem,
  MergedCellDescriptor,
  NormalCellDescriptor,
  RangeDescriptor,
  SelectionRequest,
} from '../types';
import { copyMethods } from '../util';
import type { SelectionDescriptor, SelectionContext } from './types';
import type { RectangleObject } from '../types/base-structs';
import type { ParsedTableData } from '../clipboard/parse-clipboard-data';
import {
  alterSelection,
  areSelectionsComplex,
  cloneSelections,
  findSelectionForIndex,
  getSelectedContiguousColumns,
  getSelectedContiguousRows,
  getSelectionBounds,
  getSelectionStateFromCells,
  isCellSelected,
  isColumnSelected,
  isInSelection,
  isRowSelected,
  isSelectionSingular,
  moveSelections,
  normalizeSelection,
  removeFromSelections,
  SelectionType,
  shrinkOrExpandSelections,
} from './util';
import { RangeResult } from '../range/result';
import { SELECTION_CONTEXT_TYPE_TABLE } from './constants';

/**
 * Before reading the code of this module, you must know these things:
 *
 * You may see words like "obsolete", "old API", "compatibility" in the code later.
 * Because this grid component has used a different selection mechanism in the past.
 *
 * The old mechanism use a 2D array to represent the selection state.
 * For example: `[undefined x 10, [0, 5]]` indicates
 * there are two cells are selected in current grid. they are located in row 11.
 * and one in column 1, another in column 6.
 * And `[undefined x 5, [-1, 0,1,2,3,4,5,6...], undefined x 2, [1]]` indicates
 * the row 6 is selected and the cell that located in row 9 column 2 is selected.
 *
 * But this implementation has performance issue when the grid is shipping a large dataset.
 * You can just imagine about what will happen when you select all cells in a grid with 1 million rows.
 *
 * So we create a new way to implement the selection.
 * In this way, we use a selection list to represent the selection state.
 * Each element in this selection list is a selection descriptor.
 * Each descriptor represents an area whose selected or unselected by the user.
 * And we have four types for the descriptor: UnselectedCells, Cells, Rows and Columns
 *
 * Because the old selection mechanism has been in used for a long time and
 * we have many public API about it.
 * We still need to keep these API working in the 0.x versions in the future.
 * So we create some functions to make sure these APIs and context objects work like previous version.
 * This is the reason why you may see there some functions in this file
 * be marked "for compatibility" without best practice.
 */
export default function loadGridSelectionManager(self: GridPrivateProperties) {
  copyMethods(new GridSelectionManager(self), self);
}

export type SelectedCell = {
  value: any;
  columnName: string;
  viewRowIndex: number;
  viewColumnIndex: number;
  header: GridHeader;
};

export type EachSelectedCellCallback = (
  viewRowIndex: number,
  viewColumnIndex: number,
  cell: SelectedCell,
) => any;

export class GridSelectionManager {
  constructor(private readonly self: GridPrivateProperties) {}

  /**
   * Returns the selection that user last added.
   *
   * The returned {@link SelectionType} can be {@link SelectionType.Rows} or
   * {@link SelectionType.Columns} as long as they contain the active cell.
   *
   * This always return a selection.
   * @returns {SelectionDescriptor}
   */
  getPrimarySelection = () => {
    const { self } = this;
    if (self.lastAddedSelection) return self.lastAddedSelection;
    return self.findSelectionForIndex(
      self.activeCell.rowIndex,
      self.activeCell.columnIndex,
    );
  };

  /**
   * (This method is used for adapting old API and it has performance issue for the large data set)
   *
   * Generate a selection 2 dimensional array from the selection list.
   * Each row in this 2D array is a number array that indicates which columns are selected in this row.
   * And -1 in the result means entire cells are selected in particular row/column
   * For example: The result `[undefined x 10, [0, 5]]` indicates
   * there are two cells are selected in current grid. they are located in row 11.
   * and one in column 1, another in column 6.
   *
   * @param {object[]} [otherSelections] The function create a 2d array based on this selection list
   * if this parameter is provided. Otherwise, this function uses self.selections as the list input.
   * @returns {number[][]}
   */
  getObsoleteSelectionMatrix = (otherSelections?: SelectionDescriptor[]) => {
    const { self } = this;
    const bounds = self.getSelectionBounds(true, otherSelections);
    if (!bounds) return [];
    const { top, bottom, left, right } = bounds;
    const height = bottom - top + 1;
    const width = right - left + 1;
    const states = getSelectionStateFromCells(self.selections, {
      startRow: top,
      endRow: bottom,
      startColumn: left,
      endColumn: right,
    });
    if (states === false) return [];

    const result = [];
    for (let row = top, row2 = top + height; row < row2; row++) {
      if (states === true) {
        result[row] = new Array(width).fill(0).map((_, i) => left + i);
        continue;
      }

      const rowState = states[row - top];
      if (!rowState) continue;
      result[row] = [];
      for (let col = left, col2 = left + width; col < col2; col++) {
        if (!rowState[col - left]) continue;
        result[row].push(col);
      }
    }
    for (let i = 0; i < self.selections.length; i++) {
      const selection = self.selections[i];
      if (selection.type !== SelectionType.Rows) continue;
      for (let row = selection.startRow; row <= selection.endRow; row++) {
        if (!result[row]) {
          result[row] = [-1];
          continue;
        }
        if (result[row][0] === -1) continue;
        result[row].unshift(-1);
      }
    }
    return result;
  };

  /**
   * Return a tuple if the user selected contiguous columns, otherwise `null`.
   * Info: Because the user may reorder the columns,
   * the schemaIndex of the first item may be greater than the schemaIndex of the second item,
   * but the columnIndex of the firs item must less than the columnIndex of the second item.
   * @param {object[]} [schema] from `self.getSchema()`
   * @returns {object[]} column schemas tuple (each schema has an additional field `schemaIndex`)
   */
  getSelectedContiguousColumns = (schema?: GridSchemaItem[]) => {
    const { self } = this;
    if (!schema) schema = self.getSchema();
    const columnOrderIndexes = getSelectedContiguousColumns(
      self.selections,
      false,
    );
    if (!Array.isArray(columnOrderIndexes)) return;

    return columnOrderIndexes.map((orderIndex) => {
      const schemaIndex = orderIndex;
      const columnSchema = schema[schemaIndex];
      return Object.assign({}, columnSchema, { orderIndex });
    });
  };

  /**
   * @param {boolean} [allowOnlyOneRow]
   * @returns {number[]} a viewRowIndex tuple. It can contains one row index or two row indexes.
   */
  getSelectedContiguousRows = (allowOnlyOneRow?: boolean) => {
    const { self } = this;
    const viewRowIndexes = getSelectedContiguousRows(self.selections, false);
    if (!Array.isArray(viewRowIndexes)) return;
    if (!allowOnlyOneRow && viewRowIndexes[0] === viewRowIndexes[1]) return;
    return viewRowIndexes;
  };

  /**
   * Check if current selection are copyable for the system clipboard
   * @returns {boolean}
   */
  canSelectionsBeCopied = () => {
    const { self } = this;
    return self.selections.length > 0 && !areSelectionsComplex(self.selections);
  };

  /**
   * Return the height of the selection area.
   * This function is used for rendering the overlay for the dnd(drag and drop)
   * @returns {number}
   */
  getSelectedRowsHeight = () => {
    const { self } = this;
    const selected = getSelectedContiguousRows(self.selections, true);
    if (!selected) return 0;
    let height = 0;
    for (let row = selected[0]; row <= selected[1]; row++)
      height += self.getRowHeight(row);
    return height;
  };

  /**
   * Return the width of the selection area.
   * This function is used for rendering the overlay for the dnd(drag and drop)
   * @returns {number}
   */
  getSelectedColumnsWidth = () => {
    const { self } = this;
    const selected = getSelectedContiguousColumns(self.selections, true);
    if (!selected) return 0;
    let width = 0;
    for (let col = selected[0]; col <= selected[1]; col++)
      width += self.getColumnWidth(col);
    return width;
  };

  /**
   * @param {object} cell This method needs two properties in this parameter: `rowIndex`
   * and `viewColumnIndex`
   */
  isCellSelected = (cell?: any) => {
    const { self } = this;
    return isCellSelected(self.selections, cell.rowIndex, cell.viewColumnIndex);
  };

  /**
   * Returns true if the selected columnIndex is selected on every row.
   * @memberof canvasDatagrid
   * @name isColumnSelected
   * @method
   * @param {number} columnIndex The column index to check.
   */
  isColumnSelected = (viewColumnIndex?: number) => {
    const { self } = this;
    if (typeof viewColumnIndex !== 'number') return false;
    return isColumnSelected(self.selections, viewColumnIndex);
  };

  /**
   * Returns true if the selected rowIndex is selected on every column.
   * @memberof canvasDatagrid
   * @name isRowSelected
   * @method
   * @param {number} rowIndex The row index to check.
   */
  isRowSelected = (rowIndex?: number) => {
    const { self } = this;
    if (typeof rowIndex !== 'number') return false;
    return isRowSelected(self.selections, rowIndex);
  };

  /**
   * Removes the selection and pushed the active cell as the only selection.
   * @param {boolean} [triggerEvent]
   * @param {boolean} [noActiveCellSelection] If true, prevents the active cell from being added to the selection list.
   * @returns {boolean} True if clearing changing the selection list.
   */
  clearSelections = (
    triggerEvent?: boolean,
    noActiveCellSelection?: boolean,
  ) => {
    const { self } = this;
    // No need for clearing. There is only the singular active cell selection.
    if (
      self.selections.length === 1 &&
      isSelectionSingular(self.selections[0]) &&
      !noActiveCellSelection
    ) {
      return false;
    }

    self.selections = [];
    if (!noActiveCellSelection) this._pushActiveCellToSelections();
    if (self.selections.length && triggerEvent) {
      self.dispatchSelectionChangedEvent();
      return true;
    }

    return false;
  };

  /**
   * Removes all the existing selections, except the active cell.
   *
   * Use {@link self.clearSelections()} to fully clear selections.
   * @memberof canvasDatagrid
   * @name selectNone
   * @param {boolean} [dontDraw] Suppress the draw method after the selection change.
   * @param {boolean} [suppressEvent] Suppress the selection changed from firing off.
   * @method
   * @returns {boolean} True if the selections have changed.
   */
  selectNone = (dontDraw?: boolean, suppressEvent?: boolean) => {
    const { self } = this;
    const selectionsChanged = self.clearSelections(true);

    if (selectionsChanged) {
      if (!dontDraw) self.draw();
      if (!suppressEvent) self.dispatchSelectionChangedEvent();
    }

    return selectionsChanged;
  };

  /**
   * Selects every visible cell.
   * @memberof canvasDatagrid
   * @name selectAll
   * @param noExpand Select the whole grid instead of trying to expand.
   * @param dontDraw Suppress the draw method after the selection change.
   * @return True if there wasn't a selection covering all the cells before.
   */
  selectAll = (noExpand?: boolean, dontDraw?: boolean) => {
    const { self } = this;
    const selection = self.getPrimarySelection();
    const startColumn = self.getFirstColumnIndex();
    const endColumn = self.getLastColumnIndex();
    const existing = self.selections.find(
      (selection) =>
        selection.type === SelectionType.Columns &&
        selection.startColumn === startColumn &&
        selection.endColumn === endColumn,
    );
    this.clearSelections(false, true);
    if (
      noExpand ||
      selection.type !== SelectionType.Cells ||
      !self.dataSource.expandRange(selection as RangeDescriptor)
    ) {
      this._pushNewSelection(
        existing ?? {
          type: SelectionType.Columns,
          startColumn: startColumn,
          endColumn: endColumn,
        },
      );
    } else {
      self.normalizeSelection(selection);
      this._pushNewSelection(selection);
    }
    if (!existing && !dontDraw) self.draw();
    return !!existing;
  };

  /**
   * @param {object} cell This method needs two properties in this parameter: `rowIndex`
   * and `viewColumnIndex`
   * @param {boolean} [suppressEvent]
   * @deprecated
   */
  unselectCell = (cell?: any, suppressEvent?: boolean) => {
    const { self } = this;
    const result = removeFromSelections(
      self.selections,
      self.normalizeSelection({
        type: SelectionType.Cells,
        startRow: cell.rowIndex,
        startColumn: cell.viewColumnIndex,
      }),
    );
    if (result && !suppressEvent) self.dispatchSelectionChangedEvent();
    return result;
  };

  /**
   * @param {number} startRow rowViewIndex
   * @param {number} endRow rowViewIndex
   * @param {boolean} suppressEvent When true, prevents the `selectionchanged` event from firing.
   * @returns {boolean} It returns whether the selection changed
   * @deprecated
   */
  unselectRows = (
    startRow: number,
    endRow: number,
    suppressEvent?: boolean,
  ) => {
    const { self } = this;
    const result = removeFromSelections(
      self.selections,
      self.normalizeSelection({
        type: SelectionType.Rows,
        startRow: startRow,
        endRow: endRow,
      }),
    );
    if (result && !suppressEvent) self.dispatchSelectionChangedEvent();
    return result;
  };

  /**
   * Selects the given cell depending on its type.
   * @param cell The cell to select.
   * @param ctrl True if ctrl is pressed.
   * @param shift True if shift is pressed.
   * @param suppressEvent True to suppress selection changed events.
   */
  selectAny = (
    cell: NormalCellDescriptor,
    ctrl?: boolean,
    shift?: boolean,
    suppressEvent?: boolean,
    context?: SelectionContext,
  ) => {
    const { self } = this;
    const { rowIndex, viewColumnIndex } = cell;
    if (cell.isRowHeader) {
      self.selectRow(rowIndex, ctrl, shift, suppressEvent);
    } else if (cell.isColumnHeader) {
      self.selectColumn(viewColumnIndex, ctrl, shift, suppressEvent);
    } else if (!cell.isCorner) {
      self.selectCell(
        rowIndex,
        viewColumnIndex,
        ctrl,
        shift,
        suppressEvent,
        context,
      );
    }
  };

  /**
   * Selects a cell.
   * @param rowIndex Of the cell.
   * @param columnIndex View column index of the cell.
   * @param ctrl True if ctrl is pressed.
   * @param shift True if shift is pressed.
   * @param suppressEvent True to suppress selection changed events.
   * @param context The context for this selection.
   * @returns True if the selections have changed.
   */
  selectCell = (
    rowIndex: number,
    columnIndex: number,
    ctrl?: boolean,
    shift?: boolean,
    suppressEvent?: boolean,
    context?: SelectionContext,
  ) => {
    const { self } = this;
    const selection = self.getPrimarySelection();
    let selectionsChanged = false;

    if (self.selectionRequestContext) {
      const context = self.selectionRequestContext;
      const { request } = self.selectionRequestContext;

      context.selection = {
        type: SelectionType.Cells,
        startRow: rowIndex,
        startColumn: columnIndex,
        endRow: rowIndex,
        endColumn: columnIndex,
      };
      context.initialCellIndex = { rowIndex, columnIndex };

      if (request.type === 'cell' && request.covers) {
        context.selection.endRow += request.covers.rows - 1;
        context.selection.endColumn += request.covers.columns - 1;
      }
      return true;
    }

    if (!ctrl) selectionsChanged = self.clearSelections(false, true);
    if (shift) {
      selection.type = SelectionType.Cells;
      let startRow = Math.min(self.activeCell.rowIndex, rowIndex);
      let endRow = Math.max(self.activeCell.rowIndex, rowIndex);
      let startColumn = Math.min(self.activeCell.columnIndex, columnIndex);
      let endColumn = Math.max(self.activeCell.columnIndex, columnIndex);

      if (context?.type === SELECTION_CONTEXT_TYPE_TABLE) {
        const { table } = context;
        if (/row|table/.test(context.target)) {
          startColumn = Math.min(startColumn, table.startColumn);
          endColumn = Math.max(endColumn, table.endColumn);
        }
        if (/column|table/.test(context.target)) {
          startRow = Math.min(
            startRow,
            table.startRow + (table.style.showHeaderRow ? 0 : 1),
          );
          endRow = Math.max(endRow, table.endRow);
        }
      }

      if (
        alterSelection(
          selection,
          SelectionType.Cells,
          startRow,
          endRow,
          startColumn,
          endColumn,
          context,
        )
      ) {
        selectionsChanged = true;
      }

      self.normalizeSelection(selection);
      this._pushNewSelection(selection);
    } else if (context?.type === SELECTION_CONTEXT_TYPE_TABLE) {
      const { table } = context;
      const isTable = context.target === 'table';
      const isRow = context.target === 'row';
      const isCol = context.target === 'column';
      const startRow =
        (isTable || isCol) &&
        table.style.showHeaderRow &&
        (selection.context?.type !== context.type ||
          (isCol &&
            (selection.startColumn !== selection.endColumn ||
              selection.startColumn !== columnIndex)) ||
          selection.startRow === table.startRow)
          ? table.startRow + 1
          : table.startRow;
      const newSelection: SelectionDescriptor = {
        type: SelectionType.Cells,
        context,
        startColumn: isTable || isRow ? table.startColumn : columnIndex,
        endColumn: isTable || isRow ? table.endColumn : columnIndex,
        startRow: isTable || isCol ? startRow : rowIndex,
        endRow: isTable || isCol ? table.endRow : rowIndex,
      };
      this._pushNewSelection(newSelection);
      self.setActiveCell(newSelection.startColumn, newSelection.startRow);
    } else {
      self.setActiveCell(columnIndex, rowIndex);
      this._pushActiveCellToSelections();
      selectionsChanged = true;
    }

    if (selectionsChanged && !suppressEvent) {
      self.dispatchSelectionChangedEvent();
    }

    return selectionsChanged;
  };

  /**
   * Do a drag selection using the given cell using primary selection while
   * respecting the selection type. This is useful when you only want to update
   * the selection but do not want to change its type.
   *
   * The premise for this function is when drag selecting from a normal cell,
   * the user might move the cursor over a column header. If we use
   * {@link selectAny} there, selection type will change to
   * {@link SelectionType.Columns}, which is not what we want.
   * @param {number} rowIndex Of the cell.
   * @param {number} columnIndex View column index of the cell.
   * @param {number} [draggingRowIndex] Of the cell that is being dragged.
   * @param {number} [draggingColumnIndex] View column index of the cell that is being dragged.
   * @param {boolean} [expandOnly] Do not shrink to shrink to dragging cell and just expand the selection.
   * @param {boolean} [suppressEvent]
   */
  dragSelect = (
    rowIndex: number,
    columnIndex: number,
    draggingRowIndex?: number,
    draggingColumnIndex?: number,
    expandOnly?: boolean,
    suppressEvent?: boolean,
  ) => {
    const { self } = this;
    // This doesn't support the corner cell.
    if (rowIndex === -1 && columnIndex === -1) return false;

    const isRowHeader = rowIndex >= 0 && columnIndex === -1;
    const isColumnHeader = rowIndex === -1 && columnIndex >= 0;
    const srContext = self.selectionRequestContext;

    if (srContext?.initialCellIndex) {
      draggingRowIndex = srContext.initialCellIndex.rowIndex;
      draggingColumnIndex = srContext.initialCellIndex.columnIndex;
    } else if (
      draggingRowIndex === undefined ||
      draggingColumnIndex === undefined
    ) {
      draggingRowIndex = self.activeCell.rowIndex;
      draggingColumnIndex = self.activeCell.columnIndex;
    }
    if (srContext?.request.type === 'cell') {
      if (
        rowIndex !== srContext.selection.startRow ||
        columnIndex !== srContext.selection.startColumn
      ) {
        // Move the current cell selection if selecting a single cell.
        const { selection, request } = srContext;

        selection.startRow = rowIndex;
        selection.startColumn = columnIndex;
        selection.endRow = rowIndex;
        selection.endColumn = columnIndex;

        if (request.covers) {
          selection.endRow += request.covers.rows - 1;
          selection.endColumn += request.covers.columns - 1;
        }

        self.requestRedraw('selection');
        return true;
      }
      return false;
    }
    const sel = srContext?.selection ?? self.getPrimarySelection();
    let top = Math.min(expandOnly ? sel.startRow : draggingRowIndex, rowIndex);
    let left = Math.min(
      expandOnly ? sel.startColumn : draggingColumnIndex,
      columnIndex,
    );
    let bottom = Math.max(expandOnly ? sel.endRow : draggingRowIndex, rowIndex);
    let right = Math.max(
      expandOnly ? sel.endColumn : draggingColumnIndex,
      columnIndex,
    );
    if (sel.context?.type === SELECTION_CONTEXT_TYPE_TABLE) {
      if (/row|table/.test(sel.context.target)) {
        left = sel.startColumn;
        right = sel.endColumn;
      }
      if (/column|table/.test(sel.context.target)) {
        // Don't allow going above the header, hence `Math.max`.
        top = sel.startRow;
        bottom = sel.endRow;
      }
    }

    let selectionChanged = false;
    if (sel.type === SelectionType.Rows) {
      if (!isColumnHeader) {
        sel.startRow = top;
        sel.endRow = bottom;
        selectionChanged = true;
      }
    } else if (sel.type === SelectionType.Columns) {
      if (!isRowHeader) {
        sel.startColumn = left;
        sel.endColumn = right;
        selectionChanged = true;
      }
    } else if (sel.type === SelectionType.Cells) {
      if (top > -1) sel.startRow = top;
      sel.endRow = bottom;
      if (left > -1) sel.startColumn = left;
      sel.endColumn = right;
      selectionChanged = true;
      self.normalizeSelection(sel);
    }

    if (selectionChanged && !suppressEvent) {
      self.dispatchSelectionChangedEvent();
    }

    return selectionChanged;
  };

  getTopLeftCellOfSelection = (selection: SelectionDescriptor) => {
    return {
      rowIndex:
        selection.type === SelectionType.Columns ? 0 : selection.startRow,
      columnIndex:
        selection.type === SelectionType.Rows
          ? this.self.getFirstColumnIndex()
          : selection.startColumn,
    };
  };

  getBottomRightCellOfSelection = (selection: SelectionDescriptor) => {
    return {
      rowIndex:
        selection.type === SelectionType.Columns
          ? this.self.getLastRowIndex()
          : selection.endRow,
      columnIndex:
        selection.type === SelectionType.Rows
          ? this.self.getLastColumnIndex()
          : selection.endColumn,
    };
  };

  /**
   * Merge selections or seperate them into smaller chunks if the last selection
   * is on top of another selection, i.e., the active cell touches multiple
   * selections.
   *
   * This method is meant to be invoked after the selection operation has
   * finished, e.g., in `mouseup`, so that the user can see what they are
   * selecting before we actually append the result of their changes.
   * @param {boolean} [suppressEvent]
   * @returns {boolean} True if committing selections resulted in a change in selections.
   */
  commitSelections = (suppressEvent?: boolean) => {
    const { self } = this;
    const srContext = self.selectionRequestContext;
    if (srContext) {
      srContext.request.onSelect(srContext.selection);
      self.selectionRequestContext = undefined;
      self.requestRedraw('selection');
      return true;
    } else if (
      self.selections.length <= 1 ||
      self.lastAddedSelection.type !== SelectionType.Cells
    ) {
      return false;
    }

    const intersectingSelections: SelectionDescriptor[] = [];
    const { rowIndex, columnIndex } = self.activeCell;
    const { lastAddedSelection: lastSel } = self;

    const removeSelection = (desc: SelectionDescriptor) => {
      self.selections = self.selections.filter((sel) => sel !== desc);
    };

    let startsInSelection = false;
    // Find the selections that the last added one overlaps. For all this to
    // work, the active cell must at least touch one of them (excluding the
    // last one which is ignored).
    for (const sel of self.selections) {
      if (sel == lastSel) continue;
      if (
        (sel.type === SelectionType.Columns ||
          (sel.startRow <= rowIndex && sel.endRow >= rowIndex)) &&
        (sel.type === SelectionType.Rows ||
          (sel.startColumn <= columnIndex && sel.endColumn >= columnIndex))
      ) {
        // This selection contains the active selection.
        startsInSelection = true;
        intersectingSelections.push(sel);
      } else if (
        (sel.type === SelectionType.Columns ||
          (sel.endRow >= lastSel.startRow &&
            sel.startRow <= lastSel.startRow) ||
          (lastSel.endRow >= sel.startRow &&
            lastSel.startRow <= sel.startRow)) &&
        (sel.type === SelectionType.Rows ||
          (sel.endColumn >= lastSel.startColumn &&
            sel.startColumn <= lastSel.startColumn) ||
          (lastSel.endColumn >= sel.startColumn &&
            lastSel.startColumn <= sel.startColumn))
      ) {
        // Add the slighly touching selection.
        intersectingSelections.push(sel);
      }
    }

    // We ignore all the other overlapping selections if none of them
    // contains the active cell.
    if (!startsInSelection) return false;

    // The last added selection is being used to remove other selections,
    // so it is also remove as a part of that process.
    removeSelection(lastSel);

    // Here we will overlapping selections into smaller selections if the last
    // selection only partly covers them or remove them altogether if they are
    // fully covered.
    for (const sel of intersectingSelections) {
      removeSelection(sel);

      if (sel.type == SelectionType.Rows) {
        sel.startColumn = self.getFirstColumnIndex();
        sel.endColumn = self.getLastColumnIndex();
      } else if (sel.type == SelectionType.Columns) {
        sel.startRow = 0;
        sel.endRow = self.getLastRowIndex();
      }
      const { startRow, endRow, startColumn, endColumn } = sel;

      if (endRow > lastSel.endRow) {
        this._pushNewSelection({
          type: SelectionType.Cells,
          startRow: lastSel.endRow + 1,
          endRow,
          startColumn,
          endColumn,
        });
      }
      // For the columns we limit the selection height so that the selections
      // on the left and right don't touch the newly separated selections
      // that are above and below.
      if (endColumn > lastSel.endColumn) {
        this._pushNewSelection({
          type: SelectionType.Cells,
          startRow: Math.max(startRow, lastSel.startRow),
          endRow: Math.min(endRow, lastSel.endRow),
          startColumn: self.getAdjacentCells(lastSel.endColumn).right,
          endColumn,
        });
      }
      if (startColumn < lastSel.startColumn) {
        this._pushNewSelection({
          type: SelectionType.Cells,
          startRow: Math.max(startRow, lastSel.startRow),
          endRow: Math.min(endRow, lastSel.endRow),
          startColumn,
          endColumn: self.getAdjacentCells(lastSel.startColumn).left,
        });
      }
      if (startRow < lastSel.startRow) {
        this._pushNewSelection({
          type: SelectionType.Cells,
          startRow,
          endRow: lastSel.startRow - 1,
          startColumn,
          endColumn,
        });
      }

      self.setActiveCell(
        self.lastAddedSelection.startColumn,
        self.lastAddedSelection.startRow,
      );
    }

    // The user may clicked on the singular active cell selection, which will
    // remove all the selections. So, here we check it and add it back.
    if (self.selections.length === 0) {
      this._pushActiveCellToSelections();
    } else if (
      !self.findSelectionForIndex(
        self.activeCell.rowIndex,
        self.activeCell.columnIndex,
      )
    ) {
      // User unselected all the cells in the active selection, and we have
      // other selections. So, move the active cell to the last added
      // selection. This also means `lastAddedSelection` points to an invalid
      // selection, so we update it as well.
      const lastSelection = self.selections[self.selections.length - 1];
      const topLeftCell = self.getTopLeftCellOfSelection(lastSelection);
      self.activeSelection = lastSelection;
      self.lastAddedSelection = lastSelection;
      self.setActiveCell(topLeftCell.columnIndex, topLeftCell.rowIndex);
    }

    if (!suppressEvent) self.dispatchSelectionChangedEvent();

    return true;
  };

  /**
   * Moves the current selection relative to the its current position.  Note: this method does not move the selected data, just the selection itself.
   * @memberof canvasDatagrid
   * @name moveSelection
   * @method
   * @param {number} offsetX The number of columns to offset the selection.
   * @param {number} offsetY The number of rows to offset the selection.
   */
  moveSelection = (offsetX: number, offsetY: number) => {
    const { self } = this;
    moveSelections(self.selections, offsetX, offsetY);
  };

  /**
   * Dispatch a event named `selectionchanged` with context info
   */
  dispatchSelectionChangedEvent = () => {
    const { self } = this;
    self.requestRedraw('selection');
    self.dispatchEvent('selectionchanged', self.getContextOfSelectionEvent());
  };

  /**
   * Finds the selection for the given indexes and returns it if there is one.
   * @param {number} rowIndex
   * @param {number} columnIndex
   * @see findSelectionForIndex
   */
  findSelectionForIndex = (rowIndex: number, columnIndex: number) => {
    const { self } = this;
    return findSelectionForIndex(self.selections, rowIndex, columnIndex);
  };

  normalizeSelection = (
    sel: SelectionDescriptor,
  ): Required<SelectionDescriptor> => {
    const { self } = this;
    sel = normalizeSelection(sel);
    self.expandSelectionToMergedCells(sel);
    return sel as any;
  };

  /**
   * Return the event context for event `selectionchanged`
   */
  getContextOfSelectionEvent = () => {
    const { self } = this;
    const context = { selectionList: self.cloneSelections() };
    //#region for API compatibility
    Object.defineProperty(context, 'selectedCells', {
      get: function () {
        return self.getSelectedCells();
      },
    });
    Object.defineProperty(context, 'selectionBounds', {
      get: function () {
        return self.getSelectionBounds();
      },
    });
    //#endregion for API compatibility
    return context;
  };

  /**
   * Return a cloned selection list from current selection list
   */
  cloneSelections = () => {
    const { self } = this;
    return cloneSelections(self.selections);
  };

  /**
   * Generates a {@link RangeDescriptor} version of a {@link SelectionDescriptor}
   * with all the sides (top, left, bottom, and right) of the rectangle are set
   * to the grid bounds if the selection type is other than
   * {@link SelectionType.Cells}.
   * @param sel To convert to.
   * @returns The grid range that the selection points to.
   */
  convertSelectionToRange = (sel: SelectionDescriptor): RangeDescriptor => {
    const { self } = this;
    return {
      startRow: sel.type === SelectionType.Columns ? 0 : sel.startRow,
      startColumn:
        sel.type === SelectionType.Rows
          ? self.getFirstColumnIndex()
          : sel.startColumn,
      endRow:
        sel.type === SelectionType.Columns
          ? self.getLastRowIndex()
          : sel.endRow,
      endColumn:
        sel.type === SelectionType.Rows
          ? self.getLastColumnIndex()
          : sel.endColumn,
    };
  };

  /**
   * Converts the given partial to the grid range where missing properties
   * assigned as the grid boundaries.
   * @param range To convert.
   * @returns The new descriptor.
   */
  convertPartialRangeToGridRange = (range: Partial<RangeDescriptor>) => {
    const { self } = this;
    return {
      startRow: range.startRow ?? 0,
      startColumn: range.startColumn ?? 0,
      endRow: range.endRow ?? self.dataSource.state.rows - 1,
      endColumn: range.endColumn ?? self.dataSource.state.cols - 1,
    } as RangeDescriptor;
  };

  /**
   * Gets the bounds of current selection.
   * @param {boolean} [sanitized] sanitize the bound object if the value of thie paramater is `true`
   * @memberof canvasDatagrid
   * @name getSelectionBounds
   * @method
   * @returns {rect} two situations:
   * 1. The result is always a bound object if `sanitized` is not `true`.
   * And the result is `{top: Infinity, left: Infinity, bottom: -Infinity, right: -Infinity}` if there haven't selections.
   * This is used for keeping compatibility with existing APIs.
   * 2. When the parameter `sanitized` is true. The result will be null if there haven't selections.
   */
  getSelectionBounds = (
    sanitized?: boolean,
    otherSelections?: SelectionDescriptor[],
  ) => {
    const { self } = this;
    const bounds = getSelectionBounds(otherSelections || self.selections);
    if (sanitized) {
      // nothing is selected
      if (bounds.top > bounds.bottom || bounds.left > bounds.right) return null;
      self.sanitizeSelectionBounds(bounds);
    }
    return bounds;
  };
  sanitizeSelectionBounds = (bounds: RectangleObject) => {
    const { self } = this;
    if (!bounds) return bounds;
    if (bounds.top < 0) bounds.top = 0;
    if (bounds.left < 0) bounds.left = 0;

    const viewDataLength = self.dataSource.state.rows;
    if (bounds.bottom > viewDataLength) bounds.bottom = viewDataLength - 1;

    const schemaLength = self.getSchema().length;
    if (bounds.right > schemaLength) bounds.right = schemaLength - 1;
    return bounds;
  };

  /**
   * Get the current selection considering the cell layout correction
   * @param {boolean} [sanitized] sanitize the bound object if the value of thie paramater is `true`
   * @memberof canvasDatagrid
   * @name getSelectionBounds
   * @method
   * @returns {rect} two situations:
   * getSelectionBounds () does not return the correct value if the row or column is sorted or hidden.
   * This is because it returns the coordinates in the cell layout currently drawn.
   * When selecting a range of grid, processing is required to correct it to a logical cell range.
   */
  getSelectionBoundsWithCorrection = (
    sanitized?: boolean,
    otherSelections?: SelectionDescriptor[],
  ): RectangleObject => {
    const { self } = this;
    const bounds = self.getSelectionBounds(sanitized, otherSelections);
    return {
      top: self.getBoundRowIndexFromViewRowIndex(bounds.top),
      bottom: self.getBoundRowIndexFromViewRowIndex(bounds.bottom),
      left: bounds.left,
      right: bounds.right,
    };
  };

  /**
   * This function is migrated from the old API,
   * @param {boolean} [expandToRow]
   * @returns {any[]}
   */
  getSelectedCells = (expandToRow?: boolean) => {
    const { self } = this;
    const selectedCells = [];
    const bounds = self.getSelectionBounds(true);
    // console.log(bounds);
    this._iterateSelectedCells(
      (cell) => selectedCells.push(cell),
      bounds,
      expandToRow,
    );
    return selectedCells;
  };

  /**
   * This function is migrated from the old API,
   * @returns {any[]} affected cells
   */
  clearSelectedCells = () => {
    const { self } = this;
    const affectedCells = [];
    for (const selection of self.selections) {
      self.dataSource.clearRange(self.convertSelectionToRange(selection));
    }
    return affectedCells;
  };

  /**
   * Deletes currently selected data.
   * @memberof canvasDatagrid
   * @name deleteSelectedData
   * @method
   * @param {boolean} dontDraw Suppress the draw method after the selection change.
   */
  deleteSelectedData = (dontDraw?: boolean) => {
    const { self } = this;
    self.dispatchEvent('beforedelete', {
      selections: self.selections,
    });
    const affectedCells = self.clearSelectedCells();
    const apiCompatibleCells = affectedCells.map((cell) => {
      return [
        cell.viewRowIndex,
        cell.viewColumnIndex,
        cell.boundRowIndex,
        cell.boundColumnIndex,
      ];
    });
    self.dispatchEvent('afterdelete', {
      cells: apiCompatibleCells,
    });
    if (dontDraw) return;
    requestAnimationFrame(() => self.draw());
  };

  /**
   * Runs the defined method on each selected cell.
   * @memberof canvasDatagrid
   * @name forEachSelectedCell
   * @method
   * @param {number} fn The function to execute.  The signature of the function is: (data, rowIndex, columnName).
   * @param {number} expandToRow When true the data in the array is expanded to the entire row.
   */
  forEachSelectedCell = (
    fn: EachSelectedCellCallback,
    expandToRow?: boolean,
  ) => {
    const { self } = this;
    const bounds = self.getSelectionBounds(true);
    this._iterateSelectedCells(
      (cell) => fn(cell.viewRowIndex, cell.viewColumnIndex, cell),
      bounds,
      expandToRow,
    );
  };

  /**
   * Gets the table data for a given range.
   * @param {number} startRowIndex Row index start from.
   * @param {number} startColumnIndex Col index to start from.
   * @param {number} rowsLength Number of rows to get.
   * @param {number} columnsLength Number of columns to get in a row.
   * @returns {ParsedTableData} The table data.
   * @see sanitizeRowsData
   * @see getSelectedData
   */
  getTableData = (
    startRowIndex: number,
    startColumnIndex: number,
    rowsLength: number,
    columnsLength: number,
  ): ParsedTableData => {
    // TODO: Move this to the data source.
    const { self } = this;
    const schema = self.getSchema();
    const rows: ParsedTableData = [];
    const mergedCells = self.getMergedCellsForRange({
      startRow: startRowIndex,
      startColumn: startColumnIndex,
      endRow: startRowIndex + rowsLength - 1,
      endColumn: startColumnIndex + columnsLength - 1,
    });
    const result = new RangeResult<MergedCellDescriptor>(mergedCells);

    let rowExtent = 0,
      colExtent = 0;

    for (let i = 0; i < rowsLength + rowExtent; i++) {
      const rowIndex = startRowIndex + i;
      const rowData = self.dataSource.deprecated_getRowData(rowIndex);

      if (rows[i] === undefined) rows[i] = [];

      for (let j = 0; j < columnsLength + colExtent; j++) {
        const columnIndex = startColumnIndex + j;
        const realColumnIndex = columnIndex;
        const column = schema[realColumnIndex];
        if (!column) continue;

        const mergedCell = result.get(rowIndex, columnIndex);

        let rowSpan = 1,
          columnSpan = 1;

        if (mergedCell) {
          if (
            mergedCell.startRow < rowIndex ||
            mergedCell.startColumn < columnIndex
          ) {
            rows[i][j] = null;
            continue;
          }

          rowSpan = mergedCell.endRow - mergedCell.startRow + 1;
          columnSpan = mergedCell.endColumn - mergedCell.startColumn + 1;

          if (i + rowSpan > rowsLength && i + rowSpan > rowExtent) {
            rowExtent = i + rowSpan - rowsLength;
          }

          if (j + columnSpan > columnsLength && j + columnSpan > colExtent) {
            colExtent = j + columnSpan - columnsLength;
          }
        }

        rows[i][j] = {
          value: [{ value: rowData[column.dataKey] }],
          rowSpan: rowSpan,
          columnSpan: columnSpan,
        };
      }
    }

    return rows;
  };

  /**
   * (This function is migrated from the old API)
   * Modify the width of columns that contain selected cells to fit the content.
   * @param {number} [width] Custom width for each column or undefined to fit to the minimum content size.
   */
  fitSelectedColumns = (width?: number) => {
    const { self } = this;
    const selections = self.selections.filter(
      (selection) => selection.type === SelectionType.Columns,
    );
    if (!selections.length) return;

    const hasCustomWidth = width !== undefined;
    if (hasCustomWidth) width = Math.max(self.style.minColumnWidth, width);

    let total = 0;
    for (const selection of selections) {
      if (hasCustomWidth) {
        const { startColumn, endColumn } = selection;
        self.setColumnWidth(startColumn, width, false, endColumn);
        self.dispatchEvent('resizecolumn', {
          width: width,
          height: self.resizingStartingHeight,
          columnIndex: startColumn,
          endIndex: endColumn,
          draggingItem: self.currentCell,
        });
      } else {
        for (let i = selection.startColumn; i <= selection.endColumn; i++) {
          const header = self.dataSource.getHeader(i);
          self.fitColumnToValues(header.id);
          total++;

          if (total >= self.attributes.resizeAutoFitColumnCount) break;
        }
        /**
         * @todo Show a visual warning when the grid limits auto-fit
         * operation.
         */
        if (total >= self.attributes.resizeAutoFitColumnCount) break;
      }
    }
  };

  /**
   * Set the height of the selected rows to the given value.
   * @param {number} [height] Custom width or undefined to fit to the minimum content height.
   */
  fitSelectedRows = (height?: number) => {
    const { self } = this;
    const selections = self.selections.filter(
      (selection) => selection.type === SelectionType.Rows,
    );
    if (!selections.length) return;

    const hasCustomHeight = height !== undefined;
    if (hasCustomHeight) height = Math.max(self.style.minRowHeight, height);

    for (const selection of selections) {
      const { startRow, endRow } = selection;

      self.setRowHeight(startRow, height, false, endRow);
      self.dispatchEvent('resizerow', {
        width: self.resizingStartingWidth,
        height: height,
        rowIndex: startRow,
        endIndex: endRow,
        draggingItem: self.currentCell,
      });
    }
  };

  /**
   * Selects a column.
   * @memberof canvasDatagrid
   * @name selectColumn
   * @method
   * @param {number} columnIndex The column index to select.
   * @param {boolean} [ctrl] When true, behaves as if you were holding control/command when you clicked the column.
   * @param {boolean} [shift] When true, behaves as if you were holding shift when you clicked the column.
   * @param {boolean} [suppressEvent] When true, prevents the selectionchanged event from firing.
   * @returns {boolean} True if the selections have changed.
   */
  selectColumn = (
    columnIndex: number,
    ctrl?: boolean,
    shift?: boolean,
    suppressEvent?: boolean,
  ) => {
    const { self } = this;
    let selectionsChanged = false;

    if (!ctrl) selectionsChanged = self.clearSelections(false, !shift);
    if (shift) {
      const selection = self.getPrimarySelection();
      const startColumn =
        self.activeCell.columnIndex > columnIndex
          ? columnIndex
          : self.activeCell.columnIndex;
      const endColumn =
        self.activeCell.columnIndex > columnIndex
          ? self.activeCell.columnIndex
          : columnIndex;

      if (
        alterSelection(
          selection,
          SelectionType.Columns,
          undefined,
          undefined,
          startColumn,
          endColumn,
        )
      ) {
        selectionsChanged = true;
      }
    } else {
      // Google Sheets selects the first currently visible row instead of
      // moving the active cell to the start.
      self.setActiveCell(columnIndex, self.scrollIndexTop);
      // Make the cell fully visible if its is partly visible.
      self.scrollIntoView(columnIndex, self.scrollIndexTop);
      this._pushNewSelection({
        type: SelectionType.Columns,
        startColumn: columnIndex,
        endColumn: columnIndex,
      });
      selectionsChanged = true;
    }

    if (selectionsChanged && !suppressEvent) {
      self.dispatchSelectionChangedEvent();
    }

    return selectionsChanged;
  };

  /**
   * Selects a row.
   * @memberof canvasDatagrid
   * @name selectRow
   * @method
   * @param {number} rowIndex The row index to select.
   * @param {boolean} [ctrl] When true, behaves as if you were holding control/command when you clicked the row.
   * @param {boolean} [shift] When true, behaves as if you were holding shift when you clicked the row.
   * @param {boolean} [supressSelectionchangedEvent] When true, prevents the selectionchanged event from firing.
   * @returns {boolean} True if the selections have changed.
   */
  selectRow = (
    rowIndex: number,
    ctrl?: boolean,
    shift?: boolean,
    suppressEvent?: boolean,
  ) => {
    const { self } = this;
    let selectionsChanged = false;

    if (!ctrl) selectionsChanged = self.clearSelections(false, !shift);
    if (shift) {
      const selection = self.getPrimarySelection();
      const startRow =
        self.activeCell.rowIndex > rowIndex
          ? rowIndex
          : self.activeCell.rowIndex;
      const endRow =
        self.activeCell.rowIndex > rowIndex
          ? self.activeCell.rowIndex
          : rowIndex;

      if (alterSelection(selection, SelectionType.Rows, startRow, endRow)) {
        selectionsChanged = true;
      }
    } else {
      // Google Sheets selects the first currently visible column instead of
      // moving the active cell to the start.
      self.setActiveCell(self.scrollIndexLeft, rowIndex);
      self.scrollIntoView(self.scrollIndexLeft, rowIndex, true);
      this._pushNewSelection({
        type: SelectionType.Rows,
        startRow: rowIndex,
        endRow: rowIndex,
      });
      selectionsChanged = true;
    }

    if (selectionsChanged && !suppressEvent) {
      self.dispatchSelectionChangedEvent();
    }

    return selectionsChanged;
  };

  /**
   * @param {function} iterator signature: `(cell: any) => any`
   * @param {object} bounds type: `{left:number;right:number;top:number;bottom:number}`
   * @param {boolean} [expandToRow]
   */
  private _iterateSelectedCells = (
    iterator: (cell: SelectedCell) => any,
    bounds,
    expandToRow,
  ) => {
    const { self } = this;
    if (!bounds) return;
    const { top, bottom, left, right } = bounds;
    const height = bottom - top + 1;
    const width = right - left + 1;
    const states = getSelectionStateFromCells(self.selections, {
      startRow: top,
      endRow: bottom,
      startColumn: left,
      endColumn: right,
    });
    if (states === false) return;

    const orderedSchema = this._getSchemaOrderByViewIndex(left, width);
    for (let row = top, row2 = top + height; row < row2; row++) {
      const rowData = self.dataSource.deprecated_getRowData(row);
      const rowState = states === true || states[row - top];
      if (!rowState) continue;
      for (let col = left, col2 = left + width; col < col2; col++) {
        if (rowState !== true && !rowState[col - left]) continue;

        const header = orderedSchema[col];
        if (!header || (header.hidden && !expandToRow)) continue;

        const cell: SelectedCell = {
          value: rowData[header.name],
          header,
          columnName: header.name,
          viewRowIndex: row,
          viewColumnIndex: col,
        };
        iterator(cell);
      }
    }
  };

  /**
   * Selects an area of the grid. Note that this isn't recommended for anything
   * other than tests.
   * @memberof canvasDatagrid
   * @name selectArea
   * @method
   * @param {RectangleObject} [bounds] A rect object representing the selected values.
   * @param {boolean} [ctrl]
   */
  selectArea = (bounds: RectangleObject, ctrl?: boolean) => {
    const { self } = this;
    const firstColumnIndex = self.getFirstColumnIndex();
    const lastRowIndex = self.getLastRowIndex();
    const lastColumnIndex = self.getLastColumnIndex();

    let selectionsChanged = false;

    if (bounds) {
      if (bounds.right < 0) {
        // patch for API compatibility
        bounds.right = Math.max(lastColumnIndex, bounds.left, 0);
      }
      if (bounds.top > bounds.bottom || bounds.left > bounds.right)
        throw new Error('Impossible selection area');
      self.selectionBounds = self.sanitizeSelectionBounds(bounds);
    }

    const { top, left, right } = bounds;
    let { bottom } = bounds;

    if (bottom > lastRowIndex) bottom = Math.max(lastColumnIndex, top);
    if (top < -1 || left < -1 || right > lastColumnIndex)
      throw new Error('Impossible selection area');

    // In original API, number -1 indicates selecting whole row or selecting while column.
    if (top === -1) {
      // select whole columns
      const startColumn = Math.max(left, 0);
      selectionsChanged = self.selectColumn(startColumn, ctrl, false, true);
    } else if (left === -1) {
      // select whole rows
      const startRow = Math.max(top, 0);
      selectionsChanged = self.selectRow(startRow, ctrl, false, true);
    } else {
      const startRow = Math.max(top, 0);
      const startColumn = Math.max(left, firstColumnIndex);
      selectionsChanged = self.selectCell(
        startRow,
        startColumn,
        ctrl,
        false,
        true,
      );
    }
    const endRow = Math.min(bottom, lastRowIndex);
    const endColumn = Math.min(right, lastColumnIndex);

    if (self.dragSelect(endRow, endColumn, undefined, undefined, false, true)) {
      selectionsChanged = true;
    }

    if (selectionsChanged) self.dispatchSelectionChangedEvent();
  };

  /**
   * This private method is using for make existing API about selection works.
   * TODO: This method can be removed by a better way.
   * @param {number} [rowIndex] 0 by default
   * @returns {number[]|undefined}
   */
  getRowSelectionStates = (rowIndex?: number) => {
    const { self } = this;
    if (typeof rowIndex !== 'number' || rowIndex < 0) rowIndex = 0;
    const startColumn = 0;
    const endRow = self.getSchema().length - 1;
    const width = endRow - startColumn + 1;
    const state = getSelectionStateFromCells(self.selections, {
      startRow: rowIndex,
      startColumn: startColumn,
      endRow: rowIndex,
      endColumn: endRow,
    });
    if (state === false) return;
    if (state === true) return new Array(width).fill(true).map((_, i) => i);

    const firstRow = state[0];
    if (!firstRow) return;

    const result = [];
    for (let col = 0; col < firstRow.length; col++)
      if (firstRow[col]) result.push(col);
    return result;
  };

  /**
   * Replace current selection list with new selection list.
   * @param {SelectionDescriptor[]} newSelections Selections to replace with.
   * @param {boolean} [suppressEvent] Suppress the selection changed event.
   */
  replaceAllSelections = (
    newSelections: SelectionDescriptor[],
    suppressEvent?: boolean,
  ) => {
    if (newSelections.length <= 0) return;
    const { self } = this;
    newSelections.forEach((selection) => {
      self.normalizeSelection(selection);
    });
    let changed = self.clearSelections(false, true);
    for (const newSelection of newSelections) {
      changed = true;
      this._pushNewSelection(newSelection);
    }
    const primary = self.getPrimarySelection();
    const { rowIndex, columnIndex } = self.getTopLeftCellOfSelection(primary);

    self.setActiveCell(columnIndex, rowIndex);

    if (changed && !suppressEvent) {
      self.dispatchSelectionChangedEvent();
    }
  };

  /**
   * Add a new selections to the selection and set the correct active cell based
   * on that.
   * @param selection To add.
   * @param ctrl True to preverse previous selections.
   * @param suppressEvent Skip selection changed events.
   */
  addSelection = (
    selection: SelectionDescriptor,
    ctrl?: boolean,
    suppressEvent?: boolean,
  ) => {
    const { self } = this;
    switch (selection.type) {
      case SelectionType.Rows:
        self.setActiveCell(self.getFirstColumnIndex(), selection.startRow);
        break;
      case SelectionType.Columns:
        self.setActiveCell(selection.startColumn, self.getFirstRowIndex());
        break;
      case SelectionType.Cells:
        self.setActiveCell(selection.startColumn, selection.startRow);
        break;
      default:
        return;
    }
    if (!ctrl) this.clearSelections(false, true);
    this._pushNewSelection(selection);
    if (!suppressEvent) this.dispatchSelectionChangedEvent();
  };

  /**
   * Request selection.
   * @param request
   * @returns A function to cancel request.
   */
  requestSelection = (request: SelectionRequest): (() => void) => {
    const { self } = this;
    self.selectionRequestContext = { request };
    return () => (self.selectionRequestContext = undefined);
  };

  /**
   * Checks whether there is a pending selection request.
   * @returns True if there is a pending selection request.
   */
  hasPendingSelectionRequest = () => !!this.self.selectionRequestContext;

  /**
   * Checks if the cell is in the picked range.
   * @param rowIndex
   * @param columnIndex
   * @returns False if there is no selection request, or the cell is not in the
   *  picked range.
   */
  isCellPicked = (rowIndex: number, columnIndex: number) => {
    const { self } = this;
    const request = self.selectionRequestContext;
    return (
      (request?.hover || request?.selection) &&
      isInSelection(request.selection ?? request.hover, rowIndex, columnIndex)
    );
  };

  /**
   * Select given columns and remove other existing selection area
   * @param {number[]} viewIndexes
   */
  selectColumnViewIndexes = (viewIndexes?: number[]) => {
    //const selections = viewIndexes.map((col) => ());
    this.self.replaceAllSelections([
      {
        type: SelectionType.Columns,
        startColumn: viewIndexes[0],
        endColumn: viewIndexes[viewIndexes.length - 1],
      },
    ]);
  };

  /**
   * @param {object} cell Signature: `{rowIndex:number;columnIndex:number}`
   * @param {object} keyEvent Signature: `{key:string;shiftKey:boolean}`
   * @param {boolean} [suppressEvent]
   * @param {boolean} skipDraw Skip drawing.
   */
  shrinkOrExpandSelections = (
    cell,
    keyEvent,
    suppressEvent?: boolean,
    skipDraw?: boolean,
  ) => {
    const { self } = this;
    const { rows, cols } = self.dataSource.state;
    const result = shrinkOrExpandSelections(self.selections, cell, keyEvent, {
      baseRow: self.activeCell.rowIndex,
      baseColumn: self.activeCell.columnIndex,
      columns: cols,
      rows,
    });
    if (result) {
      self.scrollIntoView(result.columnIndex, result.rowIndex, skipDraw);
      if (!suppressEvent) self.dispatchSelectionChangedEvent();
      return true;
    }
    return false;
  };

  /**
   * @param {number} [fromIndex]
   * @param {number} [len]
   */
  private _getSchemaOrderByViewIndex = (fromIndex: number, len: number) => {
    const { self } = this;
    const schema = self.getSchema();
    const orderedSchema = [];
    for (let col = fromIndex, col2 = fromIndex + len; col < col2; col++) {
      const orderedIndex = col;
      const header = schema[orderedIndex];
      orderedSchema[col] = header;
    }
    return orderedSchema;
  };

  /**
   * Add a new selection to the selections and hold its reference at
   * {@link this.self.lastAddedSelection}.
   * @param selection To add to the selection array.
   */
  private _pushNewSelection = (selection: SelectionDescriptor) => {
    const { self } = this;
    self.selections.push(selection);
    self.activeSelection = selection;
    self.lastAddedSelection = selection;
  };

  /**
   * Push the active cell to the selecitons array.
   *
   * Since the active should always stay selected, this is a helper method
   * to easily push it into the selections.
   * @return The newly added selection instance.
   */
  private _pushActiveCellToSelections = () => {
    const { self } = this;
    const sel: SelectionDescriptor = {
      type: SelectionType.Cells,
      startRow: self.activeCell.rowIndex,
      endRow: self.activeCell.rowIndex,
      startColumn: self.activeCell.columnIndex,
      endColumn: self.activeCell.columnIndex,
    };
    self.normalizeSelection(sel);
    this._pushNewSelection(sel);
    return sel;
  };
}
