import type { FromDuckDb } from './FromDuckDb';

export type FromDuckDbThis = Omit<
  FromDuckDb,
  'columns' | 'currentFilter' | 'dbManager' | 'rowsLoader' | 'cellStyles'
> & {
  columns: FromDuckDb['columns'];
  currentFilter: FromDuckDb['currentFilter'];
  dbManager: FromDuckDb['dbManager'];
  rowsLoader: FromDuckDb['rowsLoader'];
  cellStyles: FromDuckDb['cellStyles'];
  dataGroups: FromDuckDb['dataGroups'];
  connectionIds: FromDuckDb['connectionIds'];
};
