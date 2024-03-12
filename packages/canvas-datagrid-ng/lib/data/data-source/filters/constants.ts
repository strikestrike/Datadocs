import type {
  GridFilter,
  GridFilterList,
  GridGeoUnitImperial,
  GridGeoUnitMetric,
  GridFilterTypeSet,
  GridFilterTypeValue,
} from './spec';

export const GRID_FILTER_CONDITION_TYPE_STATIC = 'static';
export const GRID_FILTER_CONDITION_TYPE_VARIABLE = 'variable';
export const GRID_FILTER_CONDITION_TYPE_VALUE = 'value';
export const GRID_FILTER_CONDITION_TYPE_FORMULA = 'formula';
export const GRID_FILTER_CONDITION_TYPE_SET = 'set';

/** begin variable filters */
export const GRID_FILTER_CONDITION_NAME_EQUALS = 'equals';
export const GRID_FILTER_CONDITION_NAME_NOT_EQUALS = 'notEquals';
export const GRID_FILTER_CONDITION_NAME_CONTAINS = 'contains';
export const GRID_FILTER_CONDITION_NAME_NOT_CONTAINS = 'notContains';
export const GRID_FILTER_CONDITION_NAME_STARTS_WITH = 'startsWith';
export const GRID_FILTER_CONDITION_NAME_ENDS_WITH = 'endsWith';
export const GRID_FILTER_CONDITION_NAME_GREATER_THAN = 'greaterThan';
export const GRID_FILTER_CONDITION_NAME_GREATER_THAN_OR_EQUALS =
  'greaterThanOrEquals';
export const GRID_FILTER_CONDITION_NAME_LESS_THAN = 'lessThan';
export const GRID_FILTER_CONDITION_NAME_LESS_THAN_OR_EQUALS =
  'lessThanOrEquals';
export const GRID_FILTER_CONDITION_NAME_BETWEEN = 'between';
export const GRID_FILTER_CONDITION_NAME_DISTANCE_FROM = 'distanceFrom';

export const GRID_FILTER_CONDITION_NAME_TEXT_COLOR = 'textColor';
export const GRID_FILTER_CONDITION_NAME_CELL_COLOR = 'cellColor';

export const GRID_FILTER_CONDITION_NAME_ARRAY_CONTAINS = 'arrayContains';
export const GRID_FILTER_CONDITION_NAME_ARRAY_NOT_CONTAINS = 'arrayNotContains';
/** end variable filters */

/** begin static filters */
export const GRID_FILTER_CONDITION_NAME_IS_TRUE = 'isTrue';
export const GRID_FILTER_CONDITION_NAME_IS_FALSE = 'isFalse';

export const GRID_FILTER_CONDITION_NAME_IS_NULL = 'isNull';
export const GRID_FILTER_CONDITION_NAME_IS_NOT_NULL = 'isNotNull';
export const GRID_FILTER_CONDITION_NAME_IS_BLANK = 'isBlank';
export const GRID_FILTER_CONDITION_NAME_IS_NOT_BLANK = 'isNotBlank';

export const GRID_FILTER_CONDITION_NAME_TOP_10 = 'top10';
export const GRID_FILTER_CONDITION_NAME_BOTTOM_10 = 'bottom10';
export const GRID_FILTER_CONDITION_NAME_ABOVE_AVERAGE = 'aboveAverage';
export const GRID_FILTER_CONDITION_NAME_BELOW_AVERAGE = 'belowAverage';
/** end static filters */

/** begin value filters */
export const GRID_FILTER_CONDITION_NAME_VALUE_INCLUSION = 'inclusion';
export const GRID_FILTER_CONDITION_NAME_VALUE_EXCLUSION = 'exclusion';
/** end value filters */

/** begin formula filters */
export const GRID_FILTER_CONDITION_NAME_CUSTOM_FORMULA = 'customFormula';

// Array should contain at least one value from the set.
export const GRID_FILTER_CONDITION_NAME_SET_OP_ANY = 'arrayContainsAny';
// Array should contain the same values from the set (i.e., they are equals.)
export const GRID_FILTER_CONDITION_NAME_SET_OP_ONLY = 'arrayContainsOnly';
// Array should contain all the values from the set while possibly containing
// values that the set does not contain.
export const GRID_FILTER_CONDITION_NAME_SET_OP_ALL = 'arrayContainsAll';
// Array should contain no values from the set.
export const GRID_FILTER_CONDITION_NAME_SET_OP_NONE = 'arrayContainsNone';

