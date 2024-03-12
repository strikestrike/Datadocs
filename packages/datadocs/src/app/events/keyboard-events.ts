import { get } from "svelte/store";
import { getGridStore } from "../store/grid/base";
import { handleUndo, handleRedo } from "../store/store-toolbar";

/**
 * Check if undo redo is possible. We don't allow to undo/redo
 * if there is an active editor or a modal
 * @returns
 */
function canUndoRedo() {
  const activeElement = document.activeElement;
  const grid = get(getGridStore());
  const hasModal = document.querySelector(".modal-container");
  const hasGridEditor = !!grid?.input;
  const hasActiveInput =
    activeElement instanceof HTMLElement &&
    (activeElement.tagName === "input" ||
      activeElement.tagName === "textarea" ||
      activeElement.isContentEditable);
  // console.log("debug here ==== ", {
  //   hasModal,
  //   hasGridEditor,
  //   hasActiveInput,
  // });
  return !hasModal && !hasGridEditor && !hasActiveInput;
}

async function handleUndoRedo(event: KeyboardEvent) {
  const { metaKey, ctrlKey, shiftKey } = event;
  const undoRedoKey = event.key === "z" || event.key === "Z";

  if ((metaKey || ctrlKey) && undoRedoKey && canUndoRedo()) {
    if (shiftKey) {
      await handleRedo();
    } else {
      await handleUndo();
    }
  }
}

let init = false;

export function removeKeyboardEvents() {
  if (!init) return;
  window.removeEventListener("keydown", handleUndoRedo);
  init = false;
}

export function addKeyboardEvents() {
  if (init) return;
  window.addEventListener("keydown", handleUndoRedo);
  init = true;
}
