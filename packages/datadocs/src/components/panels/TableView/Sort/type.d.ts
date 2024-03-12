import type { GridSort } from "@datadocs/canvas-datagrid-ng";
import type { Writable } from "svelte/store";

export type DndDragObjectType = {
  sort: GridSort;
  layout: {
    width: number;
    height: number;
  };
};
export type DndDragObject = Writable<DndDragObjectType>;

export type DndDropTargetType = {
  nearest: {
    rule: GridSort;
    onTop: boolean;
    order: number;
  };
};
export type DndDropTarget = Writable<DndDropTargetType>;