export const GRID_FILTER_GROUP_KEY_EQUALITY = 'Equality';
export const GRID_FILTER_GROUP_KEY_SEARCH = 'Search';
export const GRID_FILTER_GROUP_KEY_MATCH = 'Match';
export const GRID_FILTER_GROUP_KEY_COMPARISON = 'Comparison';
export const GRID_FILTER_GROUP_KEY_NULLITY = 'Nullity';
export const GRID_FILTER_GROUP_KEY_PERCENTAGE = 'Percentage';
export const GRID_FILTER_GROUP_KEY_LOGICAL = 'Logical';
export const GRID_FILTER_GROUP_KEY_SET = 'Set';
export const GRID_FILTER_GROUP_KEY_COLOR = 'Color';
export const GRID_FILTER_GROUP_KEY_FORMULA = 'Formula';

export const GRID_FILTER_INPUT_TYPE_STRING = 'string';
export const GRID_FILTER_INPUT_TYPE_NUMBER = 'number';
export const GRID_FILTER_INPUT_TYPE_BOOLEAN = 'boolean';
export const GRID_FILTER_INPUT_TYPE_DATE = 'date';
export const GRID_FILTER_INPUT_TYPE_DATETIME = 'datetime';
export const GRID_FILTER_INPUT_TYPE_INTERVAL = 'interval';
export const GRID_FILTER_INPUT_TYPE_TIME = 'time';
export const GRID_FILTER_INPUT_TYPE_GEO = 'geo';

export const GRID_FILTER_DEFAULT_EQUALS: GridFilter = <const>{
  conditionType: GRID_FILTER_CONDITION_TYPE_VARIABLE,
  conditionName: GRID_FILTER_CONDITION_NAME_EQUALS,
  name: {
    generic: 'Equals',
    specific: {
      text: 'Is',
      date: 'Is',
      geo: 'Is',
      array: 'Array equals',
    },
  },
  variableCount: 1,
  groupKey: GRID_FILTER_GROUP_KEY_EQUALITY,
};

export const GRID_FILTER_SIMPLE_RULE_LIMIT = 2;

export const GRID_FILTER_DEFAULT_NOT_EQUALS: GridFilter = <const>{
  conditionType: GRID_FILTER_CONDITION_TYPE_VARIABLE,
  conditionName: GRID_FILTER_CONDITION_NAME_NOT_EQUALS,
  name: {
    generic: 'Not equals',
    specific: {
      text: 'Is not',
      date: 'Is not',
      geo: 'Is not',
      array: 'Array does not equal',
    },
  },
  variableCount: 1,
  groupKey: GRID_FILTER_GROUP_KEY_EQUALITY,
};

export const GRID_FILTER_DEFAULT_CONTAINS: GridFilter = <const>{
  conditionType: GRID_FILTER_CONDITION_TYPE_VARIABLE,
  conditionName: GRID_FILTER_CONDITION_NAME_CONTAINS,
  name: {
    generic: 'Contains',
  },
  variableCount: 1,
  groupKey: GRID_FILTER_GROUP_KEY_SEARCH,
};

export const GRID_FILTER_DEFAULT_NOT_CONTAINS: GridFilter = <const>{
  conditionType: GRID_FILTER_CONDITION_TYPE_VARIABLE,
  conditionName: GRID_FILTER_CONDITION_NAME_NOT_CONTAINS,
  name: {
    generic: 'Does not contain',
  },
  variableCount: 1,
  groupKey: GRID_FILTER_GROUP_KEY_SEARCH,
};

export const GRID_FILTER_DEFAULT_STARTS_WITH: GridFilter = <const>{
  conditionType: GRID_FILTER_CONDITION_TYPE_VARIABLE,
  conditionName: GRID_FILTER_CONDITION_NAME_STARTS_WITH,
  name: {
    generic: 'Starts with',
  },
  variableCount: 1,
  groupKey: GRID_FILTER_GROUP_KEY_MATCH,
};

