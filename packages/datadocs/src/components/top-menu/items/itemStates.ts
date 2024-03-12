import { get } from "svelte/store";
import { showQueryToolbarStore } from "../../../app/store/store-ui";

// view show Formular bar
export function getShowFormulaBar(): boolean {
  return get(showQueryToolbarStore);
}

export function toggleShowFormulaBar() {
  // showFormulaBar = !showFormulaBar;
  showQueryToolbarStore.update((show) => {
    return !show;
  });
}

// view show gridlines
export let showGridlines = false;
export function getShowGridlines(): boolean {
  return showGridlines;
}
export function toggleShowGridlines() {
  showGridlines = !showGridlines;
}

// view show formulas
export let showHeadings = false;
export function getShowHeadings(): boolean {
  return showHeadings;
}
export function toggleShowHeadings() {
  showHeadings = !showHeadings;
}

// view show protected ranges
export let showProtectedRanges = false;
export function getShowProtectedRanges(): boolean {
  return showProtectedRanges;
}
export function toggleShowProtectedRanges() {
  showProtectedRanges = !showProtectedRanges;
}
