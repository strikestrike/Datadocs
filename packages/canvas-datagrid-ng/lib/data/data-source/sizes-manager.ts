import type { GridHeader, SizeMapping } from '../../types';
import { extractFromSparseData } from '../reorder/sparse-data';
import type { DataRecord } from '../data-map';
import { DataMap } from '../data-map';
import type { ColumnsManager } from './columns-manager';

const getRangeSumFromBtree = (
  map: DataMap<number>,
  start: number,
  end: number,
  defaultLength: number,
) => {
  const beginning = map.getRecord(start);
  const reusedArray = [];
  let sum = 0;
  let previous = start;

  const entries = map.records.entries(
    beginning?.startIndex ?? start,
    reusedArray,
  );
  for (const [recordStart, record] of entries) {
    if (recordStart > end) break;
    if (previous < recordStart) {
      // Add up the default length when there are gaps in between
      sum += defaultLength * (recordStart - previous);
    }
    sum +=
      record.data *
      (Math.min(record.endIndex, end) - Math.max(recordStart, start) + 1);
    previous = record.data;
  }
  return sum;
};

export class SizesManager implements SizeMapping {
  readonly columns = new DataMap<number>();
  readonly rows = new DataMap<number>();
  readonly trees: { [x: string]: number } = {};

  readonly hiddenColumnSizes = new Map<string, number | DataRecord<any>>();

  constructor(public columnsManager?: ColumnsManager) {}

  clearColumnWidths = () => {
    this.columns.clear();
  };
  getColumnWidth = (index: number, defaultColumnWidth?: number) => {
    const data = this.columns.getData(index);
    return data ?? defaultColumnWidth;
  };
  setColumnWidth = (
    index: number,
    width: number,
    auto?: boolean,
    endIndex?: number,
  ): boolean => {
    return this.columns.setData(index, width, auto, endIndex);
  };
  getColumnRangeWidth = (
    startIndex: number,
    endIndex: number,
    defaultWidth: number,
  ) => getRangeSumFromBtree(this.columns, startIndex, endIndex, defaultWidth);

  clearRowHeights = () => {
    this.rows.clear();
  };
  getRowHeight = (index: number, defaultRowHeight?: number) => {
    return this.rows.getDataOrDefault(index, defaultRowHeight);
  };
  setRowHeight = (
    index: number,
    height: number,
    auto?: boolean,
    endIndex?: number,
  ) => {
    return this.rows.setData(index, height, auto, endIndex);
  };
  getRowRangeHeight = (
    startIndex: number,
    endIndex: number,
    defaultHeight: number,
  ) => {
    return getRangeSumFromBtree(this.rows, startIndex, endIndex, defaultHeight);
  };

  getTreeHeight = (index: number, defaultValue?: number) => {
    return this.trees[index] ?? defaultValue;
  };
  setTreeHeight = (index: number, height: number) => {
    this.trees[index] = height;
  };

  reorderColumns = (
    columnViewIndex: number,
    count: number,
    afterViewIndex: number,
  ) => {
    this.columns.reorder(
      afterViewIndex,
      columnViewIndex,
      columnViewIndex + Math.max(count - 1, 0),
    );
  };

  reorderRows = (
    beginViewIndex: number,
    count: number,
    afterViewIndex: number,
  ) => {
    this.rows.reorder(
      afterViewIndex,
      beginViewIndex,
      beginViewIndex + Math.max(count - 1, 0),
    );
  };

  hide = (removedColumns: Pick<GridHeader, 'id' | 'columnViewIndex'>[]) => {
    const map = new Map(
      removedColumns.map((it) => [it.columnViewIndex, it.id]),
    );
    const viewIndexes = Array.from(map.keys());
    const extracted = extractFromSparseData(this.columns, viewIndexes);
    extracted.forEach(([viewIndex, size]) => {
      const columnId = map.get(viewIndex);
      if (columnId) this.hiddenColumnSizes.set(columnId, size);
    });
  };

  unhide = (
    afterViewIndex: number,
    insertedColumns: Pick<GridHeader, 'id'>[],
  ) => {
    // const sizes = insertedColumns.map(
    //   (column) => this.hiddenColumnSizes.get(column.id) || ({} as SizeInfo),
    // );
    // insertIntoSparseData(this.columns, [afterViewIndex, sizes]);
  };
}
