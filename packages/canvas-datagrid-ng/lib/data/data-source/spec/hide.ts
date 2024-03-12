import type { GridHeader } from '../../../types/column-header';

export type HiddenColumnsInfo = {
  before?: GridHeader[];
  after?: GridHeader[];
  beforeGroup: boolean;
  afterGroup: boolean;
};
