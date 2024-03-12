import type {
  CellDataFormat,
  CellStyleDeclaration,
  CellStyleDeclarationKey,
  SelectionDescriptor,
} from "@datadocs/canvas-datagrid-ng/lib/types";
import { CellStyleKeyFriendlyName } from "./constants";
import type {
  ActiveCellOffsetDeclarator,
  BorderInfoType,
  MACRO_ITEM_REFERENCE_TYPE,
  SelectionOffsetDeclarator,
} from "./type";

export function getStyleMessage(
  keys: CellStyleDeclarationKey[],
  value: Partial<CellStyleDeclaration> | BorderInfoType
): string {
  let msg = "";
  for (let key of keys) {
    switch (key) {
      case "isBold":
      case "isItalic":
      case "isStrikethrough": {
        if (value[key]) {
          msg += "Set " + CellStyleKeyFriendlyName.get(key);
        } else {
          msg += "Clear " + CellStyleKeyFriendlyName.get(key);
        }
        break;
      }
      case "dataFormat": {
        msg += getDataFormatMessage(value[key]); 
        break;
      }
      case "borders": {
        msg += "Set " + CellStyleKeyFriendlyName.get(key);
        break;
      }
      default: {
        msg +=
          "Set " +
          CellStyleKeyFriendlyName.get(key) +
          " to '" +
          value[key] +
          "'";
      }
    }
  }
  return msg;
}

function getDataFormatMessage(value: CellDataFormat) {
  const name = CellStyleKeyFriendlyName.get("dataFormat");
  let message = "";

  if (!value) {
    message = `Set ${name} to default`; 
  } else {
    message = `Set ${name} type ${value.type.toUpperCase()} to ${value.format}`;
  }

  if (value.type === 'number' && !isNaN(value.decimalPlaces)) {
    message += ` with decimal places ${value.decimalPlaces}`;
  }

  return message;
}

export function gridSelectionFromSelectionOffset(
  selOffset: SelectionOffsetDeclarator,
  reference: MACRO_ITEM_REFERENCE_TYPE,
  currentActiveCell: any,
  activeOffsetList: ActiveCellOffsetDeclarator[]
): SelectionDescriptor {
  const isAbsolute = reference === "ABSOLUTE";
  let offset: ActiveCellOffsetDeclarator = {
    offsetRow: selOffset.offsetRow,
    offsetColumn: selOffset.offsetColumn,
  };
  for (const ao of activeOffsetList) {
    offset.offsetRow += ao.offsetRow;
    offset.offsetColumn += ao.offsetColumn;
  }
  return {
    type: 1,
    startRow: isAbsolute
      ? selOffset.offsetRow
      : currentActiveCell.rowIndex + offset.offsetRow,
    startColumn: isAbsolute
      ? selOffset.offsetColumn
      : currentActiveCell.columnIndex + offset.offsetColumn,
    endRow:
      (isAbsolute
        ? selOffset.offsetRow
        : currentActiveCell.rowIndex + offset.offsetRow) +
      selOffset.numRow -
      1,
    endColumn:
      (isAbsolute
        ? selOffset.offsetColumn
        : currentActiveCell.columnIndex + offset.offsetColumn) +
      selOffset.numColumn -
      1,
  };
}

export function gridActiveCellFromCellOffset(
  activeCellOffset: ActiveCellOffsetDeclarator,
  reference: MACRO_ITEM_REFERENCE_TYPE,
  currentActiveCell: any,
  activeOffsetList: ActiveCellOffsetDeclarator[]
) {
  const isAbsolute = reference === "ABSOLUTE";
  let offset: ActiveCellOffsetDeclarator = {
    offsetRow: activeCellOffset.offsetRow,
    offsetColumn: activeCellOffset.offsetColumn,
  };
  for (const ao of activeOffsetList) {
    offset.offsetRow += ao.offsetRow;
    offset.offsetColumn += ao.offsetColumn;
  }
  return {
    rowIndex: isAbsolute
      ? activeCellOffset.offsetRow
      : offset.offsetRow + currentActiveCell.rowIndex,
    columnIndex: isAbsolute
      ? activeCellOffset.offsetColumn
      : offset.offsetColumn + currentActiveCell.columnIndex,
  };
}

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
