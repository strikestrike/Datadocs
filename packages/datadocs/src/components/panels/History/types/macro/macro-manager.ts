import { get, writable, Writable } from "svelte/store";
import type { MacroItem } from "./macro-item";

export class MacroManager {
  macroItemsStore: Writable<MacroItem[]>;
  isProcessing: boolean = false;

  constructor() {
    this.macroItemsStore = writable([]);
  }

  get macroItems() {
    return get(this.macroItemsStore);
  }

  updateMacroItems(items: MacroItem[]) {
    this.macroItemsStore.set(items);
  }

  /**
   * Get valid name for current name
   * @param name
   */
  getValidName(name: string): string {
    const existedNames = this.macroItems.map((c) => c.name);

    let index = 0;
    let updatedName = name;
    while (existedNames.includes(updatedName)) {
      updatedName = name + " " + index;
      index++;
    }

    return updatedName;
  }

  /**
   * Get Macro from store by its id
   * @param id 
   * @returns 
   */
  getMacroItemById(id: string): MacroItem {
    return this.macroItems.find((m) => m.id === id);
  }

  /**
   * Add macro item to list of macro
   * @param action HistoryAction
   */
  add(macro: MacroItem) {
    if (macro) {
      this.isProcessing = true;
      let macroItems = this.macroItems;
      macroItems.push(macro);
      this.updateMacroItems(macroItems);
      this.isProcessing = true;
    }
  }
}
