import type {
  CellStyleDeclaration,
  CellStyleDeclarationKey,
  GridPublicAPI,
  MergeDirection,
  SelectionDescriptor,
} from "@datadocs/canvas-datagrid-ng";
import { appManager } from "../../../../../../app/core/global/app-manager";
import {
  createGridStyleAction,
  createGridValueAction,
  createMergeCellAction,
} from "../../../../../../app/store/panels/store-history-panel";
import type { MergeCellsDirection } from "../../../../../../app/store/store-toolbar";
import {
  getPaneByViewNameInWorksheet,
  getSheetsData,
} from "../../../../../../app/store/store-worksheets";
import {
  MACRO_ERROR_CODE_INVALID_ARGUMENT,
  MACRO_ERROR_CODE_STARTING_ROW_COLUMN_TOO_SMALL,
} from "../../constants";
import type HistoryAction from "../../history/actions/history-action";
import type {
  ActiveCellOffsetDeclarator,
  BorderInfoType,
  MACRO_ITEM_REFERENCE_TYPE,
  MergeCellStateType,
  SelectionOffsetDeclarator,
  StyleStateType,
  ValueStateType,
} from "../../type";
import { MacroError } from "../../type";
import {
  delay,
  gridActiveCellFromCellOffset,
  gridSelectionFromSelectionOffset,
} from "../../utils";
import MacroAction, { MacroState } from "./macro-action";
import { getUndoRedoCellKey } from "@datadocs/canvas-datagrid-ng/lib/utils/undo-redo";

export class StyleMacroState extends MacroState {
  value: Partial<CellStyleDeclaration>;
  constructor(type: StyleStateType, value: Partial<CellStyleDeclaration>) {
    super(type);
    this.value = value;
  }
}

export class ValueMacroState extends MacroState {
  value: any;
  constructor(type: ValueStateType, value: any) {
    super(type);
    this.value = value;
  }
}

export class MergecellMacroState extends MacroState {
  direction: MergeCellsDirection;
  constructor(type: MergeCellStateType, direction: MergeCellsDirection) {
    super(type);
    this.direction = direction;
  }
}

export class GridMacroAction extends MacroAction {
  selections: SelectionOffsetDeclarator[];
  activeCell: ActiveCellOffsetDeclarator;
  sheetName: string;
  viewName: string;

  constructor(
    gridState: MacroState,
    selections: SelectionOffsetDeclarator[],
    activeCell: ActiveCellOffsetDeclarator,
    sheetName: string,
    viewName: string
  ) {
    super("GRID", gridState);
    this.selections = selections;
    this.activeCell = activeCell;
    this.sheetName = sheetName;
    this.viewName = viewName;
  }

  async handleSheetAndPanel(
    reference: MACRO_ITEM_REFERENCE_TYPE,
    activeOffsetMap: {
      [key: string]: { [key: string]: ActiveCellOffsetDeclarator[] };
    }
  ): Promise<any> {
    const sheetsData = getSheetsData();
    const sheet = sheetsData.find((ws) => ws.isActive);
    // const sheet = sheetsData.find((s) => s.name === gridMacro.sheetName);
    // if (!sheet) {
    //   return new MacroError(MACRO_ERROR_CODE_INVALID_ARGUMENT);
    // }
    // if (!sheet.isActive) {
    //   const sheetsData = getSheetsData();
    //   switchTab(sheetsData, sheet.id);
    //   changeSheetsData(sheetsData);
    //   await delay(10);
    // }
    let addDelayPane = false;
    const pane = getPaneByViewNameInWorksheet(sheet.name, this.viewName);
    if (!pane) {
      return new MacroError(MACRO_ERROR_CODE_INVALID_ARGUMENT);
    }
    if (pane.id !== appManager.state.activePane.id) {
      addDelayPane = true;
    }
    appManager.setActivePane(pane, null, false);
    if (pane.parent) {
      const activeTab = pane.parent.children.findIndex((p) => p.id === pane.id);
      if (pane.parent.props.activeChild !== activeTab) {
        addDelayPane = true;
      }
      appManager.worksheetLayout.panesContext.activeTabChange(
        pane.parent,
        activeTab
      );
    }
    if (addDelayPane) {
      await delay(10);
    }

    // Init active offset map if needed
    if (!activeOffsetMap[sheet.id]) {
      activeOffsetMap[sheet.id] = { [pane.id]: [] };
    } else if (!activeOffsetMap[sheet.id][pane.id]) {
      activeOffsetMap[sheet.id][pane.id] = [];
    }

    // Get active grid and init selections/active cell
    const grid = appManager.activeGrid;
    const currentActiveCell = grid.activeCell;
    const activeCell = gridActiveCellFromCellOffset(
      this.activeCell,
      reference,
      currentActiveCell,
      activeOffsetMap[sheet.id][pane.id]
    );
    if (activeCell.rowIndex < 0 || activeCell.columnIndex < 0) {
      activeOffsetMap[sheet.id][pane.id].push(this.activeCell);
      // Add active cell offset for invalid action
      return new MacroError(MACRO_ERROR_CODE_STARTING_ROW_COLUMN_TOO_SMALL);
    }
    const selections: SelectionDescriptor[] = [];
    for (let idx = 0; idx < this.selections.length; idx++) {
      const selectionOffset = this.selections[idx];
      const sel = gridSelectionFromSelectionOffset(
        selectionOffset,
        reference,
        currentActiveCell,
        activeOffsetMap[sheet.id][pane.id]
      );
      if (sel.startRow < 0 || sel.startColumn < 0) {
        // Add active cell offset for invalid action
        activeOffsetMap[sheet.id][pane.id].push(this.activeCell);
        return new MacroError(MACRO_ERROR_CODE_STARTING_ROW_COLUMN_TOO_SMALL);
      }
      selections.push(sel);
    }
    // Clear active offset for valid action;
    activeOffsetMap[sheet.id][pane.id] = [];
    for (let idx = 0; idx < selections.length; idx++) {
      grid.addSelection(selections[idx], idx === 0 ? false : true, true);
    }
    grid.setActiveCell(activeCell.columnIndex, activeCell.rowIndex);

    return activeCell;
  }

