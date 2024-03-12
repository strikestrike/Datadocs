import type { MetaForFetchedRow } from '../spec/meta';

export type InMemFetchedRow = {
  meta: MetaForFetchedRow;
  data: {
    [propName: string]: any;
  };
  style: {
    [propName: string]: any;
  };
};

export const defaultInMemRow: InMemFetchedRow = {
  meta: {},
  data: {},
  style: {},
};
