import type { GridPrivateProperties } from '../types';
import { copyMethods } from '../util';

export default function loadGridFilterHelper(self: GridPrivateProperties) {
  copyMethods(new GridFilterHelper(self), self);
}

export class GridFilterHelper {
  constructor(private readonly grid: GridPrivateProperties) {}

  hasActiveFilters = () => {
    return this.grid.dataSource.getCurrentFilters().length > 0;
  };

  /**
   * Sets the value of the filter.
   * @memberof canvasDatagrid
   * @name setFilter
   * @method
   * @param column Name of the column to filter.
   * @param value The value to filter for.
   */
  setFilter = (column?: string, value?: string) => {
    const self = this.grid;
    if (column === undefined && value === undefined) {
      self.columnFilters = {};
    } else if (column && (value === '' || value === undefined)) {
      delete self.columnFilters[column];
    } else {
      self.columnFilters[column] = value;
      if (self.attributes.showFilterInCell) {
        self.filterable.rows.push(0);
        self.getSchema().forEach(function (value, index) {
          self.filterable.columns.push(index);
        });
      }
    }
    if (!Object.keys(self.columnFilters).length) {
      self.filterable = {
        rows: [],
        columns: [],
      };
    }
    self.refresh();
  };
}
