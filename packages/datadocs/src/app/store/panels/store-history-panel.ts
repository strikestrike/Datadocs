import type {
  CellStyleDeclaration,
  MergedCellDescriptor,
  SelectionDescriptor,
} from "@datadocs/canvas-datagrid-ng";
import type {
  ActiveCellOffsetDeclarator,
  BorderInfoType,
  GridExtraInfo,
  MACRO_ITEM_REFERENCE_TYPE,
  MergeCellStateType,
  SelectionOffsetDeclarator,
  StyleStateType,
  ValueStateType,
} from "../../../components/panels/History/types/type";
import { MacroError } from "../../../components/panels/History/types/type";
import HistoryManager from "../../../components/panels/History/types/history/history-manager";
import {
  getCurrentActiveSheet,
  getFirstViewIdInWorksheet,
  getSheetsData,
} from "../store-worksheets";
import type { WorkbookSheet } from "../types";
import { activeHistoryManager, activeMacroManager } from "./writables";
import { get } from "svelte/store";
import { activeWorkbookStore } from "../store-workbooks";
import { appManager } from "../../core/global/app-manager";
import type HistoryAction from "../../../components/panels/History/types/history/actions/history-action";
import type GridAction from "../../../components/panels/History/types/history/actions/grid/grid-action";
import {
  ActiveCellState,
  SelectionAction,
  SelectionState,
} from "../../../components/panels/History/types/history/actions/grid/selection-action";
import {
  StyleAction,
  StyleRedoState,
  StyleUndoState,
} from "../../../components/panels/History/types/history/actions/grid/style-actions";
import {
  ValueAction,
  ValueRedoState,
  ValueUndoState,
} from "../../../components/panels/History/types/history/actions/grid/value-actions";
import {
  MergeCellAction,
  MergeCellState,
} from "../../../components/panels/History/types/history/actions/grid/mergecell-action";
import {
  NewSheetAction,
  RedoNewSheetState,
} from "../../../components/panels/History/types/history/actions/sheet/new-sheet-action";
import {
  DeleteSheetAction,
  UndoDeleteSheetState,
} from "../../../components/panels/History/types/history/actions/sheet/delete-sheet-action";
import {
  DuplicateSheetAction,
  RedoDuplicateSheetState,
} from "../../../components/panels/History/types/history/actions/sheet/duplicate-sheet-action";
import { MacroManager } from "../../../components/panels/History/types/macro/macro-manager";
import { MacroItem } from "../../../components/panels/History/types/macro/macro-item";
import { ClearAllGridAction } from "../../../components/panels/History/types/history/actions/grid/clearall-action";
import type MacroAction from "../../../components/panels/History/types/macro/actions/macro-action";
import { CombineAction } from "../../../components/panels/History/types/history/actions/combine-action";
import type { GridMacroAction } from "../../../components/panels/History/types/macro/actions/grid-action";
import {
  handleActiveCellChanged,
  handleSelectionChanged,
  type MergeCellsDirection,
  updateToolbarButtons,
} from "../store-toolbar";
import {
  ChangeSheetNameAction,
  ChangeSheetNameState,
} from "../../../components/panels/History/types/history/actions/sheet/change-sheet-name-action";
import {
  ReorderSheetAction,
  ReorderSheetState,
} from "../../../components/panels/History/types/history/actions/sheet/reorder-sheet-action";
import { HistoryState } from "../../../components/panels/History/types/history/actions/history-action";
import type { SheetAction } from "../../../components/panels/History/types/history/actions/sheet/sheet-action";
import {
  ActivateSheetAction,
  ActivateSheetState,
} from "../../../components/panels/History/types/history/actions/sheet/activate-sheet-action";
import type { SheetMacroAction } from "../../../components/panels/History/types/macro/actions/sheet-action";

export const historyManagerMap: Map<string, HistoryManager> = new Map();
export const macroManagerMap: Map<string, MacroManager> = new Map();

