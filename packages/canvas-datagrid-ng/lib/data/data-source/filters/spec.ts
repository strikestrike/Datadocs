import type { Point } from 'wkx';
import type {
  ConditionalFormattingIconSet,
  IntervalDescriptor,
} from '../../../types';
import type {
  GRID_FILTER_CONDITION_NAME_SET_OP_ANY,
  GRID_FILTER_CONDITION_NAME_SET_OP_ALL,
  GRID_FILTER_CONDITION_NAME_SET_OP_ONLY,
  GRID_FILTER_CONDITION_NAME_SET_OP_NONE,
  GRID_FILTER_GROUP_KEY_EQUALITY,
  GRID_FILTER_GROUP_KEY_SEARCH,
  GRID_FILTER_GROUP_KEY_MATCH,
  GRID_FILTER_GROUP_KEY_COMPARISON,
  GRID_FILTER_GROUP_KEY_NULLITY,
  GRID_FILTER_GROUP_KEY_PERCENTAGE,
  GRID_FILTER_GROUP_KEY_LOGICAL,
  GRID_FILTER_GROUP_KEY_SET,
  GRID_FILTER_GROUP_KEY_COLOR,
  GRID_FILTER_GROUP_KEY_FORMULA,
  GRID_FILTER_CONDITION_TYPE_STATIC,
  GRID_FILTER_CONDITION_TYPE_VARIABLE,
  GRID_FILTER_CONDITION_TYPE_FORMULA,
  GRID_FILTER_CONDITION_TYPE_VALUE,
  GRID_FILTER_CONDITION_TYPE_SET,
  GRID_FILTER_INPUT_TYPE_STRING,
  GRID_FILTER_INPUT_TYPE_NUMBER,
  GRID_FILTER_INPUT_TYPE_BOOLEAN,
  GRID_FILTER_INPUT_TYPE_DATE,
  GRID_FILTER_INPUT_TYPE_DATETIME,
  GRID_FILTER_INPUT_TYPE_INTERVAL,
  GRID_FILTER_INPUT_TYPE_TIME,
  GRID_FILTER_INPUT_TYPE_GEO,
  GRID_FILTER_CONDITION_NAME_IS_TRUE,
  GRID_FILTER_CONDITION_NAME_IS_FALSE,
  GRID_FILTER_CONDITION_NAME_IS_NULL,
  GRID_FILTER_CONDITION_NAME_IS_NOT_NULL,
  GRID_FILTER_CONDITION_NAME_IS_BLANK,
  GRID_FILTER_CONDITION_NAME_IS_NOT_BLANK,
  GRID_FILTER_CONDITION_NAME_TOP_10,
  GRID_FILTER_CONDITION_NAME_BOTTOM_10,
  GRID_FILTER_CONDITION_NAME_ABOVE_AVERAGE,
  GRID_FILTER_CONDITION_NAME_BELOW_AVERAGE,
  GRID_FILTER_CONDITION_NAME_EQUALS,
  GRID_FILTER_CONDITION_NAME_NOT_EQUALS,
  GRID_FILTER_CONDITION_NAME_CONTAINS,
  GRID_FILTER_CONDITION_NAME_NOT_CONTAINS,
  GRID_FILTER_CONDITION_NAME_STARTS_WITH,
  GRID_FILTER_CONDITION_NAME_ENDS_WITH,
  GRID_FILTER_CONDITION_NAME_GREATER_THAN,
  GRID_FILTER_CONDITION_NAME_GREATER_THAN_OR_EQUALS,
  GRID_FILTER_CONDITION_NAME_LESS_THAN,
  GRID_FILTER_CONDITION_NAME_LESS_THAN_OR_EQUALS,
  GRID_FILTER_CONDITION_NAME_DISTANCE_FROM,
  GRID_FILTER_CONDITION_NAME_BETWEEN,
  GRID_FILTER_CONDITION_NAME_TEXT_COLOR,
  GRID_FILTER_CONDITION_NAME_CELL_COLOR,
  GRID_FILTER_CONDITION_NAME_ARRAY_CONTAINS,
  GRID_FILTER_CONDITION_NAME_ARRAY_NOT_CONTAINS,
  GRID_FILTER_CONDITION_NAME_VALUE_INCLUSION,
  GRID_FILTER_CONDITION_NAME_VALUE_EXCLUSION,
  GRID_FILTER_CONDITION_NAME_CUSTOM_FORMULA,
} from './constants';

