import type {
  FilterByIdDescriptor,
  FilterByIndexDescriptor,
  FilterDescriptor,
} from './spec';
import type {
  CellStyleDeclaration,
  ColumnType,
  Field,
  FilterableColors,
  FilterableValueDescriptor,
  FilterableValues,
  GetFilterableValuesOptions,
  GridFilterCondition,
  GridFilterRule,
  GridFilterList,
  GridFilterListItem,
  GridFilterTarget,
  GridHeader,
  GridSchemaItem,
  GridStructPathType,
  GridFilterTypeValue,
  List,
  Struct,
  GridFilterGroup,
  GridFilter,
  GridFilterValue,
  GridFilterDateValue,
  GridFilterDateValueCoverage,
  GetFilterValueAsStringOptions,
  GetFilterDateValueAsStringOptions,
  DataSourceBase,
  GridSavedFilter,
  GridFilterConditionNameSet,
  GridFilterConditionTarget,
  GridFilterConditionName,
  FilterFieldPathInfo,
} from '../../../types';
import { DataType } from '../../../types';
import {
  GRID_FILTERS_ALL,
  GRID_FILTERS_ARRAY,
  GRID_FILTERS_BOOLEAN,
  GRID_FILTERS_DATE,
  GRID_FILTERS_GEOGRAPHY,
  GRID_FILTERS_JSON_RAW,
  GRID_FILTERS_NUMBER,
  GRID_FILTERS_STRING,
  GRID_FILTER_DEFAULT_VALUES_EXCLUSION,
  GRID_FILTER_CONDITION_NAME_BETWEEN,
  GRID_FILTER_CONDITION_NAME_CELL_COLOR,
  GRID_FILTER_CONDITION_NAME_EQUALS,
  GRID_FILTER_CONDITION_NAME_GREATER_THAN,
  GRID_FILTER_CONDITION_NAME_GREATER_THAN_OR_EQUALS,
  GRID_FILTER_CONDITION_NAME_IS_FALSE,
  GRID_FILTER_CONDITION_NAME_IS_NOT_NULL,
  GRID_FILTER_CONDITION_NAME_IS_NULL,
  GRID_FILTER_CONDITION_NAME_LESS_THAN,
  GRID_FILTER_CONDITION_NAME_LESS_THAN_OR_EQUALS,
  GRID_FILTER_CONDITION_NAME_NOT_EQUALS,
  GRID_FILTER_CONDITION_NAME_TEXT_COLOR,
  GRID_FILTER_CONDITION_NAME_VALUE_EXCLUSION,
  GRID_FILTER_CONDITION_NAME_VALUE_INCLUSION,
  GRID_FILTER_CONDITION_NAME_IS_BLANK,
  GRID_FILTER_CONDITION_NAME_IS_NOT_BLANK,
  GRID_FILTER_CONDITION_NAME_CONTAINS,
  GRID_FILTER_CONDITION_NAME_STARTS_WITH,
  GRID_FILTER_CONDITION_NAME_ENDS_WITH,
  GRID_FILTER_CONDITION_TYPE_VARIABLE,
  GRID_FILTER_CONDITION_TYPE_VALUE,
  GRID_FILTER_CONDITION_NAME_SET_OP_ONLY,
  GRID_FILTER_CONDITION_TYPE_SET,
  GRID_FILTER_CONDITION_TYPE_FORMULA,
  GRID_FILTER_CONDITION_NAME_NOT_CONTAINS,
  GRID_FILTER_CONDITION_TYPE_STATIC,
  GRID_FILTER_CONDITION_NAME_CUSTOM_FORMULA,
  GRID_FILTER_CONDITION_NAME_DISTANCE_FROM,
} from './constants';
import type { TableModification } from '../table-modification';
import { getConditionalFormattingIcon } from '../../conditional-formatting';
import { canonicalFromInterval } from '../../data-format';
import { Buffer } from 'buffer';
import { isGeometryInGeographyBounds } from './geo-utils';
import { Geometry, Point } from 'wkx';
import { GRID_FILTER_DEFAULT_VALUES_INCLUSION } from './constants';
import { GRID_FILTER_CONDITION_NAME_IS_TRUE } from './constants';

export function isSameFilter(a: FilterDescriptor, b: FilterDescriptor) {
  return (
    a &&
    b &&
    (a as FilterByIdDescriptor).id === (b as FilterByIdDescriptor).id &&
    (a as FilterByIndexDescriptor).viewIndex ===
      (b as FilterByIndexDescriptor).viewIndex &&
    a.op === b.op &&
    a.value === b.value
  );
}

/**
 * Convert the header to a {@link Field}
 * @param header To convert.
 * @returns Header as field.
 */
export const getHeaderAsField = (header: GridHeader): Field => {
  return {
    name: String(header.dataKey),
    displayname: header.title,
    type: header.type,
  };
};

/**
 * Returns the filtering options for a given field.
 *
 * The returned {@link GridFilter} may be variable or static.  For a boolean
 * type, all the available options are static, meaning they have a predetermined
 * values that can't be changed (`true` and `false`).
 *
 * Other field types might have filtering options that are variable, e.g.,
 * numbers can be filtered with the `Greater than` option where the value to
 * filter until can be set to anything.
 *
 * Examples:
 *  For numbers:
 *    - Equals
 *    - Greater than
 *    - Less than
 *    - Greater than or equals
 *    - Lower than or equals
 *    - Not equals
 *  For booleans:
 *    - Equals (True)
 *    - Equals (False)
 * @param field To get the filtering options for.
 * @param structFieldNotation The target field name in dot-notation for struct fields.
 * @returns The filtering options available for the given column type.
 * @see getFiltersForField
 */
export const getFiltersForField = (
  field: Field,
  structFieldNotation?: string,
  castType?: GridStructPathType,
): GridFilterList | undefined => {
  const { type: columnType } = field;
  if (typeof columnType === 'object') {
    switch (columnType.typeId) {
      case DataType.Date:
      case DataType.DateTime:
      case DataType.Time:
        return GRID_FILTERS_DATE;
      case DataType.Decimal:
      case DataType.Float:
        return GRID_FILTERS_NUMBER;
      case DataType.Interval:
        return GRID_FILTERS_NUMBER;
      case DataType.Struct:
        if (structFieldNotation) {
          const structField = resolveStructField(field, structFieldNotation);
          if (structField) return getFiltersForField(structField);
        }
        return;
      case DataType.Variant:
        return GRID_FILTERS_STRING;
      case DataType.Geography:
        return GRID_FILTERS_GEOGRAPHY;
      case DataType.Json:
        if (!castType || castType === 'raw') {
          return GRID_FILTERS_JSON_RAW;
        } else if (castType === 'string') {
          return GRID_FILTERS_STRING;
        } else if (castType === 'number') {
          return GRID_FILTERS_NUMBER;
        }
        break;
      case DataType.List:
        return GRID_FILTERS_ARRAY;
    }
  }

  switch (columnType) {
    case 'boolean':
      return GRID_FILTERS_BOOLEAN;
    case 'float':
    case 'number':
    case 'int':
      return GRID_FILTERS_NUMBER;
    case 'string':
      return GRID_FILTERS_STRING;
  }
};

