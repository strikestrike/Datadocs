import type {
  FilterableColors,
  FilterableValueDescriptor,
  FilterableValues,
  GetFilterableValuesOptions,
  GridFilterValue,
  GridSavedSimpleFilter,
  List,
} from '@datadocs/canvas-datagrid-ng';
import { DataType } from '@datadocs/canvas-datagrid-ng';
import { canonicalFromInterval } from '@datadocs/canvas-datagrid-ng/lib/data/data-format';
import {
  convertFilterToWhereClause,
  getFilterValueAsString,
  getPathInfoFromHeader,
  getSqlFieldFromPathInfo,
  updateFilterableValues,
} from '@datadocs/canvas-datagrid-ng/lib/data/data-source/filters/utils';
import { transformDuckDBValue } from '../utils/transformDuckDBValue';
import type { FromDuckDbThis } from '../internal-types';
import { escapeId } from '@datadocs/duckdb-utils';

export async function getFilterableColorsForColumn(
  this: FromDuckDbThis,
  columnId: string,
): Promise<FilterableColors> {
  const column = this.getHeaderById(columnId);
  if (column) {
    const result = await this.metadataTable.getFilterableColorsForColumn(
      column.dataKey as string,
      this.state.rows,
    );

    if (column.columnStyle) {
      const firstCellColor = result.cellColors[0];
      const firstTextColor = result.textColors[0];

      if (firstCellColor && firstCellColor.color === null) {
        firstCellColor.color = column.columnStyle.backgroundColor ?? null;
      }

      if (firstTextColor && firstTextColor.color === null) {
        firstTextColor.color = column.columnStyle.textColor ?? null;
      }
    }
    return result;
  }
  return {
    cellIcons: [],
    cellColors: [],
    textColors: [],
  };
}

