import type { GridHeader, GridSchemaItem } from '../../../types';
import type { HiddenColumnsInfo } from '../spec';
import { reorderConsequentInArray } from '../../reorder/array';
import type { HiddenColumn } from './types';

export class ColumnsManager {
  /** this property is used for restore hidden columns */
  private hiddenColumns: HiddenColumn[] = [];

  private columns: GridHeader[] = [];
  private readonly idToDataKey = new Map<string, string | number>();
  //#region implement Array methods
  get length() {
    return this.columns.length;
  }
  slice: Array<GridHeader>['slice'];
  map: Array<GridHeader>['map'];
  find: Array<GridHeader>['find'];
  forEach: Array<GridHeader>['forEach'];
  //#endregion
  resolveAfterChange = () => {
    let columnViewIndex = 0;
    let columnIndex = 0;

    const consume = (info: HiddenColumn | undefined) => {
      if (!info) return;
      for (const column of info.columns) {
        column.hidden = true;
        column.columnIndex = columnIndex++;
      }
    };

    consume(this.hiddenColumns.find((item) => item.after === null));
    this.columns.forEach((it) => {
      it.hidden = false;
      it.columnViewIndex = columnViewIndex++;
      it.columnIndex = columnIndex++;
      this.idToDataKey.set(it.id, it.dataKey);

      consume(this.hiddenColumns.find((item) => item.after === it.id));
    });
  };
  set = (columns: GridSchemaItem[]) => {
    const usedId = new Set<string | number>();
    this.columns = columns.map((it, columnIndex) => {
      if (it.id) usedId.add(it.id);
      return Object.assign(it, { columnIndex });
    });
    this.slice = this.columns.slice.bind(this.columns);
    this.map = this.columns.map.bind(this.columns);
    this.find = this.columns.find.bind(this.columns);
    this.forEach = this.columns.forEach.bind(this.columns);

    this.columns.forEach((it) => {
      if (it.id) return;
      let id = it.dataKey;
      for (let suffix = 0; usedId.has(id); suffix++)
        id = [it.dataKey, suffix].join('_');
      it.id = String(id);
      usedId.add(id);
    });
    if (this.initColumns) delete this.initColumns;
    this.idToDataKey.clear();
    this.resolveAfterChange();
  };

  /** This property only gets value when the `columns` property is changed by hide, unhide or reorder */
  private initColumns?: GridHeader[];
  reset = () => {
    if (!this.initColumns) return;
    this.columns = this.initColumns.map((x) => x);
    this.idToDataKey.clear();
    this.resolveAfterChange();
  };
  constructor(columns: GridHeader[]) {
    this.set(columns);
  }

  get = (index: number) => this.columns[index];
  getAll = (includeHidden = false) => {
    if (!includeHidden) return this.columns;
    const headers = [...this.getAll()];
    for (const hidden of this.hiddenColumns) {
      const index = hidden.after
        ? headers.findIndex((header) => hidden.after == header.id)
        : -1;
      if (index <= -1 && hidden.after) continue;
      headers.splice(index + 1, 0, ...hidden.columns);
    }
    return headers;
  };
  getById = (id: string) => {
    const result = this.columns.find((it) => it.id === id);
    if (result !== undefined) return result;

    for (const hidden of this.hiddenColumns) {
      for (const column of hidden.columns) {
        if (id === column.id) return column;
      }
    }
  };
  getViewIndex = (id: string) => this.columns.findIndex((it) => it.id === id);
  getViewIndexByOriginalIndex = (index: number, matchNearestIfNeed = false) => {
    const callback = (column) => column.columnIndex === index;
    const result = this.columns.find(callback)?.columnViewIndex;
    if (typeof result === 'number' || !matchNearestIfNeed) return result;
    const hiddenColumn = this.hiddenColumns.find(
      (hiddenColumn) => hiddenColumn.columns.find(callback) !== undefined,
    );
    return this.getById(hiddenColumn.after)?.columnViewIndex;
  };
  getName = (id: string) => this.idToDataKey.get(id);

  getHiddenColumnCount = () =>
    this.hiddenColumns.reduce((previous, current) => {
      return previous + current.columns.length;
    }, 0);

  collapseGroup = (startIndex: number, endIndex: number) => {
    // TODO: Move the functionality of `hide` to here for group.
    // Notice that this should use real indexes and not view indexes.
  };
  expandGroup = (startIndex: number, endIndex: number) => {
    // TODO: Move the functionality of `unhide` to here for group.
    // Notice that this should use real indexes and not view indexes.
  };

