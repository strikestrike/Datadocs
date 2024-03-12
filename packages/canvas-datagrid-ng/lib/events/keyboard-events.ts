import isPrintableKeyEvent from 'is-printable-key-event';
import type { GridPrivateProperties } from '../types';
import { copyMethods } from '../util';

export default function loadGridKeyboardEventHandler(
  self: GridPrivateProperties,
) {
  copyMethods(new GridKeyboardEventHandler(self), self);
}

export class GridKeyboardEventHandler {
  constructor(private readonly self: GridPrivateProperties) {}

  keydown = (e: KeyboardEvent) => {
    const { self } = this;
    const dataSourceState = self.dataSource.state;

    let columnIndex = Math.max(self.activeCell.columnIndex, 0),
      rowIndex = Math.max(self.activeCell.rowIndex, 0),
      maxRow = dataSourceState.rows - 1;

    const prevColumnIndex = columnIndex;
    const prevRowIndex = rowIndex;
    const schema = self.getSchema();
    const maxCol = schema.length - 1;
    const ctrl = e.ctrlKey || e.metaKey;
    const adjacentCells = self.getAdjacentCells();
    // The non-modifier key insensitive to Shift & Caps Lock.
    const key = e.key.toLowerCase();

    const defaultPrevented = self.dispatchEvent('keydown', {
      NativeEvent: e,
      cell: self.currentCell,
    });

    if (defaultPrevented) {
      return;
    }

    if (!self.attributes.keepFocusOnMouseOut && !self.hasFocus) {
      return;
    }

    // If a user starts typing content, switch to "Enter" mode
    if (isPrintableKeyEvent(e) && !ctrl) {
      return self.beginEditAt(columnIndex, rowIndex, e, true);
    }

    if (self.attributes.showNewRow) {
      maxRow += 1;
    }

    const isArrowKey = [
      'ArrowLeft',
      'ArrowUp',
      'ArrowRight',
      'ArrowDown',
    ].includes(e.key);
    const isNavKey = ['Home', 'End', 'PageUp', 'PageDown'].includes(e.key);

    if (e.key === 'Escape') {
      self.selectNone();
    } else if (ctrl && key === 'a') {
      self.selectAll();
    } else if (['Backspace', 'Delete'].includes(e.key)) {
      self.deleteSelectedData();
    } else if (e.key === 'Tab') {
      if (self.moveActiveCell(e.shiftKey)) {
        columnIndex = self.activeCell.columnIndex;
        rowIndex = self.activeCell.rowIndex;
      }
      e.preventDefault();
    } else if (!ctrl && e.shiftKey && isArrowKey) {
      self.shrinkOrExpandSelections({ rowIndex, columnIndex }, e, false, true);
    } else if (!ctrl && e.key === 'ArrowDown') {
      rowIndex = self.getVisibleRowIndex(rowIndex, 1);
    } else if (!ctrl && e.key === 'ArrowUp') {
      rowIndex = self.getVisibleRowIndex(rowIndex, -1);
    } else if (e.key === 'ArrowLeft' && !ctrl) {
      columnIndex = adjacentCells.left;
    } else if (e.key === 'ArrowRight' && !ctrl) {
      columnIndex = adjacentCells.right;
    } else if (e.key === 'PageUp') {
      rowIndex = self.getVisibleRowIndex(rowIndex, -self.page.vertical);
      e.preventDefault();
    } else if (e.key === 'PageDown') {
      rowIndex = self.getVisibleRowIndex(rowIndex, self.page.vertical);
      e.preventDefault();
    } else if (ctrl && e.key === 'ArrowUp') {
      rowIndex = self.getFirstRowIndex();
    } else if (ctrl && e.key === 'ArrowDown') {
      rowIndex = self.getLastRowIndex();
    } else if (e.key === 'End' || (ctrl && e.key === 'ArrowRight')) {
      columnIndex = adjacentCells.last;
    } else if (e.key === 'Home' || (ctrl && e.key === 'ArrowLeft')) {
      columnIndex = adjacentCells.first;
    } else if (e.key === 'Enter') {
      e.preventDefault();
      self.moveWithEnter(e.shiftKey, false);
      return;
    }
    if (columnIndex < 0 || Number.isNaN(columnIndex)) {
      columnIndex = adjacentCells.first;
    }
    if (rowIndex > maxRow) {
      rowIndex = maxRow;
    }
    if (rowIndex < 0 || Number.isNaN(rowIndex)) {
      rowIndex = 0;
    }
    if (columnIndex > maxCol) {
      columnIndex = adjacentCells.last;
    }

    let rowSelected = false,
      colSelected = false;

    if (e.shiftKey && ((ctrl && isArrowKey) || isNavKey)) {
      const activeRowIndex = self.activeCell.rowIndex;
      const activeColIndex = self.activeCell.columnIndex;
      const selection = self.findSelectionForIndex(
        self.activeCell.rowIndex,
        self.activeCell.columnIndex,
      );
      if (selection) {
        if (e.key == 'ArrowLeft' || e.key == 'Home') {
          selection.startColumn = columnIndex;
          selection.endColumn = activeColIndex;
          colSelected = true;
        } else if (e.key == 'ArrowRight' || e.key == 'End') {
          selection.startColumn = activeColIndex;
          selection.endColumn = columnIndex;
          colSelected = true;
        } else if (e.key == 'ArrowUp') {
          selection.startRow = rowIndex;
          selection.endRow = activeRowIndex;
          rowSelected = true;
        } else if (e.key == 'ArrowDown') {
          selection.startRow = activeRowIndex;
          selection.endRow = rowIndex;
          rowSelected = true;
        } else if (e.key == 'PageUp') {
          if (selection.endRow - self.page.vertical >= activeRowIndex) {
            selection.endRow -= self.page.vertical;
            rowIndex = selection.endRow;
          } else {
            selection.startRow = Math.max(
              0,
              selection.startRow - self.page.vertical,
            );
            selection.endRow = activeRowIndex;
            rowIndex = selection.startRow;
          }
        } else if (e.key == 'PageDown') {
          if (selection.startRow + self.page.vertical <= activeRowIndex) {
            selection.startRow += self.page.vertical;
            rowIndex = selection.startRow;
          } else {
            selection.startRow = activeRowIndex;
            selection.endRow = Math.min(
              dataSourceState.rows - 1,
              selection.endRow + self.page.vertical,
            );
            rowIndex = selection.endRow;
          }
        }
        self.dispatchSelectionChangedEvent();
      }
    }

    if (
      rowIndex !== prevRowIndex ||
      columnIndex !== prevColumnIndex ||
      rowSelected ||
      colSelected
    ) {
      if (!e.shiftKey && e.key !== 'Tab') {
        // The selection for the arrow key movement is done here,
        // so Ctrl + [Arrow Keys] moves the us to the edges of the grid, so
        // ctrl only applies when it is not an arrow key.
        self.selectCell(rowIndex, columnIndex, ctrl && !isArrowKey);
      }
      self.scrollIntoView(columnIndex, rowIndex, true);
      self.requestRedraw('selection');
    }

    self.redrawCommit();
  };

  keyup = (e: KeyboardEvent) => {
    const { self } = this;
    if (
      self.dispatchEvent('keyup', { NativeEvent: e, cell: self.currentCell })
    ) {
      return;
    }
    if (!self.hasFocus) {
      return;
    }
  };

  keypress = (e: KeyboardEvent) => {
    const { self } = this;
    if (!self.hasFocus) {
      return;
    }
    if (
      self.dispatchEvent('keypress', { NativeEvent: e, cell: self.currentCell })
    ) {
      return;
    }
  };
}
