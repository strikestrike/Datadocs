'use strict';

import type { DrawDirtyFlag, DrawDirtyFlags } from '.';
import type {
  CellCorner,
  GridHeader,
  GridPrivateProperties,
  NormalCellDescriptor,
  PixelBoundingRect,
  SelectionHandleDescriptor,
} from '../types';
import type { DrawCache } from './cache';

/**
 * This class holds the drawing related data for one frame so that things that
 * might need time execute are created only once and can be accessed from a
 * single place.
 */
export class DrawFrameCache {
  readonly collapsedColumnGroups = this.self.getCollapsedColumnGroups();
  readonly collapsedRowGroups = this.self.getCollapsedRowGroups();
  readonly columnHeaderCellHeight = this.self.dp(
    this.self.getColumnHeaderCellHeight(),
  );
  readonly firstColumnIndex = this.self.getFirstColumnIndex();
  readonly frozenColumnsWidth: number;
  readonly hasCollapsedRowGroup = this.self.hasCollapsedRowGroup();
  readonly height = this.self.height;
  readonly lastColumnIndex = this.self.getLastColumnIndex();
  readonly lastRowIndex = this.self.getLastRowIndex();
  readonly primarySelection = this.self.getPrimarySelection();
  readonly rowHeaderCellWidth = this.self.dp(this.self.getRowHeaderCellWidth());
  readonly width = this.self.width;

  readonly leftAreaWidth = this.self.dp(this.self.getLeftAreaWidth());
  readonly topAreaHeight = this.self.dp(this.self.getTopAreaHeight());

  readonly columnGroupAreaHeight = this.self.dp(
    this.self.getColumnGroupAreaHeight(),
  );
  readonly rowGroupAreaWidth = this.self.dp(this.self.getRowGroupAreaWidth());

  readonly dataSource = this.self.dataSource;
  readonly dataSourceState = this.dataSource.state;

  readonly selectionHandles: Partial<
    Record<CellCorner, SelectionHandleDescriptor>
  > = {};

  activeCell?: NormalCellDescriptor;
  checkScrollHeight = false;

  /**
   * Max number of digits needed to draw all the rows in the number column.
   */
  maxRowNumberColumnDigitCount = this.self.attributes.rowLabelMinDigits;
  /**
   * Whether the grid is displaying unhide buttons on any of the visible row
   * headers.
   */
  hasUnhideRowButtons = false;

  /**
   * This is used to hold rects that might be used invalidate a cached item
   * (usually a cell).
   * @see isUnderProp
   */
  readonly visibleProps = Object.values(this.cache.props);

  readonly hasSorter: boolean;
  readonly columnIdsDir = new Map<string, 'asc' | 'desc'>();

  constructor(
    private readonly self: GridPrivateProperties,
    private readonly flags: DrawDirtyFlags,
    private readonly cache: DrawCache,
  ) {
    this.frozenColumnsWidth = self.dp(this.getFrozenColumnsWidth());

    // debug: dump current state
    // console.log(this.dataSourceState);
    const sorters = self.dataSource.getCurrentSorters();
    this.hasSorter = sorters.length > 0;
    sorters.forEach(({ column, dir }) => this.columnIdsDir.set(column.id, dir));
  }

  /**
   * Get the height for a given row index.
   *
   * Unlike `self.getRowHeight()`, this takes the visibility of the row account
   * into account.
   * @param {number} rowIndex
   * @returns {number} The height of the row.
   */
  getCellHeight = (rowIndex: number) => {
    const { self } = this;
    if (self.dataSource.positionHelper.isRowHidden(rowIndex)) return 0;
    return self.getRowHeight(rowIndex);
  };

  /**
   * Get the width for a given column index.
   *
   * Unlike `self.getColumnWidth()`, this takes the visibility of the column
   * into account.
   * @param {number} rowIndex
   * @returns {number} The height of the row.
   */
  getCellWidth = (columnIndex: number, header?: GridHeader) => {
    const { self, collapsedColumnGroups } = this;
    if (!header) header = self.getSchema()[columnIndex];
    if (header.hidden) return 0;
    if (collapsedColumnGroups) {
      for (const group of collapsedColumnGroups) {
        if (columnIndex >= group.from && columnIndex <= group.to) {
          return 0;
        }
      }
    }

    return self.getColumnWidth(columnIndex);
  };

  private getFrozenColumnsWidth = () => {
    const { self } = this;
    const schema = self.getSchema();
    const columns = Math.min(self.frozenColumn, schema.length);
    const collapsedGroups = this.collapsedColumnGroups;
    let w = 0,
      x = 0,
      column,
      hiddenFrozenColumnCount = 0;
    while (x < columns) {
      column = schema[x];
      if (column.hidden) {
        hiddenFrozenColumnCount += 1;
      } else {
        const isCollapsed =
          collapsedGroups.findIndex(
            (group) => x >= group.from && x <= group.to,
          ) >= 0;
        if (isCollapsed) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          hiddenFrozenColumnCount += 1;
        } else {
          w += self.getColumnWidth(x);
        }
      }
      x += 1;
    }
    return w;
  };

  /**
   * @param {number} columnIndex
   * @returns {boolean}
   */
  isColumnCollapsedByGroup = (columnIndex) =>
    this.collapsedColumnGroups.findIndex(
      (group) => columnIndex >= group.from && columnIndex <= group.to,
    ) >= 0;

  /**
   * Check if a given flag has been invalidated. If the `all` flag was
   * invalidated, this always return true.
   * @param {DrawDirtyFlag} flag To check.
   * @returns {boolean} True if the given flag was invalidated.
   */
  isRedrawn = (flag: DrawDirtyFlag) => this.flags.all || this.flags[flag];

  /**
   * Check if the given rect is under a prop (i.e., is overlapping in any way).
   *
   * This is usually used to check if a cached cell needs a redrawing, because
   * another cell under or above it has been redrawn.
   *
   * You can feed this method with data by pushing more {@link Rect}s into
   * {@link visibleProps}.
   * @param {Rect} rect To check (possibly a {@link NormalCellDescriptor}).
   * @returns {boolean} True if the given rect is overlapping with any prop.
   */
  isUnderProp = (rect: PixelBoundingRect) => {
    for (const prop of this.visibleProps) {
      if (
        prop.x > rect.x + rect.width ||
        prop.x + prop.width < rect.x ||
        prop.y > rect.y + rect.height ||
        prop.y + prop.height < rect.y
      ) {
        continue;
      }
      return true;
    }
    return false;
  };
}
