import { getSheetsData } from "../../../../../../../app/store/store-worksheets";
import type { WorkbookSheet } from "../../../../../../../app/store/types";
import {
  deleteSheet,
  recoverSheet,
} from "../../../../../../toolbars/MainStatusBar/utils";
import type MacroAction from "../../../macro/actions/macro-action";
import {
  NewSheetMacroAction,
  NewSheetMacroState,
} from "../../../macro/actions/sheet-action";
import type { MACRO_ITEM_REFERENCE_TYPE } from "../../../type";
import { HistoryState } from "../history-action";
import { SheetAction } from "./sheet-action";

export class RedoNewSheetState extends HistoryState {
  worksheet: WorkbookSheet;
  position: number;
  constructor(worksheet: WorkbookSheet, position: number) {
    super("ADD_SHEET");
    this.worksheet = worksheet;
    this.position = position;
  }
}

export class NewSheetAction extends SheetAction {
  constructor(
    sheetId: string,
    undoState: HistoryState,
    redoState: RedoNewSheetState,
    userId: string,
    tags: string[]
  ) {
    tags.push(...["new sheet"]);
    super(sheetId, undoState, redoState, userId, tags, false);
  }

  get displayName(): string {
    return "Created new sheet";
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
    const redoState = this.redoState as RedoNewSheetState;
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
    const redoState = this.redoState as RedoNewSheetState;
    return [
      new NewSheetMacroAction(new NewSheetMacroState(redoState.position)),
    ];
  }
}
