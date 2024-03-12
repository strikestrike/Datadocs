import type { Writable } from "svelte/store";
import { writable } from "svelte/store";
import { indexByObject } from "./utils";
import type {
  ActiveDrag,
  DNDContext,
  DragContext,
  GlobalContext,
  Pane,
} from "../types";
import {
  CENTER,
  PANE_TYPE_GROUP,
  PANE_TYPE_PANE,
  PLACEMENT_CONTAINER,
  PLACEMENT_CONTAINER_CENTER,
} from "./constants";

/**
 * Drag context which stores the state of active drag
 * @type {DragContext}
 */
const DEFAULT_DRAG_CONTEXT: DragContext = {
  drag: {
    isMouseDown: false,
    preventDrop: false,
  },
  dnd: {
    isMouseDown: false,
    currentPane: null,
    type: "",
    edge: "",
    source: null,
    sourceBounds: null,
    sourceIndex: -1,
    sourceProxy: null,
    sourceCopy: null,
    target: null,
    targetProxy: null,
    stageBounds: null,
    startX: 0,
    startY: 0,
    x: 0,
    y: 0,
    offX: 0,
    offY: 0,
  },
};

export function getDNDContext(
  globalContext: GlobalContext,
  connector,
  panesManager,
  syncPanes,
  onLayoutChange
) {
  /**
   * Status of the active drag
   *
   */
  const activeDrag: Writable<ActiveDrag> = writable({
    ...DEFAULT_DRAG_CONTEXT.drag,
  });

  const dndContext: DNDContext = {
    dragStage: null,
    drag: activeDrag,
    dnd: {
      ...DEFAULT_DRAG_CONTEXT.dnd,
    },
    from: {},
    to: {},
    change: function (dnd = null, drag = null) {
      if (dnd !== null) {
        this.dnd = {
          ...this.dnd,
          ...dnd,
        };
      }
      if (drag !== null) {
        this.drag.update((value) => {
          return {
            ...value,
            ...drag,
          };
        });
      }
    },
    reset: function () {
      this.dnd = {
        ...DEFAULT_DRAG_CONTEXT.dnd,
      };
      this.to = {};
      this.from = {};
      this.drag.set({
        ...DEFAULT_DRAG_CONTEXT.drag,
      });
    },
    update: function (placement = "") {
      const panesMap = connector.panesMap;
      const { to: dndTo, from: dndFrom, preventDrop = false } = this;
      const dndFromPane: Pane = dndFrom.pane as Pane;
      const dndToPane: Pane = dndTo.pane as Pane;

      const fromParent = panesMap[dndFromPane.parent.id];
      const toParent = panesMap[dndToPane?.parent?.id];

      console.groupCollapsed("DNDContext");
      console.log("................. DND .................");
      console.log(dndFrom);
      console.log(dndTo);
      console.log(".......................................");
      console.groupEnd();
      if (dndFrom !== undefined && dndTo !== undefined) {
        if (dndFromPane && dndToPane) {
          if (dndFromPane === dndToPane) {
            if (
              dndFromPane.props.isTabsGroup &&
              dndFromPane.children?.length === 1
            ) {
              return;
            }
          }
          if (
            dndTo.dropArea === CENTER ||
            (dndTo.onTabs && dndTo.dropArea !== "north")
          ) {
            if (dndFromPane?.id === dndToPane?.id && dndTo.tabsList) {
              panesManager.rearrangeTab(dndFrom, dndTo);
            } else if (dndTo.tabIndex > -1 || dndTo.type === PANE_TYPE_PANE) {
              panesManager.insertTab(dndFrom, dndTo);
            }
          } else {
            if (toParent) {
              const toParentId = toParent.id;
              const toParentElement = document.getElementById(toParentId);
              if (toParentElement) {
                // const toParentBounds = toParentElement.getBoundingClientRect();
                // const childCount = toParent.children.length;
                // let parentSize = toParent.props.isVGroup
                //   ? toParentBounds.height
                //   : toParentBounds.width;
                // let minSize = toParent.props.isVGroup
                //   ? PANE_MIN_HEIGHT
                //   : PANE_MIN_WIDTH;
                // let childrenSize = (childCount + 1) * minSize;
                //if (parentSize > childrenSize) {
                if (!preventDrop) {
                  panesManager.insertPane(
                    dndFrom,
                    dndTo,
                    dndTo.dropArea,
                    placement
                  );
                }
              }
            }
          }

          if (
            fromParent.children.length === 1 &&
            fromParent.placement !== PLACEMENT_CONTAINER_CENTER &&
            fromParent.placement !== PLACEMENT_CONTAINER
          ) {
            if (fromParent.type === PANE_TYPE_GROUP && fromParent.parent) {
              const onlyPane = fromParent.children[0];
              const parentIndex = indexByObject(
                fromParent.parent.children,
                fromParent
              );
              if (parentIndex > -1) {
                fromParent.parent.children[parentIndex] = onlyPane;
                onlyPane.prev = fromParent.prev;
                onlyPane.next = fromParent.next;
                onlyPane.placement = fromParent.placement;
                onlyPane.parent = fromParent.parent;
                onlyPane.size = fromParent.size;
                delete panesMap[fromParent.id];
              }
            }
          }

          syncPanes(true);
          onLayoutChange();
          this.value = {};
        }
      }
    },
  };

  return dndContext;
}
