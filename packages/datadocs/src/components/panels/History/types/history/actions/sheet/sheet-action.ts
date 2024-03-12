import type MacroAction from "../../../macro/actions/macro-action";
import type { MACRO_ITEM_REFERENCE_TYPE } from "../../../type";
import HistoryAction, { HistoryState } from "../history-action";

export class SheetAction extends HistoryAction {
  sheetId: string;

  constructor(
    sheetId: string,
    undoState: HistoryState,
    redoState: HistoryState,
    userId: string,
    tags: string[],
    hidden: boolean
  ) {
    super("PANEL", undoState, redoState, userId, tags, hidden);
    this.sheetId = sheetId;
  }

  get displayName(): string {
    throw new Error("Method not implemented.");
  }

  toMacroAction(
    reference: MACRO_ITEM_REFERENCE_TYPE,
    gridActiveCellMap: Map<string, any>
  ): MacroAction[] {
    throw new Error("Method not implemented.");
  }
}
