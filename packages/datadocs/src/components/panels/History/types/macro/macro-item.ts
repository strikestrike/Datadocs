import { get } from "svelte/store";
import { userInformationStore } from "../../../../../api/store";
import type { MACRO_ITEM_REFERENCE_TYPE } from "../type";
import type MacroAction from "./actions/macro-action";

export class MacroItem {
  // instanceCounter is used to create a unique identifier for macro item
  static instanceCounter: number = 1;

  /**
   * unique id of Macro Item
   */
  readonly id: string;

  /**
   * name of macro item
   */
  name: string;

  /**
   * time for create item
   */
  readonly createdDate: Date;

  /**
   * owner of action
   */
  readonly owner: string;

  /**
   * reference type of macro item is 'absolute' or 'relative'
   */
  referenceType: MACRO_ITEM_REFERENCE_TYPE = "ABSOLUTE";

  listMacroActions: MacroAction[];

  constructor(
    name: string,
    listMacroActions: MacroAction[],
    referenceType: MACRO_ITEM_REFERENCE_TYPE,
    userId: string
  ) {
    this.name = name;
    this.listMacroActions = listMacroActions;
    this.referenceType = referenceType;

    if (userId) {
      this.owner = userId;
    } else {
      this.owner = get(userInformationStore).id;
    }

    this.createdDate = new Date();
    // generate unique id for history action instance
    this.id = "macro_item__" + MacroItem.instanceCounter;
    MacroItem.instanceCounter++;
  }
}
