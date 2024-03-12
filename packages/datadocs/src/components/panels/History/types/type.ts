import type {
  CellStyleDeclaration,
  CellStyleDeclarationKey,
} from "@datadocs/canvas-datagrid-ng";
import type {
  ActiveContainer,
  ActivePane,
  ActiveView,
} from "../../../../app/store/types";
import type {
  BorderStyle,
  BorderValue,
} from "../../../toolbars/MainToolbar/dropdowns/default";
import {
  MACRO_ERROR_CODE_ACTIVATE_SHEET,
  MACRO_ERROR_CODE_CHANGE_SHEET_NAME,
  MACRO_ERROR_CODE_DELETE_SHEET,
  MACRO_ERROR_CODE_DUPLICATE_SHEET,
  MACRO_ERROR_CODE_INVALID_ARGUMENT,
  MACRO_ERROR_CODE_NEW_SHEET,
  MACRO_ERROR_CODE_REORDER_SHEET,
  MACRO_ERROR_CODE_STARTING_ROW_COLUMN_TOO_SMALL,
} from "./constants";

/**
 * action types
 */
export type HistoryActionType = "BASE" | "GRID" | "PANEL";

/**
 * state types
 */
export type StyleStateType = CellStyleDeclarationKey[] | "CLEAR_STYLE";

export type ValueStateType = "ENTER_VALUE" | "CLEAR_VALUE";

export type MergeCellStateType = "MERGE_CELL" | "UNMERGE_CELL";

export type SelectionStateType = "ACTIVE_RANGE_LIST" | "ACTIVE_CELL";

export type GridStateType =
  | StyleStateType
  | ValueStateType
  | MergeCellStateType
  | SelectionStateType;

export type SheetStateType =
  | "ADD_SHEET"
  | "REMOVE_SHEET"
  | "CHANGE_SHEET_NAME"
  | "DUPLICATE_SHEET"
  | "REORDER_SHEET"
  | "ACTIVATE_SHEET";

export type HistoryStateType =
  | "BASE"
  | GridStateType
  | SheetStateType
  | "HIDDEN";

/**
 *
 */
export type GridExtraInfo = {
  /**
   * Indicate if apply entire column is on when apply data format
   * to table cells
   */
  applyEntireColumn?: boolean;
  /**
   * Whether the cell link-runs should be removed or not
   */
  clearLinkRuns?: boolean;
};

export type SelectionOffsetDeclarator = {
  offsetRow: number;
  offsetColumn: number;
  numRow: number;
  numColumn: number;
};

export type ActiveCellOffsetDeclarator = {
  offsetRow: number;
  offsetColumn: number;
};

export type GridActiveComponent = {
  activePane: ActivePane;
  activeView: ActiveView;
  activeContainer: ActiveContainer;
  activePaneTab: {
    id: string;
    activeIndex: number;
  };
};

export type BorderInfoType = {
  style: BorderStyle;
  type: BorderValue;
  color: string;
};

export type MACRO_ITEM_REFERENCE_TYPE = "ABSOLUTE" | "RELATIVE";

export class MacroError {
  errorcode: number;

  constructor(code: number) {
    this.errorcode = code;
  }

  what(): string {
    let errmsg = "Exception: ";
    switch (this.errorcode) {
      case MACRO_ERROR_CODE_INVALID_ARGUMENT:
        {
          errmsg += "Invalid Argument!";
        }
        break;

      case MACRO_ERROR_CODE_STARTING_ROW_COLUMN_TOO_SMALL:
        {
          errmsg += "The starting row/column of the range is too small.";
        }
        break;

      case MACRO_ERROR_CODE_NEW_SHEET:
        {
          errmsg += "New sheet has error!";
        }
        break;

      case MACRO_ERROR_CODE_DUPLICATE_SHEET:
        {
          errmsg += "Duplicate sheet has error!";
        }
        break;

      case MACRO_ERROR_CODE_CHANGE_SHEET_NAME:
        {
          errmsg += "Change sheet name has error!";
        }
        break;

      case MACRO_ERROR_CODE_DELETE_SHEET:
        {
          errmsg += "Delete sheet has error!";
        }
        break;

      case MACRO_ERROR_CODE_REORDER_SHEET:
        {
          errmsg += "Reorder sheet has error!";
        }
        break;

      case MACRO_ERROR_CODE_ACTIVATE_SHEET:
        {
          errmsg += "Activate sheet has error!";
        }
        break;

      default:
        {
          errmsg += "Unknown!";
        }
        break;
    }

    return errmsg;
  }
}