/**
 * Finds and returns the subfields inside of a struct or nested structs.
 * @param field T
 * @param target The target subfield that uses dot notation, e.g., address.zip.
 * @returns The target as the field, or undefined when not found.
 */
export const resolveStructField = (
  field: Field,
  target: string,
): Field | undefined => {
  const names = target.split('.');
  if (!names.length) return;

  let current = field;
  for (const name of names) {
    if (
      !current ||
      typeof current.type !== 'object' ||
      current.type.typeId !== DataType.Struct
    ) {
      return;
    }
    const struct_ = current.type as Struct;
    current = undefined;
    for (const subfield of struct_.children) {
      if (name === subfield.name) {
        current = subfield;
      }
    }
  }

  return current;
};

/**
 * Finds and returns the suitable name for the given filter, e.g., the 'greater
 * than or equal to' filter will become 'on or is after' for date types.
 * @param columnType To get the matching name for.
 * @param filter Whose name is needed.
 * @param setOp Set operation for the array type.
 */
export const getFilterNameForColumnType = (
  columnType: ColumnType,
  filter: GridFilterListItem,
  setOp?: GridFilterConditionNameSet,
) => {
  if (
    setOp &&
    typeof columnType === 'object' &&
    columnType.typeId === DataType.List
  ) {
    return getFilterNameForColumnType((columnType as List).child.type, filter);
  }

  let filterName: string | undefined;

  if (typeof columnType === 'object') {
    switch (columnType.typeId || columnType) {
      case DataType.Date:
      case DataType.DateTime:
      case DataType.Time:
        filterName = filter.name.specific?.date;
        break;
      case DataType.Decimal:
      case DataType.Float:
        filterName = filter.name.specific?.number;
        break;
      case DataType.Geography:
        filterName = filter.name.specific?.geo;
        break;
      case DataType.List:
        filterName = filter.name.specific?.array;
    }
  } else {
    switch (columnType) {
      case 'float':
      case 'number':
      case 'int':
        filterName = filter.name.specific?.number;
        break;
      case 'string':
        filterName = filter.name.specific?.text;
        break;
    }
  }

  return filterName ?? filter.name.generic;
};

export const getFilterableValuesForColumn = (
  edit: TableModification<any>,
  column: GridHeader,
  options: GetFilterableValuesOptions | undefined,
  filter: GridFilterTypeValue | undefined,
) => {
  const { id: columnId } = column;
  const { search, geographyBoundaries: bounds } = options ?? {};
  const isStruct =
    typeof column.type === 'object' && column.type.typeId === DataType.Struct;
  const result: FilterableValues = {
    data: [],
    limited: false,
  };
  if (isStruct && !column.structFilterPath) return result;

  // For struct type only.
  const splitNames = column.structFilterPath?.split('.');

  const hierarchy: Record<string, FilterableValueDescriptor> = {};
  const searchRegex = search ? new RegExp(search, 'iu') : undefined;
  const isDate =
    typeof column.type === 'object' && column.type.typeId === DataType.Date;
  const isDateTime =
    typeof column.type === 'object' && column.type.typeId === DataType.DateTime;
  const isGeo =
    typeof column.type === 'object' &&
    column.type.typeId === DataType.Geography;
  const nest = (
    parent: FilterableValueDescriptor | undefined,
    value: any,
    filterValue: GridFilterValue,
  ) => {
    const valueAsString = getFilterValueAsString(filterValue);
    let subdescriptor = hierarchy[valueAsString];
    if (!subdescriptor) {
      subdescriptor = {
        parent,
        value,
        valueAsString,
        filterValue,
        title: valueAsString,
        filtered: false,
        expanded: false,
        indeterminate: false,
        subvalues: [],
      };
      hierarchy[valueAsString] = subdescriptor;
      if (parent) {
        parent.subvalues.push(subdescriptor);
      } else {
        result.data.push(subdescriptor);
      }
    }
    return subdescriptor;
  };
  const resolveValue = (value: any) => {
    if (!isStruct || !column.structFilterPath || !splitNames?.length) {
      return value;
    }

    let jsonVal = JSON.parse(value);

    for (const name of splitNames) {
      jsonVal = jsonVal[name];
      if (!jsonVal) return;
    }
    return jsonVal;
  };
  const pushValue = (value: any, valueAsString: string) => {
    if (result[value ?? ''] !== undefined) return;

    if (isDate || isDateTime) {
      const date = new Date(value);

      let parent = nest(undefined, value, {
        valueType: 'date',
        coverage: 'year',
        value: new Date(date),
      });
      parent = nest(parent, value, {
        valueType: 'date',
        coverage: 'month',
        value: new Date(date),
      });
      parent = nest(parent, value, {
        valueType: 'date',
        coverage: 'day',
        value: new Date(date),
      });

      if (isDateTime) {
        parent = nest(parent, value, {
          valueType: 'date',
          coverage: 'hour',
          value: new Date(date),
        });
        nest(parent, value, {
          valueType: 'date',
          coverage: 'minute',
          value: new Date(date),
        });
      }
    } else {
      let title = undefined;
      if (
        typeof column.type === 'object' &&
        column.type.typeId === DataType.Interval
      ) {
        title = canonicalFromInterval(
          typeof value === 'bigint'
            ? Number(value / 1000n)
            : parseInt(value) / 1000,
        );
      }

      let filterValue: GridFilterValue =
        value === null
          ? { valueType: 'null' }
          : { valueType: 'string', value: valueAsString };
      switch (typeof value) {
        case 'boolean':
          title = value ? 'True' : 'False';
          filterValue = { valueType: 'boolean', value };
          break;
        case 'number':
          filterValue = { valueType: 'number', value };
      }

      const desc: FilterableValueDescriptor = {
        title,
        value,
        valueAsString,
        filterValue,
        filtered: false,
        expanded: false,
        indeterminate: false,
      };
      result.data[value] = desc;
    }
  };

  edit.iterateColumn(columnId, (rawValue) => {
    const value = resolveValue(rawValue);
    const valueAsString = value?.toString();
    if (searchRegex && !searchRegex.test(valueAsString)) return;

    if (isGeo && bounds) {
      try {
        const geometry = Geometry.parse(Buffer.from(rawValue));
        if (!isGeometryInGeographyBounds(bounds, geometry)) return;
      } catch {
        // Do nothing
      }
    }

    pushValue(value, valueAsString);

    if (result.data.length >= options.limit) {
      result.limited = true;
      return false;
    }
  });

  const defineIndeterminatedState = (desc: FilterableValueDescriptor) => {
    if (!desc.subvalues) return;
    for (const subvalues of desc.subvalues) {
      defineIndeterminatedState(subvalues);
      if (subvalues.indeterminate) {
        desc.indeterminate = true;
        return;
      }
    }
  };

  for (const desc of Object.values(result.data)) {
    defineIndeterminatedState(desc);
  }

  return result;
};