  hide = (columnViewIndex: number, count: number, isGroup?: boolean) => {
    if (columnViewIndex < 0) columnViewIndex = 0;
    if (columnViewIndex >= this.columns.length) return;

    // TODO: This is a temporary solution.  From what I've seen from both
    // Sheets and Excel (online) is that keeping the hidden parts of the
    // columns/rows instead of moving them is more easier to handle when
    // it comes to storing the data related to them.
    if (isGroup) {
      const endColumnIndex = columnViewIndex + count - 1;

      let firstColumn: GridHeader | undefined;
      let lastColumn: GridHeader | undefined;
      for (const column of this.columns) {
        if (!firstColumn && column.columnIndex >= columnViewIndex) {
          firstColumn = column;
        }
        if (column.columnIndex <= endColumnIndex) {
          lastColumn = column;
        } else {
          break;
        }
      }

      if (!firstColumn || !lastColumn) return;
      columnViewIndex = firstColumn.columnViewIndex;
      count = lastColumn.columnViewIndex - columnViewIndex + 1;
    }

    if (!this.initColumns) this.initColumns = this.columns.map((x) => x);
    const removedColumns = this.columns.splice(columnViewIndex, count);
    count = removedColumns.length;

    const after =
      columnViewIndex > 0 ? this.columns[columnViewIndex - 1].id : null;

    let merged: boolean;
    do {
      merged = false;
      for (let i = 0; i < this.hiddenColumns.length; i++) {
        const hiddenInfo = this.hiddenColumns[i];

        for (let j = 0; j < removedColumns.length; j++) {
          if (hiddenInfo.after === removedColumns[j].id) {
            removedColumns.splice(j + 1, 0, ...hiddenInfo.columns);
            this.hiddenColumns.splice(i, 1);
            i--;
            merged = true;
            break;
          }
        }
      }
    } while (merged);

    const existedInfo = this.hiddenColumns.find((info) => info.after === after);
    if (existedInfo) {
      existedInfo.columns.push(...removedColumns);
    } else {
      this.hiddenColumns.push({
        after,
        columns: removedColumns,
        isGroup,
      });
    }

    this.resolveAfterChange();
    return removedColumns;
  };

  /**
   * @param afterViewIndex `-1` for the hidden columns in the beginning
   */
  unhide = (afterViewIndex: number, isGroup?: boolean) => {
    let at: number;

    if (isGroup) {
      let targetColumn: GridHeader | undefined;
      for (const column of this.columns) {
        if (column.columnIndex < afterViewIndex + 1) continue;
        targetColumn = column;
        break;
      }
      if (!targetColumn) return;
      afterViewIndex = targetColumn.columnViewIndex - 1;
    }
    if (afterViewIndex < 0) {
      at = this.hiddenColumns.findIndex((it) => !it.after);
    } else {
      const column = this.columns[afterViewIndex];
      if (!column) return;
      at = this.hiddenColumns.findIndex((it) => it.after === column.id);
    }
    if (at < 0) return;

    if (!this.initColumns) this.initColumns = this.columns.map((x) => x);

    const { columns } = this.hiddenColumns[at];
    this.columns.splice(afterViewIndex + 1, 0, ...columns);
    this.hiddenColumns.splice(at, 1);
    this.resolveAfterChange();
    return { columns };
  };

  setVisibility = (columnId: string, visible: boolean | 'replace') => {
    if (visible === 'replace') {
      this.unhideAll();
      const columnIndex = this.columns.findIndex((col) => col.id === columnId);
      if (columnIndex <= -1) return false;

      const column = this.columns[columnIndex];
      const beginning = this.columns.slice(0, columnIndex);
      const end = this.columns.slice(columnIndex + 1, this.columns.length);

      if (beginning.length > 0) {
        this.hiddenColumns.push({
          after: null,
          columns: beginning,
          isGroup: false,
        });
      }
      if (end.length > 0) {
        this.hiddenColumns.push({
          after: column.id,
          columns: end,
          isGroup: false,
        });
      }

      this.columns.length = 0;
      this.columns.push(column);

      this.resolveAfterChange();
      return true;
    }

    if (visible) {
      let hiddenRangeData: [HiddenColumn, number] | undefined;
      for (let i = 0; i < this.hiddenColumns.length; i++) {
        const info = this.hiddenColumns[i];
        const index = info.columns.findIndex((col) => col.id === columnId);
        if (index <= -1) continue;

        this.hiddenColumns.splice(i, 1);
        hiddenRangeData = [info, index];
        break;
      }

      if (!hiddenRangeData) return false;

      const [info, index] = hiddenRangeData;
      const column = info.columns[index];
      const beginning = info.columns.slice(0, index);
      const end = info.columns.slice(index + 1, info.columns.length);
      const targetIndex =
        this.columns.findIndex((col) => col.id === info.after) + 1;

      if (beginning.length > 0) {
        this.hiddenColumns.push({
          after: info.after,
          columns: beginning,
          isGroup: false,
        });
      }
      if (end.length > 0) {
        this.hiddenColumns.push({
          after: column.id,
          columns: end,
          isGroup: false,
        });
      }

      this.columns.splice(targetIndex, 0, column);
      this.resolveAfterChange();
      return true;
    } else {
      const column = this.getById(columnId);
      if (column) {
        this.hide(column.columnViewIndex, 1, false);
        return true;
      }
    }

    return false;
  };

