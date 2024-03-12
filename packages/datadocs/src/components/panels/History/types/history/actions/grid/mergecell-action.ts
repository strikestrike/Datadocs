import type {
  MergedCellDescriptor,
  SelectionDescriptor,
} from "@datadocs/canvas-datagrid-ng/lib/types";
import type { MergeCellsDirection } from "../../../../../../../app/store/store-toolbar";
import {
  GridMergecellMacroAction,
  MergecellMacroState,
} from "../../../macro/actions/grid-action";
import type MacroAction from "../../../macro/actions/macro-action";
import type {
  GridActiveComponent,
  MACRO_ITEM_REFERENCE_TYPE,
  MergeCellStateType,
} from "../../../type";
import { HistoryState } from "../history-action";
import GridAction from "./grid-action";

export class MergeCellState extends HistoryState {
  mergedCells: MergedCellDescriptor[];
  constructor(type: MergeCellStateType, mergedCells: MergedCellDescriptor[]) {
    super(type);
    this.mergedCells = mergedCells;
  }
}

export class MergeCellAction extends GridAction {
  direction: MergeCellsDirection;
  constructor(
    selections: SelectionDescriptor[],
    activeCell: any,
    sheetId: string,
    gridActiveComponent: GridActiveComponent,
    undoState: MergeCellState,
    redoState: MergeCellState,
    direction: MergeCellsDirection,
    userId: string,
    tags: string[]
  ) {
    tags.push("merge cell");
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
    this.direction = direction;
  }

  get displayName(): string {
    const redoState = this.redoState as MergeCellState;
    if (redoState.stateType === "UNMERGE_CELL") {
      return "Unmerged cell " + this.getNameSelections(false);
    } else {
      return "Merged cell " + this.getNameSelections(false);
    }
  }

  async undo(refresh: boolean) {
    this.handleSwitchSheetIfNeeded();
    this.handleGridActiveComponentIfNeeded();
    const grid = this.getActiveGrid();
    if (!grid) return;

    if (this.selections) {
      const undoState = this.undoState as MergeCellState;
      grid.undoRedoMergedCell(
        this.selections,
        this.activeCell,
        undoState.mergedCells,
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
      const redoState = this.redoState as MergeCellState;
      grid.undoRedoMergedCell(
        this.selections,
        this.activeCell,
        redoState.mergedCells,
        refresh
      );
    }
  }

  toMacroAction(
    reference: MACRO_ITEM_REFERENCE_TYPE,
    gridActiveCellMap: Map<string, any>
  ): MacroAction[] {
    const currentActiveCell = gridActiveCellMap.get(
      this.gridActiveComponent.activeView.id
    );

    return [
      new GridMergecellMacroAction(
        new MergecellMacroState(
          this.redoState.stateType as MergeCellStateType,
          this.direction
        ),
        this.getSelectionsOffset(reference, currentActiveCell),
        this.getActiveCellOffset(reference, currentActiveCell),
        this.sheetName,
        this.viewName
      ),
    ];
  }
}