export const getFilterableColorsForColumn = (
  styles: TableModification<Partial<CellStyleDeclaration>>,
  values: TableModification<any>,
  columnId: string,
  rowCount: number,
): FilterableColors => {
  const cellColors: Record<string, number> = {};
  const textColors: Record<string, number> = {};
  const cellIcons: Record<string, number> = {};

  const assign = (target: Record<string, number>, style: string) => {
    target[style ?? ''] = (target[style ?? ''] ?? 0) + 1;
  };

  let count = 0;
  styles.iterateColumn(columnId, (value) => {
    count++;
    if (!value) return;
    assign(cellColors, value.backgroundColor);
    assign(textColors, value.textColor);
    assign(
      cellIcons,
      value.iconSet
        ? value.iconSet +
            ':' +
            getConditionalFormattingIcon(
              values.get(count - 1, columnId),
              value.iconSet,
            ).iconImage
        : undefined,
    );
  });

  if (count < rowCount) {
    for (const list of [cellColors, textColors, cellIcons]) {
      const existing = list[''] ?? 0;
      list['null'] = rowCount - count + existing;
    }
  }

  return {
    cellColors: Object.entries(cellColors).map(([key, value]) => {
      return { color: key, usageCount: value };
    }),
    textColors: Object.entries(cellColors).map(([key, value]) => {
      return { color: key, usageCount: value };
    }),
    cellIcons: Object.entries(cellColors).map(([key, value]) => {
      return { name: key, usageCount: value };
    }),
  };
};

const convertFilterValueSimple = (value: GridFilterValue) => {
  switch (value.valueType) {
    case 'null':
      return 'null';
    case 'boolean':
      return value.value;
    case 'string':
    case 'number':
      return `'${value.value}'`;
    case 'date':
      return `'${getFilterDateValueAsString(value)}'`;
  }
};

const convertFilterDateValue = (
  field: string,
  value: GridFilterDateValue,
  filterType: GridFilterConditionName,
) => {
  const date = value.value;
  const parts: [field: string, value: string][] = [];

  switch (value.coverage) {
    case 'whole':
    case 'second':
      parts.push([`SECOND(${field})`, String(date.getSeconds())]);
    // eslint-disable-next-line no-fallthrough
    case 'minute':
      parts.push([`MINUTE(${field})`, String(date.getMinutes())]);
    // eslint-disable-next-line no-fallthrough
    case 'hour':
      parts.push([`HOUR(${field})`, String(date.getHours())]);
    // eslint-disable-next-line no-fallthrough
    case 'day':
      parts.push([`DAY(${field})`, String(date.getDate())]);
    // eslint-disable-next-line no-fallthrough
    case 'month':
      parts.push([`MONTH(${field})`, String(date.getMonth() + 1)]);
    // eslint-disable-next-line no-fallthrough
    case 'year':
      parts.push([`YEAR(${field})`, String(date.getFullYear())]);
  }

  if (parts.length < 1) return '';

  const pairs = parts.reverse();

  const createEqualityClause = (filterType: GridFilterConditionName) => {
    const result = pairs.map((pair) => pair.join(' = ')).join(' AND ');
    if (
      filterType === GRID_FILTER_CONDITION_NAME_EQUALS ||
      filterType === GRID_FILTER_CONDITION_NAME_VALUE_INCLUSION
    ) {
      return result;
    } else {
      return `NOT (${result})`;
    }
  };

  const createComparisonClause = (filterType: GridFilterConditionName) => {
    const symbol =
      filterType === GRID_FILTER_CONDITION_NAME_GREATER_THAN ? ' > ' : ' < ';
    const result: string[] = [];

    for (let i = 0; i < pairs.length; i++) {
      const subpairs: string[] = [];
      const pair = pairs[i];
      for (let j = 0; j < i; j++) {
        const subpair = pairs[j];
        subpairs.push(subpair.join(' = '));
      }
      subpairs.push(pair.join(symbol));
      result.push(subpairs.join(' AND '));
    }
    return result.map((pair) => `(${pair})`).join(' OR ');
  };

  switch (filterType) {
    case GRID_FILTER_CONDITION_NAME_EQUALS:
    case GRID_FILTER_CONDITION_NAME_NOT_EQUALS:
    case GRID_FILTER_CONDITION_NAME_VALUE_INCLUSION:
    case GRID_FILTER_CONDITION_NAME_VALUE_EXCLUSION:
      return createEqualityClause(filterType);
    case GRID_FILTER_CONDITION_NAME_GREATER_THAN:
    case GRID_FILTER_CONDITION_NAME_LESS_THAN:
      return createComparisonClause(filterType);
    case GRID_FILTER_CONDITION_NAME_GREATER_THAN_OR_EQUALS:
    case GRID_FILTER_CONDITION_NAME_LESS_THAN_OR_EQUALS: {
      const clause1 = createEqualityClause(GRID_FILTER_CONDITION_NAME_EQUALS);
      const clause2 = createComparisonClause(
        filterType === GRID_FILTER_CONDITION_NAME_GREATER_THAN_OR_EQUALS
          ? GRID_FILTER_CONDITION_NAME_GREATER_THAN
          : GRID_FILTER_CONDITION_NAME_LESS_THAN,
      );
      return `(${clause1}) OR (${clause2})`;
    }
  }

  return '';
};

/**
 * @FIXME
 * @todo ... this SQL logic should not be put in here. what about other NoSQL data sources ...
 * @todo update for `targetFild` and its docs (E.g., escaped?, ...)
 * @FIXME
 */
