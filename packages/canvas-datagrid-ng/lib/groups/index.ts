import { copyMethods } from '../util';
import {
  addGroup,
  isNewGroupRangeValid,
  removeGroup,
  reorderGroups,
} from './util';
import type { GridPrivateProperties } from '../types';
import type { GroupDescriptor, GroupDescriptorResult } from './types';

export default function loadGridGroupManager(self: GridPrivateProperties) {
  copyMethods(new GridGroupManager(self), self);
}

export class GridGroupManager {
  constructor(private readonly grid: GridPrivateProperties) {}

  isNewGroupRangeValid = isNewGroupRangeValid;

  /**
   * Grouping columns
   * @param columnViewIndexFrom The index of first column to be grouped.
   * @param columnViewIndexTo The index of the last column to be grouped.
   */
  groupColumns = (columnViewIndexFrom: number, columnViewIndexTo: number) => {
    if (columnViewIndexFrom > columnViewIndexTo)
      throw new Error(`Can't group these columns`);

    const from = columnViewIndexFrom;
    const to = columnViewIndexTo;
    const ev: any = { group: { type: 'columns', from, to } };
    try {
      addGroup(this.grid, 'columns', from, to);
    } catch (error) {
      ev.error = error;
    }
    this.grid.dispatchEvent('aftercreategroup', ev);
  };

  /**
   * Grouping columns
   * @param rowIndexFrom The row index which is the beginning of the group
   * @param rowIndexTo The row index which is the end of the group
   */
  groupRows = (rowIndexFrom: number, rowIndexTo: number) => {
    if (!Number.isInteger(rowIndexFrom) || rowIndexFrom < 0)
      throw new Error(`No such row for the beginning of the group`);

    const self = this.grid;
    const dataLength = self.dataSource.state.rows;
    if (
      !Number.isInteger(rowIndexFrom) ||
      rowIndexTo < rowIndexFrom ||
      rowIndexTo > dataLength
    )
      throw new Error(`No such row for the end of the group`);
    const ev: any = {
      group: {
        type: 'rows',
        from: rowIndexFrom,
        to: rowIndexTo,
      },
    };
    try {
      addGroup(self, 'rows', rowIndexFrom, rowIndexTo);
    } catch (error) {
      ev.error = error;
    }
    self.dispatchEvent('aftercreategroup', ev);
  };

  /**
   * Remove a column group.
   * @param columnIndexFrom The beginning index of the column group.
   * @param columnIndexTo The last index of the column group.
   */
  removeGroupColumns = (columnIndexFrom: number, columnIndexTo: number) => {
    const self = this.grid;
    removeGroup(self, self.groupedColumns, columnIndexFrom, columnIndexTo);
    self.unhideColumns(columnIndexFrom - 1, true);
  };

  /**
   * Remove grouping columns
   * @param rowIndexFrom The row index which is the beginning of the group
   * @param rowIndexTo The row index which is the end of the group
   */
  removeGroupRows = (rowIndexFrom: number, rowIndexTo: number) => {
    const self = this.grid;
    removeGroup(self, self.groupedRows, rowIndexFrom, rowIndexTo);
    self.unhideRows(rowIndexFrom, rowIndexTo, true);
  };

  /**
   * Complimentary method to reorder columns groups.
   * @todo Consider moving this to data source.
   * @param startIndex The start index of the reordered columns.
   * @param endIndex The end index of the reordered columns.
   * @param afterViewIndex The column index where the reordered columns are moved.
   */
  reorderColumnGroups = (
    startIndex: number,
    endIndex,
    afterViewIndex: number,
  ) => {
    const self = this.grid;
    reorderGroups(self.groupedColumns, startIndex, endIndex, afterViewIndex);
  };

