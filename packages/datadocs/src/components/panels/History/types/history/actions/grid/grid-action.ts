import type { HistoryState } from "../history-action";
import HistoryAction from "../history-action";
import type {
  GridPublicAPI,
  SelectionDescriptor,
} from "@datadocs/canvas-datagrid-ng";
import type {
  ActiveCellOffsetDeclarator,
  GridActiveComponent,
  MACRO_ITEM_REFERENCE_TYPE,
  SelectionOffsetDeclarator,
} from "../../../type";
import { appManager } from "../../../../../../../app/core/global/app-manager";
import { HISTORY_GRID_SELECTION_MAX_LENGTH } from "../../../constants";
import {
  getCurrentActiveSheet,
  getFirstPaneIdOfViewInWorksheet,
  getPaneByIdInWorksheet,
  getSheetsData,
} from "../../../../../../../app/store/store-worksheets";
import { switchSheet } from "../../../../../../toolbars/MainStatusBar/utils";
import type MacroAction from "../../../macro/actions/macro-action";

class GridAction extends HistoryAction {
  selections: SelectionDescriptor[];
  activeCell: any;
  sheetId: string;
  sheetName: string;
  viewName: string;
  gridActiveComponent: GridActiveComponent;
  constructor(
    selections: SelectionDescriptor[],
    activeCell: any,
    sheetId: string,
    gridActiveComponent: GridActiveComponent,
    undoState: HistoryState,
    redoState: HistoryState,
    userId: string,
    tags: string[],
    hidden: boolean
  ) {
    tags.push("grid");
    super("GRID", undoState, redoState, userId, tags, hidden);
    this.selections = selections;
    this.activeCell = activeCell;
    this.sheetId = sheetId;
    this.gridActiveComponent = gridActiveComponent;
    this.sheetName = this.getSheetName();
    this.viewName = this.getViewName();
  }

  get displayName(): string {
    throw new Error("Method not implemented.");
  }

  async undo(refresh: boolean) {
    throw new Error("Method not implemented.");
  }

  async redo(refresh: boolean) {
    throw new Error("Method not implemented.");
  }

  toMacroAction(
    reference: MACRO_ITEM_REFERENCE_TYPE,
    gridActiveCellMap: Map<string, any>
  ): MacroAction[] {
    throw new Error("Method not implemented.");
  }

  getActiveGrid(): GridPublicAPI {
    return appManager.state.activeGrid;
  }

  getNameActiveCell(): string {
    const grid = this.getActiveGrid();
    if (!grid) return "";

    return grid.getNameActiveCell(this.activeCell, true);
  }

  getNameSelections(fullstring = true): string {
    const grid = this.getActiveGrid();
    if (!grid) return "";

    const nameSelections = grid.getNameSelections(this.selections, true);

    if (
      fullstring ||
      nameSelections.length <= HISTORY_GRID_SELECTION_MAX_LENGTH
    ) {
      return nameSelections;
    } else {
      return nameSelections.slice(0, HISTORY_GRID_SELECTION_MAX_LENGTH) + "...";
    }
  }

  handleSwitchSheetIfNeeded() {
    if (getCurrentActiveSheet().id !== this.sheetId) {
      switchSheet(this.sheetId);
    }
  }

  handleGridActiveComponentIfNeeded() {
    if (this.gridActiveComponent) {
      appManager.setGridActionComponenent(this.gridActiveComponent);
    }
  }

  getSelectionsOffset(
    reference: MACRO_ITEM_REFERENCE_TYPE,
    prevActiveCell: any
  ): SelectionOffsetDeclarator[] {
    const selectionsOffset: SelectionOffsetDeclarator[] = [];

    for (const sel of this.selections) {
      if (reference === "ABSOLUTE") {
        selectionsOffset.push({
          offsetRow: sel.startRow,
          offsetColumn: sel.startColumn,
          numColumn: sel.endColumn - sel.startColumn + 1,
          numRow: sel.endRow - sel.startRow + 1,
        });
      } else {
        selectionsOffset.push({
          offsetRow: sel.startRow - prevActiveCell.rowIndex,
          offsetColumn: sel.startColumn - prevActiveCell.columnIndex,
          numColumn: sel.endColumn - sel.startColumn + 1,
          numRow: sel.endRow - sel.startRow + 1,
        });
      }
    }

    return selectionsOffset;
  }

  getActiveCellOffset(
    reference: MACRO_ITEM_REFERENCE_TYPE,
    prevActiveCell: any
  ): ActiveCellOffsetDeclarator {
    if (reference === "ABSOLUTE") {
      return {
        offsetRow: this.activeCell.rowIndex,
        offsetColumn: this.activeCell.columnIndex,
      };
    } else {
      return {
        offsetRow: this.activeCell.rowIndex - prevActiveCell.rowIndex,
        offsetColumn: this.activeCell.columnIndex - prevActiveCell.columnIndex,
      };
    }
  }

  getSheetName(): string {
    const sheetsData = getSheetsData();
    const sheet = sheetsData.find((s) => s.id === this.sheetId);
    if (!sheet) {
      throw new Error("Sheet not found.");
    }
    return sheet.name;
  }

  getViewName(): string {
    let paneId = this.gridActiveComponent.activePane.id;
    if (!paneId || paneId === "") {
      paneId = getFirstPaneIdOfViewInWorksheet(this.sheetId);
    }
    if (!paneId) {
      throw new Error("Pane not found.");
    }
    const pane = getPaneByIdInWorksheet(paneId);
    if (!pane) {
      throw new Error("Pane not found.");
    }
    return pane.content.view?.label;
  }
}

export default GridAction;