const getBaseFilterCondition = (
  condition: GridFilterCondition,
  field: string,
  targetField: string,
  caseSensitive: boolean,
) => {
  caseSensitive = getOverridingBoolean(condition.caseSensitive, caseSensitive);
  const { target, setOp } = condition;
  if (setOp === GRID_FILTER_CONDITION_NAME_SET_OP_ONLY) {
    if (
      (target.conditionName !== GRID_FILTER_CONDITION_NAME_VALUE_INCLUSION &&
        target.conditionName !== GRID_FILTER_CONDITION_NAME_VALUE_EXCLUSION) ||
      target.values.length < 1
    ) {
      return '';
    }
    const { values } = target;
    sortFilterValues(values);
    const valuesMapped = values.map(convertFilterValueSimple).join(', ');
    return `array_sort(${field}) = array_sort([${valuesMapped}])`;
  }
  switch (target.conditionName) {
    case GRID_FILTER_CONDITION_NAME_IS_BLANK:
      return targetField + ` = ''`;
    case GRID_FILTER_CONDITION_NAME_IS_NOT_BLANK:
      return targetField + ` != ''`;
    case GRID_FILTER_CONDITION_NAME_IS_NULL:
      return targetField + ` IS NULL`;
    case GRID_FILTER_CONDITION_NAME_IS_NOT_NULL:
      return targetField + ` IS NOT NULL`;
    case GRID_FILTER_CONDITION_NAME_IS_TRUE:
      return targetField + ' = true';
    case GRID_FILTER_CONDITION_NAME_IS_FALSE:
      return targetField + ` = false`;
    case GRID_FILTER_CONDITION_NAME_VALUE_INCLUSION:
    case GRID_FILTER_CONDITION_NAME_VALUE_EXCLUSION: {
      if (target.values.length < 1) return '';
      const inclusion =
        target.conditionName === GRID_FILTER_CONDITION_NAME_VALUE_INCLUSION;
      return target.values
        .map((value) => {
          if (value.valueType === 'null') {
            return targetField + ' IS' + (inclusion ? '' : ' NOT') + ' NULL';
          }
          if (value.valueType === 'date') {
            return convertFilterDateValue(
              targetField,
              value,
              target.conditionName,
            );
          }
          return (
            targetField +
            (inclusion ? ' == ' : ' != ') +
            convertFilterValueSimple(value)
          );
        })
        .join(inclusion ? ' OR ' : ' AND ');
    }
  }
  if (target.conditionType === GRID_FILTER_CONDITION_TYPE_VARIABLE) {
    const a = target.values[0];
    switch (target.conditionName) {
      case GRID_FILTER_CONDITION_NAME_EQUALS:
        if (a.valueType === 'null') {
          return targetField + ' IS NULL';
        } else if (a.valueType === 'date') {
          return convertFilterDateValue(targetField, a, target.conditionName);
        } else if (a.valueType === 'string' && !caseSensitive) {
          return targetField + ' ILIKE ' + convertFilterValueSimple(a);
        } else {
          return targetField + ' = ' + convertFilterValueSimple(a);
        }
      case GRID_FILTER_CONDITION_NAME_NOT_EQUALS:
        if (a.valueType === 'null') {
          return targetField + ' IS NOT NULL';
        } else if (a.valueType === 'string' && !caseSensitive) {
          return targetField + ' NOT ILIKE ' + convertFilterValueSimple(a);
        } else {
          return targetField + ' != ' + convertFilterValueSimple(a);
        }
      case GRID_FILTER_CONDITION_NAME_GREATER_THAN:
      case GRID_FILTER_CONDITION_NAME_LESS_THAN:
        if (a.valueType === 'date') {
          return convertFilterDateValue(targetField, a, target.conditionName);
        } else {
          const symbol =
            target.conditionName === GRID_FILTER_CONDITION_NAME_GREATER_THAN
              ? ' > '
              : ' < ';
          return targetField + symbol + convertFilterValueSimple(a);
        }
      case GRID_FILTER_CONDITION_NAME_GREATER_THAN_OR_EQUALS:
      case GRID_FILTER_CONDITION_NAME_LESS_THAN_OR_EQUALS:
        if (a.valueType === 'date') {
          return convertFilterDateValue(targetField, a, target.conditionName);
        } else {
          const symbol =
            target.conditionName ===
            GRID_FILTER_CONDITION_NAME_GREATER_THAN_OR_EQUALS
              ? ' >= '
              : ' <= ';
          return targetField + symbol + convertFilterValueSimple(a);
        }
      case GRID_FILTER_CONDITION_NAME_CONTAINS:
        return (
          targetField +
          ' ' +
          (caseSensitive ? 'LIKE' : 'ILIKE') +
          ` '%${getFilterValueAsString(a)}%'`
        );
      case GRID_FILTER_CONDITION_NAME_NOT_CONTAINS:
        return (
          targetField +
          ` NOT ` +
          (caseSensitive ? 'LIKE' : 'ILIKE') +
          ` '%${getFilterValueAsString(a)}%'`
        );
      case GRID_FILTER_CONDITION_NAME_STARTS_WITH:
        return (
          targetField +
          (caseSensitive ? 'LIKE' : 'ILIKE') +
          ` '${getFilterValueAsString(a)}%'`
        );
      case GRID_FILTER_CONDITION_NAME_ENDS_WITH:
        return (
          targetField +
          (caseSensitive ? 'LIKE' : 'ILIKE') +
          ` '%${getFilterValueAsString(a)}'`
        );
      case GRID_FILTER_CONDITION_NAME_BETWEEN: {
        const b = target.values[1];
        if (a.valueType === 'date' && b.valueType === 'date') {
          const greaterThan = convertFilterDateValue(
            targetField,
            a,
            GRID_FILTER_CONDITION_NAME_GREATER_THAN_OR_EQUALS,
          );
          const lessThan = convertFilterDateValue(
            targetField,
            b,
            GRID_FILTER_CONDITION_NAME_LESS_THAN_OR_EQUALS,
          );
          return `(${greaterThan}) AND (${lessThan})`;
        } else if (a.valueType === 'geopoint' && b.valueType === 'geopoint') {
          const sw = a.value;
          const ne = b.value;
          return (
            `ST_WITHIN(` +
            ` ST_MakePolygon(null, [` +
            `  ST_MakePoint(${sw.lng}, ${sw.lat}),` +
            `  ST_MakePoint(${ne.lng}, ${sw.lat}),` +
            `  ST_MakePoint(${ne.lng}, ${ne.lat}),` +
            `  ST_MakePoint(${sw.lng}, ${ne.lat}),` +
            `  ST_MakePoint(${sw.lng}, ${sw.lat})` +
            ` ]),` +
            ` ${targetField}` +
            `)`
          );
        } else {
          return (
            `${targetField} >= ${convertFilterValueSimple(a)}` +
            ' AND ' +
            `${targetField} <= ${convertFilterValueSimple(b)}`
          );
        }
      }
      case GRID_FILTER_CONDITION_NAME_DISTANCE_FROM: {
        const b = target.values[1];
        if (a.valueType === 'geopoint' && b?.valueType === 'number') {
          const { lng, lat } = a.value;
          return (
            `ST_DISTANCE(${targetField}, ST_MAKEPOINT(${lng}, ${lat})) <= ` +
            `'${b.value}'`
          );
        }
        break;
      }
    }
  }
  return '';
};

