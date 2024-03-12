import {
  PANE_CONTENT_VIEW,
  PANE_TYPE_GROUP,
  PANE_TYPE_PANE,
} from "../../../layout/_dprctd/core/constants";
import type { GlobalContext, Pane } from "../../../layout/_dprctd/types";
import { getGridInstance, grid, gridDataSource } from "../../store/grid/base";
import { testCounter } from "../../store/store-main";
import { activeContainer, activePane, activeView } from "../../store/store-ui";
import type {
  ActiveContainer,
  ActivePane,
  ActiveView,
} from "../../store/types";

import { api } from "../api";
import LayerManager from "../layers/LayersManager";
import { ObjectEnum } from "src/layout/enums/object";
import ObjectsManager from "../../../layout/store/object/ObjectsManager";
import { appDnd } from "./app-dnd";
import type { GridPublicAPI } from "@datadocs/canvas-datagrid-ng/lib/types/grid";
import type { GridActiveComponent } from "../../../components/panels/History/types/type";
import { useLayoutSheet } from "src/layout/store/pane";
import { get } from "svelte/store";

type AnyFunction = (...args: any) => void;

export type ComponentPayload = {
  message: string;
  callbacks?: {
    [key: string]: AnyFunction;
  };
  data?: any;
};

export type EventPayload = {
  data?: any;
};

interface AppState {
  activeContainer: ActiveContainer;
  activePane: ActivePane;
  activeView: ActiveView;
  activeGrid: GridPublicAPI;
}

class AppManager {
  panelsLayout: GlobalContext;
  worksheetLayout: GlobalContext;

  layerManager: LayerManager;
  objectsManager: ObjectsManager;

  activeDND = appDnd;

  components = {};

  events = {};

  api = api;

  state: AppState = {
    activeContainer: {
      type: "",
      id: "",
    },
    activePane: {
      id: "",
      element: null,
    },
    activeView: {
      type: "",
      id: "",
    },
    activeGrid: null,
  };

  get activePanels() {
    return this.panelsLayout.panels.activePanels;
  }

  get activeContainer(): ActiveContainer {
    return this.state.activeContainer;
  }

  get activePane() {
    return this.state.activePane;
  }

  get activeGrid() {
    return this.state.activeGrid;
  }

  initialize() {
    activeContainer.subscribe((activeContainer) => {
      this.state.activeContainer = activeContainer;
    });
    activePane.subscribe((activePane) => {
      this.state.activePane = activePane;
    });
    activeView.subscribe((activeView) => {
      this.state.activeView = activeView;
      this.setActiveGrid(activeView);
    });
    grid.subscribe((grid) => {
      if (this.state.activeGrid && this.state.activeGrid !== grid) {
        this.state.activeGrid.setPassive(true);
      }
      if (this.state.activeGrid !== grid) {
        if (grid !== null) {
          grid.setPassive(false);
        }
        this.state.activeGrid = grid;
      }
    });
  }

  /* UI Operations */

  togglePanel(...args) {
    this.panelsLayout.panels.togglePanel(...args);
  }

  setActivePane(pane: Pane, element: HTMLElement, checkParent = true) {
    activePane.set({
      id: pane.id,
      element,
    });
    if (pane?.content?.view !== undefined) {
      activeView.set({
        id: pane?.content?.view.id,
        type: pane?.content?.view.name,
      });
    } else {
      this.clearActive(PANE_CONTENT_VIEW);
    }
    if (checkParent) {
      if (pane?.parent?.type === PANE_TYPE_GROUP) {
        activeContainer.set({
          id: pane?.parent?.id,
          type: pane?.parent?.type,
        });
      }
    }
  }

  setActiveItems(pane: Pane, element: HTMLElement) {
    if (pane.type === PANE_TYPE_PANE) {
      this.clearActive(PANE_TYPE_GROUP);
      this.setActivePane(pane, element);
    } else if (pane.type === PANE_TYPE_GROUP) {
      activeContainer.set({
        id: pane.id,
        type: pane.type,
      });
      if (pane.props.isEmbeddedGroup) {
        this.setActivePane(pane, element);
      } else {
        this.clearActive(PANE_TYPE_PANE);
        this.clearActive(PANE_CONTENT_VIEW);
      }
      // if (
      //   appManager.activePane.element === null ||
      //   !element.contains(appManager.activePane.element)
      // ) {
      //   activeContainer.set({
      //     id: pane.id,
      //     type: pane.type,
      //   });
      //   this.clearActive(PANE_TYPE_PANE);
      //   this.clearActive(PANE_CONTENT_VIEW);
      // }
    }
  }

