import type { DataSourceBase } from './spec';

// eslint-disable-next-line @typescript-eslint/no-empty-function
const returnUndefined = () => undefined;
const return0 = () => 0;
const returnFalse = () => false;
const returnTrue = () => true;
const returnNull = () => null;
const returnEmptyString = () => '';
const returnEmptyArray = () => [];

/**
 * Add fallback implementations for the data source instance.
 * So we can omit some optional API in a data source class to
 * make sure the code clear and reduce the helper/supporting code.
 */
export function addFallbackAPIsForDataSource(
  dataSource: DataSourceBase,
): Required<DataSourceBase> {
  addFallback('bind', returnUndefined);
  addFallback('unbind', returnUndefined);

  addFallback('preload', returnNull);

  addFallback('abort', returnFalse);

  addFallback('getCellStyle', returnNull);

  addFallback('setSchema', returnFalse);

  addFallback('getPrimaryKeys', returnEmptyArray);
  addFallback('setPrimaryKeys', returnFalse);

  addFallback('createRows', returnFalse);
  addFallback('deleteRows', returnFalse);

  addFallback('createColumns', returnFalse);
  addFallback('deleteColumns', returnFalse);

  addFallback('containsDataInRange', returnTrue);
  addFallback('clearRange', returnTrue);
  addFallback('expandRange', returnFalse);

  addFallback('editCells', returnFalse);

  addFallback('createTable', returnNull);
  addFallback('deleteTable', returnFalse);
  addFallback('getTable', returnNull);
  addFallback('getTableByIndex', returnNull);
  addFallback('getTablesInRange', returnEmptyArray);
  addFallback('isInTableRange', returnFalse);
  addFallback('unhideAllTableColumns', returnFalse);
  addFallback('clearCells', returnFalse);

  addFallback('setFilter', returnFalse);
  addFallback('sort', returnFalse);
  addFallback('getCurrentFilters', returnEmptyArray);
  addFallback('getCurrentSorters', returnEmptyArray);

  addFallback('move', returnFalse);

  addFallback('hideColumns', returnFalse);
  addFallback('unhideColumns', returnEmptyArray);
  addFallback('unhideAllColumns', returnFalse);

  addFallback('hideRows', returnFalse);
  addFallback('unhideRows', returnUndefined);
  addFallback('getHiddenColumns', returnUndefined);

  addFallback('getHiddenColumnCount', return0);
  addFallback('getHiddenRowCount', return0);

  addFallback('allowReorderColumns', returnFalse);
  addFallback('reorderField', returnFalse);
  addFallback('reorderColumns', returnFalse);
  addFallback('allowReorderRows', returnFalse);
  addFallback('reorderRows', returnFalse);
  return dataSource as any;

  function addFallback<Method extends keyof DataSourceBase>(
    method: Method,
    fn: DataSourceBase[Method],
  ) {
    if (typeof dataSource[method] === 'function') return;
    dataSource[method] = fn;
  }
}