/** @FIXME This is a DuckDB related utils but not for the core of the grid */
const convertFilterConditionToWhereClause = (
  tableName: string,
  header: GridSchemaItem,
  filterConditon: GridFilterCondition,
  escapeId: (id: string, bool?: boolean) => string,
  caseSensitive: boolean,
): string => {
  const { dataKey: fieldd } = header;

  const { target, setOp } = filterConditon;
  const filter = getFilterWithType(target.conditionName);
  const pathInfo = getPathInfoFromConditionTarget(filterConditon.target);
  const { target: baseField } = getSqlFieldFromPathInfo(
    tableName,
    escapeId(String(fieldd), true),
    header.type,
    pathInfo,
  );
  const targetField = setOp ? '__dd__unnested' : baseField;

  const condition = getBaseFilterCondition(
    filterConditon,
    baseField,
    targetField,
    caseSensitive,
  );
  let clause = '';

  if (!condition.trim().length) {
    // No condition applied, do nothing.
  } else if (setOp === 'arrayContainsAll') {
    clause =
      `array_length(${baseField}) > 0 AND ` +
      `NOT EXISTS (` +
      ` SELECT * FROM (SELECT UNNEST(${baseField}) as ${targetField})` +
      ` WHERE NOT (${condition})` +
      `)`;
  } else if (setOp === 'arrayContainsAny') {
    clause =
      `array_length(${baseField}) > 0 AND ` +
      `EXISTS (` +
      ` SELECT * FROM (SELECT UNNEST(${baseField}) as ${targetField})` +
      ` WHERE ${condition}` +
      `)`;
  } else if (setOp === 'arrayContainsNone') {
    clause =
      `NOT EXISTS (` +
      ` SELECT * FROM (SELECT UNNEST(${baseField}) as ${targetField})` +
      ` WHERE ${condition}` +
      `)`;
  } else {
    clause += condition;
  }

  if (!clause && filter.conditionType !== 'value')
    console.log('the where clause is empty for', filter.conditionName);

  return clause;
};

/**
 * Converts the filter and its values to its SQL WHERE clause equivalent.
 * @FIXME This is a DuckDB related utils but not for the core of the grid
 * @param filterTarget
 * @param getHeader
 * @param generateColorFilter Generator for colors filters (needs access to
 *  metadata table).
 * @returns The contents of the where clause (excluding `WHERE`).
 */
export const convertFilterToWhereClause = (
  tableName: string,
  filterTarget: GridSavedFilter,
  escapeId: (id: string) => string,
  getHeader: (id: string) => GridHeader,
  caseSensitive: boolean,
  generateColorFilter?: (condition: GridFilterCondition) => string,
): string => {
  filterTarget = structuredClone(filterTarget);

  const generateGroup = (rule: GridFilterRule) => {
    if (rule.disabled) return '';

    if (rule.type === 'condition') {
      const { target } = rule;
      if (
        target.conditionType === 'variable' &&
        (target.conditionName === GRID_FILTER_CONDITION_NAME_TEXT_COLOR ||
          target.conditionName === GRID_FILTER_CONDITION_NAME_CELL_COLOR) &&
        generateColorFilter
      ) {
        return generateColorFilter(rule);
      } else if (
        target.conditionName === GRID_FILTER_CONDITION_NAME_CUSTOM_FORMULA
      ) {
        return target.formula;
      }
      const header = getHeader(target.columnId);
      return convertFilterConditionToWhereClause(
        tableName,
        header,
        rule,
        escapeId,
        caseSensitive,
      );
    }
    const subclauses = [] as string[];
    for (const subrule of rule.rules) {
      const group = generateGroup(subrule);
      if (group.length > 0) subclauses.push(group);
    }

    const conjunction = rule.conjunction === 'and' ? 'AND' : 'OR';
    return subclauses.length
      ? '(' + subclauses.join(` ${conjunction} `) + ')'
      : '';
  };

  let finalResult = '';
  if (filterTarget.type === 'simple') {
    const groupClauses: string[] = [];
    for (const target of Object.values(filterTarget.targets)) {
      const sanitizedTarget = sanitizeFilterTarget(target);
      const result = generateGroup(sanitizedTarget.filter);
      if (result) groupClauses.push(`(${result})`);
    }
    finalResult = groupClauses.join(' AND ');
  } else {
    const target = sanitizeFilterTarget(filterTarget.target);
    finalResult = generateGroup(target.filter);
  }

  console.log('the where clause is:', finalResult);
  return finalResult;
};

export const updateFilterableValues = (
  values: FilterableValueDescriptor[],
  columnId: string,
  filterRule: GridFilterRule | undefined,
  options?: { expand?: boolean; search?: string },
) => {
  const expand = options?.expand;
  const search = options?.search;
  const [filter, filterValues] = getFilterAsValuesFilter(filterRule);

  let baseState: boolean | undefined;

  const updateDescriptor = (
    descriptor: FilterableValueDescriptor,
    forceState?: boolean | undefined,
  ) => {
    descriptor.indeterminate = false;
    if (forceState !== undefined) {
      descriptor.filtered = forceState;
    } else {
      const exclusion =
        filter.conditionName === GRID_FILTER_CONDITION_NAME_VALUE_EXCLUSION;
      const included = containsFilterValue(
        filterValues,
        descriptor.filterValue,
        true,
      );
      const selfState = exclusion === included;

      descriptor.filtered = selfState;
      if (included) {
        if (expand && descriptor.parent) descriptor.parent.expanded = true;
        forceState = selfState;
      }
    }

    if (
      !descriptor.expanded &&
      search &&
      ((descriptor.title && descriptor.title.includes(search)) ||
        String(descriptor.valueAsString).includes(search))
    ) {
      let currentParent = descriptor.parent;
      while (currentParent && !currentParent.expanded) {
        currentParent.expanded = true;
        currentParent = currentParent.parent;
      }
    }

    const { subvalues } = descriptor;
    if (subvalues?.length > 0) {
      let filteredCount = 0;
      for (const subdescriptor of subvalues) {
        updateDescriptor(subdescriptor, forceState);

        if (forceState === undefined) {
          if (subdescriptor.filtered) filteredCount++;
          if (subdescriptor.indeterminate) descriptor.indeterminate = true;
          if (expand && subdescriptor.expanded) descriptor.expanded = true;
        }
      }

      if (forceState === undefined && filter.conditionType === 'value') {
        if (filteredCount > 0 && filteredCount < subvalues.length) {
          descriptor.indeterminate = true;
        }
        descriptor.filtered = filteredCount === subvalues.length;
      }
    }
  };

  const valuesCount = Math.max(values.length - 1, 0);
  let markedCount = 0;
  let hasIndeterminate = false;
  let selectAllDescriptor: FilterableValueDescriptor | undefined;
  for (const descriptor of values) {
    if (descriptor.isSelectAll) {
      selectAllDescriptor = descriptor;
    } else {
      updateDescriptor(descriptor, baseState);
      if (descriptor.indeterminate) hasIndeterminate = true;
      if (descriptor.filtered) markedCount++;
    }
  }

  if (selectAllDescriptor) {
    if (baseState !== undefined) {
      selectAllDescriptor.filtered = baseState;
      selectAllDescriptor.indeterminate = false;
    } else if (filter?.conditionType === 'value') {
      selectAllDescriptor.filtered = markedCount === valuesCount;
      selectAllDescriptor.indeterminate =
        hasIndeterminate || (markedCount > 0 && markedCount < valuesCount);
    }
  }
};