export async function getFilterableValuesForColumn(
  this: FromDuckDbThis,
  columnId: string,
  options?: GetFilterableValuesOptions,
) {
  const result: FilterableValues = {
    data: [],
    limited: false,
  };
  const valueHelper = options?.valueHelper;
  const savedFilter = this.currentFilter;
  const appliedFilter: GridSavedSimpleFilter = structuredClone(
    savedFilter?.type === 'advanced' ? savedFilter?.simplified : savedFilter,
  );
  const filterTarget = appliedFilter?.targets?.[columnId];

  if (appliedFilter) {
    delete appliedFilter.targets[columnId];
  }

  const search = options?.search?.trim();
  const column = this.columns.getById(columnId);
  const isStruct =
    typeof column.type === 'object' && column.type.typeId === DataType.Struct;
  const isJson =
    typeof column.type === 'object' && column.type.typeId === DataType.Json;

  if (
    !column ||
    (isStruct && !options?.pathInfo?.path && !column.structFilterPath)
  ) {
    return result;
  }

  const selectAllDescriptor: FilterableValueDescriptor = {
    title: '(Select All)',
    isSelectAll: true,
    expanded: false,
    filtered: false,
    indeterminate: false,
    value: undefined,
    valueAsString: undefined,
    filterValue: undefined,
  };

  const { field, target } = getSqlFieldFromPathInfo(
    undefined,
    escapeId(columnId, true),
    column.type,
    options.pathInfo ?? getPathInfoFromHeader(column),
  );
  if (!field) return result;

  const subfield =
    typeof field.type === 'object' &&
    field.type.typeId === DataType.List &&
    options.unnest
      ? (field.type as List).child
      : field;

  const hierarchy: Record<string, FilterableValueDescriptor> = {};
  const isDate =
    typeof subfield.type === 'object' && subfield.type.typeId === DataType.Date;
  const isDateTime =
    typeof subfield.type === 'object' &&
    subfield.type.typeId === DataType.DateTime;
  const isInterval =
    typeof subfield.type === 'object' &&
    subfield.type.typeId === DataType.Interval;
  const isBool = subfield.type === 'boolean';
  const isArray =
    typeof field.type === 'object' && field.type.typeId === DataType.List;

  const nest = (
    parent: FilterableValueDescriptor | undefined,
    value: any,
    filterValue: GridFilterValue,
  ) => {
    const valueAsString = getFilterValueAsString(filterValue, {
      date: {
        coverageOnly: true,
      },
    });
    const valueAsStringFull = getFilterValueAsString(filterValue);

    let subdescriptor = hierarchy[valueAsStringFull];
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
      hierarchy[valueAsStringFull] = subdescriptor;
      if (parent) {
        parent.subvalues.push(subdescriptor);
      } else {
        result.data.push(subdescriptor);
      }
    }
    return subdescriptor;
  };
  const pushValue = (value: any, valueAsString: string) => {
    if (result.data.length === 0 && !valueHelper) {
      result.data.push(selectAllDescriptor);
    }

    if (!valueHelper && (isDate || isDateTime)) {
      const date = new Date(value);

      let subdate = new Date(0);
      subdate.setFullYear(date.getFullYear());
      let parent = nest(undefined, value, {
        valueType: 'date',
        coverage: 'year',
        value: subdate,
      });
      subdate = new Date(date);
      subdate.setMonth(date.getMonth());
      parent = nest(parent, value, {
        valueType: 'date',
        coverage: 'month',
        value: subdate,
      });
      subdate = new Date(date);
      subdate.setDate(date.getDate());
      parent = nest(parent, value, {
        valueType: 'date',
        coverage: 'day',
        value: subdate,
      });

      if (isDateTime) {
        subdate = new Date(date);
        subdate.setHours(date.getHours());
        parent = nest(parent, value, {
          valueType: 'date',
          coverage: 'hour',
          value: subdate,
        });
        subdate = new Date(date);
        subdate.setMinutes(date.getMinutes());
        nest(parent, value, {
          valueType: 'date',
          coverage: 'minute',
          value: new Date(date),
        });
      }
    } else {
      let title = valueAsString;
      if (value === null) {
        title = '(Blanks)';
      } else if (isInterval) {
        title = canonicalFromInterval(
          typeof value === 'bigint'
            ? Number(value / BigInt(1000))
            : parseInt(value) / 1000,
        );
      }

      let filterValue: GridFilterValue;
      if (isDate) {
        filterValue = { valueType: 'date', value, coverage: 'day' };
        title = (value as Date).toLocaleDateString();
      } else if (isDateTime) {
        filterValue = { valueType: 'date', value, coverage: 'minute' };
      } else {
        switch (typeof value) {
          case 'string':
            filterValue = { valueType: 'string', value };
            break;
          case 'boolean':
            title = value ? 'True' : 'False';
            filterValue = { valueType: 'boolean', value };
            break;
          case 'number':
            filterValue = { valueType: 'number', value };
            break;
          case 'bigint':
            // TODO: The problem is getting bigint inputs from user (once fixed,
            // return bigint from here.)
            filterValue = {
              valueType: 'number',
              value: parseFloat(valueAsString),
            };
            break;
          default:
            filterValue =
              value === null
                ? { valueType: 'null' }
                : { valueType: 'raw', value };
        }
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
      result.data.push(desc);
    }
  };

  const { suggestion } = this.connectionIds;
  if (suggestion) {
    try {
      await this.dbManager.closeConnection(suggestion);
    } catch {
      console.log('Failed to close an existing connection.');
    } finally {
      this.connectionIds.suggestion = undefined;
    }
  }

  const connId = await this.dbManager.createConnection();
  this.connectionIds.suggestion = connId;

  /** @todo optimize it by using native SQL approach */
  try {
    const ddTarget = this.prefix + '_target';
    const ddAsStr = this.prefix + '_as_str';
    const { tblName } = this.rowsLoader;
    const { selectionSource } = this.dbState;
    const whereClause = appliedFilter
      ? convertFilterToWhereClause(
          tblName,
          appliedFilter,
          escapeId,
          this.getHeaderById,
          options?.caseSensitive,
        )
      : '';

    let targetClause = '';
    if (options?.unnest && isArray) {
      targetClause = `UNNEST(${target}) AS ${ddTarget}`;
    } else {
      targetClause = `${target} AS ${ddTarget}`;
    }

    const orderByClause =
      ddTarget + (column.type === 'string' ? ' COLLATE NOCASE' : '');
    const limit = 1e4;

    const baseQuery =
      `WITH ${tblName} AS ${selectionSource} ` +
      `SELECT * FROM ${tblName} ` +
      (whereClause ? 'WHERE ' + whereClause : '');
    const query =
      `SELECT *, CAST(${ddTarget} AS STRING) AS ${ddAsStr} ` +
      `FROM (` +
      ` SELECT ${ddTarget} FROM (SELECT ${targetClause} FROM (${baseQuery}))` +
      ` GROUP BY ${ddTarget}` +
      `) ` +
      (search ? `WHERE ${ddAsStr} ILIKE '%${search}%' ` : '') +
      `ORDER BY ${orderByClause} ` +
      `LIMIT ${isBool ? 3 : limit}`;

    const recordsInBatch = await this.dbManager.queryAll(query, connId);
    let rowCount = 0;
    for (const rows of recordsInBatch) {
      for (const row of rows) {
        rowCount++;

        const data = transformDuckDBValue(row[ddTarget], subfield.type);
        const dataAsString = row[ddAsStr];
        pushValue(data, dataAsString);
      }
    }

    if (rowCount >= limit) result.limited = true;
  } catch (e) {
    if (connId === this.connectionIds.stateUpdate) {
      console.error(e);
    }
  } finally {
    if (this.connectionIds.suggestion === connId) {
      await this.dbManager.closeConnection(connId);
      this.connectionIds.suggestion = undefined;
    }
  }

  const rule = options?.filter ?? filterTarget?.filter;
  updateFilterableValues(result.data, column.id, rule, {
    expand: true,
    search,
  });
  return result;
}
