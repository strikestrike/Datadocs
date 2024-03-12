import type { Writable } from "svelte/store";
import { writable } from "svelte/store";
import type HistoryManager from "../../../components/panels/History/types/history/history-manager";
import type { MacroManager } from "../../../components/panels/History/types/macro/macro-manager";

export const activeHistoryManager: Writable<HistoryManager> = writable(null);
export const activeMacroManager: Writable<MacroManager> = writable(null);

export const isTableViewOpen: Writable<boolean> = writable(false);
