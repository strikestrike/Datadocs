import type HistoryAction from "../../history/actions/history-action";
import type {
  HistoryActionType,
  HistoryStateType,
  MacroError,
} from "../../type";

export class MacroState {
  readonly stateType: HistoryStateType = "BASE";

  constructor(type: HistoryStateType) {
    this.stateType = type;
  }
}

abstract class MacroAction {
  // instanceCounter is used to create a unique identifier for history action
  static instanceCounter: number = 1;

  /**
   * unique id of HistoryAction
   */
  readonly id: string;

  /**
   * type of action
   */
  readonly actionType: HistoryActionType = "BASE";

  /**
   * new state for redo action
   */
  readonly macroState: MacroState;

  constructor(type: HistoryActionType, macroState: MacroState) {
    this.actionType = type;
    this.macroState = macroState;

    // generate unique id for history action instance
    this.id = "macro_action__" + MacroAction.instanceCounter;
    MacroAction.instanceCounter++;
  }
}

export default MacroAction;
