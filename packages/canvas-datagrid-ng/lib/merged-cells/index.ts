import { isSelectionSingular, SelectionType } from '../selections/util';
import type {
  GridPrivateProperties,
  MergedCellDescriptor,
  RangeDescriptor,
  RectangleObject,
  SelectionDescriptor,
} from '../types';
import { MergeDirection } from '../types';
import { copyMethods } from '../util';
import { checkRange } from './util';

export default function loadGridMergedCells(self: GridPrivateProperties) {
  copyMethods(new GridMergedCells(self), self);
}

/**
 * Grid merged cells
 */
export class GridMergedCells {
  constructor(private readonly self: GridPrivateProperties) {}

  /**
   * Check if there are any merged cells in the given bounds.
   *
   * Missing properties in {@link range} will be set to the grid boundaries.
   * @param range Approximate range to check if it contains any merged cells.
   * @return True if the given range contains merged cells.
   */
  containsMergedCells = (range: Partial<RangeDescriptor>): boolean => {
    const { self } = this;
    return self.dataSource.mergedCells.containsInRange(
      self.convertPartialRangeToGridRange(range),
    );
  };

  /**
   * Expands a given bounds to merged cell bounds if it contains merged cells.
   *
   * The changes are made to the same object.
   *
   * By default this only expands cell selections.  To expand all selection
   * types, pass {@link all} as true.
   * @param sel To expand.
   * @returns The same selection object that was passed.
   */
  expandSelectionToMergedCells = (sel: SelectionDescriptor, all = false) => {
    if (sel.type !== SelectionType.Cells && !all) return;
    const { self } = this;
    const range = self.convertSelectionToRange(sel);
    const descriptors = self.dataSource.mergedCells.getForRange(range);

    for (const desc of descriptors) {
      if (sel.type === SelectionType.Cells || sel.type === SelectionType.Rows) {
        sel.startRow = Math.min(desc.startRow, sel.startRow);
        sel.endRow = Math.max(desc.endRow, sel.endRow);
      }
      if (
        sel.type === SelectionType.Cells ||
        sel.type === SelectionType.Columns
      ) {
        sel.startColumn = Math.min(desc.startColumn, sel.startColumn);
        sel.endColumn = Math.max(desc.endColumn, sel.endColumn);
      }
    }
    return sel;
  };

  getMergedCell = (
    rowViewIndex: number,
    columnViewIndex: number,
  ): MergedCellDescriptor | undefined => {
    return this.self.dataSource.mergedCells.get(rowViewIndex, columnViewIndex);
  };

  getMergedCellsForRange = (range: RangeDescriptor): MergedCellDescriptor[] => {
    return this.self.dataSource.mergedCells.getForRange(range);
  };

  /**
   * @deprecated Use {@link getMergedCell} instead.
   * Get the whole area of a merged cell.
   * @param rowIndex Of merged cell.
   * @param colIndex Of merged cell.
   * @returns A {@link RectangleObject} of the merged cell or null, if the given
   *  indexes are not part of a merged cell.
   */
  getMergedCellBounds = (
    rowIndex: number,
    colIndex: number,
  ): RectangleObject | undefined => {
    const { self } = this;
    const descriptor = self.getMergedCell(rowIndex, colIndex);
    if (!descriptor) return;

    return {
      left: descriptor.startColumn,
      top: descriptor.startRow,
      right: descriptor.endColumn,
      bottom: descriptor.endRow,
    };
  };

  /**
   * Merge given cells and erase all the data on them except for the
   * left-top-most cell.
   * @param range To merge.
   * @param direction Defaults to {@link MergeDirection.Center}, which will
   *  merge all the cells into one.  Horizontal will merge horizontally, and
   *  vertical will merge vertically.
   */
  mergeCells = (range: RangeDescriptor, direction = MergeDirection.Center) => {
    if (
      !checkRange(range) ||
      (range.startColumn == range.endColumn &&
        range.startRow == range.endColumn)
    ) {
      return;
    }

    const { self } = this;
    const isHorizontal = direction == MergeDirection.Horizontal;
    const isVertical = direction == MergeDirection.Vertical;

    // Destroy previously merged region that the current one overlaps.
    self.unmergeCells(range);

    self.dataSource.mergedCells.merge(range, direction);

    // Update borders for merged cells after merging
    if (isHorizontal) {
      for (
        let rowIndex = range.startRow;
        rowIndex <= range.endRow;
        rowIndex++
      ) {
        self.editMergedCellBorder({
          startRow: rowIndex,
          endRow: rowIndex,
          startColumn: range.startColumn,
          endColumn: range.endColumn,
        });
      }
    } else if (isVertical) {
      for (
        let columnIndex = range.startColumn;
        columnIndex <= range.endColumn;
        columnIndex++
      ) {
        self.editMergedCellBorder({
          startRow: range.startRow,
          endRow: range.endRow,
          startColumn: columnIndex,
          endColumn: columnIndex,
        });
      }
    } else {
      self.editMergedCellBorder(range);
    }

    self.dispatchEvent('aftermerge', { bounds: range });
  };

  /**
   * Unmerge all the merged cells contained in the given range.
   * @param range Range that contains one or more merged cells.
   */
  unmergeCells = (range: RangeDescriptor) => {
    if (!checkRange(range)) return;

    const { self } = this;
    const unmergedCells = self.dataSource.mergedCells.unmergeRange(range);

    if (unmergedCells.length > 0) {
      self.dispatchEvent('afterunmerge', { unmergedCells });
    }
  };

  /**
   * Get current state of merge cells action, decide if it's possible
   * to do MergeAll, MergeDirectionally and Unmerge
   */
  getMergeCellsState = () => {
    const { self } = this;

    const isMultiSelection = self.selections.length > 1;
    const selection = self.getPrimarySelection();
    const tables = self.dataSource.getTablesInRange(
      self.convertSelectionToRange(selection),
    );
    const containTable = tables.length > 0;
    const canMergeAll =
      self.attributes.allowMergingCells &&
      !isMultiSelection &&
      !isSelectionSingular(selection) &&
      !containTable;
    // TODO: This should be separated into 'vertical' and 'horizontal'.
    const canMergeDirectionally = canMergeAll;
    const canUnmerge =
      self.attributes.allowMergingCells && self.containsMergedCells(selection);

    return {
      canMergeAll,
      canMergeDirectionally,
      canUnmerge,
    };
  };

  /**
   * Merge current selected cells
   * @param direction Defaults to {@link MergeDirection.Center}
   * @see MergeDirection
   */
  mergeCurrentSelectedCells = (direction = MergeDirection.Center) => {
    const { self } = this;
    const state = self.getMergeCellsState();
    const range = self.convertSelectionToRange(self.getPrimarySelection());

    if (
      (direction === MergeDirection.Center && state.canMergeAll) ||
      (direction === MergeDirection.Horizontal &&
        state.canMergeDirectionally) ||
      (direction === MergeDirection.Vertical && state.canMergeDirectionally)
    ) {
      self.mergeCells(range, direction);
      self.requestRedraw('all');
      self.redrawCommit();
    }
  };

  /**
   * Unmerge all merged cells inside current selected cells
   */
  unmergeCurrentSelectedCells = () => {
    const { self } = this;
    const state = self.getMergeCellsState();
    const range = self.convertSelectionToRange(self.getPrimarySelection());

    if (state.canUnmerge) {
      self.unmergeCells(range);
      self.requestRedraw('all');
      self.redrawCommit();
    }
  };
}
