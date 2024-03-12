import { get, writable, Writable } from "svelte/store";
import type GridAction from "./actions/grid/grid-action";
import type HistoryAction from "./actions/history-action";
import type { GridActiveComponent } from "../type";
import type { SheetAction } from "./actions/sheet/sheet-action";

class HistoryManager {
  undoStackStore: Writable<HistoryAction[]>;
  redoStackStore: Writable<HistoryAction[]>;
  selectedArrayStore: Writable<string[]>;
  showHiddenStore: Writable<boolean>;
  isProcessing: boolean = false;

  constructor() {
    this.undoStackStore = writable([]);
    this.redoStackStore = writable([]);
    this.selectedArrayStore = writable([]);
    this.showHiddenStore = writable(false);
    this.isProcessing = false;
  }

  get undoStack() {
    return get(this.undoStackStore);
  }

  get redoStack() {
    return get(this.redoStackStore);
  }

  get selectedArrs() {
    return get(this.selectedArrayStore);
  }

  get showHidden() {
    return get(this.showHiddenStore);
  }

  updateUndoStack(stack: HistoryAction[]) {
    this.undoStackStore.set(stack);
  }

  updateRedoStack(stack: HistoryAction[]) {
    this.redoStackStore.set(stack);
  }

  updateSelectedArray(selectedArr: string[]) {
    this.selectedArrayStore.set(selectedArr);
  }

  updateShowHidden(show: boolean) {
    this.showHiddenStore.set(show);
  }

  clearRedoSelected() {
    const redoActions = this.redoStack;
    const redoIds = redoActions.map((a) => a.id);
    const selecteds = this.selectedArrs;
    const newSelecteds: string[] = [];
    for (const id of selecteds) {
      if (!redoIds.includes(id)) {
        newSelecteds.push(id);
      }
    }

    this.updateSelectedArray(newSelecteds);
  }

  /**
   * Add action to undo stack
   * Reset redo stack
   * @param action HistoryAction
   */
  add(action: HistoryAction) {
    if (action) {
      this.isProcessing = true;
      let undoActions = this.undoStack;
      undoActions.push(action);
      this.updateUndoStack(undoActions);
      this.clearRedoSelected();
      this.updateRedoStack([]);
      this.isProcessing = false;
    }
  }

  /**
   * Handle undo one action
   * @param refresh
   * @returns null
   */
  async undo(refresh: boolean = true) {
    if (this.isProcessing) {
      return;
    }
    this.isProcessing = true;
    let undoActions = this.undoStack;
    let redoActions = this.redoStack;
    let action = undoActions.pop();
    while (action) {
      if (!action.hidden) {
        await action.undo(refresh);
        redoActions.push(action);
        // Pop all hidden actions
        while (
          undoActions.length > 0 &&
          undoActions[undoActions.length - 1].hidden
        ) {
          redoActions.push(undoActions.pop());
        }
        break;
      } else {
        redoActions.push(action);
        action = undoActions.pop();
      }
    }
    this.updateRedoStack(redoActions);
    this.updateUndoStack(undoActions);
    this.isProcessing = false;
  }

  /**
   * Handle redo one action
   * @param refresh
   * @returns null
   */
  async redo(refresh: boolean = true) {
    if (this.isProcessing) {
      return;
    }
    this.isProcessing = true;
    let undoActions = this.undoStack;
    let redoActions = this.redoStack;
    let action = redoActions.pop();
    while (action) {
      if (!action.hidden) {
        await action.redo(refresh);
        undoActions.push(action);
        break;
      } else {
        undoActions.push(action);
        action = redoActions.pop();
      }
    }
    this.updateRedoStack(redoActions);
    this.updateUndoStack(undoActions);
    this.isProcessing = false;
  }

