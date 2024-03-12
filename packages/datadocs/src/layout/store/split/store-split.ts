import type { SplitData } from "src/layout/types/split";
import { writable } from "svelte/store";

export const splitDataSheet = writable<SplitData>(null);
export const splitDataWorkbook = writable<SplitData>(null);
