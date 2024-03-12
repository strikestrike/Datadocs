import { getSheetsData } from "../../../../../../../app/store/store-worksheets";
import type { WorkbookSheet } from "../../../../../../../app/store/types";
import {
  deleteSheet,
  recoverSheet,
} from "../../../../../../toolbars/MainStatusBar/utils";
import MacroAction, { MacroState } from "../../../macro/actions/macro-action";
import { DeleteSheetMacroAction } from "../../../macro/actions/sheet-action";
import type { MACRO_ITEM_REFERENCE_TYPE } from "../../../type";
import { HistoryState } from "../history-action";
import { SheetAction } from "./sheet-action";

export class UndoDeleteSheetState extends HistoryState {
  worksheet: WorkbookSheet;
  position: number;

  constructor(worksheet: WorkbookSheet, position: number) {
    super("REMOVE_SHEET");
    this.worksheet = worksheet;
    this.position = position;
  }
}

export class DeleteSheetAction extends SheetAction {
  constructor(
    sheetId: string,
    undoState: UndoDeleteSheetState,
    redoState: HistoryState,
    userId: string,
    tags: string[]
  ) {
    tags.push(...["delete sheet", "sheet"]);
    super(sheetId, undoState, redoState, userId, tags, false);
  }

  get displayName(): string {
    const undoState = this.undoState as UndoDeleteSheetState;
    return "Deleted sheet '" + undoState.worksheet.name + "'";
  }

  async undo(refresh: boolean) {
    const undoState = this.undoState as UndoDeleteSheetState;
    await recoverSheet(
      undoState.worksheet.workbookId,
      undoState.worksheet.id,
      undoState.position,
      undoState.worksheet
    );
  }

  async redo(refresh: boolean) {
    const sheetsData = getSheetsData();
    const sheet = sheetsData.find((s) => s.id === this.sheetId);
    if (!sheet) {
      throw new Error("Sheet not found.");
    }
    await deleteSheet(sheet, false);
  }

  toMacroAction(
    reference: MACRO_ITEM_REFERENCE_TYPE,
    gridActiveCellMap: Map<string, any>
  ): MacroAction[] {
    return [new DeleteSheetMacroAction(new MacroState("REMOVE_SHEET"))];
  }
}
