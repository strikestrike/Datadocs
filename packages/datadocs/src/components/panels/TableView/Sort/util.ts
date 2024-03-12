import { MIME_TYPE_SORT_ITEM } from "./constants";

export function isAcceptableDragEvent(e: DragEvent) {
  const { types } = e.dataTransfer;
  return types.indexOf(MIME_TYPE_SORT_ITEM) !== -1;
}