export function setActiveHistoryPanelManager(create_new = true) {
  const activeWorkbookId = get(activeWorkbookStore).id;

  // For history manager
  const historyManager = historyManagerMap.get(activeWorkbookId);
  if (historyManager) {
    activeHistoryManager.set(historyManager);
  } else if (create_new) {
    historyManagerMap.set(activeWorkbookId, new HistoryManager());
    activeHistoryManager.set(historyManagerMap.get(activeWorkbookId));
  }

  // For macro manager
  const macroManager = macroManagerMap.get(activeWorkbookId);
  if (macroManager) {
    activeMacroManager.set(macroManager);
  } else if (create_new) {
    macroManagerMap.set(activeWorkbookId, new MacroManager());
    activeMacroManager.set(macroManagerMap.get(activeWorkbookId));
  }
}

export function getCurrentHistoryManager() {
  return get(activeHistoryManager);
}

export function getCurrentMacroManager() {
  return get(activeMacroManager);
}

/**
 * Add action for undo/redo
 * @param action
 */
export function addHistoryAction(
  action: HistoryAction,
  include_selections = false
) {
  let historyManager = getCurrentHistoryManager();
  if (!historyManager) {
    return;
  }
  if (include_selections && action.canAddActivateSheet()) {
    const sheetId = (action as GridAction | SheetAction).sheetId;
    const lastUnhiddenAction = historyManager.getLastUnhiddenAction() as
      | GridAction
      | SheetAction;
    if (lastUnhiddenAction && sheetId !== lastUnhiddenAction.sheetId) {
      const sheetsData = getSheetsData();
      const worksheet = sheetsData.find((ws) => sheetId === ws.id);
      if (worksheet) {
        historyManager.add(
          new ActivateSheetAction(
            sheetId,
            new ActivateSheetState(worksheet.name),
            null,
            []
          )
        );
      }
    }
  }
  if (include_selections && action.canAddSelection()) {
    const gridAction = action as GridAction;
    const lastUnhiddenAction = historyManager.getLastGridUnhiddenAction(
      gridAction.sheetId,
      gridAction.gridActiveComponent
    ) as GridAction;
    const lastSelections =
      gridAction.selections[gridAction.selections.length - 1];
    const activedCellNotFirst =
      lastSelections.startRow != gridAction.activeCell.rowIndex ||
      lastSelections.startColumn != gridAction.activeCell.columnIndex;
    if (!lastUnhiddenAction) {
      let selections: SelectionOffsetDeclarator[] = [];
      for (const sel of gridAction.selections) {
        selections.push({
          offsetRow: sel.startRow,
          offsetColumn: sel.startColumn,
          numRow: sel.endRow - sel.startRow + 1,
          numColumn: sel.endColumn - sel.startColumn + 1,
        });
      }
      historyManager.add(
        new SelectionAction(
          gridAction.selections,
          gridAction.activeCell,
          gridAction.sheetId,
          gridAction.gridActiveComponent,
          new SelectionState(selections),
          gridAction.owner,
          ["range"]
        )
      );
      if (activedCellNotFirst) {
        historyManager.add(
          new SelectionAction(
            gridAction.selections,
            gridAction.activeCell,
            gridAction.sheetId,
            gridAction.gridActiveComponent,
            new ActiveCellState({
              offsetRow: gridAction.activeCell.rowIndex,
              offsetColumn: gridAction.activeCell.columnIndex,
            }),
            gridAction.owner,
            ["active cell"]
          )
        );
      }
    } else {
      let canAddRange = false;
      if (
        lastUnhiddenAction.selections.length !== gridAction.selections.length
      ) {
        canAddRange = true;
      } else {
        for (let idx = 0; idx < lastUnhiddenAction.selections.length; idx++) {
          const currentSel = gridAction.selections[idx];
          const lastSel = lastUnhiddenAction.selections[idx];
          if (
            currentSel.startRow !== lastSel.startRow ||
            currentSel.endRow !== lastSel.endRow ||
            currentSel.startColumn !== lastSel.startColumn ||
            currentSel.endColumn != lastSel.endColumn
          ) {
            canAddRange = true;
            break;
          }
        }
      }

      if (canAddRange) {
        let selections: SelectionOffsetDeclarator[] = [];
        for (const sel of gridAction.selections) {
          selections.push({
            offsetRow: sel.startRow - lastUnhiddenAction.activeCell.rowIndex,
            offsetColumn:
              sel.startColumn - lastUnhiddenAction.activeCell.columnIndex,
            numRow: sel.endRow - sel.startRow + 1,
            numColumn: sel.endColumn - sel.startColumn + 1,
          });
        }
        historyManager.add(
          new SelectionAction(
            gridAction.selections,
            gridAction.activeCell,
            gridAction.sheetId,
            gridAction.gridActiveComponent,
            new SelectionState(selections),
            gridAction.owner,
            ["range"]
          )
        );
      }

      if (
        (lastUnhiddenAction.activeCell.rowIndex !==
          gridAction.activeCell.rowIndex ||
          lastUnhiddenAction.activeCell.columnIndex !==
            gridAction.activeCell.columnIndex) &&
        activedCellNotFirst
      ) {
        historyManager.add(
          new SelectionAction(
            gridAction.selections,
            gridAction.activeCell,
            gridAction.sheetId,
            gridAction.gridActiveComponent,
            new ActiveCellState({
              offsetRow:
                gridAction.activeCell.rowIndex -
                lastUnhiddenAction.activeCell.rowIndex,
              offsetColumn:
                gridAction.activeCell.columnIndex -
                lastUnhiddenAction.activeCell.columnIndex,
            }),
            gridAction.owner,
            ["active cell"]
          )
        );
      }
    }
  }
  historyManager.add(action);
}