export type FilterByIdDescriptor = {
  id: string;
  op?: any;
  value: any;
};
export type FilterByIndexDescriptor = {
  viewIndex: number;
  op?: any;
  value: any;
};
export type FilterDescriptor = FilterByIdDescriptor | FilterByIndexDescriptor;

/**
 * @see GetFilterableValuesOptions.expandedGroups
 */
export type ExpandedFilterableGroups = {
  [key: string]: ExpandedFilterableGroups;
};

export type GeographyPoint = {
  /**
   * Longitude.
   */
  lng: number;
  /**
   * Latitude.
   */
  lat: number;
};

export type GeographyRectangle = {
  /**
   * South-west point of the rectangle.
   */
  sw: GeographyPoint;
  /**
   * North-east point of the rectangle.
   */
  ne: GeographyPoint;
};

export type CircularGeographyBoundary = {
  type: 'circular';
  /**
   * The center of the circle.
   */
  center: GeographyPoint;
  /**
   * Radius in meters.
   */
  distance: number;
};

export type RectangleGeographyBoundary = GeographyRectangle & {
  type: 'rectangle';
};

export type GeographyBoundary =
  | CircularGeographyBoundary
  | RectangleGeographyBoundary;

/**
 * Options that can be used to limit the result when querying values than can
 * be used to filter a field.
 */
export type GetFilterableValuesOptions = {
  /**
   * Keyword to search for.
   */
  search?: string;
  /**
   * Geometry boundary.
   */
  geographyBoundaries?: GeographyBoundary;
  /**
   * Limit the maximum amount of results to return.
   */
  limit?: number;
  /**
   * The value to start finding results after.  `null` or `undefined` means it
   * should start from the beginning.
   */
  after?: string;
  /**
   * Unnest the items of array.
   */
  unnest?: boolean;
  /**
   * The filter to use when determining whether values are filtered.
   */
  filter?: GridFilterRule;
  /**
   * When true, date and datetime types won't be unnested and (Select All)
   * option won't be added into the result.
   */
  valueHelper?: boolean;
  /**
   * Whether the results will show the same case values on string, variant, JSON
   * and struct types.
   */
  caseSensitive?: boolean;
  /**
   * Path to resolve with JSON and Struct fields.
   */
  pathInfo?: FilterFieldPathInfo;
};

export type FilterableIconData = {
  data?: {
    type: ConditionalFormattingIconSet;
    image: string;
  };
  count: number;
};

export type FilterableColors = {
  cellIcons: { name: string; usageCount: number }[];
  cellColors: { color: string; usageCount: number }[];
  textColors: { color: string; usageCount: number }[];
};

/**
 * @see FilterableValues
 */
export type FilterableValueDescriptor = {
  /**
   * The parent filter for this filter.
   */
  parent?: FilterableValueDescriptor;
  /**
   * Raw value returned from the source.
   */
  value: any;
  /**
   * Raw value returned as string from source.
   */
  valueAsString: string;
  /**
   * Value to use for filtering.
   */
  filterValue: GridFilterValue;
  /**
   * Human-readable name for this filterable value, e.g., February for '02'.
   */
  title: string;
  /**
   * Whether the value has been filtered out.
   */
  filtered: boolean;
  /**
   * Whether the value has been expanded and is showing its subvalues.
   */
  expanded: boolean;
  /**
   * Whether any of the sub-level values is in a different filtering state,
   * e.g., this value is being filtered but a subvalue is not.
   */
  indeterminate: boolean;
  /**
   * The subvalues for this value if the value is a parent of other values.
   */
  subvalues?: FilterableValueDescriptor[];

  /**
   * Whether this is the select/unselect all item.
   */
  isSelectAll?: boolean;
};

