import type {
  CellStructChipFormatResult,
  List,
  MetaRun,
  NormalCellDescriptor,
  Struct,
} from "@datadocs/canvas-datagrid-ng";
import type { CellValue, StructFieldsItem } from "./type";
import {
  formatFormulaData,
  formatTableCellValue,
} from "@datadocs/canvas-datagrid-ng/lib/data/data-format";
import { columnTypeToLongFormString } from "@datadocs/canvas-datagrid-ng/lib/utils/column-types";
import { isHyperlinkDataFormat } from "@datadocs/canvas-datagrid-ng/lib/data/formatters/util";
import { getGrid } from "../../../app/store/grid/base";

export function getDisplayValue(value: CellValue, isRoot: boolean) {
  if (!value) return "";

  if ("dataType" in value) {
    return formatFormulaData(value, undefined, { isRoot });
  } else {
    return formatTableCellValue(value.value, value.columnType, undefined, {
      isRoot,
    });
  }
}

export function getCellDataType(cell: NormalCellDescriptor) {
  if (cell.table) {
    if (typeof cell.value === "string") return "string";

    return checkTableVariantType(cell)
      ? cell?.value?.dataType
      : columnTypeToLongFormString(cell?.tableHeader?.type);
  } else {
    return cell.meta?.parserData?.dataType;
  }
}

export function getStructFieldItems(cell: NormalCellDescriptor, index = -1) {
  index = Math.max(index, 0);
  const dataType = getCellDataType(cell);
  const isStructArray = dataType === "struct[]";
  const isStruct = dataType === "struct";
  const isTableVariantType = checkTableVariantType(cell);
  const fieldItems: Array<StructFieldsItem> = [];

  if (!isStruct && !isStructArray) {
    return {};
  }

  let parserData = cell?.meta?.parserData;
  let tableStructData: { value: any; type: Struct };

  if (cell.table && !isTableVariantType) {
    let columnType: Struct;
    let structValue: any;
    if (isStructArray) {
      columnType = (cell.tableHeader.type as List).child.type as Struct;
      structValue = cell.value[index];
    } else {
      columnType = cell.tableHeader.type as Struct;
      structValue = cell.value;
    }
    const childrenType = columnType.children;

    for (const childType of childrenType) {
      const key = childType.name;
      fieldItems.push({
        key,
        value: { columnType: childType.type, value: structValue[key] },
      });
    }

    tableStructData = { value: structValue, type: columnType };
  } else {
    if (isTableVariantType) {
      parserData = cell.value;
    }
    parserData = isStructArray
      ? parserData.value[index].value
      : parserData.value;

    for (const key in parserData) {
      if (Object.prototype.hasOwnProperty.call(parserData, key)) {
        fieldItems.push({ key, value: parserData[key] });
      }
    }
  }

  return { fieldItems, parserData, tableStructData };
}

export function countStructArrayValue(cell: NormalCellDescriptor) {
  const dataType = getCellDataType(cell);
  const isStructArray = dataType === "struct[]";
  if (!isStructArray) return 0;

  if (cell.table) {
    const value = checkTableVariantType(cell)
      ? cell?.value?.value
      : cell?.value;
    return value?.length ?? 0;
  } else {
    return cell?.meta?.parserData?.value.length ?? 0;
  }
}

export function getStructArrayChips(
  cell: NormalCellDescriptor,
  startIndex: number,
  endIndex: number
): string[] {
  const dataType = getCellDataType(cell);
  const isStructArray = dataType === "struct[]";

  if (!isStructArray) {
    return [];
  }

  const chips = [];
  const childCount = countStructArrayValue(cell);
  const isTableVariantType = checkTableVariantType(cell);

  if (endIndex > childCount - 1) endIndex = childCount - 1;
  if (startIndex > endIndex) startIndex = endIndex;

  if (cell.table && !isTableVariantType) {
    const type = (cell.tableHeader.type as List).child.type as Struct;
    const value = cell.value;

    for (let index = startIndex; index <= endIndex; index++) {
      const chip = formatTableCellValue(value[index], type, cell.dataFormat, {
        isRoot: true,
      }) as CellStructChipFormatResult;

      chips.push(chip.value[0]);
    }
  } else {
    const value = isTableVariantType
      ? cell?.value?.value
      : cell?.meta?.parserData?.value;

    for (let index = startIndex; index <= endIndex; index++) {
      const chip = formatFormulaData(value[index], cell.dataFormat, {
        isRoot: true,
      }) as CellStructChipFormatResult;

      chips.push(chip.value[0]);
    }
  }

  return chips;
}

