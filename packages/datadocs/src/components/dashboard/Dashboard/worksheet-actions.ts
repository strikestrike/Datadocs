import { get } from "svelte/store";
import { DND_INSERT_OBJECT } from "../../../app/core/global/app-dnd";
import { appManager } from "../../../app/core/global/app-manager";
import { ObjectEnum } from "src/layout/enums/object";
import type { ObjectType } from "src/layout/types/object";
import {
  PANE_GROUP_HORIZONTAL,
  PANE_TYPE_GROUP,
  PANE_TYPE_PANE,
  SOUTH_EDGE,
  WEST_EDGE,
} from "../../../layout/_dprctd/core/constants";
import { indexByObject } from "../../../layout/_dprctd/core/utils";
import type { Pane } from "../../../layout/_dprctd/types";
import { useLayoutSheet } from "src/layout/store/pane";

const { sync } = useLayoutSheet();

export function containerPaneAction(element: HTMLElement, [pane]: [Pane]) {
  let targetPane: Pane = pane;

  function onMouseDown(event: MouseEvent & { handled?: boolean }) {
    if (!event.handled) {
      appManager.setActiveItems(targetPane, element);
      event.handled = true;
    }
  }

  function onPaneMouseUp(event: MouseEvent & { handled?: boolean }) {
    // console.log("actions drag end", event, element);
    if (event.target === element || element.contains(event.target as Node)) {
      const edgeDropArea =
        appManager.worksheetLayout?.dndContext?.dnd?.edgeDropArea;

      // Handle Object Drag and Drop
      if (appManager.activeDND !== undefined && appManager.activeDND !== null) {
        if (edgeDropArea && edgeDropArea !== "none") {
          const droppedPane = appManager.worksheetLayout.dndContext?.to?.pane;
          if (droppedPane) {
            appManager.objectsManager.split({
              source: get(appManager.activeDND)?.data?.pane,
              targetId: droppedPane.id,
              edge: edgeDropArea,
            });
            sync();
          }
          event.handled = true;
        } else if (!event.handled) {
          if (
            targetPane.type === PANE_TYPE_PANE &&
            (targetPane.parent.props.isHGroup ||
              targetPane.parent.props.isVGroup ||
              (targetPane.parent.props.isEmbeddedGroup &&
                get(appManager.activeDND)?.data?.type !==
                  ObjectEnum.CONTAINER &&
                get(appManager.activeDND)?.data?.type !==
                  ObjectEnum.CONTAINER_TILED))
          ) {
            if (
              get(appManager.activeDND)?.action === DND_INSERT_OBJECT &&
              targetPane
            ) {
              const bounds = element.getBoundingClientRect();
              appManager.objectsManager.addObject(
                get(appManager.activeDND)?.data,
                element,
                targetPane,
                {
                  x: event.clientX - bounds.x,
                  y: event.clientY - bounds.y,
                }
              );
              appManager.activeDND.set(null);
              event.handled = true;
            }
          } else if (targetPane.type === PANE_TYPE_GROUP) {
            if (
              get(appManager.activeDND)?.action === DND_INSERT_OBJECT &&
              targetPane
            ) {
              const bounds = element.getBoundingClientRect();
              appManager.objectsManager.addObject(
                get(appManager.activeDND)?.data,
                element,
                targetPane,
                {
                  x: event.clientX - bounds.x,
                  y: event.clientY - bounds.y,
                }
              );
              appManager.activeDND.set(null);
              event.handled = true;
            }
          }
        }
      }
    }
  }

  element.addEventListener("mousedown", onMouseDown);
  element.addEventListener("mouseup", onPaneMouseUp);

  return {
    update: ([pane]) => {
      targetPane = pane;
    },
    destroy: () => {
      element.removeEventListener("mousedown", onMouseDown);
      element.removeEventListener("mouseup", onPaneMouseUp);
    },
  };
}

export function onDividerDrag(element: HTMLElement, pane: Pane) {
  if (appManager.activeDND) {
    return true;
  }
  return false;
}

export function onDividerDrop(element: HTMLElement, pane: Pane, dropSide = "") {
  if (appManager.activeDND) {
    const object: ObjectType = get(appManager.activeDND)?.data as ObjectType;
    const parent: Pane = pane.parent;
    if (parent) {
      if (
        appManager.activeDND &&
        get(appManager.activeDND)?.action === DND_INSERT_OBJECT &&
        parent
      ) {
        appManager.objectsManager.addObject(object, element, pane.parent, {
          index: indexByObject(parent.children, pane) + 1,
        });
        appManager.activeDND.set(null);
        appManager.worksheetLayout.dndContext.reset();
      }
    }
    appManager.activeDND.set(null);
  }
}

export function onPaneMouseMove(
  element: HTMLElement,
  pane: Pane,
  checkPaneMousePosition
) {
  if (appManager.activeDND) {
    checkPaneMousePosition();
  }
}