/**
 * Filterable values dictionary that can be deeply nested and where the <key> is
 * the filterable value, and its value is a {@link FilterableValueDescriptor}
 * that describes if the value is filtered out and if it has subvalues.
 *
 * For instance, date and datetime types display their year, month, and day
 * values in a nested style, and it is possible to filter out specific portion
 * of the given date, e.g., a month in a year, or a day in a month.
 *
 * This is returned from the data source and can be used for the values-list.
 * the field.
 * @see FilterableValueDescriptor
 */
export type FilterableValues = {
  /**
   * The filterable values.
   */
  data: FilterableValueDescriptor[];
  /**
   * Whether the results has been limited with the input
   * {@link GetFilterableValuesOptions.limit}.
   */
  limited: boolean;
};

export type GridFilterGroupKey =
  | typeof GRID_FILTER_GROUP_KEY_EQUALITY
  | typeof GRID_FILTER_GROUP_KEY_SEARCH
  | typeof GRID_FILTER_GROUP_KEY_MATCH
  | typeof GRID_FILTER_GROUP_KEY_COMPARISON
  | typeof GRID_FILTER_GROUP_KEY_NULLITY
  | typeof GRID_FILTER_GROUP_KEY_PERCENTAGE
  | typeof GRID_FILTER_GROUP_KEY_LOGICAL
  | typeof GRID_FILTER_GROUP_KEY_SET
  | typeof GRID_FILTER_GROUP_KEY_COLOR
  | typeof GRID_FILTER_GROUP_KEY_FORMULA;

export type GridFilterNameType = 'text' | 'number' | 'date' | 'geo' | 'array';

export type GridFilterConditionType =
  | typeof GRID_FILTER_CONDITION_TYPE_STATIC
  | typeof GRID_FILTER_CONDITION_TYPE_VARIABLE
  | typeof GRID_FILTER_CONDITION_TYPE_VALUE
  | typeof GRID_FILTER_CONDITION_TYPE_FORMULA;

/**
 * Static filters that doesn't need a variable to work.
 */
export type GridFilterConditionNameStatic =
  | typeof GRID_FILTER_CONDITION_NAME_IS_TRUE
  | typeof GRID_FILTER_CONDITION_NAME_IS_FALSE
  | typeof GRID_FILTER_CONDITION_NAME_IS_NULL
  | typeof GRID_FILTER_CONDITION_NAME_IS_NOT_NULL
  | typeof GRID_FILTER_CONDITION_NAME_IS_BLANK
  | typeof GRID_FILTER_CONDITION_NAME_IS_NOT_BLANK
  | typeof GRID_FILTER_CONDITION_NAME_TOP_10
  | typeof GRID_FILTER_CONDITION_NAME_BOTTOM_10
  | typeof GRID_FILTER_CONDITION_NAME_ABOVE_AVERAGE
  | typeof GRID_FILTER_CONDITION_NAME_BELOW_AVERAGE;

/**
 * Variable filter type
 */
