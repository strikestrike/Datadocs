import type { DataGroup } from "@datadocs/canvas-datagrid-ng";
import type { Writable } from "svelte/store";

export type DndDragObjectType = {
  group: DataGroup;
  layout: {
    width: number;
    height: number;
  };
};
export type DndDragObject = Writable<DndDragObjectType>;

export type DndDropTargetType = {
  nearest: {
    group: DataGroup;
    onTop: boolean;
    order: number;
  };
};
export type DndDropTarget = Writable<DndDropTargetType>;
