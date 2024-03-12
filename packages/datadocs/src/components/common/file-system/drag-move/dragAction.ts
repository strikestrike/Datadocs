import type { DragActionOptions, MousePosition } from "./type";

export function dragAction(
  triggerElement: HTMLElement,
  options: DragActionOptions
) {
  let isDragging = false;

  function startDragging(position: MousePosition) {
    if (typeof options.handleDragStart === "function") {
      options.handleDragStart(position);
    }
    isDragging = true;
  }

  function handleDrag(position: MousePosition) {
    if (!isDragging) {
      return;
    }

    if (typeof options.handleDragging === "function") {
      options.handleDragging(position);
    }
  }

  function stopDragging(position: MousePosition) {
    if (!isDragging) {
      return;
    }

    if (typeof options.handleDragEnd === "function") {
      options.handleDragEnd(position);
    }
    isDragging = false;
  }

  function handleMouseDown(event: MouseEvent) {
    // Only allow dragging with left mouse button pressed
    if (event.button !== 0) {
      return;
    }

    removeGlobalEventListeners();
    addGlobalEventListeners();
  }

  function handleMouseUp(event: MouseEvent) {
    removeGlobalEventListeners();
    stopDragging(event);
  }

  function handleMouseMove(event: MouseEvent) {
    if (!isDragging) {
      startDragging(event);
    }
    handleDrag(event);
  }

  function addGlobalEventListeners() {
    document.addEventListener("mousemove", handleMouseMove, true);
    document.addEventListener("mouseup", handleMouseUp);
  }

  function removeGlobalEventListeners() {
    document.removeEventListener("mousemove", handleMouseMove, true);
    document.removeEventListener("mouseup", handleMouseUp);
  }

  triggerElement.addEventListener("mousedown", handleMouseDown);

  return {
    destroy() {
      removeGlobalEventListeners();
      triggerElement.removeEventListener("mousedown", handleMouseDown);
    },
  };
}
