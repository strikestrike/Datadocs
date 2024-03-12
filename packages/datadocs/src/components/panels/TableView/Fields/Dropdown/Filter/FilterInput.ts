import type {
  Field,
  GridFilterCondition,
  GridFilterInputType,
  GridHeader,
  List,
} from "@datadocs/canvas-datagrid-ng";
import { DataType } from "@datadocs/canvas-datagrid-ng";
import {
  GRID_FILTER_CONDITION_NAME_ARRAY_CONTAINS,
  GRID_FILTER_CONDITION_NAME_ARRAY_NOT_CONTAINS,
  GRID_FILTER_CONDITION_NAME_CELL_COLOR,
  GRID_FILTER_CONDITION_NAME_CUSTOM_FORMULA,
  GRID_FILTER_CONDITION_NAME_TEXT_COLOR,
  GRID_FILTER_INPUT_TYPE_BOOLEAN,
  GRID_FILTER_INPUT_TYPE_DATE,
  GRID_FILTER_INPUT_TYPE_DATETIME,
  GRID_FILTER_INPUT_TYPE_GEO,
  GRID_FILTER_INPUT_TYPE_INTERVAL,
  GRID_FILTER_INPUT_TYPE_NUMBER,
  GRID_FILTER_INPUT_TYPE_STRING,
  GRID_FILTER_INPUT_TYPE_TIME,
} from "@datadocs/canvas-datagrid-ng/lib/data/data-source/filters/constants";
import {
  getHeaderAsField,
  getPathInfoFromConditionTarget,
  resolveStructField,
} from "@datadocs/canvas-datagrid-ng/lib/data/data-source/filters/utils";

export function getInputTypeFromCondition(
  header: GridHeader,
  condition: GridFilterCondition
) {
  const setOp = condition?.setOp;
  const conditionName = condition?.target.conditionName;
  const pathInfo =
    condition && getPathInfoFromConditionTarget(condition.target);

  switch (conditionName) {
    case GRID_FILTER_CONDITION_NAME_CUSTOM_FORMULA:
    case GRID_FILTER_CONDITION_NAME_ARRAY_CONTAINS:
    case GRID_FILTER_CONDITION_NAME_ARRAY_NOT_CONTAINS:
    case GRID_FILTER_CONDITION_NAME_TEXT_COLOR:
    case GRID_FILTER_CONDITION_NAME_CELL_COLOR:
      return GRID_FILTER_INPUT_TYPE_STRING;
  }
  if (
    setOp &&
    typeof header.type === "object" &&
    header.type.typeId === DataType.List
  ) {
    return getInputTypeFromField((header.type as List).child);
  }
  return getInputTypeFromField(
    getHeaderAsField(header),
    pathInfo?.path ?? header.structFilterPath
  );
}

function getInputTypeFromField(
  field: Field,
  structField?: string
): GridFilterInputType | undefined {
  const { type: fieldType } = field;
  const type = typeof fieldType === "object" ? fieldType.typeId : fieldType;
  switch (type) {
    case "date":
    case DataType.Date:
      return GRID_FILTER_INPUT_TYPE_DATE;
    case DataType.DateTime:
      return GRID_FILTER_INPUT_TYPE_DATETIME;
    case DataType.Time:
      return GRID_FILTER_INPUT_TYPE_TIME;
    case "number":
    case "int":
    case "float":
    case DataType.Decimal:
    case DataType.Float:
      return GRID_FILTER_INPUT_TYPE_NUMBER;
    case DataType.Interval:
      return GRID_FILTER_INPUT_TYPE_INTERVAL;
    case DataType.Struct:
      return structField
        ? getInputTypeFromField(resolveStructField(field, structField))
        : undefined;
    case DataType.Geography:
      return GRID_FILTER_INPUT_TYPE_GEO;
  }
  if (type === "boolean") {
    return GRID_FILTER_INPUT_TYPE_BOOLEAN;
  }
  return GRID_FILTER_INPUT_TYPE_STRING;
}
