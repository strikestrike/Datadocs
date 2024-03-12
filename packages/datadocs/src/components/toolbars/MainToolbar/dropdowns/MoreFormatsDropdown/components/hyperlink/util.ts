import type { GridHeader } from "@datadocs/canvas-datagrid-ng";
import {
  getCellDataFormatByIndex,
  getTableColumnsAt,
} from "../../../../../../../app/store/store-toolbar";
import { isHyperlinkDataFormat } from "@datadocs/canvas-datagrid-ng/lib/data/formatters/util";
import { getGrid } from "../../../../../../../app/store/grid/base";

export const MAX_ITEM_WIDTH = 350;

export function getTableStringColumnsAt(
  rowIndex: number,
  columnIndex: number
): GridHeader[] {
  const allColumns = getTableColumnsAt(rowIndex, columnIndex);
  let stringColumns: GridHeader[] = [];

  if (Array.isArray(allColumns)) {
    stringColumns = allColumns.filter((column) => {
      return column.type === "string";
    });
  }

  return stringColumns;
}

/**
 * Check if a cell at @rowIndex and @columnIndex with Hyperlink data format
 * but doesn't define the link url.
 *
 * @param rowIndex
 * @param columnIndex
 */
export function checkMissingLinkRef(rowIndex: number, columnIndex: number) {
  const grid = getGrid();
  const dataFormat = getCellDataFormatByIndex(rowIndex, columnIndex);
  const isStringCell =
    grid.getCellDataTypeByIndex(rowIndex, columnIndex) === "string";

  if (
    !isHyperlinkDataFormat(dataFormat) ||
    !dataFormat.style?.startsWith("r") ||
    !isStringCell
  ) {
    return false;
  }

  const formatStyle = dataFormat.style;
  const table = grid.getTableAt(rowIndex, columnIndex);
  let linkRef: string;
  // console.log(
  //   "debug here ===== getCellDataTypeByIndex === ",
  //   grid.getCellDataTypeByIndex(rowIndex, columnIndex)
  // );
  if (formatStyle === "rtext") {
    linkRef = dataFormat.value;
  } else if (formatStyle === "rcolumn" && table && isStringCell) {
    linkRef = grid.getTableCellValueByColumnId?.(
      table,
      dataFormat.value,
      rowIndex
    );
  }

  return !linkRef;
}
