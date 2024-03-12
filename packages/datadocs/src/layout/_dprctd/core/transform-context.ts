import type { Pane } from "../types";
import {
  DIVIDER_SIZE,
  PANE_CLOSED_SIZE,
  PANE_CLOSE_ADJUST,
  PANE_MIN_HEIGHT,
  PANE_MIN_WIDTH,
  PANE_TYPE_GROUP,
} from "./constants";
import type {
  GlobalContext,
  PanelResize,
  PaneTransform,
  ResizeMarker,
  TransformContext,
} from "../types";
import { RESIZE_END, RESIZE_START } from "../../constants/events";
import { writable } from "svelte/store";
import { setCursor, setPointerEvents } from "./ui-utils";
import { console } from "./console";
import { appManager } from "src/app/core/global/app-manager";
import {
  APP_EVENT_LAYOUT_RESIZE_END,
  APP_EVENT_LAYOUT_RESIZE_START,
} from "src/app/core/global/app-manager-events";

export function getTransformContext(
  globalContext: GlobalContext,
  connector,
  onLayoutChange,
  syncPanes
) {
  /**
   * Object that stores the state of active resizing operation
   * @type {PanelResize}
   */
  const DEFAULT_RESIZE: PanelResize = {
    initialized: false,
    initialParams: {},

    source: null,
    parent: null,
    divider: null,

    paneXIndex: -1,
    paneYIndex: -1,
    paneX: null,
    paneY: null,
    paneXBounds: null,
    paneYBounds: null,
    paneXElement: null,
    paneYElement: null,
    panes: [],
    paneElements: {},
    paneBounds: {},
    paneMinSizes: {},
    panesCount: 0,
    panesSkip: {},
    panesSkipped: 0,

    totalSize: 0,
    availableSize: 0,
    borderAdjust: 0,

    type: null,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    markers: [],

    userSelect: null,
    direction: "",
    maxXReached: false,
    maxYReached: false,
    onResize: null,
  };

  /**
   * Object that stores the trasforms being applied to a Pane
   * @type {PaneTransform}
   */
  let transform: PaneTransform = {
    resize: {
      ...DEFAULT_RESIZE,
    },
  };

  /**
   * Context which handles Pane resizing
   *
   */
  const transformContext: TransformContext = {
    isResizing: false,
    resize: writable({
      isResizing: false,
      type: "",
    }),
    transform,

    startResize: function (
      x,
      y,
      divider,
      pane,
      paneIndex,
      type,
      equal = false,
      onResize
    ) {
      transform.resize.initialized = false;
      transform.resize.initialParams = {
        x,
        y,
        divider,
        pane,
        paneIndex,
        type,
        equal,
        onResize,
      };

      if (!equal) {
        const parentElement: HTMLElement = document.getElementById(
          pane.parent.id
        );
        const parentBounds: DOMRect = parentElement.getBoundingClientRect();
        appManager.trigger(APP_EVENT_LAYOUT_RESIZE_START, {
          data: {
            container: parentElement,
            bounds: parentBounds,
            type,
            panes: this.getResizPanes(pane.parent, type),
          },
        });
        // globalContext.dispatchEvent(RESIZE_START, );

        window.addEventListener("mousemove", transformContext.doResize);
        window.addEventListener("mouseup", transformContext.stopResize);

        transformContext.isResizing = true;
        transformContext.resize.update((resize) => {
          return {
            ...resize,
            isResizing: true,
            type,
          };
        });

        setCursor(type === "horizontal" ? "n-resize" : "w-resize");
        setPointerEvents("none");
      } else {
        transformContext.updateResize(type, true);
      }
    },

    initialize() {
      const { x, y, divider, pane, paneIndex, type, equal, onResize } =
        transform.resize.initialParams;

      const paneXIndex = paneIndex;
      const paneYIndex = paneIndex + 1;

      transform.resize.source = pane;
      transform.resize.parent = pane.parent;
      transform.resize.divider = divider;

      transform.resize.paneXIndex = paneXIndex;
      transform.resize.paneYIndex = paneYIndex;
      transform.resize.paneX = null;
      transform.resize.paneY = null;
      transform.resize.paneXBounds = null;
      transform.resize.paneYBounds = null;
      transform.resize.paneXElement = null;
      transform.resize.paneYElement = null;
      transform.resize.panes = [];
      // transform.resize.panes = [];
      transform.resize.paneElements = {};
      transform.resize.paneBounds = {};
      transform.resize.paneMinSizes = {};
      transform.resize.panesCount = 0;
      transform.resize.panesSkip = {};
      transform.resize.panesSkipped = 0;

      transform.resize.type = type;
      transform.resize.startX = x;
      transform.resize.startY = y;
      transform.resize.currentX = x;
      transform.resize.currentY = y;
      transform.resize.markers = [];

      transform.resize.totalSize = 0;
      transform.resize.availableSize = 0;

      transform.resize.direction = "";
      transform.resize.maxXReached = false;
      transform.resize.maxYReached = false;

      transform.resize.userSelect = document.body.style.userSelect;
      transform.resize.onResize = onResize;

      // transformContext.setResizePane("X", type);
      // transformContext.setResizePane("Y", type);
      // // transformContext.setResizeBounds(type);

      transformContext.updateResize(transform.resize.type);
      document.body.style.userSelect = "none";
      transform = transform;
      syncPanes();
      onLayoutChange();
      transform.resize.initialized = true;
    },

    updateResize(type, equal = false) {
      let resized = false;
      if (equal) {
        transformContext.initialize();
        transformContext.setResizePanes(type);
        resized = transformContext.splitSize();
        transform.resize.initialized = false;
        transformContext.stopResize();
      } else {
        transformContext.setResizePanes(type);
        transformContext.saveResizePanes(type, true);
      }
    },

    splitSize() {
      const panesContext = globalContext.panesContext;

      const { x, y, divider, pane, paneIndex, type, equal, onResize } =
        transform.resize.initialParams;

      const paneMinSizes = transform.resize.paneMinSizes;

      const paneX: Pane = pane;
      const paneY: Pane = pane.next;

      const parent: Pane = paneX.parent;

      let borderAdjust = 0;

      // if (
      //   paneX.placement === PLACEMENT_CONTAINER_CENTER ||
      //   paneX.placement === PLACEMENT_CONTAINER_CENTER_MAIN ||
      //   paneY.placement === PLACEMENT_CONTAINER_CENTER ||
      //   paneY.placement === PLACEMENT_CONTAINER_CENTER_MAIN
      // ) {
      //   return false;
      // }

      function applySize(paneId: string, size: number) {
        const panesMap = connector.panesMap;
        const pane = panesMap[paneId];
        if (pane) {
          // if (
          //   pane.placement === PLACEMENT_CONTAINER_CENTER ||
          //   pane.placement === PLACEMENT_CONTAINER_CENTER_MAIN
          // ) {
          //   pane.size = "auto";
          // } else {
          //   pane.size = size;
          // }
          pane.size = size;
        }
      }

      if (parent && parent.children && parent.children.length > 0) {
        borderAdjust =
          ((parent.children.length - 1) * DIVIDER_SIZE) /
          parent.children.length;
      }

      if (paneX !== undefined && paneY !== undefined) {
        const paneXElement: HTMLElement = document.getElementById(paneX.id);
        const paneYElement: HTMLElement = document.getElementById(paneY.id);
        if (paneXElement !== null && paneYElement !== null) {
          const paneXBounds: DOMRect = paneXElement.getBoundingClientRect();
          const paneYBounds: DOMRect = paneYElement.getBoundingClientRect();

          let totalSize = 0;

          if (type === "vertical") {
            let paneXMinSize = paneX.props.minWidth;
            let paneYMinSize = paneY.props.minWidth;

            if (paneMinSizes[paneX.id]) {
              paneXMinSize = paneMinSizes[paneX.id];
            }

            if (paneMinSizes[paneY.id]) {
              paneYMinSize = paneMinSizes[paneY.id];
            }

            if (!paneXMinSize) {
              paneXMinSize = PANE_MIN_WIDTH;
            }

            if (!paneYMinSize) {
              paneYMinSize = PANE_MIN_WIDTH;
            }

            totalSize =
              (paneX.props.isClosed ? PANE_MIN_WIDTH : paneXBounds.width) +
              (paneY.props.isClosed ? PANE_MIN_WIDTH : paneYBounds.width);

            totalSize += borderAdjust * 2;

            if (totalSize / 2 < paneXMinSize) {
              applySize(paneX.id, paneXMinSize);
              applySize(paneY.id, totalSize - paneXMinSize);
            } else if (totalSize / 2 < paneYMinSize) {
              applySize(paneX.id, totalSize - paneYMinSize);
              applySize(paneY.id, paneYMinSize);
            } else {
              applySize(paneX.id, totalSize / 2);
              applySize(paneY.id, totalSize / 2);
            }

            if (paneX.props.isClosed) {
              panesContext.expand(paneX, null, undefined, false);
            }
            if (paneY.props.isClosed) {
              panesContext.expand(paneY, null, undefined, false);
            }

            syncPanes();
            onLayoutChange();
          } else {
            let paneXMinSize = paneX.props.minHeight;
            let paneYMinSize = paneY.props.minHeight;

            if (paneMinSizes[paneX.id]) {
              paneXMinSize = paneMinSizes[paneX.id];
            }

            if (paneMinSizes[paneY.id]) {
              paneYMinSize = paneMinSizes[paneY.id];
            }

            if (!paneXMinSize) {
              paneXMinSize = PANE_MIN_HEIGHT;
            }

            if (!paneYMinSize) {
              paneYMinSize = PANE_MIN_HEIGHT;
            }

            totalSize =
              (paneX.props.isClosed ? PANE_MIN_HEIGHT : paneXBounds.height) +
              (paneY.props.isClosed ? PANE_MIN_HEIGHT : paneYBounds.height);

            totalSize += borderAdjust * 2;

            if (totalSize / 2 < paneXMinSize) {
              applySize(paneX.id, paneXMinSize);
              applySize(paneY.id, totalSize - paneXMinSize);
            } else if (totalSize / 2 < paneYMinSize) {
              applySize(paneX.id, totalSize - paneYMinSize);
              applySize(paneY.id, paneYMinSize);
            } else {
              applySize(paneX.id, totalSize / 2);
              applySize(paneY.id, totalSize / 2);
            }

            if (paneX.props.isClosed) {
              panesContext.expand(paneX, null, undefined, false);
            }
            if (paneY.props.isClosed) {
              panesContext.expand(paneY, null, undefined, false);
            }

            syncPanes();
            onLayoutChange();
          }
        }
      }

      return true;
    },

    getResizPanes: function (parent, type) {
      const panesList = parent.children;
      const panesCount = panesList.length;

      const panes = {};
      for (let i = 0; i < panesCount; i++) {
        const pane = panesList[i];
        panes[pane.id] = true;
        if (type === "vertical") {
          if (pane.children !== undefined && pane.children.length > 1) {
            const vGroupPanes = pane.children;
            const maxPanes = 1;
            if (vGroupPanes && vGroupPanes instanceof Array) {
              const vGroupPanesCount = pane.children.length;
              for (let i = 0; i < vGroupPanesCount; i++) {
                const pane = vGroupPanes[i];
                panes[pane.id] = true;
              }
            }
          }
        } else if (type === "horizontal") {
          if (pane.children !== undefined && pane.children.length > 1) {
            if (!pane.props.isVGroup) {
              const hGroupPanes = pane.children;
              const maxPanes = 1;
              if (hGroupPanes && hGroupPanes instanceof Array) {
                const hGroupPanesCount = pane.children.length;
                for (let i = 0; i < hGroupPanesCount; i++) {
                  const pane = hGroupPanes[i];
                  panes[pane.id] = true;
                }
              }
            }
          }
        }
      }

      return panes;
    },

    setResizePanes: function (type) {
      const parent = transform.resize.parent;
      const panes = parent.children;
      const panesCount = panes.length;

      const paneXIndex = transform.resize.paneXIndex;
      const paneYIndex = transform.resize.paneYIndex;

      const paneElements = {};
      const paneBounds = {};
      const paneMinSizes = {};

      const panesSkip = {};
      let panesSkipped = 0;

      let paneX = null;
      let paneY = null;

      const paneXElement = null;
      const paneYElement = null;

      const markers: Array<ResizeMarker> = [];
      let marker = 0;

      for (let i = 0; i < panesCount; i++) {
        const pane = panes[i];
        const paneElement = document.getElementById(pane.id);
        const paneElementBounds = paneElement.getBoundingClientRect();
        let paneSkip = false;
        let paneMinSize = 0;
        let paneSize;

        if (type === "vertical") {
          paneSize = paneElementBounds.width;
          if (pane.props.isClosed) {
            paneMinSize = PANE_CLOSED_SIZE;
          } else {
            if (pane.props.minWidth !== undefined) {
              paneMinSize = pane.props.minWidth;
            }
            if (pane.children !== undefined && pane.children.length > 1) {
              if (pane.props.isHGroup) {
                paneMinSize = Math.max(
                  PANE_MIN_WIDTH * pane.children.length,
                  paneMinSize
                );
              } else {
                const vGroupPanes = pane.children;
                let maxPanes = 1;
                if (vGroupPanes && vGroupPanes instanceof Array) {
                  const vGroupPanesCount = pane.children.length;
                  for (let i = 0; i < vGroupPanesCount; i++) {
                    const pane = vGroupPanes[i];
                    if (pane.children && pane.children.length > maxPanes) {
                      maxPanes = pane.children.length;
                    }
                  }
                }
                paneMinSize = Math.max(
                  PANE_MIN_WIDTH * maxPanes + (maxPanes - 1) * DIVIDER_SIZE,
                  paneMinSize
                );
              }
            } else if (paneMinSize === 0) {
              paneMinSize = PANE_MIN_WIDTH;
            }
          }
        } else if (type === "horizontal") {
          paneSize = paneElementBounds.height;
          if (pane.props.isClosed) {
            paneMinSize = PANE_CLOSED_SIZE;
          } else {
            if (pane.props.minHeight !== undefined) {
              paneMinSize = pane.props.minHeight;
            }
            if (pane.children !== undefined && pane.children.length > 1) {
              if (pane.props.isVGroup) {
                paneMinSize = Math.max(
                  PANE_MIN_HEIGHT * pane.children.length,
                  paneMinSize
                );
              } else {
                const hGroupPanes = pane.children;
                let maxPanes = 1;
                if (hGroupPanes && hGroupPanes instanceof Array) {
                  const hGroupPanesCount = pane.children.length;
                  for (let i = 0; i < hGroupPanesCount; i++) {
                    const pane = hGroupPanes[i];
                    if (pane.children && pane.children.length > maxPanes) {
                      maxPanes = pane.children.length;
                    }
                  }
                }
                paneMinSize = Math.max(PANE_MIN_HEIGHT * maxPanes, paneMinSize);
              }
            } else if (paneMinSize === 0) {
              paneMinSize = PANE_MIN_HEIGHT;
            }
          }
        }

        if (type === "vertical") {
          paneSkip =
            paneElementBounds.width <= paneMinSize || pane.props.isClosed;
        } else if (type === "horizontal") {
          paneSkip =
            paneElementBounds.height <= paneMinSize || pane.props.isClosed;
        }

        if (i === paneXIndex) {
          paneX = pane;
        } else if (i === paneYIndex) {
          paneY = pane;
        }

        paneElements[pane.id] = paneElement;
        paneBounds[pane.id] = paneElementBounds;
        paneMinSizes[pane.id] = paneMinSize;
        if (paneSkip) {
          panesSkip[pane.id] = true;
          panesSkipped++;
        }

        markers.push({
          id: pane.id,
          index: i,
          from: marker,
          start: marker,
          position: marker + paneSize,
          at: marker + paneSize,
          original: paneSize,
          size: paneSize,
          minimum: paneMinSize,
          isClosable: pane.props.isClosable,
        });
        marker += paneSize;
      }

      transform.resize.paneX = paneX;
      transform.resize.paneY = paneY;
      transform.resize.paneXElement = paneXElement;
      transform.resize.paneYElement = paneYElement;
      transform.resize.panes = panes;
      transform.resize.paneElements = paneElements;
      transform.resize.paneBounds = paneBounds;
      transform.resize.paneMinSizes = paneMinSizes;
      transform.resize.panesCount = panesCount;
      transform.resize.panesSkip = panesSkip;
      transform.resize.panesSkipped = panesSkipped;
      transform.resize.markers = markers;
    },

    setResizeInnerPanes: function () {
      const panesMap = connector.panesMap;
      const type = transform.resize.type;
      const parent = transform.resize.parent;
      const panes = parent.children;
      const panesCount = panes.length;

      function updatePaneSizes(targetPane: Pane) {
        const groupPanes: Array<Pane> = targetPane.children;
        const sizeProperty: string = targetPane.props.isHGroup
          ? "width"
          : "height";

        if (groupPanes && groupPanes instanceof Array) {
          const groupPanesCount: number = groupPanes.length;
          for (let i = 0; i < groupPanesCount; i++) {
            const pane: Pane = groupPanes[i];
            if (pane) {
              const innerPane: Pane = panesMap[pane.id];
              if (innerPane) {
                if (innerPane.type === PANE_TYPE_GROUP) {
                  updatePaneSizes(pane);
                } else if (
                  (type === "vertical" && targetPane.props.isHGroup) ||
                  (type === "horizontal" && targetPane.props.isVGroup)
                ) {
                  const innerPaneElement: HTMLElement = document.getElementById(
                    pane.id
                  );
                  const innerPaneBounds: DOMRect =
                    innerPaneElement.getBoundingClientRect();
                  pane.size = innerPaneBounds[sizeProperty];
                }
              }
            }
          }
        }
      }

      for (let i = 0; i < panesCount; i++) {
        const pane = panes[i];
        if (pane.props.isClosed) {
        } else {
          if (pane.type === PANE_TYPE_GROUP) {
            updatePaneSizes(pane);
          }
        }
      }
    },

    saveResizePanes: function (type: string, resizing = false) {
      const parent = transform.resize.parent;
      const panes = parent.children;
      const panesCount = panes.length;

      const paneBounds = transform.resize.paneBounds;

      let property = "";

      if (type === "vertical") {
        property = "width";
      } else {
        property = "height";
      }

      for (let i = 0; i < panesCount; i++) {
        const pane = panes[i];
        const paneElementBounds = paneBounds[pane.id];
        if (paneElementBounds) {
          // if (
          //   !resizing &&
          //   (pane.placement === PLACEMENT_CONTAINER_CENTER ||
          //     pane.placement === PLACEMENT_CONTAINER_CENTER_MAIN)
          // ) {
          //   pane.size = "auto";
          // } else {
          //   pane.size = paneElementBounds[property];
          //   if (i < panesCount - 1) {
          //     pane.size = (pane.size as number) + DIVIDER_SIZE;
          //   }
          // }
          pane.size = paneElementBounds[property];
          if (i < panesCount - 1) {
            pane.size = (pane.size as number) + DIVIDER_SIZE;
          }
        }
      }

      if (!resizing) {
        transformContext.setResizeInnerPanes();
      }
    },

    shrinkPane(
      marker: ResizeMarker,
      newPosition: number,
      direction: string,
      property: string,
      forwarded = false,
      reverse = false
    ) {
      console.groupCollapsed("TransformContext");
      console.log(
        "resize shrink ... ",
        marker,
        newPosition,
        direction,
        forwarded
      );
      console.groupEnd();

      const panesMap = connector.panesMap;

      const panesContext = globalContext.panesContext;

      const panes = transform.resize.panes;
      const markers = transform.resize.markers;
      const paneElements = transform.resize.paneElements;
      const paneBounds = transform.resize.paneBounds;
      const paneMinSizes = transform.resize.paneMinSizes;

      const pane = panesMap[marker.id];
      const paneElement = null;
      let paneMinSize = null;
      const paneElementBounds = null;

      const isX = direction === "X";

      let checkNext = true;

      const canClosePane = false;
      const canOpenPane = false;

      let { isClosed, isClosable } = pane.props;

      const isInner = /:inner/.test(pane.placement);

      const openedMinSize =
        property === "height" ? PANE_MIN_HEIGHT : PANE_MIN_WIDTH;

      const closeSize = openedMinSize - PANE_CLOSE_ADJUST;

      const side = isX ? -1 : 1;
      const markerNext: ResizeMarker = markers[marker.index + side];

      const paneNext = markerNext ? panesMap[markerNext.id] : null;

      let newSize;

      isClosable = !isInner && isClosable;

      if (paneMinSizes[marker.id]) {
        paneMinSize = paneMinSizes[marker.id];
      }

      const resizePane = (
        { start = undefined, at = undefined, size = undefined },
        mode = ""
      ) => {
        const paneElement = paneElements[marker.id] as HTMLElement;
        const paneElementBounds = paneBounds[marker.id];
        if (paneElement && paneElementBounds && mode != "") {
          if (mode === "start") {
            marker.at = at;
            marker.size = size;
            marker.start = at - size;
          } else if (mode === "at") {
            marker.start = start;
            marker.size = size;
            marker.at = start + size;
          } else if (mode === "size") {
            marker.at = at;
            marker.start = start;
            marker.size = at - start;
          }
          const parentElement: HTMLElement = document.getElementById(
            transform.resize.parent.id
          );
          const parentBounds = parentElement.getBoundingClientRect();
          const parentSize = parentBounds[property];
          pane.size = `${(marker.size / parentSize) * 100}%`;
          paneElement.style[property] = marker.size + "px";
          paneElementBounds[property] = marker.size;
          paneElement.style["flex"] = "none";
        }
      };

      if (forwarded) {
        if (isX) {
          newSize = newPosition - marker.start;
        } else {
          newSize = marker.at - newPosition;
        }

        if (isClosed && newSize < closeSize) {
        } else {
          if (isClosed && newSize >= closeSize && !isInner) {
            panesContext.expand(pane, undefined, paneMinSize);
          } else {
            if (isX) {
              if (!isClosed && newSize >= marker.minimum) {
                checkNext = false;
              } else if (
                (!paneNext ||
                  paneNext.props.isClosed ||
                  !paneNext.props.isClosable) &&
                !isClosed &&
                isClosable &&
                newSize < closeSize
              ) {
                newSize = PANE_CLOSED_SIZE;
                panesContext.collapse(pane, null, true);
                checkNext = false;
              }
              if (checkNext === false) {
                resizePane(
                  {
                    start: marker.start,
                    size: newSize,
                  },
                  "at"
                );
                return marker.at;
              }
            } else {
              if (!isClosed && newSize >= marker.minimum) {
                checkNext = false;
              } else if (
                (!paneNext ||
                  paneNext.props.isClosed ||
                  !paneNext.props.isClosable) &&
                !isClosed &&
                isClosable &&
                newSize < closeSize
              ) {
                newSize = PANE_CLOSED_SIZE;
                // marker.at = marker.at - newSize;
                panesContext.collapse(pane, null, true);
                checkNext = false;
              }
              if (checkNext === false) {
                resizePane(
                  {
                    at: marker.at,
                    size: newSize,
                  },
                  "start"
                );
                return marker.start;
              }
            }
          }
        }
      } else {
        if (!isX) {
          newSize = newPosition - marker.start;
        } else {
          newSize = marker.at - newPosition;
        }
        if (newSize < closeSize) {
          checkNext = false;
        }
        if (newSize >= closeSize && newSize < openedMinSize) {
          if (!isX) {
            newPosition = marker.start + openedMinSize;
          } else {
            newPosition = marker.at - openedMinSize;
          }
        }
      }

      // console.groupCollapsed("TransformContext");
      // console.log(
      //   "Closed .... ",
      //   isClosed,
      //   newSize,
      //   closeSize,
      //   paneMinSize,
      //   checkNext
      // );
      // console.groupEnd();

      if (checkNext) {
        if (markerNext !== undefined) {
          const position = transformContext.shrinkPane(
            markerNext,
            newPosition + (forwarded ? marker.minimum * (isX ? -1 : 1) : 0),
            direction,
            property,
            true
          );
          if (position !== null) {
            if (!forwarded && isClosed && !isInner) {
              panesContext.expand(pane, undefined, openedMinSize);
              // transformContext.setResizePanes(transform.resize.type);
            }
            if (forwarded) {
              resizePane(
                {
                  start: isX ? position : position - marker.minimum,
                  at: isX ? position + marker.minimum : position,
                },
                "size"
              );
              // console.log("--- forwaded ............... ");
              // console.log("--- forwaded ... " + marker.id);
              // console.log("--- forwaded... " + position);
              // console.log("--- forwaded... ", {
              //   start: isX ? position : position - marker.minimum,
              //   at: isX ? position + marker.minimum : position,
              //   size: marker.size,
              // });
              // console.log("--- forwaded ............... ");
              return isX ? marker.at : marker.start;
            } else {
              resizePane(
                {
                  start: isX ? position : marker.start,
                  at: isX ? marker.at : position,
                },
                "size"
              );
              return isX ? marker.at : marker.start;
            }
          } else {
          }
        } else {
        }
      }
      return null;
    },

    doResize: function (event: MouseEvent) {
      if (!transform.resize.initialized) {
        transformContext.initialize();
      }

      const { clientX, clientY } = event;

      const changeX = clientX - transform.resize.currentX;
      const changeY = clientY - transform.resize.currentY;

      const paneXIndex = transform.resize.paneXIndex;
      const paneYIndex = transform.resize.paneYIndex;
      const paneX = transform.resize.paneX;
      const paneY = transform.resize.paneY;

      const paneXElement = transform.resize.paneXElement;
      const paneYElement = transform.resize.paneYElement;

      const totalSize = transform.resize.totalSize;
      const availableSize = transform.resize.availableSize;

      const panes = transform.resize.panes;
      const paneElements = transform.resize.paneElements;
      const paneBounds = transform.resize.paneBounds;
      const paneMinSizes = transform.resize.paneMinSizes;

      const panesCount = transform.resize.panesCount;
      const panesSkip = transform.resize.panesSkip;
      const panesSkipped = transform.resize.panesSkipped;

      const markers = transform.resize.markers;
      const marker = markers[paneXIndex];
      const markerPrev = markers[paneXIndex - 1];
      const markerNext = markers[paneXIndex + 1];

      const type = transform.resize.type;

      let property;
      let change = 0;
      let mouseChange = 0;
      let direction = "";
      let directionChanged = false;
      let minSize;

      let paneElement;

      if (transform.resize.type === "horizontal") {
        change = clientY - transform.resize.startY;
        mouseChange = changeY;
        property = "height";
        // minSize = PANE_MIN_HEIGHT;
      } else if (transform.resize.type === "vertical") {
        change = clientX - transform.resize.startX;
        mouseChange = changeX;
        property = "width";
        // minSize = PANE_MIN_WIDTH;
      }

      if (mouseChange < -5) {
        // console.log("OK");
      }

      if (change !== 0) {
        direction = change < 0 ? "X" : "Y";
        if (
          transform.resize.direction !== "" &&
          transform.resize.direction !== direction
        ) {
          directionChanged = true;
        }
        transform.resize.direction = direction;
      }

      transformContext.shrinkPane(
        direction === "Y" ? marker : markerNext,
        marker.position + change,
        direction,
        property,
        false
      );

      transform.resize.currentX = clientX;
      transform.resize.currentY = clientY;

      if (transform.resize.onResize) {
        transform.resize.onResize();
      }
      event.stopPropagation();
    },

    stopResize: function () {
      if (transform.resize.initialized) {
        transformContext.saveResizePanes(transform.resize.type);
      }

      document.body.style.userSelect = transform.resize.userSelect;

      transform.resize = {
        ...DEFAULT_RESIZE,
      };

      transform = { ...transform };

      window.removeEventListener("mousemove", transformContext.doResize);
      window.removeEventListener("mouseup", transformContext.stopResize);

      transformContext.isResizing = false;
      transformContext.resize.update((resize) => {
        return {
          ...resize,
          isResizing: false,
          type: "",
        };
      });

      syncPanes(true);
      onLayoutChange();

      // globalContext.dispatchEvent(RESIZE_END, {});
      appManager.trigger(APP_EVENT_LAYOUT_RESIZE_END, {});

      setCursor();
      setPointerEvents();
    },
  };

  return transformContext;
}