export const GRID_FILTER_DEFAULT_ENDS_WITH: GridFilter = <const>{
  conditionType: GRID_FILTER_CONDITION_TYPE_VARIABLE,
  conditionName: GRID_FILTER_CONDITION_NAME_ENDS_WITH,
  name: {
    generic: 'Ends with',
  },
  variableCount: 1,
  groupKey: GRID_FILTER_GROUP_KEY_MATCH,
};

export const GRID_FILTER_DEFAULT_GREATER_THAN: GridFilter = <const>{
  conditionType: GRID_FILTER_CONDITION_TYPE_VARIABLE,
  conditionName: GRID_FILTER_CONDITION_NAME_GREATER_THAN,
  name: {
    generic: 'Greater than',
    specific: {
      date: 'Is after',
    },
  },
  variableCount: 1,
  groupKey: GRID_FILTER_GROUP_KEY_COMPARISON,
};

export const GRID_FILTER_DEFAULT_GREATER_THAN_OR_EQUALS: GridFilter = <const>{
  conditionType: GRID_FILTER_CONDITION_TYPE_VARIABLE,
  conditionName: GRID_FILTER_CONDITION_NAME_GREATER_THAN_OR_EQUALS,
  name: {
    generic: 'Greater than or equal to',
    specific: {
      date: 'On or is after',
    },
  },
  variableCount: 1,
  groupKey: GRID_FILTER_GROUP_KEY_COMPARISON,
};

export const GRID_FILTER_DEFAULT_LESS_THAN: GridFilter = <const>{
  conditionType: GRID_FILTER_CONDITION_TYPE_VARIABLE,
  conditionName: GRID_FILTER_CONDITION_NAME_LESS_THAN,
  name: {
    generic: 'Less than',
    specific: {
      date: 'Is before',
    },
  },
  variableCount: 1,
  groupKey: GRID_FILTER_GROUP_KEY_COMPARISON,
};

export const GRID_FILTER_DEFAULT_LESS_THAN_OR_EQUALS: GridFilter = <const>{
  conditionType: GRID_FILTER_CONDITION_TYPE_VARIABLE,
  conditionName: GRID_FILTER_CONDITION_NAME_LESS_THAN_OR_EQUALS,
  name: {
    generic: 'Less than or equal to',
    specific: {
      date: 'On or is before',
    },
  },
  variableCount: 1,
  groupKey: GRID_FILTER_GROUP_KEY_COMPARISON,
};

export const GRID_FILTER_DEFAULT_BETWEEN: GridFilter = <const>{
  conditionType: GRID_FILTER_CONDITION_TYPE_VARIABLE,
  conditionName: GRID_FILTER_CONDITION_NAME_BETWEEN,
  name: {
    generic: 'Between',
    specific: {
      date: 'Is within',
      geo: 'Within bounding box',
    },
  },
  variableCount: 2,
  groupKey: GRID_FILTER_GROUP_KEY_COMPARISON,
};

export const GRID_FILTER_DEFAULT_DISTANCE_FROM: GridFilter = <const>{
  conditionType: GRID_FILTER_CONDITION_TYPE_VARIABLE,
  conditionName: GRID_FILTER_CONDITION_NAME_DISTANCE_FROM,
  name: {
    generic: 'Distance from',
    specific: {
      geo: 'Within X unit',
    },
  },
  variableCount: 2,
  groupKey: GRID_FILTER_GROUP_KEY_COMPARISON,
};

export const GRID_FILTER_DEFAULT_TEXT_COLOR: GridFilter = <const>{
  conditionType: GRID_FILTER_CONDITION_TYPE_VARIABLE,
  conditionName: GRID_FILTER_CONDITION_NAME_TEXT_COLOR,
  name: {
    generic: 'Text color',
  },
  variableCount: 1,
  groupKey: GRID_FILTER_GROUP_KEY_COLOR,
};

export const GRID_FILTER_DEFAULT_CELL_COLOR: GridFilter = <const>{
  conditionType: GRID_FILTER_CONDITION_TYPE_VARIABLE,
  conditionName: GRID_FILTER_CONDITION_NAME_CELL_COLOR,
  name: {
    generic: 'Cell color',
  },
  variableCount: 1,
  groupKey: GRID_FILTER_GROUP_KEY_COLOR,
};

