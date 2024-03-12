import type {
  FilterFieldPathInfo,
  IntervalDescriptor,
  OrderDirection,
} from '../../../types';

export type SortByIdDescriptor = {
  id: string;
  dir: OrderDirection;
};
export type SortByIndexDescriptor = {
  viewIndex: number;
  dir: OrderDirection;
};
export type SortDescriptor = SortByIdDescriptor | SortByIndexDescriptor;

/**
 * Sort applied to value itself.
 */
export type GridSortTargetValue = {
  type: 'value';
  pathInfo?: FilterFieldPathInfo;
};

/**
 * Sort applied to background or text color.
 */
export type GridSortTargetColor = {
  type: 'color';
  colorType: 'text' | 'cell';
  code: string;
};

/**
 * Sort applied to icons.
 */
export type GridSortTargetIcon = {
  type: 'icon';
  change: 'up' | 'neutral' | 'down';
};

export type GridSortTypeFormula = {
  type: 'formula';
  formula: string;
  disabled?: boolean;
};

export type GridSortTypePreset = {
  type: 'preset';
  columnId: string;
  /**
   * Order direction.
   */
  dir: OrderDirection;
  /**
   * The type of data to sort on.
   */
  on: GridSortTarget;
  /**
   * Describes whether this filter applies to a row range. When not provided,
   * it is going to apply to whole column, which is usually the case with
   * tables.
   */
  rowRange?: IntervalDescriptor;
  caseSensitive?: boolean;
  disabled?: boolean;
};

export type GridSortTarget =
  | GridSortTargetValue
  | GridSortTargetColor
  | GridSortTargetIcon;

export type GridSort = GridSortTypeFormula | GridSortTypePreset;

/**
 * The text describing the sorting methods applicable to a {@link ColumnType}.
 */
export type GridSortLabels = [ascending: string, descending: string];
