import {
  DataType,
  type ColumnType,
  type GridHeader,
  type TableDescriptor,
  type GridFilterCondition,
  type FilterFieldPathInfo,
} from "@datadocs/canvas-datagrid-ng";
import type { FilterAndSorterContext } from "./type";
import {
  getFiltersForField,
  getHeaderAsField,
  getPathInfo,
  resolveStructField,
} from "@datadocs/canvas-datagrid-ng/lib/data/data-source/filters/utils";
import { getSortLabelsForColumnType } from "@datadocs/canvas-datagrid-ng/lib/data/data-source/sorters/utils";

export function getFilterAndSortContext(
  table: TableDescriptor,
  header: GridHeader,
  options?: {
    condition?: GridFilterCondition;
    pathInfo?: FilterFieldPathInfo;
  }
): FilterAndSorterContext {
  const isJson = isJsonType(header.type);
  const isStruct = isStructType(header.type);

  const pathInfo =
    options?.pathInfo ?? getPathInfo(header, options?.condition?.target);

  const structPath =
    (pathInfo && pathInfo.path) ||
    (isStruct || isJson
      ? table.dataSource.getStructFilterPath(header.id)
      : undefined);
  const structPathType =
    (pathInfo && pathInfo.pathType) ||
    (isJson ? table.dataSource.getStructFilterPathType(header.id) : undefined);
  const fieldToFilter = getFieldToFilter(header, structPath);
  const sortLabels = fieldToFilter
    ? getSortLabelsForColumnType(fieldToFilter.type)
    : undefined;
  const availableFilters = fieldToFilter
    ? getFiltersForField(fieldToFilter, structPath, structPathType)
    : undefined;
  const isBool = fieldToFilter?.type === "boolean";
  const isGeo =
    typeof fieldToFilter?.type === "object" &&
    fieldToFilter.type.typeId === DataType.Geography;

  return {
    fieldToFilter,
    availableFilters,
    geoSortType: undefined,
    isBool,
    isGeo,
    isJson,
    isStruct,
    needsStructFieldSelection: isStruct && !structPath,
    sortLabels,
    structPath,
    structPathType,
  };
}

export function getFieldToFilter(
  header: GridHeader,
  structPath: string | undefined
) {
  const field = getHeaderAsField(header);
  if (!isStructType(header.type)) return field;
  if (!structPath) return;
  return resolveStructField(field, structPath);
}

function isJsonType(colType: ColumnType) {
  return typeof colType === "object" && colType.typeId === DataType.Json;
}

function isStructType(colType: ColumnType) {
  return typeof colType === "object" && colType.typeId === DataType.Struct;
}
