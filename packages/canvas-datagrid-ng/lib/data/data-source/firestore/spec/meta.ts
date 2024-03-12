export type CellSyncType = 'NEW' | 'CHANGED' | 'CONFLICT';

export type MetaForFetchedRow = {
  sync?: {
    [propName: string]: CellSyncType;
  };
};
