import { get, writable } from "svelte/store";

interface ListenerMap {
  onMouseMove: (event: MouseEvent) => void;
  onMouseUp: (event: MouseEvent) => void;
  onWindowMouseUp: (event: MouseEvent) => void;
}

export const listenerStatus = writable<boolean>(false);

export const listenerMap = writable<ListenerMap | null>(null);

export function useListener({
  onMouseMove,
  onMouseUp,
  onWindowMouseUp,
}: ListenerMap) {
  function addListener() {
    if (!get(listenerStatus)) {
      listenerMap.set({
        onMouseMove,
        onMouseUp,
        onWindowMouseUp,
      });
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
      window.addEventListener("mouseup", onWindowMouseUp);
      listenerStatus.set(true);
    }
  }

  function removeListener() {
    if (get(listenerStatus)) {
      const listenerObj = get(listenerMap);
      document.removeEventListener("mousemove", listenerObj.onMouseMove);
      document.removeEventListener("mouseup", listenerObj.onMouseUp);
      window.removeEventListener("mouseup", listenerObj.onWindowMouseUp);
      listenerStatus.set(false);
      listenerMap.set(null);
    }
  }

  return {
    addListener,
    removeListener,
  };
}