export const GRID_FILTER_DEFAULT_IS_NULL: GridFilter = <const>{
  conditionType: GRID_FILTER_CONDITION_TYPE_STATIC,
  conditionName: GRID_FILTER_CONDITION_NAME_IS_NULL,
  name: {
    generic: 'Is Null',
  },
  groupKey: GRID_FILTER_GROUP_KEY_NULLITY,
};

export const GRID_FILTER_DEFAULT_IS_NOT_NULL: GridFilter = <const>{
  conditionType: GRID_FILTER_CONDITION_TYPE_STATIC,
  conditionName: GRID_FILTER_CONDITION_NAME_IS_NOT_NULL,
  name: {
    generic: 'Is Not Null',
  },
  groupKey: GRID_FILTER_GROUP_KEY_NULLITY,
};

export const GRID_FILTER_DEFAULT_IS_BLANK: GridFilter = <const>{
  conditionType: GRID_FILTER_CONDITION_TYPE_STATIC,
  conditionName: GRID_FILTER_CONDITION_NAME_IS_BLANK,
  name: {
    generic: 'Is Blank',
  },
  groupKey: GRID_FILTER_GROUP_KEY_NULLITY,
};

export const GRID_FILTER_DEFAULT_IS_NOT_BLANK: GridFilter = <const>{
  conditionType: GRID_FILTER_CONDITION_TYPE_STATIC,
  conditionName: GRID_FILTER_CONDITION_NAME_IS_NOT_BLANK,
  name: {
    generic: 'Is Not Blank',
  },
  groupKey: GRID_FILTER_GROUP_KEY_NULLITY,
};

export const GRID_FILTER_DEFAULT_TOP_10: GridFilter = <const>{
  conditionType: GRID_FILTER_CONDITION_TYPE_STATIC,
  conditionName: GRID_FILTER_CONDITION_NAME_TOP_10,
  name: {
    generic: 'Top 10',
  },
  groupKey: GRID_FILTER_GROUP_KEY_PERCENTAGE,
};

export const GRID_FILTER_DEFAULT_BOTTOM_10: GridFilter = <const>{
  conditionType: GRID_FILTER_CONDITION_TYPE_STATIC,
  conditionName: GRID_FILTER_CONDITION_NAME_BOTTOM_10,
  name: {
    generic: 'Bottom 10',
  },
  groupKey: GRID_FILTER_GROUP_KEY_PERCENTAGE,
};

export const GRID_FILTER_DEFAULT_ABOVE_AVERAGE: GridFilter = <const>{
  conditionType: GRID_FILTER_CONDITION_TYPE_STATIC,
  conditionName: GRID_FILTER_CONDITION_NAME_ABOVE_AVERAGE,
  name: {
    generic: 'Above average',
  },
  groupKey: GRID_FILTER_GROUP_KEY_PERCENTAGE,
};

export const GRID_FILTER_DEFAULT_BELOW_AVERAGE: GridFilter = <const>{
  conditionType: GRID_FILTER_CONDITION_TYPE_STATIC,
  conditionName: GRID_FILTER_CONDITION_NAME_BELOW_AVERAGE,
  name: {
    generic: 'Below average',
  },
  groupKey: GRID_FILTER_GROUP_KEY_PERCENTAGE,
};

export const GRID_FILTER_DEFAULT_IS_TRUE: GridFilter = <const>{
  conditionType: GRID_FILTER_CONDITION_TYPE_STATIC,
  conditionName: GRID_FILTER_CONDITION_NAME_IS_TRUE,
  name: {
    generic: 'Is True',
  },
  groupKey: GRID_FILTER_GROUP_KEY_LOGICAL,
};

export const GRID_FILTER_DEFAULT_IS_FALSE: GridFilter = <const>{
  conditionType: GRID_FILTER_CONDITION_TYPE_STATIC,
  conditionName: GRID_FILTER_CONDITION_NAME_IS_FALSE,
  name: {
    generic: 'Is False',
  },
  groupKey: GRID_FILTER_GROUP_KEY_LOGICAL,
};

export const GRID_FILTER_DEFAULT_VALUES_INCLUSION: GridFilterTypeValue = {
  conditionType: GRID_FILTER_CONDITION_TYPE_VALUE,
  name: {
    generic: 'In values',
    specific: {
      array: 'Array in values',
    },
  },
  conditionName: GRID_FILTER_CONDITION_NAME_VALUE_INCLUSION,
  groupKey: GRID_FILTER_GROUP_KEY_EQUALITY,
};

