import type { GridHeader } from '../../types';
import { columnTypeToString } from '../../utils/column-types';
import {
  defaultSorterForDate,
  defaultSorterForNumber,
  defaultSorterForString,
  mergeSorters,
} from '../default-sorters';
import type { SortDescriptor } from './sorters/spec';
import type { ColumnsManager } from './columns-manager';

export class InMemorySorter {
  columns: ColumnsManager;
  lastSort: Array<{
    column: GridHeader;
    dir: 'asc' | 'desc';
  }> = [];

  constructor(
    columns: ColumnsManager,
    private readonly prop: keyof GridHeader = 'dataKey',
  ) {
    this.columns = columns;
  }

  private getColumnSorter = (sort: SortDescriptor) => {
    let column: GridHeader;
    if ('id' in sort && typeof sort.id !== 'undefined')
      column = this.columns.getById(sort.id);
    else if ('viewIndex' in sort && typeof sort.viewIndex !== 'undefined')
      column = this.columns.get(sort.viewIndex);
    if (!column) return;
    this.lastSort.push({ column, dir: sort.dir });

    const columnProp = column[this.prop] as string;
    if (column.sorter) return column.sorter(columnProp, sort.dir);
    const colTypeStr = columnTypeToString(column.type);
    if (
      colTypeStr === 'number' ||
      colTypeStr === 'int' ||
      colTypeStr === 'float'
    )
      return defaultSorterForNumber(columnProp, sort.dir);
    if (colTypeStr === 'date' || colTypeStr === 'datetime')
      return defaultSorterForDate(columnProp, sort.dir);
    return defaultSorterForString(columnProp, sort.dir);
  };

  sort = (sortRules: SortDescriptor[], rows: any[]) => {
    this.lastSort = [];
    const sorters = sortRules
      .map((it) => this.getColumnSorter(it))
      .filter((it) => it);

    if (sorters.length >= 1) {
      const sorter = sorters.length === 1 ? sorters[0] : mergeSorters(sorters);
      rows.sort(sorter);
    }
    return this.lastSort;
  };
}
