'use strict';

import type { GridPrivateProperties } from './types/grid';
import type { RangeDescriptor } from './types/base-structs';
import { copyMethods } from './util';
import { SelectionType } from './selections/util';
import type { SelectionDescriptor } from './selections/types';

export default function loadGridHideAndUnhide(self: GridPrivateProperties) {
  copyMethods(new GridHideAndUnhide(self), self);
}

export class GridHideAndUnhide {
  constructor(private readonly grid: GridPrivateProperties) {}

  /**
   * Hide column/columns
   * @param beginViewIndex The begin column order index
   * @param endViewIndex The end column order index
   * @param isGroup Whether it's a group that is doing the hiding.
   * @param ctrl Add to the selections instead of replacing them.
   * @param suppressEvents Suppress selection changed events.
   */
  hideColumns = (
    beginViewIndex: number,
    endViewIndex?: number,
    isGroup?: boolean,
    ctrl?: boolean,
    suppressEvents?: boolean,
  ) => {
    const self = this.grid;
    const count = Math.max(1, endViewIndex - beginViewIndex + 1);

    if (self.dataSource.hideColumns(beginViewIndex, count, isGroup)) {
      self.selectColumn(beginViewIndex, ctrl, false, suppressEvents);
      self.dispatchEvent('hidecolumns', {});
      self.refresh();
    }
  };
  /**
   * Unihde column/columns
   * @param afterViewIndex The begin column order index
   * @param isGroup Whether it is a group that is being expanded.
   * @param ctrl Add to the selections instead of replacing them.
   * @param suppressEvents Suppress selection changed events.
   */
  unhideColumns = (
    afterViewIndex: number,
    isGroup?: boolean,
    ctrl?: boolean,
    suppressEvents?: boolean,
  ) => {
    const self = this.grid;
    const restored = self.dataSource.unhideColumns(afterViewIndex, isGroup);
    if (restored?.length > 0) {
      const beginIndex = restored[0];
      const selection: SelectionDescriptor = {
        type: SelectionType.Columns,
        startColumn: beginIndex,
        endColumn: beginIndex + restored.length - 1,
      };
      self.addSelection(selection, ctrl, suppressEvents);

      const header = self.dataSource.getHeader(beginIndex);
      if (header) {
        if (isGroup) {
          this._reapplyHiddenColummGroups(
            header.columnIndex,
            header.columnIndex + restored.length - 1,
          );
        } else {
          this._setStateOfGroups(
            false,
            header.columnIndex,
            header.columnIndex + restored.length - 1,
            false,
          );
        }
      }
      self.refresh();
    }
  };
  /**
   * Hide rows
   * @param beginRowIndex The begin row index
   * @param endRowIndex The end row index
   * @param isGroup Whether it is a group doing the hiding.
   * @param ctrl Add to the selections instead of replacing them.
   * @param suppressEvents Suppress selection changed events.
   */
  hideRows = (
    beginRowIndex: number,
    endRowIndex: number,
    isGroup?: boolean,
    ctrl?: boolean,
    suppressEvents?: boolean,
  ) => {
    const self = this.grid;
    if (self.dataSource.hideRows(beginRowIndex, endRowIndex, isGroup)) {
      self.selectRow(endRowIndex + 1, ctrl, false, suppressEvents);
      self.refresh();
    }
  };
  /**
   * Unhide rows
   * @param beginRowIndex The begin row index
   * @param endRowIndex The end row index
   * @param isGroup Whether it is a group that is doing the hiding.
   * @param ctrl Add to the selections instead of replacing them.
   * @param suppressEvents Suppress selection changed events.
   */
  unhideRows = (
    beginRowIndex: number,
    endRowIndex: number,
    isGroup?: boolean,
    ctrl?: boolean,
    suppressEvents?: boolean,
  ) => {
    const self = this.grid;

    const range = self.dataSource.unhideRows(beginRowIndex, endRowIndex);
    if (isGroup) {
      this._reapplyHiddenRowGroups(range.start, range.end);
    } else {
      this._setStateOfGroups(true, range.start, range.end, false);
    }
    const newSelection = {
      type: SelectionType.Rows,
      startRow: range.start,
      endRow: range.end,
    };
    self.addSelection(newSelection, ctrl, suppressEvents);
    self.refresh();
  };

  /**
   * Hide columns of a table that are inside ranges
   * @param tableId
   * @param ranges
   */
  hideTableColumns = (tableId: string, ranges: RangeDescriptor[]) => {
    const self = this.grid;
    if (self.dataSource.hideTableColumns(tableId, ranges)) {
      self.refresh();
    }
  };

  /**
   * Unhide all columns of a table
   * @param tableId
   */
  unhideAllTableColumns = (tableId: string) => {
    const self = this.grid;
    if (self.dataSource.unhideAllTableColumns(tableId)) {
      self.refresh();
    }
  };

  /**
   * Get an unhide indicator at grid pixel coordinate x and y.
   * @param x Number of pixels from the left.
   * @param y Number of pixels from the top.
   */
  getUnhideIndicator = (x: number, y: number) => {
    const indicators = this.grid.visibleUnhideIndicators;
    if (indicators.length <= 0) return;
    for (let i = 0; i < indicators.length; i++) {
      const indicator = indicators[i];
      if (
        x >= indicator.x &&
        y >= indicator.y &&
        x <= indicator.x2 &&
        y <= indicator.y2
      )
        return indicator;
    }
  };

  /**
   * Set the collapsed state of the groups within the given range.
   *
   * This just sets the state of the groups but doesn't toggle them.
   * @param isRows True if setting for rows, or false for columns.
   * @param from The start index of the groups.
   * @param to The end index of the groups.
   * @param collapsed True to set the state to collapsed, or false for expanded.
   */
  private _setStateOfGroups = (
    isRows: boolean,
    from: number,
    to: number,
    collapsed: boolean,
  ) => {
    const self = this.grid;
    const groupData = isRows ? self.groupedRows : self.groupedColumns;
    for (let i = 0; i < groupData.length; i++) {
      const groups = groupData[i];
      groups.forRange(from, to, true, (_, descriptor, __) => {
        descriptor.collapsed = collapsed;
      });
    }
  };

  private _reapplyHiddenRowGroups = (from: number, to: number) => {
    const self = this.grid;
    for (let i = 0; i < self.groupedRows.length; i++) {
      const groups = self.groupedRows[i];

      let start = from;
      const actualStart = groups.getPairOrNextLower(from);
      if (actualStart && actualStart[1].to >= from) {
        start = actualStart[0];
      }

      groups.forRange(start, to, true, (from, descriptor, _) => {
        if (!descriptor.collapsed) return;
        self.dataSource.hideRows(from, descriptor.to, true);
      });
    }
  };

  private _reapplyHiddenColummGroups = (from: number, to: number) => {
    const self = this.grid;
    for (let i = 0; i < self.groupedColumns.length; i++) {
      const groups = self.groupedColumns[i];
      groups.forRange(from, to, true, (from, descriptor, _) => {
        if (!descriptor.collapsed) return;
        self.hideColumns(from, descriptor.to, true);
      });
    }
  };
}
