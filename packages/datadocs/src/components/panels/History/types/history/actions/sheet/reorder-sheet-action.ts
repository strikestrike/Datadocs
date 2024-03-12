import { getSheetsData } from "../../../../../../../app/store/store-worksheets";
import { reorderWorksheet } from "../../../../../../toolbars/MainStatusBar/utils";
import type MacroAction from "../../../macro/actions/macro-action";
import {
  ReorderSheetMacroAction,
  ReorderSheetMacroState,
} from "../../../macro/actions/sheet-action";
import type { MACRO_ITEM_REFERENCE_TYPE } from "../../../type";
import { HistoryState } from "../history-action";
import { SheetAction } from "./sheet-action";

export class ReorderSheetState extends HistoryState {
  index: number;
  constructor(index: number) {
    super("REORDER_SHEET");
    this.index = index;
  }
}

export class ReorderSheetAction extends SheetAction {
  constructor(
    sheetId: string,
    undoState: ReorderSheetState,
    redoState: ReorderSheetState,
    userId: string,
    tags: string[]
  ) {
    tags.push(...["reorder", "sheet"]);
    super(sheetId, undoState, redoState, userId, tags, false);
  }

  get displayName(): string {
    const undoState = this.undoState as ReorderSheetState;
    const redoState = this.redoState as ReorderSheetState;

    return (
      "Reorder sheet from " +
      (undoState.index + 1) +
      " to " +
      (redoState.index + 1)
    );
  }

  async undo(refresh: boolean) {
    const undoState = this.undoState as ReorderSheetState;
    const redoState = this.redoState as ReorderSheetState;
    const sheetsData = getSheetsData();
    const sheet = sheetsData[redoState.index];
    if (!sheet) {
      throw new Error("Sheet not found.");
    }
    await reorderWorksheet(redoState.index, undoState.index, false);
  }

  async redo(refresh: boolean) {
    const undoState = this.undoState as ReorderSheetState;
    const redoState = this.redoState as ReorderSheetState;
    const sheetsData = getSheetsData();
    const sheet = sheetsData[undoState.index];
    if (!sheet) {
      throw new Error("Sheet not found.");
    }
    await reorderWorksheet(undoState.index, redoState.index, false);
  }

  toMacroAction(
    reference: MACRO_ITEM_REFERENCE_TYPE,
    gridActiveCellMap: Map<string, any>
  ): MacroAction[] {
    return [
      new ReorderSheetMacroAction(
        new ReorderSheetMacroState((this.redoState as ReorderSheetState).index)
      ),
    ];
  }
}
