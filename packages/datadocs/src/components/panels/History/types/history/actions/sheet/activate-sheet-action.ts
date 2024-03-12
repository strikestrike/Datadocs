import {
  changeSheetsData,
  getSheetsData,
} from "../../../../../../../app/store/store-worksheets";
import { switchTab } from "../../../../../../common/tabs";
import type MacroAction from "../../../macro/actions/macro-action";
import {
  ActivateSheetMacroAction,
  ActivateSheetMacroState,
} from "../../../macro/actions/sheet-action";
import type { MACRO_ITEM_REFERENCE_TYPE } from "../../../type";
import { delay } from "../../../utils";
import { HistoryState } from "../history-action";
import { SheetAction } from "./sheet-action";

export class ActivateSheetState extends HistoryState {
  name: string;
  constructor(name: string) {
    super("ACTIVATE_SHEET");
    this.name = name;
  }
}

export class ActivateSheetAction extends SheetAction {
  constructor(
    sheetId: string,
    redoState: ActivateSheetState,
    userId: string,
    tags: string[]
  ) {
    super(sheetId, null, redoState, userId, tags, true);
  }

  get displayName(): string {
    const redoState = this.redoState as ActivateSheetState;

    return "Activated sheet '" + redoState.name + "'";
  }

  async undo(refresh: boolean) {
    return null;
  }

  async redo(refresh: boolean) {
    const sheetsData = getSheetsData();
    const sheet = sheetsData.find((s) => s.id === this.sheetId);
    if (!sheet) {
      return null;
    }
    if (!sheet.isActive) {
      const sheetsData = getSheetsData();
      switchTab(sheetsData, sheet.id);
      changeSheetsData(sheetsData);
      await delay(10);
    }
  }

  toMacroAction(
    reference: MACRO_ITEM_REFERENCE_TYPE,
    gridActiveCellMap: Map<string, any>
  ): MacroAction[] {
    return [
      new ActivateSheetMacroAction(
        new ActivateSheetMacroState((this.redoState as ActivateSheetState).name)
      ),
    ];
  }
}