  /**
   * Complimentary method to reorder row groups.
   * @todo Consider moving this to data source.
   * @param startIndex The start index of the reordered rows.
   * @param endIndex The end index of the reordered rows.
   * @param afterViewIndex The column index where the reordered rows are moved.
   */
  reorderRowGroups = (startIndex: number, endIndex, afterViewIndex: number) => {
    const self = this.grid;
    reorderGroups(self.groupedRows, startIndex, endIndex, afterViewIndex);
  };

  /**
   * Toggle (expand/collapse) the matching column group.
   * @param columnIndexFrom The beginning index of the column group to toggle.
   * @param columnIndexTo The last index index of the column group to toggle.
   */
  toggleGroupColumns = (columnIndexFrom: number, columnIndexTo: number) => {
    const self = this.grid;
    const from = columnIndexFrom;
    const to = columnIndexTo;
    if (self.toggleGroup({ type: 'c', from, to })) {
      self.refresh();
    }
  };

  /**
   * Toggle (expand/collapse) the row matching row group.
   * @param rowIndexFrom The row index which is the beginning of the group
   * @param rowIndexTo The row index which is the end of the group
   */
  toggleGroupRows = (rowIndexFrom: number, rowIndexTo: number) => {
    const self = this.grid;
    if (self.toggleGroup({ type: 'r', from: rowIndexFrom, to: rowIndexTo })) {
      self.refresh();
    }
  };

  /**
   * Get the height of the area about column groups for rendering and handling events.
   */
  getColumnGroupAreaHeight = () => {
    const self = this.grid;
    if (!self.attributes.allowGroupingColumns) {
      return 0;
    }
    const groups = self.groupedColumns.length;
    const base = self.style.columnGroupRowHeight;
    return base * groups;
  };

  /**
   * Get the width of the area about row groups for rendering and handling events.
   */
  getRowGroupAreaWidth = () => {
    const self = this.grid;
    if (!self.attributes.allowGroupingRows) {
      return 0;
    }
    const groups = self.groupedRows.length;
    const base = self.style.rowGroupColumnWidth;
    return base * groups;
  };

  getCollapsedColumnGroups = () => {
    const self = this.grid;
    const result: GroupDescriptorResult[] = [];
    for (let rowIndex = 0; rowIndex < self.groupedColumns.length; rowIndex++) {
      const groups = self.groupedColumns[rowIndex];
      groups.forEach((group: GroupDescriptor, from: number) => {
        if (group.collapsed) {
          const copy = group as GroupDescriptorResult;
          copy.from = from;
          copy.level = rowIndex;
          result.push(copy);
        }
      });
    }
    return result;
  };
  getCollapsedRowGroups = () => {
    const self = this.grid;
    const result: GroupDescriptorResult[] = [];
    for (let rowIndex = 0; rowIndex < self.groupedRows.length; rowIndex++) {
      const groups = self.groupedRows[rowIndex];
      groups.forEach((group: GroupDescriptor, from: number) => {
        if (group.collapsed) {
          const copy = group as GroupDescriptorResult;
          copy.from = from;
          copy.level = rowIndex;
          result.push(copy);
        }
      });
    }
    return result;
  };
  /**
   * Toggle the collapse status of a group (expanded/collapsed)
   * @param {{type:string,from:number,to:number}} group
   */
  toggleGroup = (group) => {
    const self = this.grid;
    if (group.type === 'c') {
      const { from, to } = group;
      let matchedGroup: GroupDescriptor;
      const allGroups = self.groupedColumns;
      for (let i = 0; i < allGroups.length; i++) {
        const groups = allGroups[i];
        const group = groups.get(from);
        if (group?.to === to) {
          matchedGroup = group;
          break;
        }
      }
      if (!matchedGroup) return;
      const nextCollapsed = !matchedGroup.collapsed;
      matchedGroup.collapsed = nextCollapsed;

      if (nextCollapsed) {
        self.hideColumns(from, to, true);
      } else {
        self.unhideColumns(from - 1, true);
      }
      return true;
    }
    if (group.type === 'r') {
      const { from, to } = group;
      let matchedGroup: GroupDescriptor;
      const allGroups = self.groupedRows;
      for (let i = 0; i < allGroups.length; i++) {
        const groups = allGroups[i];
        const group = groups.get(from);
        if (group?.to === to) {
          matchedGroup = group;
          break;
        }
      }
      if (!matchedGroup) return;
      const nextCollapsed = !matchedGroup.collapsed;
      matchedGroup.collapsed = nextCollapsed;
      if (nextCollapsed) {
        self.hideRows(from, to, true);
      } else {
        self.unhideRows(from, to, true);
      }
      return true;
    }
    return false;
  };

