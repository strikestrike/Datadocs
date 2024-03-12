import { getSheetsData } from "../../../../../../../app/store/store-worksheets";
import { changeSheetName } from "../../../../../../toolbars/MainStatusBar/utils";
import type MacroAction from "../../../macro/actions/macro-action";
import {
  ChangeSheetNameMacroAction,
  ChangeSheetNameMacroState,
} from "../../../macro/actions/sheet-action";
import type { MACRO_ITEM_REFERENCE_TYPE } from "../../../type";
import { HistoryState } from "../history-action";
import { SheetAction } from "./sheet-action";

export class ChangeSheetNameState extends HistoryState {
  sheetName: string;
  constructor(sheetName: string) {
    super("CHANGE_SHEET_NAME");
    this.sheetName = sheetName;
  }
}

export class ChangeSheetNameAction extends SheetAction {
  constructor(
    sheetId: string,
    undoState: ChangeSheetNameState,
    redoState: ChangeSheetNameState,
    userId: string,
    tags: string[]
  ) {
    tags.push("change sheet name");
    super(sheetId, undoState, redoState, userId, tags, false);
  }

  get displayName(): string {
    const redoState = this.redoState as ChangeSheetNameState;
    const undoState = this.undoState as ChangeSheetNameState;
    return (
      "Change sheet name from '" +
      undoState.sheetName +
      "' to '" +
      redoState.sheetName +
      "'"
    );
  }

  async undo(refresh: boolean) {
    const undoState = this.undoState as ChangeSheetNameState;
    const sheetsData = getSheetsData();
    const sheet = sheetsData.find((s) => s.id === this.sheetId);
    if (!sheet) {
      throw new Error("Sheet not found.");
    }
    await changeSheetName(this.sheetId, undoState.sheetName, false);
  }

  async redo(refresh: boolean) {
    const redoState = this.redoState as ChangeSheetNameState;
    const sheetsData = getSheetsData();
    const sheet = sheetsData.find((s) => s.id === this.sheetId);
    if (!sheet) {
      throw new Error("Sheet not found.");
    }
    await changeSheetName(this.sheetId, redoState.sheetName, false);
  }

  toMacroAction(
    reference: MACRO_ITEM_REFERENCE_TYPE,
    gridActiveCellMap: Map<string, any>
  ): MacroAction[] {
    const redoState = this.redoState as ChangeSheetNameState;
    return [
      new ChangeSheetNameMacroAction(
        new ChangeSheetNameMacroState(redoState.sheetName)
      ),
    ];
  }
}
