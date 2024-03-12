import { checkIfRangesIntersect, isInRange } from '../../range/util';
import type { GridHeader, RangeDescriptor } from '../../types';
import { reorderInSparseData } from '../reorder/sparse-data';

type Records<T> = {
  [rowIndex: string]: { [columnId: string]: T };
};

export type MoveCallback<T = any> = (
  rowIndex: number,
  column: GridHeader,
  data: T,
) => boolean;

export class TableModification<T = any> {
  private records: Records<T> = {};
  private rows = 0;
  get touchedRows() {
    return this.rows;
  }

  get rowIndexes() {
    return Object.keys(this.records).map((str) => parseInt(str, 10));
  }

  checkBeforeMove = (
    range: RangeDescriptor,
    targetRange: RangeDescriptor,
    columns: GridHeader[],
    targetColumns: GridHeader[],
  ) => {
    if (!checkIfRangesIntersect(range, targetRange)) {
      return !this.containsData(
        targetColumns.map((col) => col.id),
        targetRange.startRow,
        targetRange.endRow,
      );
    }
    const startRow = Math.min(range.startRow, targetRange.startRow);
    const startColumn = Math.min(range.startColumn, targetRange.startColumn);
    const endRow = Math.max(range.endRow, targetRange.endRow);
    const endColumn = Math.max(range.endColumn, targetRange.endColumn);

    const mappedColIds: Record<number, string> = {};

    const colCallback = (col: GridHeader) =>
      (mappedColIds[col.columnViewIndex] = col.id);
    columns.forEach(colCallback);
    targetColumns.forEach(colCallback);

    // Check if there is any data outside of the source range.
    for (const rowIndex of this.rowIndexes) {
      if (rowIndex < startRow || rowIndex > endRow) continue;
      const row = this.records[rowIndex];
      for (let colIndex = startColumn; colIndex <= endColumn; colIndex++) {
        if (isInRange(range, rowIndex, colIndex)) continue;
        const columnId = mappedColIds[colIndex];
        const data = row[columnId];
        if (
          data !== undefined &&
          data !== null &&
          (typeof data !== 'string' || data.length > 0)
        ) {
          return false;
        }
      }
    }
    return true;
  };

  containsData = (
    columnIds: string[],
    startRowIndex: number,
    endRowIndex: number,
  ): boolean => {
    for (const rowIndex of this.rowIndexes) {
      if (rowIndex < startRowIndex || rowIndex > endRowIndex) continue;
      const row = this.records[rowIndex];
      for (const columnId of columnIds) {
        const data = row[columnId];
        if (
          data !== undefined &&
          data !== null &&
          (typeof data !== 'string' || data.length > 0)
        ) {
          return true;
        }
      }
    }
    return false;
  };

  reset = () => {
    this.rows = 0;
    this.records = Object.create(null);
  };

  modify = (rowIndex: number, columnId: string | number, value: T) => {
    if (!this.records[rowIndex]) {
      this.rows++;
      this.records[rowIndex] = Object.create(null);
    }
    const row = this.records[rowIndex];
    row[columnId] = value;
  };

  assign = (basedValues: T[], columnIds: string[], rowIndex: number) => {
    const row = this.records[rowIndex];
    if (!row) return;
    for (let i = 0; i < columnIds.length; i++) {
      const columnId = columnIds[i];
      const modification = row[columnId];
      if (typeof modification !== 'undefined') basedValues[i] = modification;
    }
  };

  delete = (
    columnIds: string[],
    startRowIndex: number,
    endRowIndex: number,
  ) => {
    if (endRowIndex < startRowIndex) return;
    for (const rowIndex of this.rowIndexes) {
      if (rowIndex < startRowIndex || rowIndex > endRowIndex) continue;

      const row = this.records[rowIndex];
      for (const columnId of columnIds) {
        delete row[columnId];
      }
    }
  };

  get = (rowIndex: number, columnId: string): T => {
    const row = this.records[rowIndex];
    if (!row) return;
    return row[columnId];
  };

  getRange = (startRow: number, endRow: number, columns: GridHeader[]) => {
    const records: T[][] = [];

    for (const rowIndex of this.rowIndexes) {
      if (rowIndex < startRow || rowIndex > endRow) continue;

      const recordIndex = rowIndex - startRow;
      const row = this.records[rowIndex];
      const target = [];

      records[recordIndex] = target;
      for (const column of columns) {
        if (column.id === '__proto__') continue;
        target.push(row?.[column.id]);
      }
    }
    return records;
  };

