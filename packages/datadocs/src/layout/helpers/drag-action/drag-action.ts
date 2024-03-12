import type { DragActionOptions, PointerPosition } from "./types";

function handlePointerEvent(e: MouseEvent | TouchEvent): PointerPosition {
  const target = e instanceof MouseEvent ? e : e.touches[0];
  return { x: target.clientX, y: target.clientY };
}

export default function dragAction(
  el: HTMLElement,
  options: DragActionOptions
) {
  const removeMouseEvents = (all = false) => {
    setTimeout(() => {
      if (all) el.removeEventListener("mousedown", mousedown);
      window.removeEventListener("mousemove", mousemove);
      window.removeEventListener("mouseup", mouseup);
      window.removeEventListener("click", click, true);
    });
  };

  const removeTouchEvents = (all = false) => {
    if (all) el.removeEventListener("touchstart", touchstart);
    window.removeEventListener("touchmove", mousemove);
    window.removeEventListener("touchend", mouseup);
  };

  const mousedown = (e: MouseEvent) => {
    if (!options.onDragStartedCallback?.(handlePointerEvent(e))) {
      return;
    }

    e.stopPropagation();
    window.addEventListener("mousemove", mousemove);
    window.addEventListener("mouseup", mouseup);
    window.addEventListener("click", click, true);
  };
  const mousemove = (e: MouseEvent) => {
    if (!options.onDragCallback?.(handlePointerEvent(e))) {
      removeTouchEvents();
      return;
    }

    e.stopPropagation();
  };
  const mouseup = (e: MouseEvent) => {
    options.onDragEndedCallback?.();
    removeMouseEvents();
    e.stopPropagation();
  };
  const click = (e: MouseEvent) => {
    e.stopPropagation();
  };

  const touchstart = (e: TouchEvent) => {
    if (
      e.touches.length !== 1 ||
      !options.onDragStartedCallback?.(handlePointerEvent(e))
    ) {
      return;
    }

    e.stopPropagation();
    window.addEventListener("touchmove", touchmove);
    window.addEventListener("touchend", touchend);
  };
  const touchmove = (e: TouchEvent) => {
    if (!options.onDragCallback?.(handlePointerEvent(e))) {
      removeTouchEvents();
      return;
    }
    e.stopPropagation();
  };
  const touchend = (e: TouchEvent) => {
    options.onDragEndedCallback?.();
    removeTouchEvents();
    e.stopPropagation();
  };

  el.addEventListener("mousedown", mousedown);
  el.addEventListener("touchstart", touchstart);

  return {
    destroy() {
      removeMouseEvents(true);
      removeTouchEvents(true);
    },
  };
}