  async undoToActionId(actionId: string, refresh: boolean = true) {
    if (this.isProcessing) {
      return;
    }
    this.isProcessing = true;
    let undoActions = this.undoStack;
    let redoActions = this.redoStack;

    let action = undoActions.pop();
    while (action) {
      if (!action.hidden) {
        await action.undo(action.id === actionId && refresh);
        redoActions.push(action);
        if (action.id === actionId) {
          // Pop all hidden actions
          while (
            undoActions.length > 0 &&
            undoActions[undoActions.length - 1].hidden
          ) {
            redoActions.push(undoActions.pop());
          }
          break;
        } else {
          action = undoActions.pop();
        }
      } else {
        redoActions.push(action);
        action = undoActions.pop();
      }
    }

    this.updateRedoStack(redoActions);
    this.updateUndoStack(undoActions);
    this.isProcessing = false;
  }

  async redoToActionId(actionId: string, refresh: boolean = true) {
    if (this.isProcessing) {
      return;
    }
    this.isProcessing = true;
    let undoActions = this.undoStack;
    let redoActions = this.redoStack;

    let action = redoActions.pop();
    while (action) {
      if (!action.hidden) {
        await action.redo(action.id === actionId && refresh);
        undoActions.push(action);
        if (action.id === actionId) {
          break;
        }
        action = redoActions.pop();
      } else {
        undoActions.push(action);
        action = redoActions.pop();
      }
    }

    this.updateRedoStack(redoActions);
    this.updateUndoStack(undoActions);
    this.isProcessing = false;
  }

  /**
   * check if can undo
   * @returns boolean
   */
  canUndo() {
    return this.undoStack.length === 0;
  }

  /**
   * check if can redo
   * @returns boolean
   */
  canRedo() {
    return this.redoStack.length === 0;
  }

  /**
   * Get last Grid Unhidden Action
   * @param sheetId
   * @param gridId
   * @returns
   */
  getLastGridUnhiddenAction(
    sheetId: string,
    gridActiveComponent: GridActiveComponent
  ): HistoryAction {
    for (let idx = this.undoStack.length - 1; idx >= 0; idx--) {
      if (this.undoStack[idx].actionType !== "GRID") {
        continue;
      }
      const action = this.undoStack[idx] as GridAction;
      if (
        !action.hidden &&
        action.sheetId === sheetId &&
        action.gridActiveComponent.activeView.id ===
          gridActiveComponent.activeView.id
      ) {
        return action;
      }
    }

    return null;
  }

  /**
   * Get last Unhidden Action
   * @param sheetId
   * @returns
   */
  getLastUnhiddenAction(): HistoryAction {
    for (let idx = this.undoStack.length - 1; idx >= 0; idx--) {
      if (!this.undoStack[idx].isGrid() && !this.undoStack[idx].isSheet()) {
        continue;
      }
      const action = this.undoStack[idx];
      if (!action.hidden) {
        return action;
      }
    }

    return null;
  }

  /**
   * Check current action is active action
   * @param id
   * @returns
   */
  isActive(id: string) {
    for (let idx = this.undoStack.length - 1; idx >= 0; idx--) {
      const action = this.undoStack[idx];
      if (!action.hidden) {
        return action.id == id;
      }
    }

    return false;
  }

  isSelected(id: string): boolean {
    return this.selectedArrs.includes(id);
  }

  toggleSelected(id: string) {
    let selecteds = this.selectedArrs;
    const index = selecteds.indexOf(id);
    if (index === -1) {
      selecteds.push(id);
    } else {
      selecteds.splice(index, 1);
    }

    this.updateSelectedArray(selecteds);
  }

  getUndoActionBeforeAction(id: string, includeHidden: boolean = false) {
    let action: HistoryAction = null;
    for (let idx = this.undoStack.length - 1; idx >= 0; idx--) {
      const a = this.undoStack[idx];
      if (a.id === id) {
        break;
      }
      if (includeHidden || !a.hidden) {
        action = a;
      }
    }

    return action;
  }

  getSelectedActions(): HistoryAction[] {
    let selecteds = this.selectedArrs;
    const undoActions = this.undoStack;
    const redoActions = this.redoStack;
    let res: HistoryAction[] = [];
    for (const action of undoActions) {
      if (selecteds.includes(action.id)) {
        res.push(action);
      }
    }

    for (const action of [...redoActions].reverse()) {
      if (selecteds.includes(action.id)) {
        res.push(action);
      }
    }

    return res;
  }
}

export default HistoryManager;