export const getFilterAsValuesFilter = (
  filterRule: GridFilterRule | undefined,
): [GridFilterTypeValue, GridFilterValue[]] => {
  let condition: GridFilterCondition | undefined;

  if (filterRule) {
    if (filterRule.type === 'condition') {
      condition = filterRule;
    } else if (filterRule.type === 'group') {
      if (
        filterRule.rules.length === 1 &&
        filterRule.rules[0].type === 'condition'
      ) {
        condition = filterRule.rules[0];
      } else if (filterRule.rules.length > 1) {
        return [GRID_FILTER_DEFAULT_VALUES_INCLUSION, []];
      }
    }
  }
  if (!condition) return [GRID_FILTER_DEFAULT_VALUES_EXCLUSION, []];

  const { target } = condition;
  const filter = getFilterWithType(target.conditionName);
  if (
    target.conditionType === GRID_FILTER_CONDITION_TYPE_VALUE &&
    filter.conditionType === GRID_FILTER_CONDITION_TYPE_VALUE
  ) {
    return [filter, structuredClone(target.values)];
  } else if (target.conditionType === GRID_FILTER_CONDITION_TYPE_STATIC) {
    switch (target.conditionName) {
      case GRID_FILTER_CONDITION_NAME_IS_TRUE:
      case GRID_FILTER_CONDITION_NAME_IS_FALSE:
        return [
          GRID_FILTER_DEFAULT_VALUES_INCLUSION,
          [
            {
              valueType: 'boolean',
              value:
                filter.conditionName === GRID_FILTER_CONDITION_NAME_IS_TRUE,
            },
          ],
        ];
      case GRID_FILTER_CONDITION_NAME_IS_NULL:
      case GRID_FILTER_CONDITION_NAME_IS_NOT_NULL:
        return [
          target.conditionName === GRID_FILTER_CONDITION_NAME_IS_NULL
            ? GRID_FILTER_DEFAULT_VALUES_INCLUSION
            : GRID_FILTER_DEFAULT_VALUES_EXCLUSION,
          [{ valueType: 'null' }],
        ];
    }
  } else if (target.conditionType === GRID_FILTER_CONDITION_TYPE_VARIABLE) {
    switch (target.conditionName) {
      case GRID_FILTER_CONDITION_NAME_EQUALS:
      case GRID_FILTER_CONDITION_NAME_NOT_EQUALS:
        return [
          target.conditionName === GRID_FILTER_CONDITION_NAME_EQUALS
            ? GRID_FILTER_DEFAULT_VALUES_INCLUSION
            : GRID_FILTER_DEFAULT_VALUES_EXCLUSION,
          structuredClone(target.values),
        ];
    }
  }

  return [GRID_FILTER_DEFAULT_VALUES_INCLUSION, []];
};

export const deepCopyFilterTarget = (target: GridFilterTarget) => {
  const { filter, rowRange } = target;
  const newFilter: GridFilterGroup = {
    conjunction: filter.conjunction,
    rules: [],
    type: 'group',
  };
  const deepCopyGroup = (target: GridFilterGroup, from: GridFilterGroup) => {
    for (const rule of from.rules) {
      if (rule.type === 'group') {
        const newGroup: GridFilterGroup = {
          type: 'group',
          conjunction: rule.conjunction,
          disabled: rule.disabled,
          rules: [],
        };
        target.rules.push(newGroup);
        deepCopyGroup(newGroup, rule);
      } else if (rule.type === 'condition') {
        target.rules.push({
          type: 'condition',
          target: structuredClone(rule.target),
          setOp: rule.setOp,
          disabled: rule.disabled,
          caseSensitive: rule.caseSensitive,
        });
      }
    }
  };

  deepCopyGroup(newFilter, filter);

  return {
    filter: newFilter,
    rowRange,
  };
};

export const getFilterWithType = (
  name: GridFilterConditionName,
): Readonly<GridFilter> | undefined => {
  for (const filter of GRID_FILTERS_ALL) {
    if (filter.conditionName === name) {
      return filter;
    }
  }
};

export const getFilterDateValueAsString = (
  filterValue: GridFilterDateValue,
  dateOptions?: Partial<GetFilterDateValueAsStringOptions>,
) => {
  const options: Intl.DateTimeFormatOptions = {};
  const coverageIndex: GridFilterDateValueCoverage[] = [
    'year',
    'month',
    'day',
    'hour',
    'minute',
    'second',
    'whole',
  ];
  const finalIndex = coverageIndex.indexOf(filterValue.coverage);
  const setOptionFor = (coverage: GridFilterDateValueCoverage) => {
    switch (coverage) {
      case 'year':
        options.year = 'numeric';
        break;
      case 'month':
        options.month = 'long';
        break;
      case 'day':
        options.day = '2-digit';
        break;
      case 'hour':
        options.hour = '2-digit';
        break;
      case 'minute':
        options.minute = '2-digit';
        break;
      case 'second':
        options.second = '2-digit';
    }
  };

  coverageIndex.forEach((coverage, i) => {
    if (
      (dateOptions?.coverageOnly && coverage === filterValue.coverage) ||
      (!dateOptions?.coverageOnly && i <= finalIndex)
    ) {
      setOptionFor(coverage);
    }
  });
  if (
    options.year ||
    options.month ||
    options.day ||
    !(options.hour || options.minute || options.second)
  ) {
    return filterValue.value.toLocaleDateString(dateOptions?.locale, options);
  }
  return filterValue.value.toLocaleTimeString(dateOptions?.locale, options);
};

export const getFilterValueAsString = (
  filterValue: GridFilterValue,
  options?: Partial<GetFilterValueAsStringOptions>,
) => {
  switch (filterValue.valueType) {
    case 'null':
      return '(Blanks)';
    case 'string':
      return filterValue.value;
    case 'date':
      return getFilterDateValueAsString(filterValue, options?.date);
    case 'boolean':
      return filterValue.value ? 'True' : 'False';
    case 'number':
      return String(filterValue.value);
  }
};