  expandRange = (
    baseRange: RangeDescriptor,
    getHeader: (index: number) => GridHeader,
  ): boolean => {
    const rowIndexes = this.rowIndexes.sort((a, b) => a - b);
    if (rowIndexes.length == 0) return;

    let rowsBeginIndex = -1;
    let rowsEndIndex = -1;
    for (let i = 0; i < rowIndexes.length; i++) {
      const rowIndex = rowIndexes[i];
      if (rowIndex < baseRange.startRow - 1) continue;
      if (rowsBeginIndex === -1) {
        if (rowIndex > baseRange.endRow + 1) return false;
        rowsBeginIndex = i;
      }
      if (rowIndex > baseRange.endRow + 1) break;
      rowsEndIndex = i;
    }

    // The range is not inside a data range.
    if (rowsBeginIndex === -1 || rowsEndIndex === -1) return false;

    const newRange: RangeDescriptor = baseRange;
    /* const newRange: RangeDescriptor = {
      startRow: baseRange.startRow,
      startColumn: baseRange.startColumn,
      endRow: baseRange.endRow,
      endColumn: baseRange.endColumn,
    }; */

    const isValidData = (data: any) =>
      data !== undefined &&
      data !== null &&
      (typeof data !== 'string' || data.length > 0);

    let startRowLimited = false;
    let endRowLimited = false;
    let hadSuccess = false;
    let success = false;

    do {
      success = false;

      if (!startRowLimited || !endRowLimited) {
        const topRowIndex = rowIndexes[rowsBeginIndex];
        const bottomRowIndex = rowIndexes[rowsEndIndex];

        for (
          let columnIndex = newRange.startColumn;
          columnIndex <= newRange.endColumn;
          columnIndex++
        ) {
          const header = getHeader(columnIndex);
          if (
            newRange.startRow <= topRowIndex &&
            newRange.endRow >= bottomRowIndex
          ) {
            break;
          }

          if (
            !startRowLimited &&
            isValidData(this.records[topRowIndex][header.id])
          ) {
            newRange.startRow = Math.min(topRowIndex, newRange.startRow);
            success = true;

            if (
              rowsBeginIndex - 1 >= 0 &&
              rowIndexes[rowsBeginIndex - 1] === newRange.startRow - 1
            ) {
              rowsBeginIndex--;
            } else {
              startRowLimited = true;
            }
          }

          if (
            !endRowLimited &&
            isValidData(this.records[bottomRowIndex][header.id])
          ) {
            newRange.endRow = Math.max(bottomRowIndex, newRange.endRow);
            success = true;

            if (
              rowsEndIndex + 1 < rowIndexes.length &&
              rowIndexes[rowsEndIndex + 1] === newRange.endRow + 1
            ) {
              rowsEndIndex++;
            } else {
              endRowLimited = true;
            }
          }
        }
      }

      for (let key = rowsBeginIndex; key <= rowsEndIndex; key++) {
        let header: GridHeader | undefined;

        const rowIndex = rowIndexes[key];
        const row = this.records[rowIndex];

        header =
          newRange.startColumn - 1 >= 0 && getHeader(newRange.startColumn - 1);
        if (header && isValidData(row[header.id])) {
          success = true;
          newRange.startColumn--;
        }

        header = getHeader(newRange.endColumn + 1);
        if (header && isValidData(row[header.id])) {
          success = true;
          newRange.endColumn++;
        }
      }

      if (success) hadSuccess = true;
    } while (success);

    return hadSuccess;
  };

  iterateColumn = (columnId: string, callback: (value: T) => boolean | any) => {
    for (const key of Object.keys(this.records)) {
      const data = this.records[key][columnId];
      if (data === undefined) continue;
      if (callback(data) === false) break;
    }
  };

  move = (
    startRow: number,
    endRow: number,
    columns: GridHeader[],
    rowOffset: number,
    targetColumns: GridHeader[],
    callback: MoveCallback<T>,
  ) => {
    if (columns.length !== targetColumns.length) return;
    // Avoid overwriting the next data by starting from the unique index.
    const reverseRowAccess = rowOffset >= 0;
    const reverseColumnAccess =
      targetColumns[0].columnIndex > columns[0].columnIndex;
    const columnCount = columns.length;

    const rowIndexes = this.rowIndexes.sort((a, b) => a - b);
    if (rowIndexes.length == 0) return;

    const targetStartRow = startRow + rowOffset;
    const targetEndRow = endRow + rowOffset;

    const startColumn = columns[0].columnIndex;
    const endColumn = columns[columns.length - 1].columnIndex;

    const targetOnlyColumns = targetColumns.filter(
      (targetCol) =>
        targetCol.columnIndex > endColumn ||
        targetCol.columnIndex < startColumn,
    );

    for (let i = 0; i < rowIndexes.length; i++) {
      const rowIndex =
        rowIndexes[reverseRowAccess ? rowIndexes.length - 1 - i : i];

      if (rowIndex >= targetStartRow && rowIndex <= targetEndRow) {
        if (startRow > rowIndex || endRow < rowIndex) {
          const row = this.records[rowIndex];
          for (const col of targetColumns) {
            delete row[col.id];
          }
        } else if (targetOnlyColumns.length > 0) {
          for (const col of targetOnlyColumns) {
            const row = this.records[rowIndex];
            delete row[col.id];
          }
        }
      }

      if (rowIndex < startRow || rowIndex > endRow) {
        if (reverseRowAccess === rowIndex < startRow) {
          break;
        } else {
          continue;
        }
      }

      const row = this.records[rowIndex];
      const targetRowIndex = rowIndex + rowOffset;
      const targetRow =
        this.records[targetRowIndex] ?? (this.records[targetRowIndex] = {});
      for (let j = 0; j < columnCount; j++) {
        const columnPos = reverseColumnAccess ? columnCount - 1 - j : j;
        const column = columns[columnPos];
        const targetColumn = targetColumns[columnPos];
        if (column.id === '__proto__' || targetColumn.id === '__proto__') {
          continue;
        }

        const data = row?.[column.id];
        if (data) delete row[column.id];

        if (callback(targetRowIndex, targetColumn, data)) continue;
        if (data) {
          targetRow[targetColumn.id] = data;
        } else {
          delete targetRow[targetColumn.id];
        }
      }
    }
  };

  insert = (afterIndex: number, count: number) => {
    const keys = Object.keys(this.records)
      .map((key) => parseInt(key))
      .sort((a, b) => b - a);
    for (const key of keys) {
      if (key <= afterIndex) continue;
      const data = this.records[key];
      delete this.records[key];

      this.records[key + count] = data;
    }
  };

  reorder = (rowIndexes: number[], afterIndex: number) => {
    reorderInSparseData(this.records, rowIndexes, afterIndex);
  };

  getAll = () => this.records;
  unsafeOverwrite = (records: Records<T>, rows: number) => {
    this.records = records;
    this.rows = rows;
  };
}
