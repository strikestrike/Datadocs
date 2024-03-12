import { get, writable } from "svelte/store";

export let isDraggingStore = writable(false);

export function checkDragging() {
  return get(isDraggingStore);
}
