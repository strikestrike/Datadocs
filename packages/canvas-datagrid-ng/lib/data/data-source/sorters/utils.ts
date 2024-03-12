import type { ColumnType, GridSort, GridSortLabels } from '../../../types';
import { DataType } from '../../../types';
import { filterPathsMatch } from '../filters/utils';
import {
  GRID_SORT_LABELS_BOOLEAN,
  GRID_SORT_LABELS_DATE,
  GRID_SORT_LABELS_NUMBER,
  GRID_SORT_LABELS_TEXT,
} from './constants';

/**
 * Find the suitable sort labels for a given field.
 *
 * Examples:
 *  Date and related types:
 *    - Newest to Oldest
 *    - Oldest to Newest
 *  Number and related types:
 *    - Largest to smallest
 *    - Smallest to Largest
 * @param columnType To get the text for.
 * @returns Pair of texts for the field to be used as sorting options.
 */
export const getSortLabelsForColumnType = (
  columnType: ColumnType,
): GridSortLabels => {
  if (typeof columnType === 'object') {
    switch (columnType.typeId) {
      case DataType.Date:
      case DataType.DateTime:
      case DataType.Time:
        return GRID_SORT_LABELS_DATE;
      case DataType.Decimal:
      case DataType.Float:
        return GRID_SORT_LABELS_NUMBER;
    }
  }

  switch (columnType) {
    case 'boolean':
      return GRID_SORT_LABELS_BOOLEAN;
    case 'float':
    case 'number':
    case 'int':
      return GRID_SORT_LABELS_NUMBER;
    case 'string':
      return GRID_SORT_LABELS_TEXT;
  }
};

export const sortsMatch = (a: GridSort, b: GridSort) => {
  return (
    (!a && !b) ||
    (a?.type === 'formula' &&
      b?.type === 'formula' &&
      a.formula === b.formula) ||
    (a?.type === 'preset' &&
      b?.type === 'preset' &&
      a.caseSensitive === b.caseSensitive &&
      !!a.disabled === !!b.disabled &&
      a.columnId === b.columnId &&
      a.dir === b.dir &&
      a.on.type === b.on.type &&
      ((a.on.type === 'value' &&
        b.on.type === 'value' &&
        filterPathsMatch(a.on.pathInfo, b.on.pathInfo)) ||
        (a.on.type === 'color' &&
          b.on.type === 'color' &&
          a.on.colorType === b.on.colorType &&
          a.on.code === b.on.code) ||
        (a.on.type === 'icon' &&
          b.on.type === 'icon' &&
          a.on.change === b.on.change)))
  );
};

export const getPathInfoFromSort = (sort: GridSort | undefined) => {
  if (sort?.type !== 'preset' || sort?.on?.type !== 'value') return;
  return sort.on.pathInfo;
};