export const GRID_FILTER_DEFAULT_VALUES_EXCLUSION: GridFilterTypeValue = {
  conditionType: GRID_FILTER_CONDITION_TYPE_VALUE,
  name: {
    generic: 'Not in values',
    specific: {
      array: 'Array not in values',
    },
  },
  conditionName: GRID_FILTER_CONDITION_NAME_VALUE_EXCLUSION,
  groupKey: GRID_FILTER_GROUP_KEY_EQUALITY,
};

export const GRID_FILTER_DEFAULT_ARRAY_CONTAINS: GridFilter = <const>{
  conditionType: GRID_FILTER_CONDITION_TYPE_VARIABLE,
  conditionName: GRID_FILTER_CONDITION_NAME_ARRAY_CONTAINS,
  name: {
    generic: 'Array contains',
  },
  variableCount: 1,
  groupKey: GRID_FILTER_GROUP_KEY_SEARCH,
};

export const GRID_FILTER_DEFAULT_ARRAY_NOT_CONTAINS: GridFilter = <const>{
  conditionType: GRID_FILTER_CONDITION_TYPE_VARIABLE,
  conditionName: GRID_FILTER_CONDITION_NAME_ARRAY_NOT_CONTAINS,
  name: {
    generic: 'Array does not contain',
  },
  variableCount: 1,
  groupKey: GRID_FILTER_GROUP_KEY_SEARCH,
};

export const GRID_FILTER_DEFAULT_CUSTOM_FORMULA: GridFilter = <const>{
  conditionType: GRID_FILTER_CONDITION_TYPE_FORMULA,
  conditionName: GRID_FILTER_CONDITION_NAME_CUSTOM_FORMULA,
  name: {
    generic: 'Custom formula is',
  },
  groupKey: GRID_FILTER_GROUP_KEY_FORMULA,
};

export const GRID_FILTER_DEFAULT_SET_OP_ANY: GridFilterTypeSet = <const>{
  conditionType: GRID_FILTER_CONDITION_TYPE_SET,
  conditionName: GRID_FILTER_CONDITION_NAME_SET_OP_ANY,
  name: {
    generic: 'Any elements',
  },
  groupKey: GRID_FILTER_GROUP_KEY_SET,
};

export const GRID_FILTER_DEFAULT_SET_OP_ONLY: GridFilterTypeSet = <const>{
  conditionType: GRID_FILTER_CONDITION_TYPE_SET,
  conditionName: GRID_FILTER_CONDITION_NAME_SET_OP_ONLY,
  name: {
    generic: 'Elements are exactly',
  },
  groupKey: GRID_FILTER_GROUP_KEY_SET,
};

export const GRID_FILTER_DEFAULT_SET_OP_ALL: GridFilterTypeSet = <const>{
  conditionType: GRID_FILTER_CONDITION_TYPE_SET,
  conditionName: GRID_FILTER_CONDITION_NAME_SET_OP_ALL,
  name: {
    generic: 'All elements',
  },
  groupKey: GRID_FILTER_GROUP_KEY_SET,
};

export const GRID_FILTER_DEFAULT_SET_OP_NONE: GridFilterTypeSet = <const>{
  conditionType: GRID_FILTER_CONDITION_TYPE_SET,
  conditionName: GRID_FILTER_CONDITION_NAME_SET_OP_NONE,
  name: {
    generic: 'No elements',
  },
  groupKey: GRID_FILTER_GROUP_KEY_SET,
};

export const GRID_FILTERS_ARRAY: GridFilterList = [
  GRID_FILTER_DEFAULT_EQUALS,
  GRID_FILTER_DEFAULT_NOT_EQUALS,

  // Accepts a set matching the type of array.
  GRID_FILTER_DEFAULT_SET_OP_ANY,
  GRID_FILTER_DEFAULT_SET_OP_ALL,
  GRID_FILTER_DEFAULT_SET_OP_NONE,
  GRID_FILTER_DEFAULT_SET_OP_ONLY,

  GRID_FILTER_DEFAULT_IS_BLANK,
  GRID_FILTER_DEFAULT_IS_NOT_BLANK,
];