  hasCollapsedRowGroup = () => {
    const self = this.grid;
    let hasCollapsed = false;
    for (let i = 0; i < self.groupedRows.length; i++) {
      const groups = self.groupedRows[i];
      groups.forEach((group: GroupDescriptor, _: number, __) => {
        if (group.collapsed) {
          hasCollapsed = true;
          return { break: true };
        }
      });
      if (hasCollapsed) return true;
    }
    return false;
  };

  /**
   * Get a column group at grid pixel coordinate x and y.
   * @param x Number of pixels from the left.
   * @param y Number of pixels from the top.
   */
  getColumnGroupAt = (x: number, y: number) => {
    const self = this.grid;
    const groups = self.groupedColumns.length;
    if (groups <= 0) return;
    const yZero = self.dp(self.getColumnGroupAreaHeight());
    if (y >= yZero) return;
    for (let i = 0; i < self.visibleGroups.length; i++) {
      const g = self.visibleGroups[i];
      if (g.type !== 'c') continue;
      if (x >= g.x && y >= g.y && x <= g.x2 && y <= g.y2) return g;
    }
  };
  /**
   * Get a row group at grid pixel coordinate x and y.
   * @param x Number of pixels from the left.
   * @param y Number of pixels from the top.
   */
  getRowGroupAt = (x: number, y: number) => {
    const self = this.grid;
    const groups = self.groupedRows.length;
    if (groups <= 0) return;
    const xZero = self.dp(self.getRowGroupAreaWidth());
    if (x >= xZero) return;
    for (let i = 0; i < self.visibleGroups.length; i++) {
      const g = self.visibleGroups[i];
      if (g.type !== 'r') continue;
      if (x >= g.x && y >= g.y && x <= g.x2 && y <= g.y2) return g;
    }
  };

  /**
   * Get the column group info given column belongs to
   * @param columnIndex Column index.
   */
  getGroupsColumnBelongsTo = (columnIndex: number) => {
    const self = this.grid;
    if (!self.attributes.allowGroupingColumns) return [];
    const result: GroupDescriptorResult[] = [];
    for (let i = 0; i < self.groupedColumns.length; i++) {
      const groups = self.groupedColumns[i];
      const group = groups.getPairOrNextLower(columnIndex);
      if (group && (group[0] === columnIndex || group[1].to >= columnIndex)) {
        const copy = { ...group[1] } as GroupDescriptorResult;
        copy.from = group[0];
        copy.level = i;
        result.push(copy);
      }
    }
    return result;
  };

  /**
   * Get the row group info given row belongs to
   * @param rowIndex Row index.
   */
  getGroupsRowBelongsTo = (rowIndex: number) => {
    const self = this.grid;
    if (!self.attributes.allowGroupingRows) return [];
    const result: GroupDescriptorResult[] = [];
    for (let i = 0; i < self.groupedRows.length; i++) {
      const groups = self.groupedRows[i];
      const group = groups.getPairOrNextLower(rowIndex);
      if (group && (group[0] === rowIndex || group[1].to >= rowIndex)) {
        const copy = { ...group[1] } as GroupDescriptorResult;
        copy.from = group[0];
        copy.level = i;
        result.push(copy);
      }
    }
    return result;
  };
}
