import type {
  FilterFieldPathInfo,
  GridFilterGroup,
  GridFilterRule,
  GridHeader,
  GridStructPathType,
} from "@datadocs/canvas-datagrid-ng";
import type { Writable } from "svelte/store";

export type DndDragObjectType = {
  /**
   * The group containing the rule.
   */
  group: GridFilterGroup;
  /**
   * The rule that is being dragged.
   */
  rule: GridFilterRule;
  layout: {
    width: number;
    height: number;
  };
};
export type DndDragObject = Writable<DndDragObjectType>;

export type DndDropTargetType = {
  /**
   * The group that the rule will be moved to.
   */
  group: GridFilterGroup;
  nearest?: {
    rule: GridFilterRule;
    onTop: boolean;
    order: number;
  };
};
export type DndDropTarget = Writable<DndDropTargetType>;

export type DndHandleDrop = (e: DragEvent) => any;

export type Position = { x: number; y: number };
export type DragContext = {
  offset: Position;
  current: Position;
  initializing: boolean;
};

export type NotifyAfterUpdate = () => any;

export type FieldSelectorFormulaTarget = {
  type: "formula";
};

export type FieldSelectorHeaderTarget = {
  type: "column";
  columnId: string;
  pathInfo?: FilterFieldPathInfo;
};

export type FieldSelectorTarget =
  | FieldSelectorFormulaTarget
  | FieldSelectorHeaderTarget;