export type GridFilterConditionNameVariable =
  | typeof GRID_FILTER_CONDITION_NAME_EQUALS
  | typeof GRID_FILTER_CONDITION_NAME_NOT_EQUALS
  | typeof GRID_FILTER_CONDITION_NAME_CONTAINS
  | typeof GRID_FILTER_CONDITION_NAME_NOT_CONTAINS
  | typeof GRID_FILTER_CONDITION_NAME_STARTS_WITH
  | typeof GRID_FILTER_CONDITION_NAME_ENDS_WITH
  | typeof GRID_FILTER_CONDITION_NAME_GREATER_THAN
  | typeof GRID_FILTER_CONDITION_NAME_GREATER_THAN_OR_EQUALS
  | typeof GRID_FILTER_CONDITION_NAME_LESS_THAN
  | typeof GRID_FILTER_CONDITION_NAME_LESS_THAN_OR_EQUALS
  | typeof GRID_FILTER_CONDITION_NAME_BETWEEN
  | typeof GRID_FILTER_CONDITION_NAME_DISTANCE_FROM
  | typeof GRID_FILTER_CONDITION_NAME_TEXT_COLOR
  | typeof GRID_FILTER_CONDITION_NAME_CELL_COLOR
  | typeof GRID_FILTER_CONDITION_NAME_ARRAY_CONTAINS
  | typeof GRID_FILTER_CONDITION_NAME_ARRAY_NOT_CONTAINS
  | typeof GRID_FILTER_CONDITION_NAME_SET_OP_ANY
  | typeof GRID_FILTER_CONDITION_NAME_SET_OP_ONLY
  | typeof GRID_FILTER_CONDITION_NAME_SET_OP_ALL
  | typeof GRID_FILTER_CONDITION_NAME_SET_OP_NONE;

export type GridFilterConditionNameValue =
  | typeof GRID_FILTER_CONDITION_NAME_VALUE_INCLUSION
  | typeof GRID_FILTER_CONDITION_NAME_VALUE_EXCLUSION;

export type GridFilterConditionNameFormula =
  typeof GRID_FILTER_CONDITION_NAME_CUSTOM_FORMULA;

export type GridFilterConditionName =
  | GridFilterConditionNameStatic
  | GridFilterConditionNameVariable
  | GridFilterConditionNameValue
  | GridFilterConditionNameFormula;

export type GridFilterConditionIdStatic = {
  conditionType: typeof GRID_FILTER_CONDITION_TYPE_STATIC;
  conditionName: GridFilterConditionNameStatic;
};

export type GridFilterConditionIdVariable = {
  conditionType: typeof GRID_FILTER_CONDITION_TYPE_VARIABLE;
  conditionName: GridFilterConditionNameVariable;
};

export type GridFilterConditionIdValue = {
  conditionType: typeof GRID_FILTER_CONDITION_TYPE_VALUE;
  conditionName: GridFilterConditionNameValue;
};

export type GridFilterConditionIdFormula = {
  conditionType: typeof GRID_FILTER_CONDITION_TYPE_FORMULA;
  conditionName: GridFilterConditionNameFormula;
};

export type GridFilterConditionId =
  | GridFilterConditionIdStatic
  | GridFilterConditionIdVariable
  | GridFilterConditionIdValue
  | GridFilterConditionIdFormula;

/**
 * Name describing the field for different field types.
 */
export type GridFilterName = {
  /**
   * The generic name of the filter.
   */
  generic: string;

  /**
   * The names of the filter specific to different filter types (defaults to
   * {@link GridFilterName.generic} when not available.)
   * @see GridFilterNameType
   */
  specific?: Readonly<Partial<Record<GridFilterNameType, string>>>;
};

export type GridFilterConditionTargetStatic = GridFilterConditionIdStatic & {
  columnId: string;
  pathInfo?: FilterFieldPathInfo;
};

export type GridFilterConditionTargetVariable =
  GridFilterConditionIdVariable & {
    columnId: string;
    values: GridFilterValue[];
    pathInfo?: FilterFieldPathInfo;
  };

export type GridFilterConditionTargetValue = GridFilterConditionIdValue & {
  columnId: string;
  values: GridFilterValue[];
  pathInfo?: FilterFieldPathInfo;
};

export type GridFilterConditionTargetFormula = GridFilterConditionIdFormula & {
  columnId?: string;
  formula: string;
};

