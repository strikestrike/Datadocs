import type { GridPrivateProperties } from '../types';
import { copyMethods } from '../util';

export default function loadGridSorterHelper(self: GridPrivateProperties) {
  copyMethods(new GridSorterHelper(self), self);
}

export class GridSorterHelper {
  constructor(private readonly grid: GridPrivateProperties) {}

  /**
   * Sets the order of the data.
   * @param columnId Name of the column to be sorted.
   * @param dir `asc` for ascending or `desc` for descending.
   */
  order = (columnId: string | number, dir: 'asc' | 'desc') => {
    const self = this.grid;
    self.dataSource.sort([{ id: String(columnId), dir }]);
  };
}
