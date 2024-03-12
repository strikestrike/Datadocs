/**
 * @file Internal types for column manager
 */

import type { GridHeader } from '../../../types/column-header';

export type HiddenColumn = {
  /**
   * The `id` of the first visible column that is ahead of these hidden columns.
   * This field should be empty(null/undefined) when
   * these hidden columns in the front of the grid.
   */
  after?: string;

  columns: GridHeader[];

  /**
   * Are these columns hidden by a group hiding action
   */
  isGroup: boolean;
};