export type GridFilterConditionTarget =
  | GridFilterConditionTargetStatic
  | GridFilterConditionTargetVariable
  | GridFilterConditionTargetValue
  | GridFilterConditionTargetFormula;

/**
 * The condition that is applied to a filter target.
 */
export type GridFilterCondition = {
  type: 'condition';
  target: GridFilterConditionTarget;
  /**
   * The type operation to apply to array type.
   */
  setOp?: GridFilterConditionNameSet;
  /**
   * When true, the condition will not be evaluated when filtering.
   */
  disabled?: boolean;
  caseSensitive?: boolean;

  /**
   * Metadata that is only used when setting the filter with the UI.
   */
  meta?: {
    /**
     * The filter is managed by values-well.
     */
    sourceValuesWell?: boolean;
  };
};

/**
 * Describes a group of rules tied together with a logical opearator.
 */
export type GridFilterGroup = {
  type: 'group';
  /**
   * The way to connect multiple conditions;
   */
  conjunction: GridFilterConjunction;
  /**
   * Conditions applied with this filter group.
   */
  rules: GridFilterRule[];
  /**
   * When true, the group will not be evaluated when filtering.
   */
  disabled?: boolean;
};

/**
 * The logical operators to use to connect filter groups and/or conditions.
 */
export type GridFilterConjunction = 'and' | 'or';

/**
 * A filter rule is a filter descriptor that can contain subrules and or
 * conditions.
 */
export type GridFilterRule = GridFilterCondition | GridFilterGroup;

/**
 * A filter applicable to a data source.
 */
export type GridFilterTarget = {
  /**
   * Describes whether this filter applies to a row range. When not provided,
   * it is going to apply to whole column, which is usually the case with
   * tables.
   */
  rowRange?: IntervalDescriptor;
  /**
   * Conditions applied with this filter target.
   */
  filter: GridFilterGroup;
};

type FilterBase = {
  /**
   * Human readable name of the filter.
   *
   * For instance, the name for {@link GridFilterTypeGreaterThan} is going to
   * be 'Greater than' for numbers, whereas it is going to be 'After date' for
   * dates.
   */
  name: GridFilterName;

  /**
   * The group that describes the filter.
   */
  groupKey: GridFilterGroupKey;
};

/**
 * A filter that can have a dynamic value.
 *
 * For instance, number can have any number as value for the 'greater than'
 * filter.
 */
export type GridFilterTypeVariable = {
  /**
   * Number of variables that should be provided with this filter type.
   */
  variableCount: number;
} & (FilterBase & GridFilterConditionIdVariable);

/**
 * A filter that has a static value.
 *
 * For instance, boolean will have either 'True' or 'False' as the possible
 * filter.
 */
export type GridFilterTypeStatic = FilterBase & GridFilterConditionIdStatic;

/**
 * The filter applied through values-list.
 */
export type GridFilterTypeValue = FilterBase & GridFilterConditionIdValue;

/**
 * The filter uses a custom formula as filter.
 */
export type GridFilterTypeFormula = FilterBase & GridFilterConditionIdFormula;

export type GridFilterTypeSet = FilterBase & {
  conditionType: typeof GRID_FILTER_CONDITION_TYPE_SET;
  /**
   * The set operation to apply.
   */
  conditionName: GridFilterConditionNameSet;
};

/**
 * How a value-list is going to be applied to an array type column.
 */
export type GridFilterConditionNameSet =
  | typeof GRID_FILTER_CONDITION_NAME_SET_OP_ANY
  | typeof GRID_FILTER_CONDITION_NAME_SET_OP_ONLY
  | typeof GRID_FILTER_CONDITION_NAME_SET_OP_ALL
  | typeof GRID_FILTER_CONDITION_NAME_SET_OP_NONE;

