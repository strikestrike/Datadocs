import {
  MIME_TYPE_FILTER_CONDITION_REORDER,
  MIME_TYPE_FILTER_GROUP_REORDER,
} from "./constant";

export function isAcceptableDragEvent(e: DragEvent) {
  const { types } = e.dataTransfer;
  return (
    types.indexOf(MIME_TYPE_FILTER_CONDITION_REORDER) !== -1 ||
    types.indexOf(MIME_TYPE_FILTER_GROUP_REORDER) !== -1
  );
}
