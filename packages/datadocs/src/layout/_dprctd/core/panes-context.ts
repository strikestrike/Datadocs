import {
  getId,
  indexByObject,
  indexByProperty,
  insertToArray,
  removeFromArray,
  removeFromArrayIndex,
} from "./utils";
import type {
  GlobalContext,
  Pane,
  PanePlacement,
  PanesContext,
  PanesManager,
  View,
} from "../types";
import {
  EAST,
  NORTH,
  PANE_CLOSED_SIZE,
  PANE_MIN_HEIGHT,
  PANE_MIN_WIDTH,
  PANE_TYPE_GROUP,
  PANE_TYPE_PANE,
  PANE_TABBED,
  PLACEMENT_CONTAINER_CENTER_BOTTOM,
  PLACEMENT_CONTAINER_CENTER_MAIN,
  PLACEMENT_CONTAINER_LEFT,
  PLACEMENT_CONTAINER_RIGHT,
  SOUTH,
  WEST,
} from "./constants";
import { cloneDeep } from "lodash-es";

export function getPanesContext(
  globalContext: GlobalContext,
  panesManager: PanesManager,
  connector,
  syncPanes,
  onLayoutChange
) {
  const panesContext: PanesContext = {
    /**
     * Method which expands a collapsed Pane
     *
     */
    expand: function (pane, index = null, size = undefined, apply = true) {
      const panesMap = connector.panesMap;
      if (
        pane.parent &&
        pane.parent.type === PANE_TYPE_GROUP &&
        pane.parent.props.isClosed
      ) {
        const parent = panesMap[pane.parent.id];
        const children = parent.children;

        if (size !== undefined) {
          parent.size = size;
        }
        parent.props.isClosed = false;
        for (let i = 0; i < children.length; i++) {
          let childPane = children[i];
          childPane = panesMap[childPane.id];
          childPane.props.isClosed = false;
        }
        parent.children = children;
        panesMap[pane.parent.id] = parent;
      } else if (pane.type === PANE_TYPE_GROUP && pane.props.isClosed) {
        const parent = panesMap[pane.id];
        const children = parent.children;

        if (size !== undefined) {
          parent.size = size;
        }
        parent.props.isClosed = false;
        for (let i = 0; i < children.length; i++) {
          let childPane = children[i];
          childPane = panesMap[childPane.id];
          childPane.props.isClosed = false;
        }
        parent.children = children;
        panesMap[pane.id] = parent;
      } else if (pane.type === PANE_TYPE_PANE) {
        pane = panesMap[pane.id];

        if (size !== undefined) {
          pane.size = size;
        }
        pane.props.isClosed = false;
        if (index !== null && pane.props.isTabsGroup) {
          pane.props.activeChild = index;
        }
        panesMap[pane.id] = pane;
      }

      if (apply) {
        syncPanes();
        onLayoutChange();
      }
    },
    /**
     * Method which collapses an expanded Pane
     *
     */
    collapse: function (pane: Pane, index = null, quick = true, apply = true) {
      const panesMap = connector.panesMap;

      function collapseEnd() {
        if (apply) {
          syncPanes();
          onLayoutChange();
        }
      }

      if (
        pane.parent &&
        /inner/.test(pane.placement) &&
        (pane.parent.props.isHGroup || pane.parent.props.isVGroup)
      ) {
        const parent: Pane = panesMap[pane.parent.id];

        function collpasePane() {
          const children = parent.children;
          parent.props.isClosed = true;
          for (let i = 0; i < children.length; i++) {
            let childPane = children[i];
            childPane = panesMap[childPane.id];
            childPane.props.isClosed = true;
          }
          parent.children = children;
          panesMap[pane.parent.id] = parent;
          collapseEnd();
        }

        if (quick) {
          collpasePane();
        } else {
          if (parent) {
            const parentElement: HTMLElement = document.getElementById(
              pane.parent.id
            );
            parentElement.classList.remove("is-closing");
            parentElement.classList.add("is-closing");
            if (parent.props.isVGroup) {
              parentElement.style.minWidth = "unset";
              parentElement.style.width = PANE_CLOSED_SIZE + "px";
            } else {
              parentElement.style.minHeight = "unset";
              parentElement.style.height = PANE_CLOSED_SIZE + "px";
            }
            setTimeout(() => {
              collpasePane();
            }, 50);
          }
        }
      } else if (pane.type === PANE_TYPE_GROUP) {
        const parent: Pane = panesMap[pane.id];

        function collapsePane() {
          const children = parent.children;
          parent.props.isClosed = true;
          for (let i = 0; i < children.length; i++) {
            let childPane = children[i];
            childPane = panesMap[childPane.id];
            childPane.props.isClosed = true;
          }
          parent.children = children;
          panesMap[pane.id] = parent;
          collapseEnd();
        }

        if (quick) {
          collapsePane();
        } else {
          if (parent) {
            const parentElement: HTMLElement = document.getElementById(
              parent.id
            );
            parentElement.classList.remove("is-closing");
            parentElement.classList.add("is-closing");
            if (parent.props.isVGroup) {
              parentElement.style.minWidth = "unset";
              parentElement.style.width = PANE_CLOSED_SIZE + "px";
            } else {
              parentElement.style.minHeight = "unset";
              parentElement.style.height = PANE_CLOSED_SIZE + "px";
            }
            setTimeout(() => {
              collapsePane();
            }, 50);
          }
        }
      } else if (pane.type === PANE_TYPE_PANE) {
        pane = panesMap[pane.id];
        if (quick) {
          pane.props.isClosed = true;
          panesMap[pane.id] = pane;
          collapseEnd();
        } else {
          if (pane) {
            const paneElement: HTMLElement = document.getElementById(pane.id);
            paneElement.classList.remove("is-closing");
            paneElement.classList.add("is-closing");
            if (pane.parent.props.isHGroup) {
              paneElement.style.minWidth = "unset";
              paneElement.style.width = PANE_CLOSED_SIZE + "px";
            } else {
              paneElement.style.minHeight = "unset";
              paneElement.style.height = PANE_CLOSED_SIZE + "px";
            }
            setTimeout(() => {
              pane.props.isClosed = true;
              panesMap[pane.id] = pane;
              collapseEnd();
            }, 50);
          }
        }
      }
    },

    /**
     * Get Pane definition with Id
     *
     */
    getPane: function (id: string): Pane | null {
      const panesMap = connector.panesMap;
      const pane = panesMap[id];
      if (pane !== undefined) {
        return pane;
      }
      return null;
    },
    /**
     *Get Pane definition with placement
     *
     */
    getPaneByPlacement: function (placement: PanePlacement): Pane | null {
      const placementMap = connector.placementMap;
      const pane = placementMap[placement];
      if (pane !== undefined) {
        return pane;
      }
      return null;
    },
    getPaneByViewId: function (id: string) {
      const viewPanesMap = connector.viewPanesMap;
      const pane: Pane = viewPanesMap[id];
      if (pane) {
        return pane;
      }
      return null;
    },
    getView: function (id: string) {
      const viewsMap = connector.viewsMap;
      const view: View = viewsMap[id];
      if (view) {
        return view;
      }
      return null;
    },
    getViewIndex: function (id: string) {
      const viewIndexMap = connector.viewIndexMap;
      const index: number = viewIndexMap[id];
      if (index) {
        return index;
      }
      return null;
    },

    insertNewPane(
      pane: Pane,
      type: string,
      side: string,
      paneIndex: number,
      dragInsert = false
    ) {
      // tabscheck
      // const panesMap = connector.panesMap;
      // const fromPane: Pane = {
      //   ...pane,
      //   id: getId(),
      //   parent: null,
      //   prev: null,
      //   next: null,
      //   size: 70,
      //   props: {
      //     ...pane.props,
      //     hasAutosize: false,
      //     minWidth: type === "horizontal" ? undefined : 0,
      //     minHeight: type === "vertical" ? undefined : 0,
      //   },
      //   content: {
      //     view: {
      //       id: getId(),
      //       name: "spreadsheet",
      //       label: "Grid",
      //       icon: "status-bar-spreadsheet",
      //       config: {},
      //     }
      //   },
      // };
      // if (
      //   (pane.parent.props.isVGroup && (side === WEST || side === EAST)) ||
      //   (pane.parent.props.isHGroup && (side === NORTH || side === SOUTH))
      // ) {
      //   pane.props.hasAutosize = true;
      // }
      // if (side === WEST || side === NORTH) {
      //   fromPane.props.isDragInsert = true;
      // } else if (side === SOUTH || side === EAST) {
      //   pane.props.isDragInsert = true;
      // }
      // panesManager.insertPane(
      //   {
      //     pane: fromPane,
      //     type: PANE_TYPE_PANE,
      //   },
      //   {
      //     pane: panesMap[pane.id],
      //     paneIndex,
      //   },
      //   side,
      //   dragInsert
      // );
      // syncPanes(true);
      // onLayoutChange();
    },
    /**
     * Add a Panel to the Workspace by the name of the Panel
     *
     */
    addByName: function (panelName) {
      const panesMap = connector.panesMap;
      const panelConfigs = connector.panelConfigs;
      const enabledPanels = connector.enabledPanels;
      const viewConfig = panelConfigs[panelName];
      const paneId = getId();
      const viewId = getId();

      let centerPane: Pane = null;
      let targetPane: Pane = null;
      if (viewConfig && enabledPanels[panelName] === undefined) {
        for (const paneId in panesMap) {
          const pane = panesMap[paneId];
          if (pane && pane.placement === viewConfig.defaultPlacement) {
            targetPane = pane;
            break;
          } else if (pane.placement === PLACEMENT_CONTAINER_CENTER_MAIN) {
            centerPane = pane;
          }
        }
        if (targetPane && targetPane.props.isTabsGroup) {
          if (targetPane.children instanceof Array) {
            const newPane: Pane = panesManager.createPane(
              PANE_TYPE_PANE,
              PANE_TABBED,
              {
                id: paneId,
                viewId,
                viewConfig,
              }
            );

            targetPane.props.activeChild = targetPane.children.length;
            // tabscheck
            insertToArray(
              targetPane.children,
              targetPane.children.length,
              newPane
            );
            panesMap[newPane.id] = newPane;
          }
          targetPane.props.isClosed = false;
          panesMap[targetPane.id] = targetPane;
        } else if (centerPane) {
          const containerCenterPane = centerPane.parent;
          const containerPane = containerCenterPane.parent;
          if (containerPane) {
            // tabscheck
            const newPane: Pane = {
              id: getId(),
              placement: viewConfig.defaultPlacement,
              props: {
                isMovedPane: true,
                isClosable: true,
                isClosed: false,
              },
            };

            newPane.type = PANE_TYPE_PANE;
            newPane.parent = containerPane;
            newPane.props.isClosable = true;
            newPane.props.isClosed = false;

            if (viewConfig.defaultPlacement === PLACEMENT_CONTAINER_LEFT) {
              newPane.prev = null;
              newPane.next = containerPane.children[0];
              panesManager.insertPaneAtIndex(
                newPane,
                {
                  placement: PLACEMENT_CONTAINER_LEFT,
                },
                containerPane,
                0,
                PANE_MIN_WIDTH
              );
            } else if (
              viewConfig.defaultPlacement === PLACEMENT_CONTAINER_RIGHT
            ) {
              newPane.prev =
                containerPane.children[containerPane.children.length - 1];
              newPane.next = null;

              panesManager.insertPaneAtIndex(
                newPane,
                {
                  placement: PLACEMENT_CONTAINER_RIGHT,
                },
                containerPane,
                containerPane.children.length,
                PANE_MIN_WIDTH
              );
            } else if (
              viewConfig.defaultPlacement === PLACEMENT_CONTAINER_CENTER_BOTTOM
            ) {
              newPane.prev =
                containerCenterPane.children[
                  containerCenterPane.children.length - 1
                ];
              newPane.next = null;

              panesManager.insertPaneAtIndex(
                newPane,
                {
                  placement: PLACEMENT_CONTAINER_CENTER_BOTTOM,
                },
                containerCenterPane,
                containerCenterPane.children.length,
                PANE_MIN_HEIGHT
              );
            }

            panesMap[newPane.id] = newPane;
            panesMap[containerPane.id] = containerPane;
          }
        }

        syncPanes(true);
        onLayoutChange();
        globalContext.panels.clearPanelChange();
      }
    },
    /**
     * Remove a Panel from the Workspace by the name of the Panel
     *
     */
    removeByName: function (panelName) {
      const panesMap = connector.placementMap;
      const enabledPanels = connector.enabledPanels;
      if (enabledPanels !== null && enabledPanels[panelName] !== undefined) {
        let pane: Pane = enabledPanels[panelName];
        console.groupCollapsed("PanesContext");
        console.log("Remove By Name " + panelName, pane);
        console.groupEnd();
        if (pane !== undefined) {
          pane = panesMap[pane.id];
          if (pane !== undefined) {
            if (pane.props.isTabsGroup) {
              const paneTabs = pane.children?.map(
                (pane: Pane) => pane.content?.view
              );
              const index = indexByProperty(paneTabs, "name", panelName);
              removeFromArrayIndex(pane.children, index);
              if (pane.props.activeChild === index) {
                pane.props.activeChild = 0;
              } else if (pane.props.activeChild > index) {
                // reduce active index by one if the removed tab is on the left side of the active tab
                pane.props.activeChild -= 1;
              }

              if (pane.children.length === 0) {
                if (pane.parent && pane.parent.children) {
                  const fromParent = panesMap[pane.parent.id];
                  panesManager.removePane(fromParent, pane);
                }
                delete panesMap[pane.id];
              } else {
                panesMap[pane.id] = pane;
              }

              syncPanes(true);
              onLayoutChange();
              globalContext.panels.clearPanelChange();
            }
          }
        }
      }
    },
    /**
     * Remove a Pane from the Workspace with the instance of the Pane
     *
     */
    removePane: function (pane: Pane) {
      const panesMap = connector.panesMap;

      if (pane !== undefined && pane.id) {
        pane = panesMap[pane.id];

        if (pane !== undefined) {
          if (pane.props.isTabsGroup) {
            // update active panels
            const paneTabs = pane.children?.map(
              (pane: Pane) => pane.content?.view
            );
            globalContext.panels.activePanels.update((panels) => {
              paneTabs.forEach((tab) => {
                if (tab.name && panels[tab.name]) {
                  delete panels[tab.name];
                }
              });

              return panels;
            });

            pane.children = [];

            if (pane.parent && pane.parent.children) {
              const fromParent = panesMap[pane.parent.id];
              panesManager.removePane(fromParent, pane);
            }

            // console.log(pane, pane.id);
            delete panesMap[pane.id];
            syncPanes(true, true);
            syncPanes(true);
            onLayoutChange();
          } else {
            if (pane.parent && pane.parent.children) {
              const fromParent = panesMap[pane.parent.id];
              panesManager.removePane(fromParent, pane);
              delete panesMap[pane.id];
              syncPanes(true, true);
              syncPanes(true);
              onLayoutChange();
            }
          }
        }
      }
    },
    /**
     * Remove a tab from the Pane with the tab index
     *
     */
    removeTabByIndex: function (pane: Pane, index = -1) {
      if (pane && pane.props.isTabsGroup) {
        const panesMap = connector.panesMap;
        const paneTabs = pane.children?.map((pane: Pane) => pane.content?.view);
        removeFromArrayIndex(pane.children, index);
        if (pane.props.activeChild === index) {
          pane.props.activeChild = 0;
        } else if (pane.props.activeChild > index) {
          // reduce active index by one if the removed tab is on the left side of the active tab
          pane.props.activeChild -= 1;
        }

        if (pane.children?.length === 0) {
          if (pane.parent && pane.parent.children) {
            const fromParent = panesMap[pane.parent.id];
            panesManager.removePane(fromParent, pane);
          }
          delete panesMap[pane.id];
        } else {
          panesMap[pane.id] = pane;
        }

        syncPanes(true);
        onLayoutChange();
      }
    },

    movePane: function (
      pane: Pane = null,
      toIndex = -1,
      fromIndex = -1,
      parent: Pane = null
    ) {
      const panesMap = connector.panesMap;
      if (pane !== null && toIndex >= 0 && fromIndex !== toIndex) {
        if (parent !== null || pane.parent !== parent) {
          parent = pane.parent;
        }
        if (fromIndex < 0) {
          fromIndex = indexByObject(parent.children, pane);
        }
        removeFromArray(parent.children, pane);
        insertToArray(
          parent.children,
          fromIndex > toIndex ? toIndex : toIndex - 1,
          pane
        );
        panesMap[parent.id] = parent;
        syncPanes(true);
        onLayoutChange();
      }
    },
    reorderPanes: function (
      fromPane: Pane,
      toPane: Pane,
      fromIndex = -1,
      toIndex = -1
    ) {
      const panesMap = connector.panesMap;
      const fromPaneTarget: Pane = panesMap[fromPane?.id];
      const toPaneTarget: Pane = panesMap[toPane?.id];

      console.groupCollapsed("PanesContext");
      console.log(
        "reorderPanes ",
        fromPaneTarget,
        toPaneTarget,
        fromIndex,
        toIndex
      );

      if (
        fromPaneTarget &&
        toPaneTarget &&
        fromPaneTarget.parent &&
        toPaneTarget.parent
      ) {
        panesManager.removePane(fromPaneTarget.parent, fromPaneTarget);
      }

      panesManager.insertPane(
        {
          pane: fromPaneTarget,
          type: PANE_TYPE_PANE,
        },
        {
          pane: toPaneTarget,
          toIndex,
        }
      );

      panesMap[fromPaneTarget.id] = fromPaneTarget;
      panesMap[toPaneTarget.id] = toPaneTarget;
      if (fromPaneTarget.parent) {
        panesMap[fromPaneTarget.parent.id] = fromPaneTarget.parent;
      }
      if (toPaneTarget.parent) {
        panesMap[toPaneTarget.parent.id] = toPaneTarget.parent;
      }
      syncPanes(true);
      onLayoutChange();

      console.groupEnd();
    },
    /**
     * Reorder paneTab By Index
     *
     */
    reorderTabsByIndex: function (
      pane: Pane,
      fromIndex: number,
      toIndex: number
    ) {
      const panesMap = connector.panesMap;
      if (pane !== undefined) {
        const targetPane: Pane = panesMap[pane.id];
        if (targetPane !== undefined && targetPane.props.isTabsGroup) {
          const tabPanes: Array<Pane> = targetPane.children;

          const sourceTab: Pane = tabPanes[fromIndex];
          const targetTab: Pane = tabPanes[toIndex];

          if (sourceTab !== undefined && targetTab !== undefined) {
            removeFromArray(tabPanes, sourceTab);
            insertToArray(
              tabPanes,
              fromIndex > toIndex ? toIndex : toIndex - 1,
              sourceTab
            );

            pane.props.activeChild = toIndex;

            syncPanes(true);
            onLayoutChange();
          }
        }
      }
    },
    /**
     * Reorder tabPanes
     *
     */
    reorderTabs: function (toPane, newTabs, active) {
      const panesMap = connector.panesMap;
      const pane: Pane = panesMap[toPane.id];
      pane.props.activeChild = active;
      pane.children = newTabs;
      syncPanes(true);
      onLayoutChange();
    },
    /**
     * Update the change in active tab in the tabPanes of a Pane
     *
     */
    activeTabChange: function (pane, index = 0) {
      const panesMap = connector.panesMap;
      const targetPane: Pane = panesMap[pane.id];
      if (targetPane) {
        targetPane.props.activeChild = index;
        panesMap[targetPane.id] = targetPane;
        syncPanes(true);
        onLayoutChange();
      }
    },

    /**
     * Reset the status of a Pane which was moved
     *
     */
    clearMovedPane: function (pane) {
      if (pane.props.isMovedPane) {
        const panesMap = connector.panesMap;
        pane.props.isMovedPane = false;
        panesMap[pane.id] = pane;
        syncPanes();
        onLayoutChange();
      }
    },

    updatePane(pane: Pane, sync = false) {
      const panesMap = connector.panesMap;
      panesMap[pane.id] = pane;
      syncPanes(sync);
      onLayoutChange();
    },

    updatePanes(panes: Array<Pane>, sync = false) {
      const panesMap = connector.panesMap;
      panes.forEach((pane) => {
        panesMap[pane.id] = pane;
      });
      syncPanes(sync);
      onLayoutChange();
    },

    createPane(
      type,
      paneGroupType,
      params = {
        id: null,
        viewId: null,
        placement: "",
        props: {},
        children: [],
      }
    ) {
      return panesManager.createPane(type, paneGroupType, params);
    },

    insertPane(pane: Pane, newPane: Pane, index = -1) {
      const panesMap = connector.panesMap;
      pane = panesMap[pane?.id];
      if (pane) {
        pane.children = pane.children || [];

        if (index === -1) {
          index = pane.children.length;
        }

        insertToArray(pane.children, index, newPane);
        // pane.children.push(newPane);
        newPane.parent = pane;
        panesMap[newPane.id] = newPane;
        panesMap[pane.id] = pane;
        if (newPane.children) {
          const newChildren = newPane.children;
          newPane.children = [];
          // insert recursively
          newChildren.forEach((childPane, i) => {
            panesContext.insertPane(newPane, childPane, i);
          });
        }
        syncPanes(true);
        onLayoutChange();
      }
    },

    /** Following methods are not required now. It can be directly called from the Panel */
    /**
     * Show/hide Query Toolbar
     *
     */
    // toggleCollapsedQueryToolbar(isCollapsed: boolean) {
    //   if (!datagridPane) {
    //     return;
    //   }

    //   const view = datagridPane.settingx.view;
    //   view.queryToolbar = view.queryToolbar || {};

    //   datagridPane.settingx.view.queryToolbar.collapse = isCollapsed;
    //   panes = panes;
    //   onLayoutChange();
    // },
    /**
     * Change the size of the Query Toolbar
     *
     */
    // resizeQueryToolbar(height: number, layoutChange: boolean) {
    //   if (!datagridPane) {
    //     return;
    //   }

    //   const view = datagridPane.settingx.view;
    //   view.queryToolbar = view.queryToolbar || {};
    //   view.queryToolbar.height = height;
    //   panes = panes;

    //   if (layoutChange) {
    //     onLayoutChange();
    //   }
    // },
  };

  return panesContext;
}
