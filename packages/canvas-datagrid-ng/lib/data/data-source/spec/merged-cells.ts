import type { RangeDescriptor } from '../../../types/base-structs';
import type { MergedCellDescriptor, MergeDirection } from '../../../types/cell';

export interface MergedCellsManager {
  contains(rowIndex: number, columnIndex: number): boolean;

  containsInRange(range: RangeDescriptor): boolean;

  merge(range: RangeDescriptor, direction: MergeDirection): boolean;

  unmerge(rowIndex: number, columnIndex): boolean;

  unmergeRange(range: RangeDescriptor): MergedCellDescriptor[];

  get(rowIndex: number, columnIndex: number): MergedCellDescriptor | undefined;

  getForRange(range: RangeDescriptor): MergedCellDescriptor[];

  insertRows(afterIndex: number, count: number);

  insertColumns(afterIndex: number, count: number);
}
