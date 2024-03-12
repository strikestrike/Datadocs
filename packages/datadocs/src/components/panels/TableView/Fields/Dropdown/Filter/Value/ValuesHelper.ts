import type {
  FilterableValues,
  GridFilterCondition,
  GridFilterValue,
  GridHeader,
  TableDescriptor,
} from "@datadocs/canvas-datagrid-ng";
import {
  getFilterValueAsString,
  getPathInfo,
} from "@datadocs/canvas-datagrid-ng/lib/data/data-source/filters/utils";

export async function getValueSuggestionsData(
  table: TableDescriptor,
  header: GridHeader,
  currentCondition: GridFilterCondition,
  value: GridFilterValue | undefined
): Promise<FilterableValues> {
  const pathInfo = getPathInfo(header, currentCondition.target);
  const search = value ? getFilterValueAsString(value).trim() : "";
  const result = table.dataSource.getFilterableValuesForColumn(header.id, {
    search,
    valueHelper: true,
    filter: currentCondition,
    limit: 10,
    unnest: true,
    pathInfo,
  });

  return result instanceof Promise ? await result : result;
}
