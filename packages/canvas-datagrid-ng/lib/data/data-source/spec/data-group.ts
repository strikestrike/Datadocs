import type { FilterFieldPathInfo } from '../filters/spec';

export type DataGroup = {
  columnId: string;
  ascending: boolean;
  /**
   * Values collapsed by the user.
   *
   * When collapsed, only a single row from that group is shown, however,
   * counting the total row count in the group is still performed.
   */
  collapsedValues: string[][];
  pathInfo?: FilterFieldPathInfo;
  caseSensitive?: boolean;
  disabled?: boolean;
};
