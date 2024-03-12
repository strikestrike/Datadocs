import type { SelectionDescriptor } from "@datadocs/canvas-datagrid-ng/lib/types";
import type MacroAction from "../../../macro/actions/macro-action";
import type {
  GridActiveComponent,
  MACRO_ITEM_REFERENCE_TYPE,
} from "../../../type";
import GridAction from "./grid-action";

export class ClearAllGridAction extends GridAction {
  actions: GridAction[];

  constructor(
    selections: SelectionDescriptor[],
    activeCell: any,
    sheetId: string,
    gridActiveComponent: GridActiveComponent,
    actions: GridAction[],
    userId: string,
    tags: string[]
  ) {
    super(
      selections,
      activeCell,
      sheetId,
      gridActiveComponent,
      null,
      null,
      userId,
      tags,
      false
    );
    this.actions = actions;
  }

  get displayName(): string {
    return "Clear Content and Style";
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
    }
  }

  toMacroAction(
    reference: MACRO_ITEM_REFERENCE_TYPE,
    gridActiveCellMap: Map<string, any>
  ): MacroAction[] {
    let childMacroActions: MacroAction[] = [];

    for (let idx = 0; idx < this.actions.length; idx++) {
      let activeCell = null;
      const action = this.actions[idx];
      const viewId = (action as GridAction).gridActiveComponent.activeView.id;
      activeCell = gridActiveCellMap.get(viewId);
      if (!activeCell) {
        gridActiveCellMap.set(viewId, (action as GridAction).activeCell);
      }

      childMacroActions = childMacroActions.concat(
        action.toMacroAction(reference, gridActiveCellMap)
      );
      gridActiveCellMap.set(viewId, (action as GridAction).activeCell);
    }

    return childMacroActions;
  }
}
