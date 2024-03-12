import type { SorterFn, SorterFnGenerator } from '../types';

export function mergeSorters(sorters: SorterFn[]): SorterFn {
  return (a, b) => {
    for (let i = 0; i < sorters.length; i++) {
      const sorter = sorters[i];
      const v = sorter(a, b);
      if (v === 0) continue;
      return v;
    }
    return 0;
  };
}

export const defaultSorterForString: SorterFnGenerator = (
  columnName,
  direction,
) => {
  const asc = direction === 'asc';
  return function (a, b) {
    const aValue = a[columnName] || '';
    const bValue = b[columnName] || '';
    if (asc) {
      if (!aValue.localeCompare) {
        return 1;
      }
      return aValue.localeCompare(bValue);
    }
    if (!bValue.localeCompare) {
      return 1;
    }
    return bValue.localeCompare(aValue);
  };
};

export const defaultSorterForNumber: SorterFnGenerator = (
  columnName,
  direction,
) => {
  const asc = direction === 'asc';
  return function (a, b) {
    if (asc) {
      return a[columnName] - b[columnName];
    }
    return b[columnName] - a[columnName];
  };
};

export const defaultSorterForDate: SorterFnGenerator = (
  columnName,
  direction,
) => {
  const asc = direction === 'asc';
  return function (a, b) {
    if (asc) {
      return (
        new Date(a[columnName]).getTime() - new Date(b[columnName]).getTime()
      );
    }
    return (
      new Date(b[columnName]).getTime() - new Date(a[columnName]).getTime()
    );
  };
};
