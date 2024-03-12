import {
  getId,
  indexByObject,
  insertToArray,
  removeFromArray,
  removeFromArrayIndex,
} from "./utils";

import type { Pane, PaneProps, PanesManager, View, ViewConfig } from "../types";
import {
  CENTER,
  EAST,
  EAST_EDGE,
  NORTH,
  PANE_GROUP_EMBEDDED,
  PANE_GROUP_FIXED,
  PANE_GROUP_HORIZONTAL,
  PANE_GROUP_TABS,
  PANE_GROUP_TILED,
  PANE_GROUP_VERTICAL,
  PANE_MIN_HEIGHT,
  PANE_MIN_WIDTH,
  PANE_TABBED,
  PANE_TYPE_GROUP,
  PANE_TYPE_PANE,
  PLACEMENT_CONTAINER,
  PLACEMENT_CONTAINER_CENTER,
  PLACEMENT_CONTAINER_CENTER_BOTTOM,
  PLACEMENT_CONTAINER_LEFT,
  PLACEMENT_CONTAINER_RIGHT,
  SOUTH,
  SOUTH_EDGE,
  WEST,
  WEST_EDGE,
} from "./constants";

export function getPanesManager(connector): PanesManager {
  /** Pane reorder functions */

  function insertPane(dndFrom, dndTo, edge = "", placement = "") {
    const panesMap = connector.panesMap;

    const dndFromPane: Pane = dndFrom.pane;
    let dndToPane: Pane = dndTo.pane;

    dndToPane = panesMap[dndToPane.id];

    let fromTab = null;

    if (dndFrom.type === "tab") {
      // tabscheck
      fromTab = dndFromPane.children[dndFrom.tabIndex];
      removeFromArrayIndex(dndFromPane.children, dndFrom.tabIndex);
      if (dndFromPane.children.length === 0) {
        if (dndFromPane.parent && dndFromPane.parent.children) {
          const fromParent = panesMap[dndFromPane.parent.id];
          removeFromArray(fromParent.children, dndFromPane);
        }
        if (
          dndFrom.paneIndex < dndTo.paneIndex &&
          dndFromPane.parent === dndToPane.parent
        ) {
          dndTo.paneIndex--;
        }
        dndFromPane.parent = null;
        delete panesMap[dndFromPane.id];
      } else {
        if (dndFrom.tabIndex <= dndFromPane.props.activeChild) {
          if (dndFrom.tabIndex - 1 >= 0) {
            dndFromPane.props.activeChild = dndFromPane.props.activeChild - 1;
          } else {
            dndFromPane.props.activeChild = 0;
          }
        }
        panesMap[dndFromPane.id] = dndFromPane;
      }
    } else if (dndFromPane.parent && dndFromPane.parent.children) {
      const fromParent = panesMap[dndFromPane.parent.id];
      removeFromArray(fromParent.children, dndFromPane);
      delete panesMap[dndFromPane.id];
    }
    if (dndToPane.parent && dndToPane.parent.children) {
      let fromPane = dndFromPane;
      const toPane = panesMap[dndToPane.id];
      const toParent = panesMap[dndToPane.parent.id];

      if (!toPane) {
        return;
      }

      if (edge === "") {
        if (dndToPane.parent.props.isVGroup) {
          edge = SOUTH;
        } else if (dndToPane.parent.props.isHGroup) {
          edge = EAST;
        }
      }

      // tabscheck
      if (dndFrom.type === "tab") {
        let isClosable =
          (toPane.type === PANE_TYPE_GROUP || toPane.props.isClosable) &&
          fromPane.props.isClosable;
        if (isClosable === undefined) {
          isClosable = true;
        }
        const newPane: Pane = createPane(PANE_TYPE_GROUP, PANE_GROUP_TABS, {
          placement: "",
          props: {
            isMovedPane: true,
            isClosable: isClosable,
            isClosed: isClosable && (fromPane.props.isClosed || false),
            activeChild: 0,
            groupType: PANE_GROUP_TABS,
          },
          children: [fromTab],
          size: dndFromPane.size,
        });

        fromPane = newPane;
        panesMap[newPane.id] = newPane;
      } else {
        let isClosable = toPane.props.isClosable && fromPane.props.isClosable;
        if (isClosable === undefined) {
          isClosable = true;
        }
        fromPane.props = {
          ...fromPane.props,
          isMovedPane: true,
          isClosable: isClosable,
          isClosed: toPane.props.isClosed && (fromPane.props.isClosed || false),
        };
      }

      if (edge === SOUTH_EDGE) {
        let targetPane = null;
        for (const paneId in panesMap) {
          const pane = panesMap[paneId];
          if (pane && pane.placement === PLACEMENT_CONTAINER_CENTER) {
            targetPane = pane;
            break;
          }
        }
        if (targetPane) {
          if (targetPane?.props?.isHGroup) {
            targetPane = targetPane.parent;
            targetPane = panesMap[targetPane.id];
          }
          targetPane.children.push(fromPane);
          fromPane.parent = targetPane;
          fromPane.placement = placement
            ? placement
            : PLACEMENT_CONTAINER_CENTER_BOTTOM;
          fromPane.size = fromPane.size || PANE_MIN_HEIGHT;
          panesMap[fromPane.id] = fromPane;
        }
      } else if (edge === WEST_EDGE || edge === EAST_EDGE) {
        let targetPane = null;
        for (const paneId in panesMap) {
          const pane = panesMap[paneId];
          if (pane && pane.placement === PLACEMENT_CONTAINER) {
            targetPane = pane;
            break;
          }
        }
        if (targetPane) {
          if (targetPane?.props?.isVGroup) {
            targetPane = targetPane.children[0];
            targetPane = panesMap[targetPane.id];
          }
          if (edge === EAST_EDGE) {
            targetPane.children.push(fromPane);
          } else {
            targetPane.children.unshift(fromPane);
          }
          fromPane.parent = targetPane;
          fromPane.placement =
            placement ??
            (edge === WEST_EDGE
              ? PLACEMENT_CONTAINER_LEFT
              : PLACEMENT_CONTAINER_RIGHT);
          fromPane.size = fromPane.size || PANE_MIN_WIDTH;
          panesMap[fromPane.id] = fromPane;
        }
      } else if (edge === NORTH) {
        if (dndToPane.parent.props.isVGroup) {
          insertPaneAtIndex(
            fromPane,
            toPane,
            toParent,
            fromPane.parent === toPane.parent
              ? dndFrom.paneIndex < dndTo.paneIndex
                ? dndTo.paneIndex - 1
                : dndTo.paneIndex
              : dndTo.paneIndex,
            fromPane.size || PANE_MIN_HEIGHT
          );
        } else {
          const newSize = toPane.size;
          toPane.size = "auto";
          insertWithNewGroup(
            fromPane,
            toPane,
            true,
            false,
            toParent,
            fromPane.parent === toPane.parent
              ? dndFrom.paneIndex < dndTo.paneIndex
                ? dndTo.paneIndex - 1
                : dndTo.paneIndex
              : dndTo.paneIndex,
            newSize
          );
        }
      } else if (edge === WEST) {
        if (dndToPane.parent.props.isHGroup) {
          insertPaneAtIndex(
            fromPane,
            toPane,
            toParent,
            fromPane.parent === toPane.parent
              ? dndFrom.paneIndex < dndTo.paneIndex
                ? dndTo.paneIndex - 1
                : dndTo.paneIndex
              : dndTo.paneIndex,
            fromPane.size || PANE_MIN_WIDTH
          );
        } else {
          const newSize = toPane.size;
          toPane.size = "auto";
          insertWithNewGroup(
            fromPane,
            toPane,
            false,
            true,
            toParent,
            fromPane.parent === toPane.parent
              ? dndFrom.paneIndex < dndTo.paneIndex
                ? dndTo.paneIndex - 1
                : dndTo.paneIndex
              : dndTo.paneIndex,
            newSize
          );
        }
      } else if (edge === SOUTH) {
        if (dndToPane.parent.props.isVGroup) {
          insertPaneAtIndex(
            fromPane,
            toPane,
            toParent,
            fromPane.parent === toPane.parent
              ? (dndFrom.paneIndex < dndTo.paneIndex
                  ? dndTo.paneIndex - 1
                  : dndTo.paneIndex) + 1
              : dndTo.paneIndex + 1,
            fromPane.size || PANE_MIN_HEIGHT
          );
        } else {
          const newSize = toPane.size;
          toPane.size = "auto";
          insertWithNewGroup(
            fromPane,
            toPane,
            true,
            false,
            toParent,
            fromPane.parent === toPane.parent
              ? dndFrom.paneIndex < dndTo.paneIndex
                ? dndTo.paneIndex - 1
                : dndTo.paneIndex
              : dndTo.paneIndex,
            newSize,
            true
          );
        }
      } else if (edge === EAST) {
        if (dndToPane.parent.props.isHGroup) {
          insertPaneAtIndex(
            fromPane,
            toPane,
            toParent,
            fromPane.parent === toPane.parent
              ? (dndFrom.paneIndex < dndTo.paneIndex
                  ? dndTo.paneIndex - 1
                  : dndTo.paneIndex) + 1
              : dndTo.paneIndex + 1,
            fromPane.size || PANE_MIN_WIDTH
          );
        } else {
          const newSize = toPane.size;
          toPane.size = "auto";
          insertWithNewGroup(
            fromPane,
            toPane,
            false,
            true,
            toParent,
            fromPane.parent === toPane.parent
              ? dndFrom.paneIndex < dndTo.paneIndex
                ? dndTo.paneIndex - 1
                : dndTo.paneIndex
              : dndTo.paneIndex,
            newSize,
            true
          );
        }
      }
    }
  }

  function insertPaneAtIndex(
    fromPane: Pane,
    toPane: Pane,
    toParent: Pane,
    toIndex: number,
    size
  ) {
    const panesMap = connector.panesMap;

    insertToArray(toParent.children, toIndex, fromPane);
    fromPane.parent = toParent;
    toParent.props.activeChild = toIndex;
    if (toPane.placement === PLACEMENT_CONTAINER_CENTER) {
      fromPane.placement = PLACEMENT_CONTAINER_RIGHT;
    } else {
      fromPane.placement = toPane.placement;
    }
    if (/inner/.test(fromPane.placement)) {
      fromPane.size = undefined;
      fromPane.props.isClosed = false;
    } else {
      fromPane.size = size;
    }

    panesMap[fromPane.id] = fromPane;
  }

  function insertWithNewGroup(
    fromPane: Pane,
    toPane: Pane,
    isVGroup,
    isHGroup,
    toParent,
    toIndex,
    size,
    southeast = false
  ) {
    const panesMap = connector.panesMap;
    const newGroup: Pane = {
      id: getId(),
      type: PANE_TYPE_GROUP,
      size: size,
      placement: toPane.placement,
      props: {
        hasAutosize: toPane.props.hasAutosize,
        isClosable: toPane.props.isClosable === false ? false : true,
        isClosed: toPane.props.isClosed,
      },
      prev: toPane.prev,
      next: toPane.next,
      children: !southeast ? [fromPane, toPane] : [toPane, fromPane],
    };

    if (isVGroup) {
      newGroup.props.groupType = PANE_GROUP_VERTICAL;
      newGroup.props.isVGroup = true;
    } else if (isHGroup) {
      newGroup.props.groupType = PANE_GROUP_HORIZONTAL;
      newGroup.props.isHGroup = true;
    }

    if (toPane.prev) {
      toPane.prev.next = newGroup;
    }
    if (toPane.next) {
      toPane.next.prev = newGroup;
    }
    newGroup.parent = toParent;

    panesMap[newGroup.id] = newGroup;

    fromPane.props.isClosed = toPane.props.isClosed;
    fromPane.parent = newGroup;
    fromPane.prev = null;
    fromPane.next = toPane;
    toPane.size = toPane.size !== "auto" ? undefined : "auto";

    toPane.parent = newGroup;
    fromPane.prev = toPane;
    fromPane.next = null;
    toParent.children[toIndex] = newGroup;

    if (!/:inner/.test(toPane.placement)) {
      toPane.placement = toPane.placement + ":inner";
    }
    fromPane.placement = toPane.placement;
    panesMap[toParent.id] = toParent;
    panesMap[toPane.id] = toPane;
    panesMap[fromPane.id] = fromPane;
  }

  function rearrangeTab(dndFrom, dndTo) {
    // tabscheck
    const panesMap = connector.panesMap;
    const dndFromPane: Pane = dndFrom.pane;
    const dndToPane: Pane = dndTo.pane;
    const { tabsList, active } = dndTo;
    if (tabsList instanceof Array) {
      const pane = panesMap[dndToPane.id];
      pane.props.activeChild = active;
      pane.children = tabsList;
      panesMap[dndToPane.id] = pane;
    }
  }

  function insertTab(dndFrom, dndTo) {
    const panesMap = connector.panesMap;
    const dndFromPane: Pane = dndFrom.pane;
    const dndToPane: Pane = dndTo.pane;
    let fromTab;
    if (dndFrom.type === PANE_TYPE_PANE) {
      if (dndFromPane.parent && dndFromPane.parent.children) {
        const fromParent = panesMap[dndFromPane.parent.id];
        removeFromArray(fromParent.children, dndFromPane);
        delete panesMap[dndFromPane.id];
      }
    } else if (dndFrom.type === "tab") {
      // tabscheck
      fromTab = dndFromPane.children[dndFrom.tabIndex];
      removeFromArrayIndex(dndFromPane.children, dndFrom.tabIndex);
      if (dndFromPane !== dndToPane) {
        if (dndFromPane.children.length === 0) {
          if (dndFromPane.parent && dndFromPane.parent.children) {
            const fromParent = panesMap[dndFromPane.parent.id];
            removeFromArray(fromParent.children, dndFromPane);
            delete panesMap[dndFromPane.id];
          }
        } else {
          if (dndFrom.tabIndex <= dndFromPane.props.activeChild) {
            if (dndFrom.tabIndex - 1 >= 0) {
              dndFromPane.props.activeChild = dndFromPane.props.activeChild - 1;
            } else {
              dndFromPane.props.activeChild = 0;
            }
          }
        }
      }
    }

    if (dndTo.type === "tab") {
      if (fromTab !== undefined) {
        const targetIndex = dndTo.tabIndex;
        let newPane: Pane;

        if ((fromTab as Pane).type === PANE_TYPE_PANE) {
          newPane = createPane(
            PANE_TYPE_PANE,
            (fromTab as Pane).props.paneType,
            {
              viewConfig: (fromTab as Pane).content?.view,
              props: fromTab.props,
            }
          );
        } else {
          newPane = createPane(
            PANE_TYPE_GROUP,
            (fromTab as Pane).props.groupType,
            {
              viewConfig: (fromTab as Pane).content?.view,
              children: (fromTab as Pane).children,
              props: fromTab.props,
            }
          );
        }
        // if (dndToPane === dndFromPane && dndFrom.tabIndex < targetIndex) {
        //   targetIndex -= 1;
        // }
        insertToArray(dndToPane.children, targetIndex, newPane);
        dndToPane.props.activeChild = targetIndex;
        newPane.parent = dndToPane;
        panesMap[dndToPane.id] = dndToPane;
        panesMap[newPane.id] = newPane;
        // if (targetIndex <= dndToPane.settingx.active) {
        //   dndToPane.settingx.active = dndToPane.settingx.active + 1;
        // }
      }
    } else if (dndTo.type === PANE_TYPE_PANE) {
      if (dndTo.dropArea === CENTER) {
        if (
          fromTab !== undefined &&
          (fromTab as Pane).type === PANE_TYPE_PANE
        ) {
          const targetIndex = dndTo.tabIndex;
          let newPane: Pane;

          if ((fromTab as Pane).type === PANE_TYPE_PANE) {
            newPane = createPane(
              PANE_TYPE_PANE,
              (fromTab as Pane).props.paneType,
              {
                viewConfig: (fromTab as Pane).content?.view,
                props: fromTab.props,
              }
            );
          } else {
            newPane = createPane(
              PANE_TYPE_GROUP,
              (fromTab as Pane).props.groupType,
              {
                viewConfig: (fromTab as Pane).content?.view,
                children: (fromTab as Pane).children,
                props: fromTab.props,
              }
            );
          }
          // if (dndToPane === dndFromPane && dndFrom.tabIndex <
          // targetIndex) {
          //   targetIndex -= 1;
          // }
          insertToArray(dndToPane.children, dndToPane.children.length, newPane);
          dndToPane.props.activeChild = dndToPane.children.length - 1;
          panesMap[newPane.id] = newPane;
        } else if (
          dndFromPane.type === PANE_TYPE_GROUP &&
          dndToPane.type === PANE_TYPE_GROUP &&
          dndFromPane.props.isTabsGroup &&
          dndToPane.props.isTabsGroup
        ) {
          if (dndFromPane.children && dndToPane.children) {
            const fromTabs = dndFromPane.children;
            const toTabs = dndToPane.children;
            dndToPane.children = [...toTabs, ...fromTabs];
          }
        } else if (
          dndFromPane.type === PANE_TYPE_GROUP &&
          dndToPane.type === PANE_TYPE_PANE
        ) {
          if (dndFromPane.children) {
            const fromTabs = dndFromPane.children;
            const toIndex = indexByObject(dndToPane.parent.children, dndToPane);
            const newTabsGroupPane = createPane(
              PANE_TYPE_GROUP,
              PANE_GROUP_TABS,
              {
                children: [dndToPane, ...fromTabs],
                size: "auto",
                placement: dndToPane.placement,
              }
            );
            newTabsGroupPane.prev = dndToPane.prev;
            newTabsGroupPane.next = dndToPane.next;
            newTabsGroupPane.parent = dndToPane.parent;
            newTabsGroupPane.props.activeChild = 0;
            dndToPane.parent.children[toIndex] = newTabsGroupPane;
            panesMap[newTabsGroupPane.id] = newTabsGroupPane;
            panesMap[newTabsGroupPane.parent.id] = newTabsGroupPane.parent;

            fromTabs.map((fromTab, i) => {
              if (i === 0) {
                fromTab.prev = dndToPane;
                dndToPane.next = fromTab;
              }
              fromTab.parent = newTabsGroupPane;
            });
          }
        }
      }
    }
  }

  function removePane(fromParent, pane) {
    const panesMap = connector.panesMap;
    if (fromParent && fromParent.children instanceof Array && pane) {
      const idx = fromParent.children.indexOf(pane);

      if (idx === -1) {
        return;
      }

      if (
        pane.type === PANE_TYPE_PANE &&
        /inner/.test(pane.placement) &&
        idx >= 1
      ) {
        // because in resizing, the pane size can be set to a number of pixel
        // the previous child should take the rest of space of deleted pane
        // it should only be applied for inner panes
        fromParent.children[idx - 1].size = "auto";
      }

      removeFromArray(fromParent.children, pane);

      pane.parent = null;

      // if (fromParent.children.length === 0) {
      //   if (fromParent.parent !== undefined) {
      //     const parent = panesMap[fromParent.parent.id];
      //     if (parent) {
      //       // should remove the group also if it becomes empty
      //       removePane(parent, fromParent);
      //       delete panesMap[fromParent.id];
      //     }
      //   }

      //   return;
      // }
      if (fromParent.children.length) {
        if (idx === 0) {
          fromParent.children[idx].prev = null;
        } else if (fromParent.children[idx]) {
          fromParent.children[idx - 1].next = fromParent.children[idx];
          fromParent.children[idx].prev = fromParent.children[idx - 1];
        } else {
          fromParent.children[idx - 1].next = null;
        }
      }
    }
  }

  function createPane(
    type: string,
    paneGroupType: string,
    params: {
      id?: string;
      viewId?: string;
      placement?: string;
      props?: PaneProps;
      children?: Pane[];
      viewConfig?: View;
      size?: number | string;
    } = { id: null, viewId: null, placement: "", props: {}, children: [] }
  ): Pane | null {
    switch (type) {
      case PANE_TYPE_PANE: {
        switch (paneGroupType) {
          case PANE_TABBED: {
            return {
              id: params.id || getId(),
              type: PANE_TYPE_PANE,
              placement: "tab",
              props: {
                paneType: PANE_TABBED,
              },
              content: params.viewConfig
                ? {
                    view: {
                      id: params.viewId || getId(),
                      ...params.viewConfig,
                    } as View,
                  }
                : null,
            };
          }
          default: {
            return {
              id: params.id || getId(),
              type: PANE_TYPE_PANE,
              placement: params.placement,
              size: params.size || "auto",
              props: {
                paneType: paneGroupType,
              },
              content: params.viewConfig
                ? {
                    view: {
                      id: params.viewId || getId(),
                      ...params.viewConfig,
                    } as View,
                  }
                : null,
            };
          }
        }
      }
      case PANE_TYPE_GROUP: {
        return {
          id: params.id || getId(),
          type: PANE_TYPE_GROUP,
          placement: params.placement,
          props: {
            ...(params.props || {}),
            groupType: paneGroupType,
          },
          children: params.children || [],
          size: params.size || "auto",
          content: params.viewConfig
            ? {
                view: {
                  id: params.viewId || getId(),
                  ...params.viewConfig,
                } as View,
              }
            : null,
        };
        return null;
      }
    }
    return null;
  }

  /** End of Pane reorder functions */

  return {
    insertPane,
    insertPaneAtIndex,
    insertWithNewGroup,
    rearrangeTab,
    insertTab,
    removePane,
    createPane,
  };
}