export const GRID_FILTERS_BOOLEAN: GridFilterList = [
  GRID_FILTER_DEFAULT_IS_TRUE,
  GRID_FILTER_DEFAULT_IS_FALSE,

  // For testing only. Remove later.
  GRID_FILTER_DEFAULT_EQUALS,
  GRID_FILTER_DEFAULT_NOT_EQUALS,
  GRID_FILTER_DEFAULT_VALUES_INCLUSION,
  GRID_FILTER_DEFAULT_VALUES_EXCLUSION,

  GRID_FILTER_DEFAULT_IS_NULL,
  GRID_FILTER_DEFAULT_IS_NOT_NULL,
  GRID_FILTER_DEFAULT_IS_BLANK,
  GRID_FILTER_DEFAULT_IS_NOT_BLANK,
];

export const GRID_FILTERS_NUMBER: GridFilterList = [
  GRID_FILTER_DEFAULT_EQUALS,
  GRID_FILTER_DEFAULT_NOT_EQUALS,
  GRID_FILTER_DEFAULT_GREATER_THAN,
  GRID_FILTER_DEFAULT_GREATER_THAN_OR_EQUALS,
  GRID_FILTER_DEFAULT_LESS_THAN,
  GRID_FILTER_DEFAULT_LESS_THAN_OR_EQUALS,
  GRID_FILTER_DEFAULT_BETWEEN,
  GRID_FILTER_DEFAULT_TOP_10,
  GRID_FILTER_DEFAULT_BOTTOM_10,
  GRID_FILTER_DEFAULT_ABOVE_AVERAGE,
  GRID_FILTER_DEFAULT_BELOW_AVERAGE,
  GRID_FILTER_DEFAULT_IS_NULL,
  GRID_FILTER_DEFAULT_IS_NOT_NULL,
  GRID_FILTER_DEFAULT_IS_BLANK,
  GRID_FILTER_DEFAULT_IS_NOT_BLANK,
];

export const GRID_FILTERS_STRING: GridFilterList = [
  GRID_FILTER_DEFAULT_EQUALS,
  GRID_FILTER_DEFAULT_NOT_EQUALS,

  GRID_FILTER_DEFAULT_STARTS_WITH,
  GRID_FILTER_DEFAULT_ENDS_WITH,

  GRID_FILTER_DEFAULT_CONTAINS,
  GRID_FILTER_DEFAULT_NOT_CONTAINS,

  GRID_FILTER_DEFAULT_VALUES_INCLUSION,
  GRID_FILTER_DEFAULT_VALUES_EXCLUSION,

  GRID_FILTER_DEFAULT_IS_NULL,
  GRID_FILTER_DEFAULT_IS_NOT_NULL,
  GRID_FILTER_DEFAULT_IS_BLANK,
  GRID_FILTER_DEFAULT_IS_NOT_BLANK,
];

export const GRID_FILTERS_DATE: GridFilterList = [
  GRID_FILTER_DEFAULT_EQUALS,
  GRID_FILTER_DEFAULT_NOT_EQUALS,
  GRID_FILTER_DEFAULT_GREATER_THAN,
  GRID_FILTER_DEFAULT_GREATER_THAN_OR_EQUALS,
  GRID_FILTER_DEFAULT_LESS_THAN,
  GRID_FILTER_DEFAULT_LESS_THAN_OR_EQUALS,
  GRID_FILTER_DEFAULT_BETWEEN,
  GRID_FILTER_DEFAULT_IS_NULL,
  GRID_FILTER_DEFAULT_IS_NOT_NULL,
  GRID_FILTER_DEFAULT_IS_BLANK,
  GRID_FILTER_DEFAULT_IS_NOT_BLANK,
];

export const GRID_FILTERS_JSON_RAW: GridFilterList = [
  GRID_FILTER_DEFAULT_EQUALS,
  GRID_FILTER_DEFAULT_NOT_EQUALS,
  GRID_FILTER_DEFAULT_ARRAY_CONTAINS,
  GRID_FILTER_DEFAULT_ARRAY_NOT_CONTAINS,
  GRID_FILTER_DEFAULT_IS_TRUE,
  GRID_FILTER_DEFAULT_IS_FALSE,
  GRID_FILTER_DEFAULT_IS_NULL,
  GRID_FILTER_DEFAULT_IS_NOT_NULL,
  GRID_FILTER_DEFAULT_IS_BLANK,
  GRID_FILTER_DEFAULT_IS_NOT_BLANK,
];