export const filterDateValuesMatch = (
  a: GridFilterDateValue,
  b: GridFilterDateValue,
): boolean => {
  if (a.coverage !== b.coverage) return false;

  const da = a.value;
  const db = b.value;

  switch (a.coverage) {
    case 'whole':
      return da.getTime() === db.getTime();
    case 'year':
      return da.getFullYear() === db.getFullYear();
    case 'month':
      return (
        da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth()
      );
    case 'day':
      return (
        da.getFullYear() === db.getFullYear() &&
        da.getMonth() === db.getMonth() &&
        da.getDate() === db.getDate()
      );
    case 'hour':
      return (
        da.getFullYear() === db.getFullYear() &&
        da.getMonth() === db.getMonth() &&
        da.getDate() === db.getDate() &&
        da.getHours() === db.getHours()
      );
    case 'minute':
      return (
        da.getFullYear() === db.getFullYear() &&
        da.getMonth() === db.getMonth() &&
        da.getDate() === db.getDate() &&
        da.getHours() === db.getHours() &&
        da.getMinutes() === db.getMinutes()
      );
    case 'second':
      return (
        da.getFullYear() === db.getFullYear() &&
        da.getMonth() === db.getMonth() &&
        da.getDate() === db.getDate() &&
        da.getHours() === db.getHours() &&
        da.getMinutes() === db.getMinutes() &&
        da.getSeconds() === db.getSeconds()
      );
  }
};

export const filterValuesMatch = (
  a: GridFilterValue,
  b: GridFilterValue,
  caseSensitive = false,
) => {
  if (!a || !b) return !a && !b;
  return (
    (a.valueType === 'null' && b.valueType === 'null') ||
    (a.valueType === 'date' &&
      b.valueType === 'date' &&
      filterDateValuesMatch(a, b)) ||
    (a.valueType === 'string' &&
      b.valueType === 'string' &&
      ((!caseSensitive && a.value.toLowerCase() === b.value.toLowerCase()) ||
        (caseSensitive && a.value === b.value))) ||
    (a.valueType === 'boolean' &&
      b.valueType === 'boolean' &&
      a.value === b.value) ||
    (a.valueType === 'number' &&
      b.valueType === 'number' &&
      a.value === b.value) ||
    (a.valueType === 'geopoint' &&
      b.valueType === 'geopoint' &&
      a.value.lng === b.value.lng &&
      a.value.lat === b.value.lat)
  );
};

export const containsFilterValue = (
  values: GridFilterValue[],
  value: GridFilterValue,
  caseSensitive = false,
) => {
  return (
    values.findIndex(
      (other) =>
        other?.valueType && filterValuesMatch(value, other, caseSensitive),
    ) !== -1
  );
};

export const sortFilterValues = (values: GridFilterValue[]) => {
  return values.sort((a, b) => {
    if (a.valueType === 'number' && b.valueType === 'number') {
      return a.value - b.value;
    }
    if (a.valueType === 'bigint' && b.valueType === 'bigint') {
      return Number(a.value - b.value);
    }
    if (a.valueType === 'date' && b.valueType === 'date') {
      return a.value.getTime() - b.value.getTime();
    }
    return getFilterValueAsString(a).localeCompare(getFilterValueAsString(b));
  });
};

export const isFilterConditionValid = (condition: GridFilterCondition) => {
  const { target } = condition;
  const filter = getFilterWithType(target.conditionName);
  const isValueValid = (value: GridFilterValue) => !!value && value.valueType;
  return (
    target.conditionType === GRID_FILTER_CONDITION_TYPE_STATIC ||
    (target.conditionType === GRID_FILTER_CONDITION_TYPE_VALUE &&
      target.values.length > 0 &&
      target.values.findIndex((value) => !isValueValid(value)) === -1) ||
    (target.conditionType === GRID_FILTER_CONDITION_TYPE_VARIABLE &&
      filter.conditionType === GRID_FILTER_CONDITION_TYPE_VARIABLE &&
      target.conditionType === 'variable' &&
      target.values.length >= filter.variableCount &&
      target.values.findIndex((value) => !isValueValid(value)) === -1) ||
    (target.conditionType === GRID_FILTER_CONDITION_TYPE_FORMULA &&
      target.formula.length > 0)
  );
};

export const sanitizeFilterGroup = (
  group: GridFilterGroup,
): GridFilterGroup => {
  const newRules: GridFilterRule[] = [];

  for (const rule of group.rules) {
    if (rule.type === 'condition') {
      if (isFilterConditionValid(rule)) newRules.push(rule);
    } else if (rule.type === 'group') {
      const newGroup = sanitizeFilterGroup(rule);
      if (newGroup.rules.length > 0) {
        newRules.push(newGroup);
      }
    }
  }

  return {
    type: 'group',
    conjunction: group.conjunction,
    disabled: group.disabled,
    rules: newRules,
  };
};

export const sanitizeFilterTarget = (
  target: GridFilterTarget,
): GridFilterTarget => {
  return {
    filter: sanitizeFilterGroup(target.filter),
    rowRange: target.rowRange ? [...target.rowRange] : undefined,
  };
};

export const getFieldToFilter = (
  dataSource: DataSourceBase,
  header: GridHeader,
  options?: {
    pathInfo?: FilterFieldPathInfo;
  },
): Field | undefined => {
  const needsPath =
    typeof header.type === 'object' &&
    (header.type.typeId === DataType.Struct ||
      header.type.typeId === DataType.Json);
  const structPath = needsPath
    ? options?.pathInfo?.path ?? dataSource.getStructFilterPath(header.id)
    : undefined;
  if (needsPath && !structPath) return undefined;

  const field = getHeaderAsField(header);
  return needsPath ? resolveStructField(field, structPath) : field;
};

/**
 * Filter out subdates when they are covered by the given date value, e.g., when
 * the given date is covering the year 2018, this will remove values covering
 * the months, dates, hours, etc. in the year 2018.
 *
 * @param values To filter out.
 * @param value To filter with.
 * @returns The filtered out values.
 */
export const filterSubdates = (
  values: GridFilterValue[],
  value: GridFilterDateValue,
): GridFilterValue[] => {
  if (value.coverage === 'whole') return values;

  let i = 0;
  const order: Record<GridFilterDateValueCoverage, number> = {
    year: i++,
    month: i++,
    day: i++,
    hour: i++,
    minute: i++,
    second: i++,
    whole: i++,
  };

  const valuePos = order[value.coverage];

  return values.filter((other) => {
    if (other.valueType !== 'date') return true;

    const otherPos = order[other.coverage];
    if (otherPos <= valuePos) return true;

    const { value: a } = value;
    const { value: b } = other;

    // We need it to fallthrough, otherwise, it will need to be written in a
    // repeating manner.
    switch (value.coverage) {
      case 'second':
        if (a.getSeconds() !== b.getSeconds()) return true;
      // eslint-disable-next-line no-fallthrough
      case 'minute':
        if (a.getMinutes() !== b.getMinutes()) return true;
      // eslint-disable-next-line no-fallthrough
      case 'hour':
        if (a.getHours() !== b.getHours()) return true;
      // eslint-disable-next-line no-fallthrough
      case 'day':
        if (a.getDate() !== b.getDate()) return true;
      // eslint-disable-next-line no-fallthrough
      case 'month':
        if (a.getMonth() !== b.getMonth()) return true;
      // eslint-disable-next-line no-fallthrough
      case 'year':
        if (a.getFullYear() !== b.getFullYear()) return true;
      // eslint-disable-next-line no-fallthrough
      default:
        return false;
    }
  });
};