/**
 * Perform undo history action
 */
export async function undoHistoryAction() {
  const historyManager = getCurrentHistoryManager();
  if (!historyManager) {
    return;
  }
  await historyManager.undo();
}

/**
 * Perform redo history action
 */
export async function redoHistoryAction() {
  const historyManager = getCurrentHistoryManager();
  if (!historyManager) {
    return;
  }
  await historyManager.redo();
}

/**
 * Perform undo multiple actions in history
 * @param actionId
 */
export function undoMultipleActions(actionId: string) {
  let historyManager = getCurrentHistoryManager();
  if (!historyManager) {
    return;
  }
  historyManager.undoToActionId(actionId);
}

/**
 * Perform redo multiple actions in history
 * @param actionId
 */
export function redoMultipleActions(actionId: string) {
  let historyManager = getCurrentHistoryManager();
  if (!historyManager) {
    return;
  }
  historyManager.redoToActionId(actionId);
}

/**
 * Create style action for history
 * @param selections
 * @param activeCell
 * @param stateType
 * @param valueMap
 * @param value
 * @param tags
 * @returns action
 */
export function createGridStyleAction(
  selections: SelectionDescriptor[],
  activeCell: any,
  stateType: StyleStateType,
  valueMap: Map<string, Partial<CellStyleDeclaration>>,
  value: Partial<CellStyleDeclaration> | BorderInfoType,
  tags: string[] = [],
  extraInfo: GridExtraInfo = {},
  userId: string = null
): StyleAction {
  return new StyleAction(
    selections,
    activeCell,
    getCurrentActiveSheet().id,
    appManager.getGridActiveComponent(),
    new StyleUndoState(stateType, valueMap),
    new StyleRedoState(stateType, value, extraInfo),
    userId,
    tags
  );
}

/**
 * create value action for history
 * @param selections
 * @param activeCell
 * @param stateType
 * @param oldValueMap
 * @param newValueMap
 * @param tags
 * @returns ValueAction
 */
export function createGridValueAction(
  selections: SelectionDescriptor[],
  activeCell: any,
  stateType: ValueStateType,
  oldValueMap: Map<string, any>,
  newValueMap: Map<string, any>,
  value: any,
  tags: string[] = [],
  userId: string = null
): ValueAction {
  return new ValueAction(
    selections,
    activeCell,
    getCurrentActiveSheet().id,
    appManager.getGridActiveComponent(),
    new ValueUndoState(stateType, oldValueMap),
    new ValueRedoState(stateType, newValueMap, value),
    userId,
    tags
  );
}

/**
 * create clear both content and style for history
 * @param selections
 * @param activeCell
 * @param actions
 * @param tags
 * @returns ClearAllGridAction
 */
export function createClearAllGridAction(
  selections: SelectionDescriptor[],
  activeCell: any,
  actions: GridAction[],
  tags: string[] = [],
  userId: string = null
): ClearAllGridAction {
  return new ClearAllGridAction(
    selections,
    activeCell,
    getCurrentActiveSheet().id,
    appManager.getGridActiveComponent(),
    actions,
    userId,
    tags
  );
}