  getGridActiveComponent(): GridActiveComponent {
    // const activePane = this.worksheetLayout.panesContext.getPane(
    //   this.state.activePane.id
    // );
    const { activePaneId, getById, getParentById } = useLayoutSheet();
    const activeId = get(activePaneId);
    const activePane = getById(activeId);
    const parent = getParentById(activeId);
    return {
      activePane: {
        id: activePane.id,
        element: null,
      },
      activeView: {
        id: this.state.activeView.id,
        type: this.state.activeView.type,
      },
      activeContainer: {
        id: parent.id,
        type: parent.type,
      },
      activePaneTab: {
        id: parent?.id,
        activeIndex: parent?.children?.findIndex(
          (item) => item.id === parent?.props?.activeId
        ),
      },
    };
    // return {
    //   activePane: {
    //     id: this.state.activePane.id,
    //     element: null,
    //   },
    //   activeView: {
    //     id: this.state.activeView.id,
    //     type: this.state.activeView.type,
    //   },
    //   activeContainer: {
    //     id: this.state.activeContainer.id,
    //     type: this.state.activeContainer.type,
    //   },
    //   activePaneTab: {
    //     id: activePane?.parent?.id,
    //     activeIndex: activePane?.parent?.props.activeChild,
    //   },
    // };
  }

  setGridActionComponenent(gridActiveComponent: GridActiveComponent) {
    if (gridActiveComponent.activePane.id !== this.state.activePane.id) {
      activePane.set({ ...gridActiveComponent.activePane });
    }
    activeView.set({ ...gridActiveComponent.activeView });
    activeContainer.set({ ...gridActiveComponent.activeContainer });
    if (gridActiveComponent.activePaneTab?.id) {
      // setTimeout(() => {
      //   const pane = this.worksheetLayout.panesContext.getPane(
      //     gridActiveComponent.activePaneTab.id
      //   );
      //   if (pane) {
      //     this.worksheetLayout.panesContext.activeTabChange(
      //       pane,
      //       gridActiveComponent.activePaneTab.activeIndex
      //     );
      //   }
      // });
    }
  }

  clearActive(type) {
    if (type === PANE_TYPE_GROUP) {
      activeContainer.set({
        id: "",
        type: "",
      });
    } else if (type === PANE_TYPE_PANE) {
      activePane.set({
        id: "",
        element: null,
      });
    } else if (type === PANE_CONTENT_VIEW) {
      activeView.set({
        id: "",
        type: "",
      });
    }
  }

  setActiveGrid(activeView: ActiveView) {
    // subscribe to activeViewId to update grid/gridDataSource
    if (activeView.type === ObjectEnum.SPREADSHEET) {
      const selectedGrid = getGridInstance(activeView.id, false);
      if (!selectedGrid) {
        grid.set(null);
        gridDataSource.set(null);
      } else {
        grid.set(selectedGrid);
        gridDataSource.set(selectedGrid.dataSource);
      }
    } else {
      grid.set(null);
      gridDataSource.set(null);
    }
  }

  /* Inter-component messaging */

  register(identifier: string, handler: AnyFunction) {
    this.components[identifier] = handler;
    console.groupCollapsed("AppManager");
    console.log("Component: Registered :  " + identifier);
    console.groupEnd();
  }

  send(identifier: string, payload: ComponentPayload) {
    const handler: AnyFunction = this.components[identifier];
    if (typeof handler === "function") {
      console.groupCollapsed("AppManager");
      console.log("send ", payload.message);
      console.log(payload);
      console.groupEnd();
      handler(payload);
    } else {
      console.groupCollapsed("AppManager");
      console.log(
        "Component: Error : No registered receiver for " + identifier
      );
      console.groupEnd();
    }
  }

  sendToActiveContainer(payload: ComponentPayload) {
    if (this.state.activeContainer) {
      const activeContainerId = `${this.state.activeContainer.type}-${this.state.activeContainer.id}`;
      this.send(activeContainerId, payload);
    }
  }

  sendToActivePane(payload: ComponentPayload) {
    if (this.state.activePane) {
      const activePaneId = `pane-${this.state.activePane.id}`;
      this.send(activePaneId, payload);
    }
  }

  /* Event subscription */

  listen(eventName: string, handler: AnyFunction) {
    this.events[eventName] = this.events[eventName] || [];
    this.events[eventName].push(handler);
  }

  trigger(eventName: string, payload: EventPayload) {
    const listeners: Array<AnyFunction> = this.events[eventName];
    if (listeners instanceof Array && listeners.length) {
      for (let i = 0; i < listeners.length; i++) {
        const listener: AnyFunction = listeners[i];
        if (typeof listener === "function") {
          listener(payload);
        }
      }
    }
  }

  /* Global State Changes */

  counterIncrement() {
    testCounter.update((value) => value + 1);
  }

  counterDecrement() {
    testCounter.update((value) => value - 1);
  }

  counterSet(value) {
    testCounter.set(value);
  }
}

const appManager: AppManager = new AppManager();
appManager.layerManager = new LayerManager();
appManager.objectsManager = new ObjectsManager();

export { appManager };
