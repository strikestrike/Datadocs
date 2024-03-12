import type { CellStyleDeclarationKey } from "@datadocs/canvas-datagrid-ng/lib/types";

export const CellStyleKeyFriendlyName: Map<CellStyleDeclarationKey, string> =
  new Map([
    ["isBold", "bold"],
    ["isItalic", "italic"],
    ["isStrikethrough", "strikethrough"],
    ["fontSize", "font size"],
    ["fontFamily", "font family"],
    ["horizontalAlignment", "horizontal"],
    ["verticalAlignment", "vertical"],
    ["textColor", "text color"],
    ["wrapMode", "wrap mode"],
    ["borders", "borders"],
    ["backgroundColor", "background color"],
    ["dataFormat", "Data Format"],
  ]);

/**
 * Constants for Undo redo
 */
export const HISTORY_ACTION_TYPE_UNDO = "undo";
export const HISTORY_ACTION_TYPE_REDO = "redo";

export const HISTORY_TEXT_ACTION_MAX_LENGTH = 15;

export const HISTORY_GRID_SELECTION_MAX_LENGTH = 10;

export const MACRO_ERROR_CODE_INVALID_ARGUMENT = 1;
export const MACRO_ERROR_CODE_STARTING_ROW_COLUMN_TOO_SMALL = 2;
export const MACRO_ERROR_CODE_NEW_SHEET = 3;
export const MACRO_ERROR_CODE_DUPLICATE_SHEET = 4;
export const MACRO_ERROR_CODE_CHANGE_SHEET_NAME = 5;
export const MACRO_ERROR_CODE_DELETE_SHEET = 6;
export const MACRO_ERROR_CODE_REORDER_SHEET = 7;
export const MACRO_ERROR_CODE_ACTIVATE_SHEET = 8;