import GridAction from "./grid-action";
import type {
  SelectionDescriptor,
  CellStyleDeclaration,
  CellStyleDeclarationKey,
} from "@datadocs/canvas-datagrid-ng";
import type {
  BorderInfoType,
  GridActiveComponent,
  GridExtraInfo,
  MACRO_ITEM_REFERENCE_TYPE,
  StyleStateType,
} from "../../../type";
import { getStyleMessage } from "../../../utils";
import type MacroAction from "../../../macro/actions/macro-action";
import {
  GridStyleMacroAction,
  StyleMacroState,
} from "../../../macro/actions/grid-action";
import { HistoryState } from "../history-action";

export class StyleUndoState extends HistoryState {
  valueMap: Map<string, Partial<CellStyleDeclaration>> = new Map();
  /**
   * Columns and cells style state of table
   */
  columnsState: Record<string, any>;

  constructor(
    type: StyleStateType,
    valueMap: Map<string, Partial<CellStyleDeclaration>>
  ) {
    super(type);
    this.valueMap = valueMap;
  }

  /**
   * This is for quickly set columnsState into undo state
   * without having too much change in exists create style action.
   * Consider to change it later.
   * @param columnsState
   */
  setColumnState(columnsState: Record<string, any>) {
    this.columnsState = columnsState;
  }
}

export class StyleRedoState extends HistoryState {
  value: Partial<CellStyleDeclaration> | BorderInfoType;
  extraInfo: GridExtraInfo;

  constructor(
    type: StyleStateType,
    value: Partial<CellStyleDeclaration> | BorderInfoType,
    extra: GridExtraInfo = {}
  ) {
    super(type);
    this.value = value;
    this.extraInfo = extra;
  }
}

export class StyleAction extends GridAction {
  constructor(
    selections: SelectionDescriptor[],
    activeCell: any,
    sheetId: string,
    gridActiveComponent: GridActiveComponent,
    undoState: StyleUndoState,
    redoState: StyleRedoState,
    userId: string,
    tags: string[]
  ) {
    tags.push("style");
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
    const redoState = this.redoState as StyleRedoState;
    if (redoState.stateType === "CLEAR_STYLE") {
      return "Clearing style in " + this.getNameSelections(false);
    } else {
      return (
        getStyleMessage(
          redoState.stateType as CellStyleDeclarationKey[],
          redoState.value
        ) +
        " in " +
        this.getNameSelections(false)
      );
    }
  }

  async undo(refresh: boolean) {
    this.handleSwitchSheetIfNeeded();
    this.handleGridActiveComponentIfNeeded();
    const grid = this.getActiveGrid();
    if (!grid) return;

    if (this.selections) {
      const undoState = this.undoState as StyleUndoState;
      let stateType = undoState.stateType as StyleStateType;

      if (stateType === "CLEAR_STYLE") {
        await grid.undoCellsStyle(
          undoState.stateType as StyleStateType,
          this.selections,
          this.activeCell,
          undoState.valueMap,
          undoState.columnsState,
          refresh
        );
      } else {
        const hasBorder = stateType.includes("borders");
        const hasDataFormat = stateType.includes("dataFormat");
        const normalStyles = stateType.filter((v) => {
          return v !== "borders" && v !== "dataFormat";
        });

        if (normalStyles.length > 0) {
          await grid.undoCellsStyle(
            undoState.stateType as StyleStateType,
            this.selections,
            this.activeCell,
            undoState.valueMap,
            undoState.columnsState,
            hasBorder ? false : refresh
          );
        }

        if (hasDataFormat) {
          await grid.undoCellsDataFormat(
            undoState.stateType as StyleStateType,
            this.selections,
            this.activeCell,
            undoState.valueMap,
            undoState.columnsState,
            refresh
          );
        }

        if (hasBorder) {
          await grid.undoCellsBorders(
            this.selections,
            this.activeCell,
            undoState.valueMap,
            undoState.columnsState,
            refresh
          );
        }
      }
    }
  }

  async redo(refresh: boolean) {
    this.handleSwitchSheetIfNeeded();
    this.handleGridActiveComponentIfNeeded();
    const grid = this.getActiveGrid();
    if (!grid) return;

    if (this.selections) {
      const redoState = this.redoState as StyleRedoState;
      const stateType = redoState.stateType as StyleStateType;
      if (stateType === "CLEAR_STYLE") {
        grid.redoClearCell(this.selections, this.activeCell, "format", true);
      } else {
        let stateType = redoState.stateType as CellStyleDeclarationKey[];
        const hasBorder = stateType.includes("borders");
        const hasDataFormat = stateType.includes("dataFormat");
        const normalStyles = stateType.filter((v) => {
          return v !== "borders" && v !== "dataFormat";
        });

        if (normalStyles.length > 0) {
          await grid.redoCellsStyle(
            this.selections,
            this.activeCell,
            redoState.value as Partial<CellStyleDeclaration>,
            redoState.extraInfo.applyEntireColumn,
            hasBorder ? false : refresh
          );
        }

        if (hasDataFormat) {
          await grid.redoCellsDataFormat(
            this.selections,
            this.activeCell,
            redoState.value as Partial<CellStyleDeclaration>,
            redoState.extraInfo.applyEntireColumn,
            redoState.extraInfo.clearLinkRuns,
            refresh
          );
        }

        if (hasBorder) {
          const redoValue = redoState.value as BorderInfoType;
          await grid.redoCellsBorders(
            this.selections,
            this.activeCell,
            redoValue.style,
            redoValue.color,
            redoValue.type,
            redoState.extraInfo.applyEntireColumn,
            refresh
          );
        }
      }
    }
  }

  toMacroAction(
    reference: MACRO_ITEM_REFERENCE_TYPE,
    gridActiveCellMap: Map<string, any>
  ): MacroAction[] {
    const redoState = this.redoState as StyleRedoState;
    const currentActiveCell = gridActiveCellMap.get(
      this.gridActiveComponent.activeView.id
    );

    return [
      new GridStyleMacroAction(
        new StyleMacroState(
          redoState.stateType as StyleStateType,
          redoState.value as Partial<CellStyleDeclaration>
        ),
        this.getSelectionsOffset(reference, currentActiveCell),
        this.getActiveCellOffset(reference, currentActiveCell),
        this.sheetName,
        this.viewName
      ),
    ];
  }
}
