import type { Writable } from "svelte/store";
import { writable, get } from "svelte/store";
import type { DropdownTriggerRect } from "../../../../common/dropdown/type";
import { tableOnSelectionStore } from "../../../../../app/store/writables";

// Indicate if pro tip menu has been showed previously
let isShowed = false;

export function hasProTipMenuBeenShowed() {
  return isShowed;
}

export function setProTipMenuAsShowed() {
  isShowed = true;
  applyStyleProTipStore.set(false);
}

export const applyStyleProTipStore: Writable<boolean> = writable(false);
export const applyStyleProTipPosition: Writable<DropdownTriggerRect> =
  writable(null);

export function closeStyleProTipMenu() {
  applyStyleProTipStore.set(false);
  applyStyleProTipPosition.set(null);
}

export function openStyleProTipMenu(rect: DropdownTriggerRect) {
  if (hasProTipMenuBeenShowed() || !get(applyStyleProTipStore)) {
    return;
  }
  applyStyleProTipPosition.set(rect);
}

tableOnSelectionStore.subscribe((value) => {
  const shouldShowProTipMenu = !hasProTipMenuBeenShowed() && value;
  if (shouldShowProTipMenu !== get(applyStyleProTipStore)) {
    applyStyleProTipStore.set(shouldShowProTipMenu);
  }
});
