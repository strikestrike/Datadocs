import type { SelectionDescriptor } from "@datadocs/canvas-datagrid-ng/lib/types";
import { GridMacroAction } from "../../../macro/actions/grid-action";
import type MacroAction from "../../../macro/actions/macro-action";
import { MacroState } from "../../../macro/actions/macro-action";
import type {
  ActiveCellOffsetDeclarator,
  GridActiveComponent,
  MACRO_ITEM_REFERENCE_TYPE,
  SelectionOffsetDeclarator,
  SelectionStateType,
} from "../../../type";
import { HistoryState } from "../history-action";
import GridAction from "./grid-action";

export class SelectionState extends HistoryState {
  selections: SelectionOffsetDeclarator[];
  constructor(selections: SelectionOffsetDeclarator[]) {
    super("ACTIVE_RANGE_LIST");
    this.selections = selections;
  }
}

export class ActiveCellState extends HistoryState {
  activeCell: ActiveCellOffsetDeclarator;
  constructor(activeCell: ActiveCellOffsetDeclarator) {
    super("ACTIVE_CELL");
    this.activeCell = activeCell;
  }
}

export class SelectionAction extends GridAction {
  constructor(
    selections: SelectionDescriptor[],
    activeCell: any,
    sheetId: string,
    gridActiveComponent: GridActiveComponent,
    redoState: HistoryState,
    userId: string,
    tags: string[]
  ) {
    tags.push("selections");
    super(
      selections,
      activeCell,
      sheetId,
      gridActiveComponent,
      null,
      redoState,
      userId,
      tags,
      true
    );
  }

  get displayName(): string {
    const redoState = this.redoState as SelectionState;
    const stateType = redoState.stateType as SelectionStateType;
    if (stateType === "ACTIVE_RANGE_LIST") {
      return "Selected " + this.getNameSelections(false);
    } else {
      return "Activate cell " + this.getNameActiveCell();
    }
  }

  toMacroAction(
    reference: MACRO_ITEM_REFERENCE_TYPE,
    gridActiveCellMap: Map<string, any>
  ): MacroAction[] {
    const redoState = this.redoState as SelectionState;
    const currentActiveCell = gridActiveCellMap.get(
      this.gridActiveComponent.activeView.id
    );
    return [
      new GridMacroAction(
        new MacroState(this.redoState.stateType),
        this.getSelectionsOffset(reference, currentActiveCell),
        this.getActiveCellOffset(reference, currentActiveCell),
        this.sheetName,
        this.viewName
      ),
    ];
  }
}