/**
 * create merged cell actions for history
 * @param selections
 * @param activeCell
 * @param oldMergedCells
 * @param newMergedCells
 * @returns
 */
export function createMergeCellAction(
  type: MergeCellStateType,
  selections: SelectionDescriptor[],
  activeCell: any,
  oldMergedCells: MergedCellDescriptor[],
  newMergedCells: MergedCellDescriptor[],
  direction: MergeCellsDirection,
  userId: string = null
): MergeCellAction {
  return new MergeCellAction(
    selections,
    activeCell,
    getCurrentActiveSheet().id,
    appManager.getGridActiveComponent(),
    new MergeCellState(type, oldMergedCells),
    new MergeCellState(type, newMergedCells),
    direction,
    userId,
    []
  );
}

/**
 * Create new sheet action for history
 * @param newSheet
 * @param sheetIndex
 * @param sheetId
 * @returns
 */
export function createNewSheetAction(
  worksheet: WorkbookSheet,
  position: number,
  userId: string = null
): NewSheetAction {
  return new NewSheetAction(
    worksheet.id,
    new HistoryState("ADD_SHEET"),
    new RedoNewSheetState(worksheet, position),
    userId,
    []
  );
}

/**
 * Rename sheet action for history
 * @param sheetId
 * @param oldName
 * @param newName
 * @returns
 */
export function createChangeSheetNameAction(
  sheetId: string,
  oldName: string,
  newName: string,
  userId: string = null
): ChangeSheetNameAction {
  return new ChangeSheetNameAction(
    sheetId,
    new ChangeSheetNameState(oldName),
    new ChangeSheetNameState(newName),
    userId,
    []
  );
}

/**
 * Delete sheet action for history
 * @param sheet
 * @param sheetIndex
 * @param sheetId
 * @param activeIndex
 * @returns
 */
export function createDeleteSheetAction(
  worksheet: WorkbookSheet,
  userId: string = null
): DeleteSheetAction {
  return new DeleteSheetAction(
    worksheet.id,
    new UndoDeleteSheetState(worksheet, worksheet.position),
    new HistoryState("REMOVE_SHEET"),
    userId,
    []
  );
}

/**
 * create duplicate action for history
 * @param worksheet
 * @param sheetName
 * @param userId
 * @returns
 */
export function createDuplicateSheetAction(
  worksheet: WorkbookSheet,
  sheetName: string,
  userId: string = null
): DuplicateSheetAction {
  return new DuplicateSheetAction(
    worksheet.id,
    new HistoryState("DUPLICATE_SHEET"),
    new RedoDuplicateSheetState(worksheet, worksheet.position, sheetName),
    userId,
    []
  );
}

/**
 * create reorder sheet action for history
 * @param oldIndex
 * @param newIndex
 * @param userId
 * @returns
 */
export function createReorderSheetAction(
  sheetId: string,
  oldIndex: number,
  newIndex: number,
  userId: string = null
): ReorderSheetAction {
  return new ReorderSheetAction(
    sheetId,
    new ReorderSheetState(oldIndex),
    new ReorderSheetState(newIndex),
    userId,
    []
  );
}

export function addMacroHistory(
  value: { name: string; reference: boolean },
  userId: string = null
) {
  let macroManager = getCurrentMacroManager();
  let historyManager = getCurrentHistoryManager();
  if (!macroManager || !historyManager) {
    return;
  }
  const validName = macroManager.getValidName(value.name);
  const reference: MACRO_ITEM_REFERENCE_TYPE = value.reference
    ? "RELATIVE"
    : "ABSOLUTE";
  macroManager.add(
    new MacroItem(
      validName,
      getMacroActionsFromHistoryActions(
        historyManager.getSelectedActions(),
        reference
      ),
      reference,
      userId
    )
  );
  historyManager.updateSelectedArray([]);
}

export async function handleMacroItem(id: string) {
  let macroManager = getCurrentMacroManager();
  if (!macroManager) {
    return;
  }
  const macroItem = macroManager.getMacroItemById(id);
  if (!macroItem) {
    return;
  }

  const res = await getCombineActionFromMacroItem(macroItem);
  if (res.action) {
    addHistoryAction(res.action);
  }
  if (res.error) {
    alert(res.error.what());
  }
}