export const GRID_FILTERS_GEOGRAPHY: GridFilterList = [
  GRID_FILTER_DEFAULT_BETWEEN,
  GRID_FILTER_DEFAULT_DISTANCE_FROM,
  GRID_FILTER_DEFAULT_IS_NULL,
  GRID_FILTER_DEFAULT_IS_NOT_NULL,
];

export const GRID_FILTERS_ALL: Readonly<GridFilter>[] = [
  GRID_FILTER_DEFAULT_EQUALS,
  GRID_FILTER_DEFAULT_NOT_EQUALS,

  GRID_FILTER_DEFAULT_CONTAINS,
  GRID_FILTER_DEFAULT_NOT_CONTAINS,
  GRID_FILTER_DEFAULT_STARTS_WITH,
  GRID_FILTER_DEFAULT_ENDS_WITH,

  GRID_FILTER_DEFAULT_GREATER_THAN,
  GRID_FILTER_DEFAULT_GREATER_THAN_OR_EQUALS,
  GRID_FILTER_DEFAULT_LESS_THAN,
  GRID_FILTER_DEFAULT_LESS_THAN_OR_EQUALS,
  GRID_FILTER_DEFAULT_BETWEEN,

  GRID_FILTER_DEFAULT_DISTANCE_FROM,

  GRID_FILTER_DEFAULT_TEXT_COLOR,
  GRID_FILTER_DEFAULT_CELL_COLOR,

  GRID_FILTER_DEFAULT_IS_NULL,
  GRID_FILTER_DEFAULT_IS_NOT_NULL,
  GRID_FILTER_DEFAULT_IS_BLANK,
  GRID_FILTER_DEFAULT_IS_NOT_BLANK,

  GRID_FILTER_DEFAULT_TOP_10,
  GRID_FILTER_DEFAULT_BOTTOM_10,
  GRID_FILTER_DEFAULT_ABOVE_AVERAGE,
  GRID_FILTER_DEFAULT_BELOW_AVERAGE,

  GRID_FILTER_DEFAULT_IS_TRUE,
  GRID_FILTER_DEFAULT_IS_FALSE,

  GRID_FILTER_DEFAULT_ARRAY_CONTAINS,
  GRID_FILTER_DEFAULT_ARRAY_NOT_CONTAINS,

  GRID_FILTER_DEFAULT_VALUES_INCLUSION,
  GRID_FILTER_DEFAULT_VALUES_EXCLUSION,

  GRID_FILTER_DEFAULT_CUSTOM_FORMULA,
];

export const GRID_DISTANCE_UNIT_FOOT: GridGeoUnitImperial = <const>{
  name: 'foot',
  title: 'Feet',
  shortTitle: 'Feet',
  meters: 0.3048,
};

export const GRID_DISTANCE_UNIT_YARD: GridGeoUnitImperial = <const>{
  name: 'yard',
  title: 'Yards',
  shortTitle: 'Yards',
  meters: 0.9144,
};

export const GRID_DISTANCE_UNIT_MILE: GridGeoUnitImperial = <const>{
  name: 'mile',
  title: 'Miles',
  shortTitle: 'Miles',
  meters: 1609.344,
};

export const GRID_DISTANCE_UNIT_METER: GridGeoUnitMetric = {
  name: 'meter',
  title: 'Meters',
  shortTitle: 'M',
  meters: 1,
};

export const GRID_DISTANCE_UNIT_KILOMETER: GridGeoUnitMetric = {
  name: 'kilometer',
  title: 'Kilometers',
  shortTitle: 'KM',
  meters: 1000,
};

export const GRID_GEO_UNITS_IMPERIAL: readonly GridGeoUnitImperial[] = [
  GRID_DISTANCE_UNIT_FOOT,
  GRID_DISTANCE_UNIT_YARD,
  GRID_DISTANCE_UNIT_MILE,
];

export const GRID_GEO_UNITS_METRIC: readonly GridGeoUnitMetric[] = [
  GRID_DISTANCE_UNIT_METER,
  GRID_DISTANCE_UNIT_KILOMETER,
];
