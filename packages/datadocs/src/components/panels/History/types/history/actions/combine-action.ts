import { handlRefreshGridAndToolbars } from "../../../../../../app/store/panels/store-history-panel";
import type MacroAction from "../../macro/actions/macro-action";
import type { MACRO_ITEM_REFERENCE_TYPE } from "../../type";
import type GridAction from "./grid/grid-action";
import HistoryAction, { HistoryState } from "./history-action";

export class CombineState extends HistoryState {}

export class CombineAction extends HistoryAction {
  actions: HistoryAction[];
  name: string;
  constructor(
    name: string,
    actions: HistoryAction[],
    userId: string,
    tags: string[],
    hidden: boolean
  ) {
    super("BASE", null, null, userId, tags, hidden);
    this.actions = actions;
    this.name = name;
  }

  get displayName(): string {
    return this.name;
  }

  async undo(refresh: boolean) {
    if (this.actions.length > 0) {
      for (let idx = this.actions.length - 1; idx >= 0; idx--) {
        if (idx === 0) {
          await this.actions[idx].undo(refresh);
        } else {
          await this.actions[idx].undo(false);
        }
      }
      if (refresh) {
        handlRefreshGridAndToolbars();
      }
    }
  }

  async redo(refresh: boolean) {
    if (this.actions.length > 0) {
      for (let idx = 0; idx < this.actions.length; idx++) {
        if (idx === this.actions.length - 1) {
          await this.actions[idx].redo(refresh);
        } else {
          await this.actions[idx].redo(false);
        }
      }
      if (refresh) {
        handlRefreshGridAndToolbars();
      }
    }
  }

  toMacroAction(
    reference: MACRO_ITEM_REFERENCE_TYPE,
    gridActiveCellMap: Map<string, any>
  ): MacroAction[] {
    let childMacroActions: MacroAction[] = [];

    for (let idx = 0; idx < this.actions.length; idx++) {
      let activeCell = null;
      let viewId = "";
      const action = this.actions[idx];
      if (action.isGrid()) {
        viewId = (action as GridAction).gridActiveComponent.activeView.id;
        activeCell = gridActiveCellMap.get(viewId);
        if (!activeCell) {
          gridActiveCellMap.set(viewId, (action as GridAction).activeCell);
        }
      }

      childMacroActions = childMacroActions.concat(
        action.toMacroAction(reference, gridActiveCellMap)
      );
      if (action.isGrid()) {
        gridActiveCellMap.set(viewId, (action as GridAction).activeCell);
      }
    }

    return childMacroActions;
  }
}
