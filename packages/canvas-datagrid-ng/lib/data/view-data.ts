import type { GridPrivateProperties } from '../types';
import { copyMethods } from '../util';
import { DataSourceFromArray } from './data-source/from-array';

export default function loadGridViewDataManager(self: GridPrivateProperties) {
  copyMethods(new GridViewDataManager(self), self);
}

export class GridViewDataManager {
  constructor(private readonly grid: GridPrivateProperties) {}

  /** @deprecated */
  getBoundRowIndexFromViewRowIndex = (viewRowIndex: number) => {
    return viewRowIndex;
    // return this.grid.orders.rows.getRealIndex(viewRowIndex);
  };

  setStaticData = (data: any[]) => {
    const self = this.grid;
    self.dataSource = new DataSourceFromArray(data);
    self.createNewRowData();

    const dataSourceState = self.dataSource.state;
    if (self.attributes.autoResizeColumns && dataSourceState.rows > 0) {
      self.autosize();
    }
    // self.createRowOrders();
    // self.dispatchEvent('datachanged', { data: self.originalData });
    // self.initCellTreeSettings();
    self.resize(true);
  };

  /**
   * Gets the cell data for the given view indexes.
   * @param rowIndex
   * @param columnIndex
   * @returns cell value or undefined if the indexes are out of bounds.
   */
  getCellData = (rowIndex: number, columnIndex: number): any => {
    const self = this.grid;
    const { rows, cols } = self.dataSource.state;

    if (rowIndex >= rows || columnIndex >= cols) return;
    return self.dataSource.getCellValue(rowIndex, columnIndex);
  };

  /**
   * @deprecated Please use new data source classes
   */
  getFilteredAndSortedViewData = (originalData: any[]) => {
    const self = this.grid;
    // We make a copy of originalData here in order be able to
    // filter and sort rows without modifying the original array.
    // Each row is turned into a (row, rowIndex) tuple
    // so that when we apply filters, we can refer back to the
    // row's original row number in originalData. This becomes
    // useful when emitting cell events.
    const newViewData = originalData.map((row, originalRowIndex) => [
      row,
      originalRowIndex,
    ]);

    // Remove hidden rows here. So we can keep the bound indexes correct
    /* if (self.hiddenRowRanges.length > 0) {
      const ranges = self.hiddenRowRanges.sort((a, b) => b[1] - a[1]);
      for (let i = 0; i < ranges.length; i++) {
        const [beginRowIndex, endRowIndex] = ranges[i];
        const countOfRows = endRowIndex - beginRowIndex + 1;
        newViewData.splice(beginRowIndex, countOfRows);
      }
    } */

    // Apply filtering
    // for (const [headerName, filterText] of Object.entries(self.columnFilters)) {
    //   const header = self.getHeaderById(headerName);

    //   if (!header) {
    //     continue;
    //   }

    //   const currentFilterFunction =
    //     header.filter || self.filter(header.type || 'string');

    //   newViewData = newViewData.filter(function ([row, originalRowIndex]) {
    //     if (
    //       self.attributes.allowFreezingRows &&
    //       !self.attributes.filterFrozenRows &&
    //       originalRowIndex < self.frozenRow
    //     )
    //       return true;

    //     return currentFilterFunction(row[headerName], filterText);
    //   });
    // }

    //#region Hide rows from collapsed group
    /** @type {number[][]} */
    let collapsedGroups = [];
    for (let i = 0; i < self.groupedRows.length; i++) {
      const rows = self.groupedRows[i];
      for (let j = 0; j < rows.length; j++) {
        const r = rows[j];
        if (!r.collapsed) continue;
        collapsedGroups.push([r.from, r.to]);
      }
    }
    if (collapsedGroups.length > 0) {
      //#region merge groups
      collapsedGroups.sort((a, b) => a[0] - b[0]);
      let newLen = 0;
      const len = collapsedGroups.length;
      for (let i = 0; i < len; i++) {
        const r = collapsedGroups[i];
        if (i === len - 1) {
          collapsedGroups[newLen++] = r;
          break;
        }
        const to = r[1];
        const [from2, to2] = collapsedGroups[i + 1];
        if (from2 > to + 1) {
          collapsedGroups[newLen++] = r;
          continue;
        }
        collapsedGroups[i + 1] = r;
        if (to2 > to) collapsedGroups[i + 1][1] = to2;
      }
      collapsedGroups = collapsedGroups.slice(0, newLen);
      //#endregion merge groups

      //#region omit rows by groups
      let g = collapsedGroups.shift();
      for (let start = 0; start < newViewData.length; start++) {
        const it = newViewData[start][1];
        if (it < g[0]) continue;
        let end = start + 1;
        for (; end < newViewData.length; end++) {
          const it2 = newViewData[end][1];
          if (it2 > g[1]) break;
        }
        newViewData.splice(start, end - start);
        g = collapsedGroups.shift();
        if (!g) break;
        start--;
      }
      //#endregion omit rows by groups
    }
    //#endregion Hide rows from collapsed group

    return {
      viewData: newViewData.map(([row]) => row),
    };
  };
}