export const filterRulesMatch = (
  rule1: GridFilterRule,
  rule2: GridFilterRule,
  caseSensitive = false,
) => {
  if (rule1?.type === 'condition' && rule2?.type === 'condition') {
    const { target: target1 } = rule1;
    const { target: target2 } = rule2;
    if (
      rule1.setOp === rule2.setOp &&
      !!rule1.disabled === !!rule2.disabled &&
      rule1.caseSensitive === rule2.caseSensitive &&
      target1.conditionType === target2.conditionType &&
      target1.conditionName === target2.conditionName &&
      target1.columnId === target2.columnId &&
      ((target1.conditionType === GRID_FILTER_CONDITION_TYPE_STATIC &&
        target2.conditionType === GRID_FILTER_CONDITION_TYPE_STATIC &&
        filterPathsMatch(target1.pathInfo, target2.pathInfo)) ||
        (target1.conditionType === GRID_FILTER_CONDITION_TYPE_FORMULA &&
          target2.conditionType === GRID_FILTER_CONDITION_TYPE_FORMULA &&
          target1.formula === target2.formula) ||
        (((target1.conditionType === GRID_FILTER_CONDITION_TYPE_VARIABLE &&
          target2.conditionType === GRID_FILTER_CONDITION_TYPE_VARIABLE) ||
          (target1.conditionType === GRID_FILTER_CONDITION_TYPE_VALUE &&
            target2.conditionType === GRID_FILTER_CONDITION_TYPE_VALUE)) &&
          areFilterValuesSame(
            target1.values,
            target2.values,
            caseSensitive || rule1.caseSensitive,
          ) &&
          filterPathsMatch(target1.pathInfo, target2.pathInfo)))
    ) {
      return true;
    }
  } else if (rule1?.type === 'group' && rule2?.type === 'group') {
    if (
      rule1.conjunction === rule2.conjunction &&
      rule1.disabled === rule2.disabled &&
      rule1.rules.length === rule2.rules.length
    ) {
      for (let i = 0; i < rule1.rules.length; i++) {
        const first = rule1.rules[i];
        const second = rule2.rules[i];
        if (!filterRulesMatch(first, second, caseSensitive)) {
          return false;
        }
      }
      return true;
    }
  }
  return false;
};

export const areFilterValuesSame = (
  current: GridFilterValue[],
  applied: GridFilterValue[],
  caseSensitive = false,
) => {
  if (current.length !== applied.length) {
    return false;
  }
  for (let i = 0; i < current.length; i++) {
    if (!filterValuesMatch(current[i], applied[i], caseSensitive)) {
      return false;
    }
  }
  return true;
};

export const createEmptyConditionTargetForFilter = (
  filter: GridFilter,
  columnId: string,
  options?: {
    pathInfo: FilterFieldPathInfo;
  },
): GridFilterConditionTarget => {
  const { conditionType } = filter;
  if (conditionType === GRID_FILTER_CONDITION_TYPE_STATIC) {
    return {
      columnId,
      conditionType: filter.conditionType,
      conditionName: filter.conditionName,
      pathInfo: options?.pathInfo,
    };
  } else if (conditionType === GRID_FILTER_CONDITION_TYPE_VARIABLE) {
    return {
      columnId,
      conditionType: filter.conditionType,
      conditionName: filter.conditionName,
      values: [],
      pathInfo: options?.pathInfo,
    };
  } else if (conditionType === GRID_FILTER_CONDITION_TYPE_VALUE) {
    return {
      columnId,
      conditionType: filter.conditionType,
      conditionName: filter.conditionName,
      values: [],
      pathInfo: options?.pathInfo,
    };
  } else if (conditionType === GRID_FILTER_CONDITION_TYPE_FORMULA) {
    return {
      columnId,
      conditionType: filter.conditionType,
      conditionName: filter.conditionName,
      formula: '',
    };
  }
};

/**
 * Returns the first boolean that is defined as the result.
 */
export const getOverridingBoolean = (...bools: boolean[]) => {
  for (const bool of bools) {
    if (typeof bool === 'boolean') return bool;
  }

  return false;
};

export const filterPathsMatch = (
  a: FilterFieldPathInfo,
  b: FilterFieldPathInfo,
) =>
  (!a && !b) ||
  (a.path === b.path &&
    ((!a.pathType && !b.pathType) || a.pathType === b.pathType));

export const getSqlFieldFromPathInfo = (
  tableName: string | undefined,
  fieldName: string,
  fieldType: ColumnType,
  pathInfo?: FilterFieldPathInfo,
): {
  field: Field;
  target: string;
} => {
  let target = (tableName ? tableName + '.' : '') + fieldName;
  let field: Field = {
    name: fieldName,
    type: fieldType,
  };

  if (pathInfo && typeof fieldType === 'object') {
    if (fieldType.typeId === DataType.Struct) {
      target += '.' + pathInfo.path;
      field = resolveStructField(field, pathInfo.path);
    } else if (fieldType.typeId === DataType.Json) {
      const pathArray = pathInfo.path.split('.');
      const jsonPath = pathArray.map((path) => `'${path}'`).join('->');

      target = `${target}->${jsonPath}`;
      field.name = pathArray[pathArray.length - 1];
      field.displayname = undefined;

      switch (pathInfo.pathType) {
        case 'raw':
          break;
        case 'number':
          target = `TRY_CAST(${target} AS INT)`;
          field.type = 'int';
          break;
        case 'string':
        default:
          target = `TRY_CAST(${target} AS STRING)`;
          field.type = 'string';
      }
    }
  }
  return { field, target };
};

export const getPathInfoFromConditionTarget = (
  target: GridFilterConditionTarget | undefined,
): FilterFieldPathInfo | undefined => {
  const conditionType = target?.conditionType;
  if (
    conditionType === GRID_FILTER_CONDITION_TYPE_STATIC ||
    conditionType === GRID_FILTER_CONDITION_TYPE_VALUE ||
    conditionType === GRID_FILTER_CONDITION_TYPE_VARIABLE
  ) {
    return target.pathInfo;
  }
};

export const getPathInfoFromHeader = (
  header: GridHeader | undefined,
): FilterFieldPathInfo | undefined => {
  if (!header?.structFilterPath) return;
  return {
    path: header.structFilterPath,
    pathType: header.structFilterPathType,
  };
};

export const getPathInfo = (
  header: GridHeader | undefined,
  target: GridFilterConditionTarget | undefined,
): FilterFieldPathInfo | undefined => {
  return (
    getPathInfoFromConditionTarget(target) ?? getPathInfoFromHeader(header)
  );
};