function getMacroActionsFromHistoryActions(
  historyActions: HistoryAction[],
  reference: MACRO_ITEM_REFERENCE_TYPE
): MacroAction[] {
  let macroActions: MacroAction[] = [];
  let gridActiveCellMap: Map<string, any> = new Map();

  for (const action of historyActions) {
    let activeCell = null;
    let viewId = "";
    if (action.isGrid()) {
      viewId = (action as GridAction).gridActiveComponent.activeView.id;
      if (!viewId || viewId === "") {
        viewId = getFirstViewIdInWorksheet((action as GridAction).sheetId);
      }
      activeCell = gridActiveCellMap.get(viewId);
      if (!activeCell) {
        gridActiveCellMap.set(viewId, (action as GridAction).activeCell);
      }
    } else if (action.isNewSheet()) {
      const firstId = getFirstViewIdInWorksheet(
        (action as SheetAction).sheetId
      );
      if (firstId) {
        gridActiveCellMap.set(firstId, { rowIndex: 0, columnIndex: 0 });
      }
    }

    macroActions = macroActions.concat(
      action.toMacroAction(reference, gridActiveCellMap)
    );
    if (action.isGrid()) {
      gridActiveCellMap.set(viewId, (action as GridAction).activeCell);
    }
  }

  return macroActions;
}

async function handleMacroAction(
  macro: MacroAction,
  reference: MACRO_ITEM_REFERENCE_TYPE,
  activeOffsetMap: {
    [key: string]: { [key: string]: ActiveCellOffsetDeclarator[] };
  }
): Promise<HistoryAction | MacroError> {
  switch (macro.actionType) {
    case "GRID": {
      const gridMacro = macro as GridMacroAction;
      const activeCell = await gridMacro.handleSheetAndPanel(
        reference,
        activeOffsetMap
      );
      let grid = appManager.activeGrid;
      switch (gridMacro.macroState.stateType) {
        case "ENTER_VALUE":
        case "CLEAR_VALUE":
        case "CLEAR_STYLE":
        case "MERGE_CELL":
        case "UNMERGE_CELL": {
          return await gridMacro.toHistoryAction(activeCell, grid);
        }

        case "ACTIVE_CELL":
        case "ACTIVE_RANGE_LIST": {
          return null;
        }

        default:
          {
            if (Array.isArray(gridMacro.macroState.stateType)) {
              return await gridMacro.toHistoryAction(activeCell, grid);
            }
          }
          break;
      }
      return null;
    }

    case "PANEL": {
      const sheetMacro = macro as SheetMacroAction;
      switch (sheetMacro.macroState.stateType) {
        case "ADD_SHEET":
        case "DUPLICATE_SHEET":
        case "CHANGE_SHEET_NAME":
        case "REMOVE_SHEET":
        case "REORDER_SHEET":
        case "ACTIVATE_SHEET": {
          return await sheetMacro.toHistoryAction();
        }

        default: {
          throw "Unsupported Sheet Macro action";
        }
      }
    }

    default: {
      throw "Unsupported Macro action";
    }
  }
}

export function handlRefreshGridAndToolbars() {
  appManager.activeGrid.refresh();
  handleActiveCellChanged();
  handleSelectionChanged();
  updateToolbarButtons();
}

async function getCombineActionFromMacroItem(
  macroItem: MacroItem
): Promise<{ error: MacroError; action: HistoryAction }> {
  let historyActions: HistoryAction[] = [];
  let error = null;
  let activeOffsetMap: {
    [key: string]: { [key: string]: ActiveCellOffsetDeclarator[] };
  } = {};
  for (const action of macroItem.listMacroActions) {
    const res = await handleMacroAction(
      action,
      macroItem.referenceType,
      activeOffsetMap
    );
    if (!res) {
      continue;
    }
    if (res instanceof MacroError) {
      if (!error) {
        error = res as MacroError;
      }
      continue;
    }
    historyActions.push(res as HistoryAction);
  }
  handlRefreshGridAndToolbars();
  return {
    action: new CombineAction(macroItem.name, historyActions, null, [], false),
    error: error,
  };
}