  async toHistoryAction(
    activeCell: any,
    grid: GridPublicAPI
  ): Promise<HistoryAction | MacroError> {
    throw new Error("Method not implemented.");
  }
}

export class GridValueMacroAction extends GridMacroAction {
  constructor(
    gridState: ValueMacroState,
    selections: SelectionOffsetDeclarator[],
    activeCell: ActiveCellOffsetDeclarator,
    sheetName: string,
    viewName: string
  ) {
    super(gridState, selections, activeCell, sheetName, viewName);
  }

  async toHistoryAction(
    activeCell: any,
    grid: GridPublicAPI
  ): Promise<HistoryAction | MacroError> {
    const valueMacroState = this.macroState as ValueMacroState;
    const stateType = valueMacroState.stateType as ValueStateType;
    if (stateType === "ENTER_VALUE") {
      const oldValueMap: Map<string, any> = new Map([
        [
          getUndoRedoCellKey(activeCell.rowIndex, activeCell.columnIndex),
          grid.dataSource.getCellValue(
            activeCell.rowIndex,
            activeCell.columnIndex
          ),
        ],
      ]);
      const newValueMap: Map<string, any> = new Map([
        [
          getUndoRedoCellKey(activeCell.rowIndex, activeCell.columnIndex),
          valueMacroState.value,
        ],
      ]);
      grid.dataSource.editCells([
        {
          row: activeCell.rowIndex,
          column: activeCell.columnIndex,
          value: valueMacroState.value,
        },
      ]);
      // Add history action for enter value
      return createGridValueAction(
        grid.getSelections(),
        grid.activeCell,
        "ENTER_VALUE",
        oldValueMap,
        newValueMap,
        valueMacroState.value
      );
    } else {
      const oldValueMap: Map<string, any> = new Map([
        [
          getUndoRedoCellKey(activeCell.rowIndex, activeCell.columnIndex),
          grid.dataSource.getCellValue(
            activeCell.rowIndex,
            activeCell.columnIndex
          ),
        ],
      ]);

      grid.clearCells("content");

      // Add history action for enter value
      return createGridValueAction(
        grid.getSelections(),
        grid.activeCell,
        "CLEAR_VALUE",
        oldValueMap,
        null,
        ""
      );
    }
  }
}

export class GridStyleMacroAction extends GridMacroAction {
  constructor(
    gridState: StyleMacroState,
    selections: SelectionOffsetDeclarator[],
    activeCell: ActiveCellOffsetDeclarator,
    sheetName: string,
    viewName: string
  ) {
    super(gridState, selections, activeCell, sheetName, viewName);
  }

  async toHistoryAction(
    activeCell: any,
    grid: GridPublicAPI
  ): Promise<HistoryAction | MacroError> {
    const styleMacroState = this.macroState as StyleMacroState;
    const stateType = styleMacroState.stateType as StyleStateType;
    if (stateType === "CLEAR_STYLE") {
      const styleMapBeforeDelete = grid.getSelectionsCellValue("format");

      grid.clearCells("format");

      return createGridStyleAction(
        grid.getSelections(),
        grid.activeCell,
        "CLEAR_STYLE",
        styleMapBeforeDelete,
        {}
      );
    } else {
      const styleMacroState = this.macroState as StyleMacroState;
      const keys = [
        ...(styleMacroState.stateType as CellStyleDeclarationKey[]),
      ];
      if (keys.includes("borders")) {
        const borders = styleMacroState.value as BorderInfoType;
        const undoState = await grid.editCellsBorders(
          borders.style,
          borders.color,
          borders.type
        );
        return createGridStyleAction(
          grid.getSelections(),
          grid.activeCell,
          ["borders"],
          undoState.valueMap,
          borders,
          ["borders"],
          {}
        );
      }
      const beforeValue = grid.getSelectionsCellValue(keys);

      appManager.activeGrid.editCellsStyle(styleMacroState.value);
      return createGridStyleAction(
        grid.getSelections(),
        grid.activeCell,
        [...(styleMacroState.stateType as CellStyleDeclarationKey[])],
        beforeValue,
        styleMacroState.value,
        keys
      );
    }
  }
}

export class GridMergecellMacroAction extends GridMacroAction {
  constructor(
    gridState: MergecellMacroState,
    selections: SelectionOffsetDeclarator[],
    activeCell: ActiveCellOffsetDeclarator,
    sheetName: string,
    viewName: string
  ) {
    super(gridState, selections, activeCell, sheetName, viewName);
  }

  async toHistoryAction(
    activeCell: any,
    grid: GridPublicAPI
  ): Promise<HistoryAction | MacroError> {
    const mergedMacroState = this.macroState as MergecellMacroState;
    const oldMergedCells = grid.getCurrentMergedCells();
    if (this.macroState.stateType === "MERGE_CELL") {
      grid.mergeCurrentSelectedCells(
        mergedMacroState.direction as MergeDirection
      );
    } else {
      grid.unmergeCurrentSelectedCells();
    }
    return createMergeCellAction(
      this.macroState.stateType as MergeCellStateType,
      grid.getSelections(),
      grid.activeCell,
      oldMergedCells,
      grid.getCurrentMergedCells(),
      mergedMacroState.direction
    );
  }
}
