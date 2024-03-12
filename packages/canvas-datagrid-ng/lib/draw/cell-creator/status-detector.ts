import type { SelectionDescriptor } from '../../selections/types';
import { findSelectionForIndex, isCellSelected } from '../../selections/util';
import type { NormalCellDescriptor } from '../../types/cell';
import type { GridPrivateProperties } from '../../types/grid';
import type { DrawFrameCache } from '../frame-cache';

export class CellStatusDetector {
  private reorderabilityCache: {
    selection: SelectionDescriptor;
    isReorderable: boolean;
  }[] = [];

  constructor(
    private readonly self: GridPrivateProperties,
    private readonly frameCache: DrawFrameCache,
  ) {}

  /**
   * Check if the given indexes are inside of the drag move borders.
   * @param rowIndex
   * @param columnIndex
   * @returns `true` if the indexes are inside of the move borders.
   */
  readonly isCellMoveHighlighted = (
    rowIndex: number,
    columnIndex: number,
  ): boolean => {
    const { self } = this;
    if (!self.moveContext) return false;
    rowIndex -= self.moveContext.row;
    columnIndex -= self.moveContext.column;
    return (
      isCellSelected(self.selections, rowIndex, columnIndex) &&
      findSelectionForIndex(self.selections, rowIndex, columnIndex, true) ==
        self.moveContext.selection
    );
  };

  readonly isCellHovered = (rowIndex: number, columnIndex: number): boolean => {
    const { self } = this;
    if (
      !self.currentCell ||
      (self.draggingItem && !self.selecting) ||
      self.input
    ) {
      return false;
    }

    const { currentCell: cell } = self;
    return (
      cell.nodeType === 'canvas-datagrid-cell' &&
      cell.rowIndex === rowIndex &&
      (self.attributes.hoverMode === 'row' || cell.columnIndex === columnIndex)
    );
  };

  readonly isCellGroupHovered = (rowIndex: number, columnIndex: number) => {
    const { self } = this;
    const cell = self.currentCell as NormalCellDescriptor;
    return (
      cell?.table &&
      !cell.table.isSpilling &&
      self.dataSource.isInTableRange(cell.table, rowIndex, columnIndex) &&
      rowIndex >= cell.table.firstRowIndex &&
      rowIndex <= cell.table.lastRowIndex &&
      cell.rowIndex === rowIndex
    );
  };

  /**
   * Check if the given indexes are in the fill region (if there is one).
   * @param rowIndex
   * @param columnIndex
   * @returns True if the given indexes are inside the fill region.
   */
  readonly isCellInFillRegion = (
    rowIndex: number,
    columnIndex: number,
  ): boolean => {
    const { self } = this;
    if (!self.fillOverlay || !self.fillOverlay.direction) return false;
    const { direction, selection } = self.fillOverlay;
    return (
      (direction === 'x' &&
        rowIndex >= selection.startRow &&
        rowIndex <= selection.endRow &&
        ((self.fillOverlay.columnIndex < selection.startColumn &&
          columnIndex < selection.startColumn &&
          columnIndex >= self.fillOverlay.columnIndex) ||
          (self.fillOverlay.columnIndex > selection.endColumn &&
            columnIndex > selection.endColumn &&
            columnIndex <= self.fillOverlay.columnIndex))) ||
      (direction === 'y' &&
        columnIndex >= selection.startColumn &&
        columnIndex <= selection.endColumn &&
        ((self.fillOverlay.rowIndex < selection.startRow &&
          rowIndex < selection.startRow &&
          rowIndex >= self.fillOverlay.rowIndex) ||
          (self.fillOverlay.rowIndex > selection.endRow &&
            rowIndex > selection.endRow &&
            rowIndex <= self.fillOverlay.rowIndex)))
    );
  };

  readonly isHeaderReorderable = (index: number, isRow: boolean) => {
    const { self } = this;
    const sel = findSelectionForIndex(
      self.selections,
      isRow ? index : -1,
      isRow ? -1 : index,
      true,
    );
    // Don't check if the user is dragging an item to preserve the performance.
    if (self.draggingItem) return true;
    let item = this.reorderabilityCache.find((item) => item.selection == sel);
    if (!item) {
      const start = isRow ? sel.startRow : sel.startColumn;
      const count = (isRow ? sel.endRow : sel.endColumn) - start + 1;
      item = {
        selection: sel,
        isReorderable:
          (isRow
            ? self.dataSource.allowReorderRows(start, count)
            : self.dataSource.allowReorderColumns(start, count)) !== false,
      };
    }
    return item.isReorderable;
  };
}