/**
 * Get json value form cell
 *
 * @param cell
 * @returns
 */
export function getCellJsonValue(cell: NormalCellDescriptor) {
  if (cell.table) {
    return checkTableVariantType(cell) ? cell.value?.value : cell.value;
  } else {
    return cell?.meta?.parserData?.value;
  }
}

export function isJsonArray(value: any) {
  return Array.isArray(value);
}

export function isJsonObject(value: any) {
  return !isJsonArray(value) && typeof value === "object" && value != null;
}

/**
 * Check if a cell is in Table Variant column
 * @param cell
 * @returns
 */
export function checkTableVariantType(cell: NormalCellDescriptor) {
  return (
    cell?.tableHeader &&
    columnTypeToLongFormString(cell.tableHeader.type) === "variant"
  );
}

/**
 * Check if a cell with json value should have layover or not. In case
 * the value is null/number/string, we shouldn't have layover menu.
 * @param cell
 * @returns
 */
export function shouldShowJsonLayover(cell: NormalCellDescriptor) {
  const value = getCellJsonValue(cell);
  return isJsonArray(value) || isJsonObject(value);
}

/**
 * Check if there are hyperlinks inside the cell value, use for showing
 * Hyperlink Menu
 * @param cell
 * @returns
 */
export function checkHyperlinkRuns(cell: NormalCellDescriptor) {
  return (
    !isHyperlinkDataFormat(cell.dataFormat) &&
    cell.linkRuns &&
    cell.linkRuns.length > 0
  );
}

/**
 * Get and transform Hyperlink data format into link-run format in order to
 * unify and show in in layover menu.
 * @param cell
 * @returns
 */
export function getHyperlinkRunsFromDataFormat(
  cell: NormalCellDescriptor
): MetaRun[] {
  if (!isHyperlinkDataFormat(cell.dataFormat)) {
    return;
  }

  const format = cell.dataFormat;
  let cellValue = cell.value;

  if (cell.value && typeof cell.value === "object") {
    // variant cell value
    cellValue = cell.value?.value;
  }
  if (cell?.meta?.parserData) {
    // free form cell value
    cellValue = cell.meta.parserData.value;
  }

  if (format.style?.startsWith("l")) {
    return [
      {
        ref: cellValue,
        label: cell.linkLabel ? cell.linkLabel : null,
      },
    ];
  } else if (format.style?.startsWith("r") && cell.linkRef) {
    return [{ ref: cell.linkRef, label: cellValue }];
  }
}

/**
 * Get all hyperlinks inside a cell. It can be from metadata link-runs
 * or Hyperlink data-format.
 * @param cell
 * @returns
 */
export function getCellHyperlinkRuns(cell: NormalCellDescriptor): MetaRun[] {
  const cellType = getGrid().getDataTypeByIndex(
    cell.rowIndex,
    cell.columnIndex
  );

  if (cell.inferLink && cell.linkRuns?.length > 0) {
    return cell.linkRuns;
  } else if (cellType === "string" && isHyperlinkDataFormat(cell.dataFormat)) {
    return getHyperlinkRunsFromDataFormat(cell);
  } else if (cell.linkRuns?.length > 0) {
    return cell.linkRuns;
  }

  return null;
}

/**
 * Check if there are hyperlinks inside a cell. It can be from metadata
 * link-runs or Hyperlink data-format.
 * @param cell
 * @returns
 */
export function hasHyperlinkRuns(cell: NormalCellDescriptor): boolean {
  const linkRuns = getCellHyperlinkRuns(cell);
  return linkRuns && linkRuns.length > 0;
}
