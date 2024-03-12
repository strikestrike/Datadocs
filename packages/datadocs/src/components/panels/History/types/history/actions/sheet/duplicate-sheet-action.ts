import { getSheetsData } from "../../../../../../../app/store/store-worksheets";
import type { WorkbookSheet } from "../../../../../../../app/store/types";
import {
  deleteSheet,
  recoverSheet,
} from "../../../../../../toolbars/MainStatusBar/utils";
import type MacroAction from "../../../macro/actions/macro-action";
import { MacroState } from "../../../macro/actions/macro-action";
import { DuplicateSheetMacroAction } from "../../../macro/actions/sheet-action";
import type { MACRO_ITEM_REFERENCE_TYPE } from "../../../type";
import { HistoryState } from "../history-action";
import { SheetAction } from "./sheet-action";

export class RedoDuplicateSheetState extends HistoryState {
  worksheet: WorkbookSheet;
  position: number;
  sheetName: string;

  constructor(worksheet: WorkbookSheet, position: number, sheetName: string) {
    super("DUPLICATE_SHEET");
    this.worksheet = worksheet;
    this.position = position;
    this.sheetName = sheetName;
  }
}

export class DuplicateSheetAction extends SheetAction {
  constructor(
    sheetId: string,
    undoState: HistoryState,
    redoState: RedoDuplicateSheetState,
    userId: string,
    tags: string[]
  ) {
    tags.push(...["duplicate sheet", "sheet"]);
    super(sheetId, undoState, redoState, userId, tags, false);
  }

  get displayName(): string {
    const redoState = this.redoState as RedoDuplicateSheetState;
    return "Duplicated sheet '" + redoState.sheetName + "'";
  }

  async undo(refresh: boolean) {
    const sheetsData = getSheetsData();
    const sheet = sheetsData.find((s) => s.id === this.sheetId);
    if (!sheet) {
      throw new Error("Sheet not found.");
    }
    await deleteSheet(sheet, false);
  }

  async redo(refresh: boolean) {
    const redoState = this.redoState as RedoDuplicateSheetState;
    await recoverSheet(
      redoState.worksheet.workbookId,
      redoState.worksheet.id,
      redoState.position,
      redoState.worksheet
    );
  }

  toMacroAction(
    reference: MACRO_ITEM_REFERENCE_TYPE,
    gridActiveCellMap: Map<string, any>
  ): MacroAction[] {
    return [new DuplicateSheetMacroAction(new MacroState("DUPLICATE_SHEET"))];
  }
}
