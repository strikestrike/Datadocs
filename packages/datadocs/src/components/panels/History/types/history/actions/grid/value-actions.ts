import type { SelectionDescriptor } from "@datadocs/canvas-datagrid-ng/lib/types";
import { HISTORY_TEXT_ACTION_MAX_LENGTH } from "../../../constants";
import {
  GridValueMacroAction,
  ValueMacroState,
} from "../../../macro/actions/grid-action";
import type MacroAction from "../../../macro/actions/macro-action";
import type {
  GridActiveComponent,
  MACRO_ITEM_REFERENCE_TYPE,
  ValueStateType,
} from "../../../type";
import { HistoryState } from "../history-action";
import GridAction from "./grid-action";

export class ValueUndoState extends HistoryState {
  valueMap: Map<string, any>;
  constructor(type: ValueStateType, valueMap: Map<string, any>) {
    super(type);
    this.valueMap = valueMap;
  }
}

export class ValueRedoState extends HistoryState {
  valueMap: Map<string, any>;
  value: any;
  constructor(type: ValueStateType, valueMap: Map<string, any>, value: any) {
    super(type);
    this.valueMap = valueMap;
    this.value = value;
  }
}

export class ValueAction extends GridAction {
  constructor(
    selections: SelectionDescriptor[],
    activeCell: any,
    sheetId: string,
    gridActiveComponent: GridActiveComponent,
    undoState: ValueUndoState,
    redoState: ValueRedoState,
    userId: string,
    tags: string[]
  ) {
    tags.push("value");
    super(
      selections,
      activeCell,
      sheetId,
      gridActiveComponent,
      undoState,
      redoState,
      userId,
      tags,
      false
    );
  }

  get displayName(): string {
    const redoState = this.redoState as ValueRedoState;
    if (redoState.stateType === "CLEAR_VALUE") {
      return "Clear Value in " + this.getNameActiveCell();
    } else {
      const [cell] = redoState.valueMap.values();
      const text = (cell && cell.text) || "";
      return (
        "Typing '" +
        (text.length > HISTORY_TEXT_ACTION_MAX_LENGTH
          ? text.slice(0, HISTORY_TEXT_ACTION_MAX_LENGTH) + "..."
          : text) +
        "' in " +
        this.getNameActiveCell()
      );
    }
  }

  async undo(refresh: boolean) {
    this.handleSwitchSheetIfNeeded();
    this.handleGridActiveComponentIfNeeded();
    const grid = this.getActiveGrid();
    if (!grid) return;

    if (this.selections) {
      const undoState = this.undoState as ValueUndoState;
      grid.undoRedoCellsValue(
        this.selections,
        this.activeCell,
        undoState.valueMap,
        refresh
      );
    }
  }

  async redo(refresh: boolean) {
    this.handleSwitchSheetIfNeeded();
    this.handleGridActiveComponentIfNeeded();
    const grid = this.getActiveGrid();
    if (!grid) return;

    if (this.selections) {
      const redoState = this.redoState as ValueRedoState;
      const stateType: ValueStateType = redoState.stateType as ValueStateType;
      if (stateType === "ENTER_VALUE") {
        await grid.undoRedoCellsValue(
          this.selections,
          this.activeCell,
          redoState.valueMap,
          refresh
        );
      } else {
        grid.redoClearCell(
          this.selections,
          this.activeCell,
          "content",
          refresh
        );
      }
    }
  }

  toMacroAction(
    reference: MACRO_ITEM_REFERENCE_TYPE,
    gridActiveCellMap: Map<string, any>
  ): MacroAction[] {
    const redoState = this.redoState as ValueRedoState;
    const currentActiveCell = gridActiveCellMap.get(
      this.gridActiveComponent.activeView.id
    );

    return [
      new GridValueMacroAction(
        new ValueMacroState(
          redoState.stateType as ValueStateType,
          redoState.value
        ),
        this.getSelectionsOffset(reference, currentActiveCell),
        this.getActiveCellOffset(reference, currentActiveCell),
        this.sheetName,
        this.viewName
      ),
    ];
  }
}