  unhideAll = () => {
    for (const hidden of this.hiddenColumns) {
      const index = hidden.after
        ? this.columns.findIndex((col) => col.id === hidden.after)
        : -1;
      if (index <= -1 && hidden.after) continue;
      this.columns.splice(index + 1, 0, ...hidden.columns);
    }

    this.hiddenColumns.length = 0;
    this.resolveAfterChange();

    return true;
  };

  insert = (afterViewIndex: number, columns: GridHeader[]) => {
    if (afterViewIndex >= this.columns.length) return;
    this.columns.splice(afterViewIndex + 1, 0, ...columns);
    this.resolveAfterChange();
  };

  reorder = (viewIndex: number, count: number, afterViewIndex: number) => {
    if (count <= 0) return false;
    if (viewIndex < 0) viewIndex = 0;
    if (!this.initColumns) this.initColumns = this.columns.map((x) => x);

    const result = reorderConsequentInArray(
      this.columns,
      viewIndex,
      count,
      afterViewIndex,
    );
    if (result) this.resolveAfterChange();
    return result;
  };

  /**
   * Reorder using IDs.
   *
   * Unlike {@link reorder}, this can work with hidden columns.
   */
  reorderWithIds = (columnId: string, afterColumnId: string) => {
    const allColumns = this.getAll(true);
    const columnIndex = allColumns.findIndex(
      (column) => column.id === columnId,
    );
    if (columnIndex <= -1) return false;

    const column = allColumns[columnIndex];
    allColumns.splice(columnIndex, 1);
    if (afterColumnId) {
      const targetIndex = allColumns.findIndex(
        (column) => column.id === afterColumnId,
      );
      if (targetIndex <= -1) return false;

      allColumns.splice(targetIndex + 1, 0, column);
    } else {
      allColumns.splice(0, 0, column);
    }

    this.columns.length = 0;
    this.hiddenColumns.length = 0;

    let previousId = null;
    let hiddenColumn: HiddenColumn | undefined;

    for (const savedColumn of allColumns) {
      if (savedColumn.hidden) {
        if (!hiddenColumn) {
          hiddenColumn = {
            after: previousId,
            columns: [],
            isGroup: false,
          };
          this.hiddenColumns.push(hiddenColumn);
        }

        hiddenColumn.columns.push(savedColumn);
      } else {
        hiddenColumn = undefined;
        previousId = savedColumn.id;

        this.columns.push(savedColumn);
      }
    }

    this.resolveAfterChange();
    return true;
  };

  getHiddenColumns = (viewIndex: number): HiddenColumnsInfo => {
    const { hiddenColumns } = this;
    if (hiddenColumns.length === 0) return;

    let columnId: string;
    let prevColumnId: string = null;

    const column = this.columns[viewIndex];
    if (column) columnId = column.id;
    else return;

    let after: GridHeader[];
    let before: GridHeader[];
    let afterGroup = false;
    let beforeGroup = false;
    if (viewIndex > 0) prevColumnId = this.columns[viewIndex - 1].id;
    for (let i = 0; i < hiddenColumns.length; i++) {
      const info = hiddenColumns[i];
      if (info.after === columnId) {
        after = info.columns;
        afterGroup = info.isGroup;
      } else if (info.after === prevColumnId) {
        before = info.columns;
        beforeGroup = info.isGroup;
      }
    }
    if (after || before) return { after, before, beforeGroup, afterGroup };
  };

  getStructTarget = (columnId): string | undefined => {
    return this.getById(columnId)?.structFilterPath;
  };
  setStructField = (columnId: string, target: string | undefined) => {
    const column = this.getById(columnId);
    if (!column) return false;

    column.structFilterPath = target;
    return true;
  };
}
