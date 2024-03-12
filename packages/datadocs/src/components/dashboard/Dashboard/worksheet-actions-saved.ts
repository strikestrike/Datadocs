import { get } from "svelte/store";
import { DND_INSERT_OBJECT } from "../../../app/core/global/app-dnd";
import type { EventPayload } from "../../../app/core/global/app-manager";
import { appManager } from "../../../app/core/global/app-manager";
import {
  OBJECT_TYPE_CHART,
  OBJECT_TYPE_CONTAINER,
  OBJECT_TYPE_CONTAINER_TILED,
  OBJECT_TYPE_IMAGE,
  OBJECT_TYPE_SPREADSHEET,
} from "../../../layout/store/object/objects-constants";
import type { ObjectType } from "../../../layout/store/object/objects-types";
import { activeContainer, activePane } from "../../../app/store/store-ui";
import {
  PANE_FIXED,
  PANE_GROUP_FIXED,
  PANE_GROUP_TILED,
  PANE_TYPE_GROUP,
  PANE_TYPE_PANE,
  PLACEMENT_CONTAINER_CENTER_BOTTOM,
  PLACEMENT_CONTAINER_RIGHT,
} from "../../../layout/_dprctd/core/constants";
import { getId } from "../../../layout/_dprctd/core/utils";
import type { Pane } from "../../../layout/_dprctd/types";
import { WS_ADD_OBJECT } from "../../panels/_dprctd-WorkbookSheets/worksheet-actions";

export function addObject(
  element: HTMLElement,
  object: ObjectType,
  targetPane: Pane,
  clientX: number,
  clientY?: number,
  dropSide?: string
) {
  const params: any = {
    size: 500,
  };

  let newPane: Pane = null;

  if (object.type === OBJECT_TYPE_CONTAINER) {
    params.viewConfig = { config: {} };
  } else if (object.type === OBJECT_TYPE_CONTAINER_TILED) {
    params.viewConfig = { config: {} };
  } else if (object.type === OBJECT_TYPE_SPREADSHEET) {
    params.viewConfig = {
      id: getId(),
      name: "spreadsheet",
      label: "Grid 1",
      icon: "status-bar-spreadsheet",
      config: {},
    };
  } else if (object.type === OBJECT_TYPE_IMAGE) {
    params.viewConfig = {
      id: getId(),
      name: "image",
      label: "Image 1",
      icon: "image",
      config: {},
    };
  } else if (object.type === OBJECT_TYPE_CHART) {
    params.viewConfig = {
      id: getId(),
      name: "graph",
      label: "Graph 1",
      icon: "graph",
      config: {},
    };
  }

  if (params.viewConfig !== undefined) {
    if (element && targetPane.props.isFixedGroup) {
      const mouseX: number = clientX;
      const mouseY: number = clientY;
      const paneBounds = element.getBoundingClientRect();

      params.placement = "fixed";
      params.viewConfig.config = {
        transform: {
          x: mouseX - paneBounds.x,
          y: mouseY - paneBounds.y,
        },
      };
    } else if (targetPane.props.isCustomGroup) {
      params.placement = "tile";
    } else if (targetPane.props.isHGroup || targetPane.props.isVGroup) {
      if (dropSide === "right-before") {
        params.placement = PLACEMENT_CONTAINER_RIGHT;
      } else if (dropSide === "bottom-before") {
        params.placement = PLACEMENT_CONTAINER_CENTER_BOTTOM;
      }
    }

    if (object.type === OBJECT_TYPE_CONTAINER) {
      newPane = appManager.worksheetLayout.panesContext.createPane(
        PANE_TYPE_GROUP,
        PANE_GROUP_FIXED,
        params
      );
      if (params?.viewConfig?.config?.transform) {
        params.viewConfig.config.transform.width = 900;
        params.viewConfig.config.transform.height = 600;
      }
    } else if (object.type === OBJECT_TYPE_CONTAINER_TILED) {
      newPane = appManager.worksheetLayout.panesContext.createPane(
        PANE_TYPE_GROUP,
        PANE_GROUP_TILED,
        params
      );
      if (params?.viewConfig?.config?.transform) {
        params.viewConfig.config.transform.width = 900;
        params.viewConfig.config.transform.height = 600;
      }
    } else {
      newPane = appManager.worksheetLayout.panesContext.createPane(
        PANE_TYPE_PANE,
        PANE_FIXED,
        params
      );
    }

    if (newPane !== null) {
      appManager.worksheetLayout.panesContext.insertPane(targetPane, newPane);
    }
  }
}

export function containerPaneAction(element: HTMLElement, [pane]: [Pane]) {
  let targetPane: Pane = pane;

  function onMouseDown(event: MouseEvent) {
    if (targetPane.type === PANE_TYPE_GROUP) {
      event.stopPropagation();
      activeContainer.set({
        id: targetPane.id,
        type: targetPane.props.groupType,
      });
    } else if (targetPane.type === PANE_TYPE_PANE) {
      activePane.set({
        id: targetPane.id,
      });
    }
  }

  function onPaneMouseUp(event: MouseEvent) {
    if (event.target === element) {
      if (targetPane.type === PANE_TYPE_PANE) {
      } else if (targetPane.type === PANE_TYPE_GROUP) {
        if (
          get(appManager.activeDND) &&
          get(appManager.activeDND).action === DND_INSERT_OBJECT
        ) {
          addObject(
            element,
            get(appManager.activeDND).data,
            targetPane,
            event.clientX,
            event.clientY
          );
          appManager.activeDND.set(null);
        }
      }
    }
  }

  appManager.listen(WS_ADD_OBJECT, (payload: EventPayload) => {
    const { object } = payload.data;
    console.log(object);
    if (
      appManager.activeContainer &&
      appManager.activeContainer.id === targetPane.id
    ) {
      if (element) {
        const bounds = element.getBoundingClientRect();
        addObject(
          element,
          object,
          targetPane,
          bounds.width / 2,
          bounds.height / 2
        );
      }
      appManager.activeDND.set(null);
    }
  });

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