export type GridFilterInputType =
  | typeof GRID_FILTER_INPUT_TYPE_STRING
  | typeof GRID_FILTER_INPUT_TYPE_NUMBER
  | typeof GRID_FILTER_INPUT_TYPE_BOOLEAN
  | typeof GRID_FILTER_INPUT_TYPE_DATE
  | typeof GRID_FILTER_INPUT_TYPE_DATETIME
  | typeof GRID_FILTER_INPUT_TYPE_INTERVAL
  | typeof GRID_FILTER_INPUT_TYPE_TIME
  | typeof GRID_FILTER_INPUT_TYPE_GEO;

export type GridGeoUnitBase = {
  title: string;
  shortTitle: string;
  meters: number;
};

export type GridGeoUnitMetric = GridGeoUnitBase & {
  name: 'centimeter' | 'meter' | 'kilometer';
};

export type GridGeoUnitImperial = GridGeoUnitBase & {
  name: 'inch' | 'foot' | 'yard' | 'mile';
};

export type GridGeoUnit = GridGeoUnitImperial | GridGeoUnitMetric;

export type GridFilterNullValue = {
  valueType: 'null';
};

export type GridFilterStringValue = {
  valueType: 'string';
  value: string;
};

export type GridFilterRawValue = {
  valueType: 'raw';
  value: any;
};

export type GridFilterDateValueCoverage =
  | 'whole'
  | 'year'
  | 'month'
  | 'day'
  | 'hour'
  | 'minute'
  | 'second';

export type GridFilterDateValue = {
  valueType: 'date';
  coverage: GridFilterDateValueCoverage;
  value: Date;
};

export type GridFilterBooleanValue = {
  valueType: 'boolean';
  value: boolean;
};

export type GridFilterNumberValue = {
  valueType: 'number';
  value: number;
};

export type GridFilterBigIntValue = {
  valueType: 'bigint';
  value: bigint;
};

export type GridFilterGeoPointValue = {
  valueType: 'geopoint';
  value: GeographyPoint;
};

export type GridFilterValue =
  | GridFilterNullValue
  | GridFilterStringValue
  | GridFilterDateValue
  | GridFilterBooleanValue
  | GridFilterNumberValue
  | GridFilterBigIntValue
  | GridFilterGeoPointValue
  | GridFilterRawValue;

/**
 * A filter that is applicable to supported fields.
 */
export type GridFilter =
  | GridFilterTypeVariable
  | GridFilterTypeStatic
  | GridFilterTypeValue
  | GridFilterTypeFormula;

export type GridFilterListItem = GridFilter | GridFilterTypeSet;

export type GridFilterList = readonly Readonly<GridFilterListItem>[];

/**
 * The possible paths that can be used with JSON type fields after sampling.
 */
export type GridJsonTypeMap = {
  [key: string]: GridJsonTypeMap | undefined;
};

export type FilterFieldPathInfo = {
  /**
   * The path for struct/JSON fields.
   */
  path: string;
  /**
   * The type to cast JSON paths.
   */
  pathType?: GridStructPathType;
};

/**
 * The type to cast the path items when filtering and sorting.
 */
export type GridStructPathType = 'string' | 'number' | 'raw';

export type GetFilterDateValueAsStringOptions = {
  locale: Intl.LocalesArgument;
  coverageOnly: boolean;
};

export type GetFilterValueAsStringOptions = {
  date: Partial<GetFilterDateValueAsStringOptions>;
};

/**
 * Saved simple filter.
 */
export type GridSavedSimpleFilter = {
  type: 'simple';
  targets: Record<string, GridFilterTarget>;
};

/**
 * Saved advanced filter.
 */
export type GridSavedAdvancedFilter = {
  type: 'advanced';
  /**
   * The advanced filter target.
   */
  target: GridFilterTarget;
  /**
   * The simplified version of this filter if possible or undefined.
   */
  simplified: GridSavedSimpleFilter | undefined;
};

/**
 * Describes the saved filter to the data source.
 */
export type GridSavedFilter = GridSavedSimpleFilter | GridSavedAdvancedFilter;
