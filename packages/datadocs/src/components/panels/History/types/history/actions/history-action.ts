import { get } from "svelte/store";
import { userInformationStore } from "../../../../../../api/store";
import type MacroAction from "../../macro/actions/macro-action";
import type {
  HistoryActionType,
  HistoryStateType,
  MACRO_ITEM_REFERENCE_TYPE,
} from "../../type";

export class HistoryState {
  readonly stateType: HistoryStateType = "BASE";

  constructor(type: HistoryStateType) {
    this.stateType = type;
  }
}

abstract class HistoryAction {
  // instanceCounter is used to create a unique identifier for history action
  static instanceCounter: number = 1;

  /**
   * unique id of HistoryAction
   */
  readonly id: string;

  /**
   * action is hidden
   */
  readonly hidden: boolean;

  /**
   * type of action
   */
  readonly actionType: HistoryActionType = "BASE";

  /**
   * time for create action
   */
  readonly createdDate: Date;

  /**
   * owner of action
   */
  readonly owner: string;

  /**
   * old state for undo action
   */
  readonly undoState: HistoryState;

  /**
   * new state for redo action
   */
  readonly redoState: HistoryState;

  /**
   * tags of action
   */
  readonly tags: string[];

  constructor(
    type: HistoryActionType,
    undoState: HistoryState,
    redoState: HistoryState,
    userId: string,
    tags: string[],
    hidden: boolean
  ) {
    this.hidden = hidden;
    this.actionType = type;
    this.undoState = undoState;
    this.redoState = redoState;
    if (userId) {
      this.owner = userId;
    } else {
      this.owner = get(userInformationStore).id;
    }

    this.createdDate = new Date();
    this.tags = tags;
    // generate unique id for history action instance
    this.id = "history_action__" + HistoryAction.instanceCounter;
    HistoryAction.instanceCounter++;
  }

  /**
   * get display name of action
   */
  abstract get displayName(): string;

  /**
   * Get name of owner
   */
  get ownerName(): string {
    const userInfo = get(userInformationStore);
    if (userInfo && userInfo.id === this.owner) {
      return [userInfo.firstName, userInfo.lastName].join(" ");
    }

    return "Other";
  }

  /**
   * function for undo action
   */
  async undo(refresh: boolean) {
    throw new Error("Method not implemented.");
  }

  /**
   * function for redo action
   */
  async redo(refresh: boolean) {
    throw new Error("Method not implemented.");
  }

  /**
   * Convert from history action to macro action
   * @param reference
   */
  abstract toMacroAction(
    reference: MACRO_ITEM_REFERENCE_TYPE,
    gridActiveCellMap: Map<string, any>
  ): MacroAction[];

  /**
   * Check if action is grid
   */
  isGrid(): boolean {
    return this.actionType === "GRID";
  }

  isSheet(): boolean {
    return this.actionType === "PANEL";
  }

  isNewSheet(): boolean {
    return (
      this.isSheet() &&
      (this.redoState.stateType === "ADD_SHEET" ||
        this.redoState.stateType === "DUPLICATE_SHEET")
    );
  }

  /**
   * Check if can add selections
   * @returns
   */
  canAddSelection(): boolean {
    return this.isGrid() && !this.hidden;
  }

  canAddActivateSheet(): boolean {
    if (this.isGrid()) {
      return !this.hidden;
    }
    if (this.isSheet()) {
      if (
        this.redoState &&
        (this.redoState.stateType === "ADD_SHEET" ||
          this.redoState.stateType === "DUPLICATE_SHEET")
      ) {
        return false;
      }
      return !this.hidden;
    }
    return false;
  }
}

export default HistoryAction;
