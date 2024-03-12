import type { GridHeader } from '../../types';
import type { FilterDescriptor } from './spec';
import type { ColumnsManager } from './columns-manager';

export type FilterFnGenerator = (
  column: GridHeader,
  value: any,
) => FilterFn | boolean;
export type FilterFn = (row: any) => boolean;

export const defaultFilterGenerators = {
  eq: (column: GridHeader, value: any): FilterFn => {
    const isNumber = column.type === 'number';
    if (isNumber && typeof value !== 'number') value = parseFloat(value);

    return (row) => {
      const cell = row[column.dataKey];
      if (cell !== value) {
        if (isNumber) return parseFloat(cell) === value;
        return false;
      }
      return true;
    };
  },
  contain: (column: GridHeader, value: any): FilterFn | true => {
    value = String(value || '');
    if (!value) return true;

    return (row) => {
      const cell = String(row[column.dataKey] || '');
      return cell.indexOf(value) >= 0;
    };
  },
};

export class InMemoryFilter {
  lastFilters: Array<[GridHeader, FilterDescriptor]>;
  indexes: number[];
  originalLength = 0;

  get has() {
    return this.lastFilters && this.lastFilters.length > 0;
  }
  get length() {
    return this.indexes ? this.indexes.length : 0;
  }

  private filters = new Map<string, FilterFnGenerator>();
  registerFilter = (filterName: string, fn: FilterFnGenerator) =>
    this.filters.set(filterName, fn);

  constructor() {
    this.registerFilter('eq', defaultFilterGenerators.eq);
    this.registerFilter('contain', defaultFilterGenerators.contain);
  }

  filterAgain = (rows: any[], columnsManager: ColumnsManager) => {
    if (!this.has) return;

    const lastFilters = this.lastFilters.map((it) => it[1]);
    this.filter(lastFilters, rows, columnsManager);
  };

  filter = (
    _filters: FilterDescriptor[],
    rows: any[],
    columnsManager: ColumnsManager,
  ): boolean => {
    this.originalLength = rows.length;

    let alwasysFalse = false;
    let functions: FilterFn[] = [];

    // normalize filters
    const lastFilters: Array<[GridHeader, FilterDescriptor]> = [];
    for (const it of _filters) {
      let column: GridHeader;
      if ('id' in it && typeof it.id !== 'undefined') {
        column = columnsManager.getById(it.id);
      } else if ('viewIndex' in it && typeof it.viewIndex !== 'undefined')
        column = columnsManager.get(it.viewIndex);

      if (!column) continue;

      let fnGen = this.filters.get(it.op);
      if (!fnGen) fnGen = defaultFilterGenerators.eq;
      const fn = fnGen(column, it.value);
      lastFilters.push([column, it]);
      if (fn === true) continue;
      if (fn === false) {
        alwasysFalse = true;
        continue;
      }
      functions.push(fn);
    }
    if (alwasysFalse) functions = [];
    this.lastFilters = lastFilters;

    if (functions.length === 0) {
      this.indexes = null;
      return false;
    }

    // todo: optimize, filter the data based on previous filtered data
    // todo: implement other filter operation
    const indexes = [];

    // run first filter
    let filter = functions.shift();
    for (let boundIndex = 0; boundIndex < rows.length; boundIndex++) {
      const row = rows[boundIndex];
      if (!filter(row)) continue;
      indexes.push(boundIndex);
    }

    while (functions.length > 0) {
      filter = functions.shift();
      for (let i = 0; i < indexes.length; i++) {
        const row = rows[indexes[i]];
        if (!filter(row)) {
          indexes.splice(i, 1);
          i--;
          continue;
        }
      }
    }

    this.indexes = indexes;
    return true;
  };
}
