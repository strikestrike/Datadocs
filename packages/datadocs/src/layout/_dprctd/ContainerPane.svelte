<!-- @component
@packageModule(layout/FlexPane)
-->
<script lang="ts">
  import clsx from "clsx";
  import { afterUpdate, beforeUpdate, getContext, onMount } from "svelte";
  import { watchResize } from "svelte-watch-resize";
  import type {
    DropInfo,
    FlagIndex,
    Pane,
    View,
    PaneProps,
    PaneContent,
  } from "../../types";

  import {
    CENTER,
    DIVIDER_SIZE,
    DND_EXTERNAL,
    EAST,
    EAST_EDGE,
    EDGE_THRESHOLD,
    EDGE_THRESHOLD_CLOSED,
    EDGE_THRESHOLD_NORTH,
    GLOBAL_CONTEXT,
    NORTH,
    PANE_CLOSED_SIZE,
    PANE_GROUP_TABS,
    PANE_MIN_HEIGHT,
    PANE_MIN_WIDTH,
    PANE_TABBED,
    PANE_TILED,
    PANE_TYPE_GROUP,
    PANE_TYPE_PANE,
    PLACEMENT_ROOT,
    PLACEMENT_CONTAINER,
    PLACEMENT_CONTAINER_CENTER,
    PLACEMENT_CONTAINER_CENTER_BOTTOM,
    PLACEMENT_CONTAINER_CENTER_MAIN,
    PLACEMENT_CONTAINER_LEFT,
    PLACEMENT_CONTAINER_LEFT_INNER,
    PLACEMENT_CONTAINER_RIGHT,
    PLACEMENT_CONTAINER_RIGHT_INNER,
    PLACEMENT_INNER,
    SOUTH,
    SOUTH_EDGE,
    WEST,
    WEST_EDGE,
  } from "../../core/constants";
  import type {
    DNDContext,
    EdgeArgs,
    GlobalContext,
    PanesContext,
    TransformContext,
  } from "../../types";

  import { getId } from "../../core/utils";
  import { setCursor, setPointerEvents } from "../../core/ui-utils";
  import PaneTabs from "../../pane-ui/PaneTabs.svelte";
  import PaneDivider from "../../pane-ui/PaneDivider.svelte";
  import PaneTabsDummy from "../../pane-ui/PaneTabsDummy.svelte";
  import FixedContainerPane from "./FixedContainerPane.svelte";
  import EmbeddedContainerPane from "./EmbeddedContainerPane.svelte";
  // import { console } from "../../core/console";

  const PANEL_ICON_SIZE: string = "18px";
  const PANEL_LABEL_CLASS: string = "text-13px line-height-21px label-gray";
  const PANEL_LABEL_CANVAS_CLASS: string = "13px Poppins";
  const PANEL_HEADER_CLASS: string = "Container-shrink-0";
  const PANE_OPTIONS_CLASS: string =
    "w-3 h-full flex flex-col justify-start z-10 pointer-events-none";

  const TABS_CLASS = `w-full relative h-[31px] px-2.5 pt-1.5 flex-shrink-0`;
  const TABLIST_CLASS = "";
  const TAB_ACTIVE_CLASS = "w-full h-full";
  const COLLAPSE_ICON_CLASS = "cursor-pointer pointer-events-auto";
  const SETTINGS_ICON_CLASS =
    "cursor-pointer pointer-events-auto hidden";

  const SHOW_GRIP_OFFSET = 10;

  const DROP_EDGE_OFFSET_CLOSED = 5;
  const DROP_EDGE_OFFSET_OPEN = 15;

  const TAB_SNAP_OFFSET = 20;

  const globalContext: GlobalContext = getContext(GLOBAL_CONTEXT);
  const panesContext: PanesContext = globalContext.panesContext;
  const dndContext: DNDContext = globalContext.dndContext;
  const transformContext: TransformContext = globalContext.transformContext;

  const Icon = globalContext.Icon;

  let paneDragElement: HTMLElement = null;
  let paneDragDummy: HTMLElement = null;

  const activeDrag: any = dndContext.drag;

  let windowResizeTimeOut = null;
  let paneOpenTimeOut = null;
  let mouseDragOverElement: HTMLElement = null;

  let allowChildUpdates = false;
  let childUpdates = 0;
  let calculatedMinSize = 0;

  let resizeTimeout;

  export let paneElement: HTMLElement = null;

  /**
   *The Pane to be rendered
   * @type {Pane}
   */
  export let pane: Pane = null;
  /**
   *The Pane Component to be rendered  as children
   * @type {any}
   */
  export let paneComponent: any = null;
  /**
   *Custom Pane Component to render  children
   * @type {any}
   */
  export let customPaneComponent: any = null;
  /**
   *The Component to be rendered in a Pane
   * @type {any}
   */
  export let component: any = null;

  /**
   *The index of pane
   * @type {number}
   */
  export let paneIndex = -1;

  /**
   * Update parent Pane
   * @type {Function}
   *
   */
  export let updateParent: Function = null;

  /** Toggle Tab Style */
  /*******************************/

  function toggleType(target, type) {
    if (target) {
      if (type === "label" && !target.classList.contains("show-label")) {
        let sourceBounds = dndContext.dnd.sourceBounds;
        const offXRatio = dndContext.dnd.offX / sourceBounds.width;
        const offYRatio = dndContext.dnd.offY / sourceBounds.height;

        target.classList.remove("show-icon");
        target.classList.add("show-label");
        target.classList.add("tab-active");

        sourceBounds = target.getBoundingClientRect();
        dndContext.change({
          sourceBounds,
          offX: sourceBounds.width * offXRatio,
          offY: sourceBounds.height * offYRatio,
        });
      } else if (type === "icon" && !target.classList.contains("show-icon")) {
        let sourceBounds = dndContext.dnd.sourceBounds;
        const offXRatio = dndContext.dnd.offX / sourceBounds.width;
        const offYRatio = dndContext.dnd.offY / sourceBounds.height;

        target.classList.remove("show-label");
        target.classList.remove("tab-active");
        target.classList.add("show-icon");

        sourceBounds = target.getBoundingClientRect();
        dndContext.change({
          sourceBounds,
          offX: sourceBounds.width * offXRatio,
          offY: sourceBounds.height * offYRatio,
        });
      }
    }
  }

  function toggleTab(dragType, target, revese = false) {
    if (!isClosed) {
      toggleType(target, !revese ? "label" : "icon");
    } else if (isClosed) {
      toggleType(target, !revese ? "icon" : "label");
    }
  }

  /** Find the where Mouse is at */
  /*******************************/

  function findEdge(
    orientation: string,
    paneBounds: DOMRect,
    isClosed: boolean,
    mouseX: number,
    mouseY: number,
    padding = 0,
    half: FlagIndex = {}
  ) {
    const { top, right, bottom, left, width, height } = paneBounds;

    const d = [
      { type: NORTH, position: mouseY - top },
      { type: SOUTH, position: bottom - mouseY },
      { type: WEST, position: mouseX - left },
      { type: EAST, position: right - mouseX },
    ];

    const sidePosition = isClosed ? EDGE_THRESHOLD_CLOSED : EDGE_THRESHOLD;

    const checkCenter = {
      [NORTH]: false,
      [SOUTH]: false,
      [WEST]: false,
      [EAST]: false,
      ...half,
    };

    const west =
      padding === 0
        ? !checkCenter[WEST]
            ? sidePosition
            : isClosed
              ? 10
              : width / 3
        : width * padding;
    const east =
      padding === 0
        ? !checkCenter[EAST]
            ? sidePosition
            : isClosed
              ? 10
              : width / 3
        : width * padding;
    const north =
      padding === 0
        ? !checkCenter[NORTH]
            ? isClosed
              ? sidePosition
              : sidePosition / 2
            : isClosed
              ? 10
              : height / 3
        : height * padding;
    const south =
      padding === 0
        ? !checkCenter[SOUTH]
            ? sidePosition
            : isClosed
              ? 10
              : height / 3
        : height * padding;

    const checkVertical = (defaultPlace) => {
      const centerSpace = width - (west + east);

      if (d[0].position <= north) {
        return NORTH;
      }
      if (d[1].position <= south) {
        return SOUTH;
      }

      if (!isClosed) {
        return defaultPlace;
      }

      if (
        d[2].position > west + centerSpace / 4 &&
        d[3].position > east + centerSpace / 4
      ) {
        return defaultPlace;
      }

      return null;
    };

    const checkHorizontal = (defaultPlace) => {
      const centerSpace = width - (north + south);

      if (d[2].position <= west) {
        return WEST;
      }
      if (d[3].position <= east) {
        return EAST;
      }

      if (!isClosed) {
        return defaultPlace;
      }

      if (
        d[0].position > north + centerSpace / 4 &&
        d[1].position > south + centerSpace / 4
      ) {
        return defaultPlace;
      }

      return null;
    };

    if (orientation === "horizontal") {
      if (d[2].position <= west) {
        return WEST;
      }

      if (d[3].position <= east /*width / 2 + 40*/) {
        return EAST;
      }

      // Not Disabled to drop at center by default
      if (d[2].position > width / 5 && d[3].position > width / 5) {
        if (d[0].position > height / 5 && d[1].position > height / 5) {
          return CENTER;
        }
      }
    } else {
      if (d[0].position <= north) {
        return NORTH;
      }

      if (d[1].position <= south /*height / 2 + 40*/) {
        return SOUTH;
      }

      if (d[0].position > height / 5 && d[1].position > height / 5) {
        return CENTER;
      }
    }

    // if (orientation === "horizontal") {
    //   return checkVertical(CENTER);
    // } else {
    //   return checkHorizontal(CENTER);
    // }

    return null;
  }

  /** Check if Pane can be inserted */
  /*******************************/

  function checkInsertDrop(isPane = false, edge = "none") {
    const dndFrom: any = dndContext.from;
    const fromPane: any = dndFrom.pane;

    let parentId: string;
    let parentNode: Pane;
    let parentElement: HTMLElement;
    let childCount = 0;
    let childrenSize = 0;
    let parentBounds;
    let parentSize;
    let minSize;

    const isEdge = edge !== "none" && edge !== "";

    const checkGroup = pane.type === PANE_TYPE_GROUP;

    if (fromPane && fromPane.parent === pane.parent) {
      if (dndFrom.type !== "tab") {
        insertDropNo = false;
        return;
      }
    }

    if (isEdge) {
      let parentPane;
      if (edge === SOUTH_EDGE) {
        parentPane = panesContext.getPaneByPlacement(
          PLACEMENT_CONTAINER_CENTER
        );
      } else {
        parentPane = panesContext.getPaneByPlacement(PLACEMENT_CONTAINER);
      }
      if (parentPane !== null) {
        parentNode = parentPane;
        parentId = parentNode.id;
        childCount = parentNode.children.length;
        parentElement = document.getElementById(parentId);
      }
    } else if (!isPane || /inner/.test(pane.placement)) {
      parentNode = parent;
      parentId = parentNode.id;
      childCount = parentNode.children.length;
      parentElement = document.getElementById(parentId);

      if (parentElement) {
        parentBounds = parentElement.getBoundingClientRect();
        parentSize = parent.props.isVGroup
          ? parentBounds.height
          : parentBounds.width;
        minSize = parent.props.isVGroup ? PANE_MIN_HEIGHT : PANE_MIN_WIDTH;
        childrenSize = (childCount + 1) * minSize;
      }
    } else {
      parentNode = pane;
      parentId = parentNode.id;
      parentElement = document.getElementById(parentId);
      if (parentElement) {
        parentBounds = parentElement.getBoundingClientRect();
        parentSize = parentProps.isVGroup
          ? parentBounds.width
          : parentBounds.height;
        minSize = parentProps.isVGroup ? PANE_MIN_WIDTH : PANE_MIN_HEIGHT;
        childrenSize = (childCount + 1) * minSize;
      }
    }

    if (parentSize < childrenSize) {
      insertDropNo = true;
      // console.log(
      //   "insertDropNo parentSize < childrenSize : ",
      //   pane.id,
      //   insertDropNo
      // );
    } else {
      if (!isPane) {
        if (parent.placement === PLACEMENT_CONTAINER && childCount >= 5) {
          insertDropNo = true;
        } else if (
          parent.placement === PLACEMENT_CONTAINER_CENTER &&
          childCount >= 4
        ) {
          insertDropNo = true;
        } else if (
          parent.placement !== PLACEMENT_CONTAINER &&
          parent.placement !== PLACEMENT_CONTAINER_CENTER &&
          childCount >= 3
        ) {
          insertDropNo = true;
        }
      } else if (isPane) {
        if (checkGroup) {
          if (
            pane.placement === PLACEMENT_CONTAINER &&
            pane.children.length >= 5
          ) {
            insertDropNo = true;
          } else if (
            pane.placement === PLACEMENT_CONTAINER_CENTER &&
            pane.children.length >= 4
          ) {
            insertDropNo = true;
          } else if (
            parent.placement !== PLACEMENT_CONTAINER &&
            parent.placement !== PLACEMENT_CONTAINER_CENTER &&
            childCount >= 3
          ) {
            insertDropNo = true;
          }
        } else {
          if (isEdge) {
            if (parent.placement === PLACEMENT_CONTAINER && childCount >= 5) {
              insertDropNo = true;
            } else if (
              parent.placement === PLACEMENT_CONTAINER_CENTER &&
              childCount >= 4
            ) {
              insertDropNo = true;
            } else if (
              parent.placement !== PLACEMENT_CONTAINER &&
              parent.placement !== PLACEMENT_CONTAINER_CENTER &&
              childCount >= 3
            ) {
              insertDropNo = true;
            }
          } else if (/inner/.test(pane.placement)) {
            if (childCount >= 3) {
              insertDropNo = true;
            }
          } else {
            insertDropNo = false;
          }
        }
      }
    }
    // console.groupCollapsed("ContainerPane");
    // console.log(
    //   "insertDropNo parentSize < childrenSize ELSE : ",
    //   isPane,
    //   isEdge,
    //   pane.id,
    //   parent.placement,
    //   childCount,
    //   insertDropNo
    // );
    // console.groupEnd();
  }

  /** Panel Mouse Handlers */
  /*******************************/

  function checkPaneMousePosition(
    dndFrom: any,
    edgeArgs: EdgeArgs,
    mouseX: number,
    mouseY: number
  ) {
    let fromPane = dndFrom.pane;

    let edgeDropArea: string = "none";

    let isCenter: boolean = dropArea === CENTER;

    let dropEdgeOffset: number = isClosed
      ? DROP_EDGE_OFFSET_CLOSED
      : DROP_EDGE_OFFSET_OPEN;

    let bounds = globalContext.bounds;

    if (bounds) {
      if (isContainerCenterMain && mouseX <= dropEdgeOffset && !pane.prev) {
        if (dndFrom.type !== PANE_TYPE_PANE || fromPane.prev) {
          edgeDropArea = WEST_EDGE;
        }
      } else if (
        isContainerCenterMain &&
        bounds.width - mouseX <= dropEdgeOffset &&
        !pane.next
      ) {
        if (dndFrom.type !== PANE_TYPE_PANE || fromPane.next) {
          edgeDropArea = EAST_EDGE;
        }
      } else if (
        isContainerCenter &&
        bounds.height - mouseY <= dropEdgeOffset &&
        !pane.next
      ) {
        if (dndFrom.type !== PANE_TYPE_PANE || fromPane.next) {
          edgeDropArea = SOUTH_EDGE;
        }
      }
      // console.log(
      //   "edgeDropArea :",
      //   edgeDropArea,
      //   pane.placement,
      //   isContainerCenterMain,
      //   bounds.x + bounds.width,
      //   mouseX,
      //   bounds.x + bounds.width - mouseX,
      //   dropEdgeOffset
      // );
    }


    if (edgeDropArea === "none" && ((pane.type === PANE_TYPE_PANE && !isInner) || props.isTabsGroup)) {
      if (dndFrom.type === PANE_TYPE_PANE) {
        if (dndFrom.pane !== pane) {
          let dropTo = findEdge(...edgeArgs);

          // console.group("ContainerPane");
          // console.log("findEdge ...", dndFrom.type, dropTo);
          // console.groupEnd();

          // Allow drop in inner pane, but set parent as target pane
          // if (isInner && dropTo !== CENTER) {
          //   dropTo = null;
          // }
          if (
            dropTo !== null &&
            (dropAllowedAll ||
              (hasDropAllowed && dropAllowed[dropTo] === true) ||
              (hasDropDenied && !dropDenined[dropTo]))
          ) {
            dropArea = dropTo;
          } else {
            setDNDTo({}, { clear: true });
            dropArea = "none";
          }
        }
      } else if (dndFrom.type === "tab") {
        // if (dndContext.to.onTabs) {
        //   dropAreaHidden = true;
        // } else {
        // }

        let dropTo = findEdge(...edgeArgs);

        // console.groupCollapsed("ContainerPane");
        // console.log("findEdge ...", dropTo);
        // console.groupEnd();

        dropAreaHidden = false;

        if ((dropTo === CENTER || !hasTabs) && dndFrom.pane === pane) {
          dropTo = null;
        }

        if (dropTo !== SOUTH && dndContext.to.onTabs && !isClosed) {
          setDNDTo({ dropArea: "none" });
          dropTo = "none";
        }

        // Allow drop in inner pane, but set parent as target pane
        // if (isInner && dropTo !== CENTER) {
        //   dropTo = null;
        // }

        // if (dropTo === NORTH && dndContext.to.onTabs) {
        //   setDNDTo({}, { clear: true });
        //   dropArea = "none";
        // }

        if (
          dropTo !== null &&
          (dropAllowedAll ||
            (hasDropAllowed && dropAllowed[dropTo] === true) ||
            (hasDropDenied && !dropDenined[dropTo]))
        ) {
          dropArea = dropTo;
        } else if (!dndContext.to.onTabs) {
          setDNDTo({}, { clear: true });
          dropArea = "none";
        }
      }
    } else {
      dropArea = "none";
    }

    // if (dropArea !== CENTER && dropArea !== "none") {
    //   if (dropArea === NORTH && pane.prev !== null && parentProps.isVGroup) {
    //     dropArea = CENTER;
    //   }
    //   if (dropArea === SOUTH && pane.next !== null && parentProps.isVGroup) {
    //     dropArea = CENTER;
    //   }
    //   if (dropArea === WEST && pane.prev !== null && parentProps.isHGroup) {
    //     dropArea = CENTER;
    //   }
    //   if (dropArea === EAST && pane.next !== null && parentProps.isHGroup) {
    //     dropArea = CENTER;
    //   }
    // }

    if (
      (dropArea !== CENTER && dropArea !== "none") ||
      edgeDropArea !== "none"
    ) {
      checkInsertDrop(true, edgeDropArea);
    }

    if (edgeDropArea !== dndContext.dnd.edgeDropArea) {
      setDNDTo({
        onTabs: false,
        pane,
        paneOrientation,
        isClosed: props.isClosed,
        type: PANE_TYPE_PANE,
        paneIndex,
        dropArea: edgeDropArea,
      });
      dndContext.change(
        {
          edgeDropArea,
        },
        {
          edgeDropArea,
          insertDropNo,
        }
      );

      // console.group("ContainerPane");
      // console.log(
      //   "edgeDropArea : ",
      //   pane.type,
      //   pane.placement,
      //   pane.id,
      //   pane.props.paneType,
      //   pane.props.groupType,
      //   edgeDropArea,
      //   insertDropNo
      // );
      // console.groupEnd();
    } else if (
      edgeDropArea === "none" &&
      !dndContext.to.onTabs &&
      dropArea === CENTER
    ) {
      setDNDTo({
        onTabs: false,
        pane,
        dropArea,
        paneOrientation,
        isClosed: props.isClosed,
        type: PANE_TYPE_PANE,
        paneIndex,
      });
      dndContext.change(null, {
        edgeDropArea,
        insertDropNo,
      });
    }

    isCenter = !isCenter && dropArea === CENTER;
    if (dropArea === CENTER) {
      if (isCenter) {
        const addedTabs = [];

        const proxy = dndContext.dnd.sourceProxy;
        const tabs = proxy.querySelectorAll(".tabs-list > .flex-tab");

        if (tabs && tabs.length > 0) {
          const count = tabs.length;
          for (let i = 0; i < count; i++) {
            const tab: any = tabs[i];
            const { tabname: tabName, tablabel: tabLabel } = tab.dataset;
            addedTabs.push({
              id: getId(),
              name: tabName,
              icon: tabName,
              label: tabLabel,
            });
          }
        }
        if (addedTabs.length !== 0 || newPanes.length !== 0) {
          newPanes = addedTabs;
        }
        dndContext.change(null, {
          toPane: pane.id,
        });
      }
    } else {
      newPanes = [];
      dndContext.change(null, {
        toPane: null,
      });
    }

    if (
      !isContainerCenter &&
      dndContext.dnd.isMouseDown &&
      dndContext.to.onTabs &&
      fromPane?.id !== pane.id &&
      !pane.props.isFixed
    ) {
      dropArea = CENTER;
    }

    // console.groupCollapsed("ContainerPane");
    // console.log("droparea ...", dropArea);
    // console.groupEnd();
    if (
      dropArea === "none" &&
      edgeDropArea === "none" &&
      !dndContext.to.onTabs
    ) {
      setDNDTo({}, { clear: true });
    }
  }

  function handlePaneMouseEnter() {
    /* This now handled by Flex Tabs */
    // if (
    //   isClosed &&
    //   dndContext.dnd.isMouseDown &&
    //   dndContext.dnd.type === "tab-open"
    // ) {
    //   if (dndContext.dnd.sourceProxy) {
    //     dndContext.dnd.sourceProxy.classList.add("show-icon");
    //     dndContext.dnd.sourceProxy.classList.remove("show-label");
    //   }
    // }
  }

  function handlePaneMouseLeave() {
    /* This now handled by Flex Tabs */
    const dndFrom: any = dndContext.from;
    // if (
    //   isClosed &&
    //   dndContext.dnd.isMouseDown &&
    //   dndContext.dnd.type === "tab-open"
    // ) {
    //   if (dndContext.dnd.sourceProxy) {
    //     dndContext.dnd.sourceProxy.classList.remove("show-icon");
    //     dndContext.dnd.sourceProxy.classList.add("show-label");
    //   }
    // }
    showGrip = false;
    dropArea = "none";
    dividerDrop = false;
    if (
      pane.placement === PLACEMENT_CONTAINER_CENTER_MAIN &&
      (!pane.next || !pane.prev) &&
      dndContext.dnd.edgeDropArea !== "none"
    ) {
      dndContext.change(
        {
          edgeDropArea: "none",
        },
        {
          edgeDropArea: "none",
        }
      );
      setDNDTo({}, { clear: true });
    }
  }

  function handlePaneMouseUp() {
    const dndFrom: any = dndContext.from;
    dropArea = "none";
    dividerDrop = false;
    setTimeout(() => {
      if (
        pane.placement === PLACEMENT_CONTAINER_CENTER_MAIN &&
        (!pane.next || !pane.prev) &&
        dndContext.dnd.edgeDropArea !== "none"
      ) {
        dndContext.change(
          {
            edgeDropArea: "none",
          },
          {
            edgeDropArea: "none",
          }
        );
        setDNDTo({}, { clear: true });
      }
    }, 500);
  }

  function handlePaneMouseMove(target, paneBounds, mouseX, mouseY) {
    //const { dndtype: dndType, tabindex: tabIndex } = target.dataset;

    const dndFrom: any = dndContext.from;
    const fromPane: any = dndFrom.pane;

    const edgeArgs: EdgeArgs = [
      paneOrientation,
      paneBounds,
      isClosed,
      mouseX,
      mouseY,
      0,
      // paneOrientation === "horizontal"
      //   ? {
      //       [WEST]: true,
      //       [EAST]: true,
      //     }
      //   : {
      //       [NORTH]: true,
      //       [SOUTH]: true,
      //     },
    ];

    dndContext.change({
      currentPane: pane,
    });

    if (dndContext.dnd.sourceProxy) {
      if (
        pane.type !== PANE_TYPE_GROUP &&
        !props.isFixed &&
        dndContext.from.type === "tab"
      ) {
        toggleTab(dndContext.dnd.type, dndContext.dnd.sourceProxy);
      } else if (dndContext.dnd.type === "pane-open") {
        if (isClosed) {
          dndContext.dnd.sourceProxy.classList.add("toggle");
        } else {
          dndContext.dnd.sourceProxy.classList.remove("toggle");
        }
      }
    }

    if (!dndContext.dnd.isMouseDown) {
      // if (mouseY <= paneBounds.y + SHOW_GRIP_OFFSET) {
      //   showGrip = true;
      // } else if (showGrip) {
      //   showGrip = false;
      // }
      // dropArea = "none";
      if (globalContext.bounds) {
        const bounds: DOMRect = globalContext.bounds;
        globalContext.extMethods.onPaneMouseMove(paneElement, pane, () =>
          checkPaneMousePosition(
            {
              type: DND_EXTERNAL,
              pane: {},
            },
            edgeArgs,
            mouseX - bounds.x,
            mouseY - bounds.y
          )
        );
      }
    } else if (
      dndContext.to.onTabs &&
      isClosed &&
      fromPane?.id !== pane.id &&
      !pane.props.isFixed
    ) {
      dropArea = CENTER;
    } else {
      checkPaneMousePosition(dndFrom, edgeArgs, mouseX, mouseY);
      return true;
    }

    return false;
  }

  function addPaneHandlers(paneElement) {
    let enableMouseTracking: boolean =
      !parentProps.isTabsGroup &&
      !parentProps.isFixedGroup &&
      !parentProps.isCustomGroup &&
      (pane.type === PANE_TYPE_PANE ||
        isContainerCenter ||
        isContainerCenterMain ||
        props.groupType === PANE_GROUP_TABS);

    if (enableMouseTracking) {
      return paneHandlers(paneElement);
    }
  }

  function paneHandlers(paneElement) {
    let paneBounds = null;

    const onMouseEnter = () => {
      handlePaneMouseEnter();
      paneBounds = paneElement.getBoundingClientRect();
      paneElement.addEventListener("mousemove", onMouseMove);
      insertDropNo = false;
    };
    const onMouseLeave = () => {
      paneElement.removeEventListener("mousemove", onMouseMove);
      handlePaneMouseLeave();
      insertDropNo = false;
    };
    const onMouseUp = () => {
      handlePaneMouseUp();
      insertDropNo = false;
    };
    const onMouseMove = (event) => {
      insertDropNo = false;
      if (paneBounds !== null && !event.handled) {
        const found = handlePaneMouseMove(
          pane,
          paneBounds,
          event.clientX,
          event.clientY
        );
        if(dropArea !== "none" ||dndContext?.dnd?.edgeDropArea !== "none"){
          event.handled = true;
        }
      }
    };

    paneElement.addEventListener("mouseenter", onMouseEnter);
    paneElement.addEventListener("mouseleave", onMouseLeave);
    paneElement.addEventListener("mouseup", onMouseUp);

    return {
      destroy() {
        paneElement.removeEventListener("mouseenter", onMouseEnter);
        paneElement.removeEventListener("mouseleave", onMouseLeave);
        paneElement.removeEventListener("mouseup", onMouseUp);
        paneElement.removeEventListener("mousemove", onMouseMove);
      },
    };
  }

  /** Panel Drop Zone Mouse Handlers */
  /*******************************/

  function handleDropZoneMouseMove() {
    // console.groupCollapsed("ContainerPane");
    // console.log("dropArea ", dropArea);
    // console.groupEnd();
    if (dropArea !== "none") {
      const { dndtype: dndType, tabindex: tabIndex } = paneElement.dataset;
      const dndFrom = dndContext.from;

      if (dndFrom.type === PANE_TYPE_PANE) {
        if (
          (parentProps.isHGroup &&
            dropArea === EAST &&
            dndFrom.pane.id === pane.next?.id) ||
          (parentProps.isVGroup &&
            dropArea === SOUTH &&
            dndFrom.pane.id === pane.next?.id)
        ) {
          return;
        }
        setDNDTo({
          pane,
          paneOrientation,
          isClosed: props.isClosed,
          type: dndType,
          tabIndex,
          paneIndex,
          dropArea,
        });
        dropZone = dropArea;
      } else if (dndFrom.type === "tab") {
        setDNDTo({
          pane,
          paneOrientation,
          isClosed: props.isClosed,
          type: dndType,
          tabIndex,
          paneIndex,
          dropArea,
        });
        dndContext.change(
          {
            edgeDropArea: "none",
          },
          {
            edgeDropArea: "none",
          }
        );
        dropZone = dropArea;
      }
    }
  }

  function dropZoneHandler(dropZoneElement) {
    const moveState = {
      x: null,
      y: null,
      stopTimeout: null,
      clearStop: function () {
        clearTimeout(this.stopTimeout);
        this.x = null;
        this.y = null;
        this.stopTimeout = null;
      },
    };

    function clearStop() {
      moveState.clearStop();
      dropZone = "none";
      dropArea = "none";

      if (!dndContext.to.onTabs) {
        setDNDTo(
          {},
          {
            clear: true,
          }
        );
      } else {
        setDNDTo({ dropArea: "none" });
      }
    }

    function onMouseEnter() {}

    function onMouseMove(event) {
      // let changeX = 0;
      // let changeY = 0;
      // if (moveState.x !== null && moveState.y !== null) {
      //   changeX = Math.abs(event.clientX - moveState.x);
      //   changeY = Math.abs(event.clientY - moveState.y);
      // }
      // moveState.x = event.clientX;
      // moveState.y = event.clientY;

      // if (changeX > 0.5) {
      //   clearStop();
      //   moveState.stopTimeout = setTimeout(() => {
      //     handleDropZoneMouseMove();
      //     moveState.clearStop();
      //   }, 800);
      // }
      handleDropZoneMouseMove();
      moveState.stopTimeout = setTimeout(() => {
        clearStop;
      }, 800);
    }

    dropZoneElement.addEventListener("mouseenter", onMouseEnter);
    dropZoneElement.addEventListener("mousemove", onMouseMove);
    return {
      destroy() {
        dropZoneElement.removeEventListener("mouseenter", onMouseEnter);
        dropZoneElement.removeEventListener("mousemove", onMouseMove);
      },
    };
  }

  /** Panel Divider Mouse Handlers */
  /*******************************/

  function handleDividerMouseEnter(divider?: HTMLElement) {
    dndContext.change(null, {
      toPane: null,
    });
    if (dndContext.dnd.isMouseDown && !dndContext.to.onTabs) {
      const dndFrom = dndContext.from;
      if (dndFrom.type === PANE_TYPE_PANE) {
        if (dndFrom.pane.id !== pane.id && dndFrom.pane.id !== pane.next?.id) {
          dividerDrop = true;
        } else {
          dividerDrop = false;
        }
      } else {
        dividerDrop = true;
      }

      if (dividerDrop) {
        checkInsertDrop();
        setDNDPrevent();
      } else {
        return;
      }

      if (dividerDrop) {
        let dropArea = null;
        let tagetPane = null;
        let targetIndex = paneIndex;

        if (dividerDropSide === "left-after") {
          tagetPane = pane;
          dropArea = EAST;
        } else if (dividerDropSide === "right-before") {
          tagetPane = pane;
          dropArea = EAST;
        } else if (dividerDropSide === "bottom-before") {
          tagetPane = pane.next;
          targetIndex++;
          dropArea = NORTH;
        }

        if (!insertDropNo) {
          setDNDTo({
            pane: tagetPane,
            paneOrientation,
            isClosed: props.isClosed,
            type: PANE_TYPE_PANE,
            paneIndex: targetIndex,
            dropArea,
          });
          dndContext.change(
            {
              edgeDropArea: "none",
            },
            {
              edgeDropArea: "none",
            }
          );
        }
      } else {
        setDNDTo(
          {},
          {
            clear: true,
          }
        );
      }
    }

    if (!dividerDrop) {
      dividerDrop = globalContext.extMethods.onDividerDrag(divider, pane);
    }
  }

  function handleDividerMouseLeave() {
    if (dividerDrop) {
      dividerDrop = false;
    }
    if (insertDropNo) {
      insertDropNo = false;
    }
    setDNDTo({}, { clear: true });
  }

  function handleDividerMouseMove() {}

  function handleDividerMouseUp(divider?: HTMLElement) {
    if (dividerDrop && !dndContext.dnd.isMouseDown) {
      globalContext.extMethods.onDividerDrop(divider, pane, dividerDropSide);
    }

    if (dividerDrop) {
      dividerDrop = false;
    }
    if (insertDropNo) {
      insertDropNo = false;
    }
  }

  function dividerHandlers(divider) {
    const { type } = divider.dataset;

    const onMouseEnter = (event) => {
      handleDividerMouseEnter(divider);
    };
    const onMouseLeave = (event) => {
      handleDividerMouseLeave();
    };
    const onMouseMove = (event) => {
      handleDividerMouseMove();
    };
    const onMouseUp = (event) => {
      handleDividerMouseUp(divider);
    };

    divider.addEventListener("mouseenter", onMouseEnter);
    divider.addEventListener("mouseleave", onMouseLeave);
    divider.addEventListener("mousemove", onMouseMove);
    divider.addEventListener("mouseup", onMouseUp);
    return {
      destroy() {
        divider.removeEventListener("mouseenter", onMouseEnter);
        divider.removeEventListener("mouseleave", onMouseLeave);
        divider.removeEventListener("mousemove", onMouseMove);
        divider.removeEventListener("mouseup", onMouseUp);
      },
    };
  }

  /** Winodow Mouse Handlers */
  /*******************************/

  function handleDragMouseDown(source, clientX, clientY) {
    const { dndtype: dndType, type, tabindex: tabIndex } = source.dataset;
    if (dndContext.dragStage !== null) {
      const dragStage = dndContext.dragStage;
      const stageBounds = dragStage.getBoundingClientRect();

      const startX = clientX;
      const startY = clientY;
      const x = clientX - stageBounds.x;
      const y = clientY - stageBounds.y;

      let sourceBounds = null;
      let dummyBounds = null;
      let sourceProxy = null;
      const sourceProxyBounds = null;
      let sourceCopy = null;
      let offX = 0;
      let offY = 0;
      let proxyStyle = null;

      if (type === "tab-closed") {
        sourceBounds = source.getBoundingClientRect();
        sourceProxy = source.cloneNode(true);
        sourceProxy.classList.add("dnd-source-proxy", "picked", "on-tabs");
        sourceProxy.classList.remove("show-label-also");

        offX = clientX - sourceBounds.x;
        offY = clientY - sourceBounds.y;

        proxyStyle = {
          left: `${x - offX}px`,
          top: `${y - offY}px`,
        };
        Object.assign(sourceProxy.style, proxyStyle);
        dndContext.dragStage.appendChild(sourceProxy);

        // offX = null;
        // offY = null;
      } else if (type === "tab-open") {
        sourceBounds = source.getBoundingClientRect();
        sourceProxy = source.cloneNode(true);
        sourceProxy.classList.add("dnd-source-proxy", "picked", "on-tabs");

        offX = clientX - sourceBounds.x;
        offY = clientY - sourceBounds.y;

        proxyStyle = {
          left: `${x - offX}px`,
          top: `${y - offY}px`,
        };
        Object.assign(sourceProxy.style, proxyStyle);
        dndContext.dragStage.appendChild(sourceProxy);

        // if (dndContext.dnd.type === "tab-open" && yChange < 30) {
        //   Object.assign(sourceProxy.style, {
        //     left: `${x + xChange - offX}px`,
        //     top: `0px`,
        //   });
        // }

        // proxyStyle = {
        //   left: `${x - sourceProxy.offsetWidth / 2}px`,
        //   top: `${y - sourceProxy.offsetHeight / 2}px`,
        // };

        // if (sourceProxy.offsetHeight / 2 < 30) {
        //   Object.assign(sourceProxy.style, {
        //     left: `${x - offX}px`,
        //     top: `0px`,
        //   });
        // }

        Object.assign(sourceProxy.style, proxyStyle);

        // offX = null;
        // offY = null;
      } else if (type === "pane-closed") {
        if (paneElement !== null) {
          let dummyClosed = null;

          source = paneElement;
          sourceBounds = source.getBoundingClientRect();
          sourceCopy = source.cloneNode(true);
          sourceProxy = paneDragDummy.cloneNode(true);
          sourceProxy.classList.add(
            "dnd-source-proxy",
            "closed-pane",
            paneOrientation
          );
          sourceProxy.classList.remove("hidden");
          dndContext.dragStage.appendChild(sourceProxy);
          dummyBounds = sourceProxy.getBoundingClientRect();
          dndContext.dragStage.appendChild(sourceCopy);
          sourceCopy.classList.add("dnd-source-copy");

          dummyClosed = sourceProxy.getElementsByClassName(
            "drag-pane-dummy-closed"
          )[0];

          if (!hasTabs) {
            dummyClosed.classList.add("single");
          }

          offX = clientX - sourceBounds.x;
          offY = clientY - sourceBounds.y;
          proxyStyle = {
            left: `${x - offX}px`,
            top: `${y - offY}px`,
            width: `${
              paneOrientation === "vertical"
                ? sourceBounds.width
                : dummyBounds.width
            }px`,
            height: `${
              paneOrientation === "horizontal"
                ? sourceBounds.height
                : dummyBounds.height
            }px`,
          };
          Object.assign(sourceProxy.style, proxyStyle);
          proxyStyle = {
            left: `${x - offX}px`,
            top: `${y - offY}px`,
            width: `${sourceBounds.width}px`,
            height: `${sourceBounds.height}px`,
            maxHeight: "unset",
            maxWidth: "unset",
            border: "none",
          };
          Object.assign(sourceCopy.style, proxyStyle);

          if (dummyClosed) {
            if (paneOrientation === "horizontal") {
              proxyStyle = {
                left: `${offX - dummyBounds.width / 2}px`,
                // top: `${offY - 40}px`,
              };
            } else {
              proxyStyle = {
                top: `${offY - dummyBounds.height / 2}px`,
                // top: `${offY - 40}px`,
              };
            }
            Object.assign(dummyClosed.style, proxyStyle);
          }

          setTimeout(() => {
            sourceProxy.classList.add("picked");
            sourceCopy.classList.add("picked");
            setTimeout(() => {
              if (sourceCopy.parentElement) {
                sourceCopy.parentElement.removeChild(sourceCopy);
                sourceCopy.classList.add("hidden");
                sourceProxy.appendChild(sourceCopy);
              }
            }, 110);
          }, 20);

          // source = paneDragElement;
          // sourceBounds = source.getBoundingClientRect();
          // sourceProxy = source.cloneNode(true);
          // sourceProxy.classList.add("dnd-source-proxy", "picked");
          // dndContext.dragStage.appendChild(sourceProxy);

          // offX = clientX - sourceBounds.x;
          // offY = clientY - sourceBounds.y;
          // proxyStyle = {
          //   left: `${x - offX}px`,
          //   top: `${y - offY}px`,
          //   width: `${sourceBounds.width}px`,
          //   height: `${sourceBounds.height}px`,
          // };
          // Object.assign(sourceProxy.style, proxyStyle);
        }
      } else if (type === "pane-open") {
        if (paneElement !== null) {
          let dummyOpen = null;
          let dummyClosed = null;

          source = paneElement;
          sourceBounds = source.getBoundingClientRect();
          sourceCopy = source.cloneNode(true);
          sourceProxy = paneDragDummy.cloneNode(true);
          sourceProxy.classList.add(
            "dnd-source-proxy",
            "pane-open",
            "horizontal"
          );
          sourceProxy.classList.remove("hidden");
          dndContext.dragStage.appendChild(sourceProxy);
          dummyBounds = sourceProxy.getBoundingClientRect();
          dndContext.dragStage.appendChild(sourceCopy);
          sourceCopy.classList.add("dnd-source-copy");
          dummyOpen = sourceProxy.getElementsByClassName(
            "drag-pane-dummy-open"
          )[0];
          dummyClosed = sourceProxy.getElementsByClassName(
            "drag-pane-dummy-closed"
          )[0];

          if (!hasTabs) {
            dummyOpen.classList.add("single");
            dummyClosed.classList.add("single");
          }

          offX = clientX - sourceBounds.x;
          offY = clientY - sourceBounds.y;
          proxyStyle = {
            left: `${x - offX}px`,
            top: `${y - offY}px`,
            width: `${dummyBounds.width}px`,
            height: `${dummyBounds.height}px`,
          };
          Object.assign(sourceProxy.style, proxyStyle);
          proxyStyle = {
            left: `${x - offX}px`,
            top: `${y - offY}px`,
            width: `${sourceBounds.width}px`,
            height: `${sourceBounds.height}px`,
            maxHeight: "unset",
            maxWidth: "unset",
            border: "none",
          };
          Object.assign(sourceCopy.style, proxyStyle);

          if (dummyOpen) {
            proxyStyle = {
              left: `${offX - dummyBounds.width / 2}px`,
              // top: `${offY - 40}px`,
            };
            Object.assign(dummyOpen.style, proxyStyle);
          }
          if (dummyClosed) {
            proxyStyle = {
              left: `${offX - 16}px`,
              top: `${offY - 20}px`,
            };
            Object.assign(dummyClosed.style, proxyStyle);
          }

          setTimeout(() => {
            sourceCopy.classList.add("picked");
            sourceProxy.classList.add("picked");
            setTimeout(() => {
              if (sourceCopy.parentElement) {
                sourceCopy.parentElement.removeChild(sourceCopy);
                sourceCopy.classList.add("hidden");
                sourceProxy.appendChild(sourceCopy);
              }
            }, 110);
          }, 20);

          // source = paneElement;
          // sourceBounds = source.getBoundingClientRect();
          // sourceProxy = source.cloneNode(true);
          // sourceProxy.classList.remove(
          //   "no-top-bottom-border",
          //   "no-left-right-border",
          //   "pane-center-bottom",
          //   "no-border"
          // );
          // sourceProxy.classList.add("dnd-source-proxy", "picked");
          // dndContext.dragStage.appendChild(sourceProxy);

          // offX = clientX - sourceBounds.x;
          // offY = clientY - sourceBounds.y;
          // proxyStyle = {
          //   left: `${x - offX}px`,
          //   top: `${y - offY}px`,
          //   width: `${sourceBounds.width}px`,
          //   height: `${sourceBounds.height}px`,
          // };
          // Object.assign(sourceProxy.style, proxyStyle);
        }
      }

      if (sourceProxy !== null) {
        setDNDFrom({
          pane,
          type: dndType,
          paneIndex,
          tabIndex: parseInt(tabIndex),
        });

        dndContext.change(
          {
            isMouseDown: true,
            type,
            source,
            sourceBounds,
            sourceProxy,
            sourceProxyBounds,
            stageBounds,
            startX,
            startY,
            x,
            y,
            offX,
            offY,
          },
          {
            isMouseDown: true,
            source,
            sourceProxy,
            type,
          }
        );

        setCursor();
        setPointerEvents("none");

        return true;
      }
    }
    return false;
  }

  function handleDragMouseMove(mouseX, mouseY) {
    const { startX, startY, x, y, offX, offY, source, sourceProxy, stageBounds } =
      dndContext.dnd;

    let dragDummyBounds = null;

    if (dndContext.to && dndContext.to.dragDummyBounds) {
      dragDummyBounds = dndContext.to.dragDummyBounds;
    }

    if (sourceProxy) {
      // const newX = mouseX - stageBounds.x;
      // const newY = mouseY - stageBounds.y;

      // if (
      //   (dndContext.dnd.type === "tab-closed" ||
      //     dndContext.dnd.type === "tab-open" ||
      //     dndContext.dnd.type === "pane-closed") &&
      //   dndContext?.to?.dropArea !== "none"
      // ) {
      // }

      const xChange = mouseX - startX;
      const yChange = mouseY - startY;

      const xDiff = Math.abs(xChange);
      const yDiff = Math.abs(yChange);

      const isTab =
        dndContext.dnd.type === "tab-open" ||
        dndContext.dnd.type === "tab-closed";

      // if (isTab && dragDummyBounds !== null) {
      //   if (offX > dragDummyBounds.width) {
      //     offX = dragDummyBounds.width / 2;
      //   }
      //   if (offY > dragDummyBounds.height) {
      //     offY = dragDummyBounds.height / 2;
      //   }
      // }

      if (
        (dndContext?.to?.dropArea &&
          dndContext?.to?.dropArea !== "none" &&
          dndContext?.to?.dropArea !== CENTER) ||
        (dndContext?.dnd?.edgeDropArea &&
          dndContext?.dnd?.edgeDropArea !== "none")
      ) {
        sourceProxy.style.opacity = "0.6";
      } else {
        sourceProxy.style.opacity = "1";
      }

      if (dndContext.from.pane === dndContext.dnd.currentPane) {
        source.classList.remove("off-tabs");
      } else {
        source.classList.add("off-tabs");
      }

      if (
        dndContext.to.onTabs &&
        (!dndContext.to.isClosed ||
          (dndContext.to.isClosed &&
            dndContext.to.paneOrientation === "horizontal"))
      ) {
        Object.assign(sourceProxy.style, {
          left: `${x + xChange - offX}px`,
          top: `${
            dragDummyBounds !== null
              ? dragDummyBounds.y - stageBounds.y
              : y - offY
          }px`,
        });
      } else if (
        dndContext.to.onTabs &&
        dndContext.to.isClosed &&
        dndContext.to.paneOrientation === "vertical"
      ) {
        Object.assign(sourceProxy.style, {
          left: `${
            dragDummyBounds !== null
              ? dragDummyBounds.x - stageBounds.x
              : x - offX
          }px`,
          top: `${y + yChange - offY}px`,
        });
      } else {
        Object.assign(sourceProxy.style, {
          left: `${x + xChange - offX}px`,
          top: `${y + yChange - offY}px`,
        });
      }

      // if (
      //   dndContext.to.onTabs &&
      //   (!dndContext.to.isClosed ||
      //     (dndContext.to.isClosed &&
      //       dndContext.to.paneOrientation === "horizontal"))
      // ) {
      //   if (dndContext.from.pane === dndContext.to?.pane) {
      //     source.classList.remove("off-tabs");
      //   }
      //   sourceProxy.classList.remove("off-tabs");
      //   Object.assign(sourceProxy.style, {
      //     left: `${x + xChange - offX}px`,
      //     top: `${
      //       dragDummyBounds !== null
      //         ? dragDummyBounds.y - stageBounds.y
      //         : y - offY
      //     }px`,
      //   });
      // } else if (
      //   dndContext.to.onTabs &&
      //   dndContext.to.isClosed &&
      //   dndContext.to.paneOrientation === "vertical"
      // ) {
      //   if (dndContext.from.pane === dndContext.to?.pane) {
      //     source.classList.remove("off-tabs");
      //   }
      //   sourceProxy.classList.remove("off-tabs");
      //   Object.assign(sourceProxy.style, {
      //     left: `${
      //       dragDummyBounds !== null
      //         ? dragDummyBounds.x - stageBounds.x
      //         : x - offX
      //     }px`,
      //     top: `${y + yChange - offY}px`,
      //   });
      // } else {
      //   // offX = isTab ? sourceProxy.offsetWidth / 2 : offX;
      //   // offY = isTab ? sourceProxy.offsetHeight / 2 : offY;
      //   source.classList.add("off-tabs");
      //   // sourceProxy.classList.add("off-tabs");
      //   Object.assign(sourceProxy.style, {
      //     left: `${x + xChange - offX}px`,
      //     top: `${Math.max(-stageBounds.y, y + yChange - offY)}px`,
      //   });
      // }
    }
  }

  function handleDragMouseUp() {
    if (dndContext.dnd.sourceProxy && dndContext.dnd.sourceProxy.parentNode) {
      const change = {
        isMouseDown: false,
      };
      dndContext.change(change, change);
      if (
        dndContext?.to?.dropArea !== "none" &&
        dndContext.to.pane &&
        !dndContext.to.onTabs
      ) {
        if (dndContext?.to?.dropArea === undefined) {
          setTimeout(() => {
            dndContext.update();
            resetDrag();
          }, 120);
        } else {
          let placement: string = "";
          if (
            dndContext?.to?.dropArea === WEST_EDGE ||
            dndContext?.to?.dropArea === EAST_EDGE
          ) {
            placement = PLACEMENT_CONTAINER_CENTER_MAIN;
          } else if (dndContext?.to?.dropArea === SOUTH_EDGE) {
            placement = PLACEMENT_CONTAINER_CENTER;
          }
          dndContext.update(placement);
          resetDrag();
        }
      } else {
        if (
          (dndContext.dnd.type === "tab-closed" ||
            dndContext.dnd.type === "tab-open" ||
            dndContext.dnd.type === "pane-closed") &&
          (dndContext?.to?.dropArea !== "none" || dndContext.to.onTabs)
        ) {
          const { source, sourceProxy, sourceBounds, stageBounds } =
            dndContext.dnd;

          let { x: xx, y: yy } = sourceBounds;

          if (source) {
            const sourceBoundsNow = source.getBoundingClientRect();
            xx = sourceBoundsNow.x;
            yy = sourceBoundsNow.y;
          }

          const proxyStyle = {
            left: `${xx - stageBounds.x}px`,
            top: `${yy - stageBounds.y}px`,
          };

          if (dndContext?.to?.wasOnTabs) {
            sourceProxy.classList.add("removed-alt");
          } else {
            sourceProxy.classList.add("removed");
          }
          Object.assign(sourceProxy.style, proxyStyle);
          if (
            !dndContext?.to?.onTabs ||
            dndContext?.from?.pane === dndContext?.to?.pane
          ) {
            setTimeout(() => {
              if (dndContext?.to?.onTabs) {
                dndContext.update();
              }
              resetDrag();
            }, 100);
          } else if (
            dndContext?.to?.onTabs &&
            dndContext?.from?.pane !== dndContext?.to?.pane
          ) {
            dndContext.update();
            resetDrag();
          }
        } else {
          resetDrag();
        }
      }
    } else {
      resetDrag();
    }
  }

  function resetDrag() {
    if (dndContext.dnd.sourceProxy && dndContext.dnd.sourceProxy.parentNode) {
      dndContext.dragStage.removeChild(dndContext.dnd.sourceProxy);
    }
    dndContext.reset();
    dividerDrop = false;
    dropArea = "none";

    setCursor();
    setPointerEvents();
  }

  function dragHandlers(source) {
    let { dndtype: dndType, type, tabindex: tabIndex } = source.dataset;

    let mouseDownTimeOut = null;
    let clickAllowed = true;

    const onMouseDown = (event) => {
      // if source is tab and its' parent pane has only one child, prevent dragging
      if (
        event.target === source &&
        dndType === "tab" &&
        source.dataset.preventdragtab === "true"
      ) {
        return;
      }

      if(parentProps.isEmbeddedGroup){
        return;
      }

      const targetDataset = event.target.dataset;
      const shouldDoPaneDragging =
        event.target !== source &&
        dndType === PANE_TYPE_PANE &&
        targetDataset.preventdragtab === "true";

      if (
        (event.target === source || shouldDoPaneDragging) &&
        (event.button === 0 || event.buttons === 1 || event.which === 1)
      ) {
        if (!dndContext.dnd.isMouseDown) {
          clickAllowed = true;
          mouseDownTimeOut = setTimeout(() => {
            const canDrag = handleDragMouseDown(
              source,
              event.clientX,
              event.clientY
            );
            if (canDrag) {
              window.addEventListener("mousemove", onWindowMouseMove);
              // clickAllowed = false;
            }

            stopDragMouseOverListener();
          }, 120);
          window.addEventListener("mouseup", onWindowMouseUp);
          startDragMouseOverListener(event.target);
        }
      }
    };

    // when mouse down on draggable element, there's a delay before start dragging (120ms)
    // in that time, need to get track of where the mouse is to update style on create dnd source proxy
    let stopMouseOverTimeout = null;

    const onDragMouseOver = (event: MouseEvent) => {
      mouseDragOverElement = event.target as HTMLElement;
    };

    const startDragMouseOverListener = (mouseDownTarget: HTMLElement) => {
      mouseDragOverElement = mouseDownTarget;
      window.addEventListener("mouseover", onDragMouseOver);
    };

    const stopDragMouseOverListener = (onMouseUp?: boolean) => {
      if (onMouseUp) {
        if (stopMouseOverTimeout) {
          clearTimeout(stopMouseOverTimeout);
          stopMouseOverTimeout = null;
        }

        mouseDragOverElement = null;
        window.removeEventListener("mouseover", onDragMouseOver);
        return;
      }

      if (dndContext.dnd.isMouseDown && dndContext.dnd.sourceProxy) {
        if (dndContext.dnd.sourceProxy.dataset.initcheckontabs === "true") {
          mouseDragOverElement = null;
          window.removeEventListener("mouseover", onDragMouseOver);
        } else {
          stopMouseOverTimeout = setTimeout(() => {
            const sourceProxy = dndContext.dnd.sourceProxy;
            const isInitCheckOnTabs =
              sourceProxy.dataset.initcheckontabs === "true";

            if (
              !isInitCheckOnTabs &&
              dndType === "tab" &&
              mouseDragOverElement
            ) {
              if (
                mouseDragOverElement.closest(".simple-tabs .tabs-bar-container")
              ) {
                sourceProxy.classList.add("on-tabs");
              } else {
                sourceProxy.classList.remove("on-tabs");
              }

              sourceProxy.dataset.initcheckontabs = "true";
            }

            stopMouseOverTimeout = null;
            mouseDragOverElement = null;
            window.removeEventListener("mouseover", onDragMouseOver);
          }, 10);
        }
      }
    };

    const onMouseUp = (event) => {
      // if (dndContext.dnd.isMouseDown) {
      //   event.preventDefault();
      //   event.stopPropagation();
      //   onWindowMouseUp(event);
      // }
    };
    const onMouseClick = (event) => {
      if (clickAllowed) {
        if (type === "tab-closed") {
          panesContext.expand(pane, tabIndex);
        }
      } else {
        clickAllowed = true;
      }
    };

    const onWindowMouseMove = (event) => {
      if (dndContext.dnd.isMouseDown) {
        handleDragMouseMove(event.clientX, event.clientY);
      }
    };
    const onWindowMouseUp = (event) => {
      const currentWindow = window as any;

      clearTimeout(mouseDownTimeOut);
      stopDragMouseOverListener(true);

      if (dndContext.dnd.isMouseDown && !currentWindow.DRAG_DEBUG) {
        handleDragMouseUp();
      }

      window.removeEventListener("mousemove", onWindowMouseMove);
      window.removeEventListener("mouseup", onWindowMouseUp);
    };

    tabIndex = parseInt(tabIndex);

    source.addEventListener("mousedown", onMouseDown);
    source.addEventListener("mouseup", onMouseUp);
    source.addEventListener("click", onMouseClick);
    return {
      destroy() {
        source.removeEventListener("mousedown", onMouseDown);
        source.removeEventListener("mouseup", onMouseUp);
        source.removeEventListener("click", onMouseClick);
      },
    };
  }

  /** Hnadle Mouse Mover on Tabs */
  /*******************************/

  function onTabMove(onTabs, tabMove = null) {
    const sourceProxy = dndContext.dnd.sourceProxy;

    if (onTabs && !dndContext.to.onTabs) {
      // dropArea = CENTER;
      // setDNDTo(
      //   {},
      //   {
      //     clear: true,
      //   }
      // );
      dndContext.change(
        {
          edgeDropArea: "none",
          onTabs,
        },
        {
          edgeDropArea: "none",
          onTabs,
        }
      );

      sourceProxy.classList.add("on-tabs");
    }

    if (!onTabs && $activeDrag.onTabs) {
      dropArea = "none";
      dropZone = "none";

      dndContext.change(
        {
          onTabs,
        },
        {
          onTabs,
        }
      );

      sourceProxy.classList.remove("on-tabs");
    }

    if (sourceProxy.dataset.initcheckontabs != "true") {
      sourceProxy.dataset.initcheckontabs = "true";
    }

    if (tabMove !== null) {
      const {
        tabsList,
        tabIndex,
        active,
        dndType,
        dragDummyBounds,
        onTabsNorth,
      } = tabMove;

      const drop: DropInfo = {};
      if (onTabsNorth) {
        if (pane.prev === null || (!isInner && parentProps.isHGroup)) {
          dropArea = NORTH;
          dropZone = NORTH;
          drop.dropArea = NORTH;
        }
      }

      setDNDTo({
        pane,
        paneOrientation,
        isClosed: props.isClosed,
        type: dndType,
        paneIndex,
        tabsList,
        active,
        tabIndex,
        dragDummyBounds,
        onTabs,
        wasOnTabs: onTabs,
        ...drop,
      });
    } else {
      if (dropArea === "none" && $activeDrag.edgeDropArea === "none") {
        setDNDTo(
          {
            onTabs,
            wasOnTabs: dndContext.to.onTabs,
          },
          {
            clear: !onTabs,
          }
        );
      }
    }
  }

  /** Update Drag and Drop Source */
  /*******************************/

  function setDNDFrom(change, arg?: any) {
    const { clear = false } = arg || {};
    dndContext.from = {
      ...dndContext.from,
      ...change,
    };
  }

  /** Update Drop Target */
  /*******************************/

  function setDNDTo(change, arg?: any) {
    const { clear = false } = arg || {};
    const tab = null;

    if (clear) {
      dndContext.to = change;
      // console.groupCollapsed("ContainerPane");
      // console.log("setDNDTo", change);
      // console.groupEnd();
    } else {
      dndContext.to = {
        ...dndContext.to,
        ...change,
      };
      // console.groupCollapsed("ContainerPane");
      // console.log("setDNDTo", change);
      // console.groupEnd();
    }

    setDNDPrevent();
  }

  /** Update Drag and Drop Prevent Status */
  /*****************************************/

  function setDNDPrevent() {
    dndContext.preventDrop = insertDropNo;
    // console.groupCollapsed("ContainerPane");
    // console.log("insertDropNo setDNDPrevent : ", pane.id, insertDropNo);
    // console.groupEnd();
  }

  /** Tabs related methods */
  /*****************************************/

  function onActiveTabChange(event) {
    panesContext.activeTabChange(pane, event.detail.activeTabIndex);
  }

  function getTabProps(tab, props) {
    const tabPane: Pane = tab as Pane;
    if (tabPane !== undefined) {
      props.id = tabPane.content?.view?.id;
      props.name = tabPane.content?.view?.name;
      props.label = tabPane.content?.view?.label;
      props.icon = tabPane.content?.view?.icon;
    }
    return props;
  }

  /** Resize Panel */
  /*******************************/

  function onResize(event) {
    // resizeTimeout = setTimeout(() => {

    // }, 50);
    if (!isInner || (!props.isClosed && !parentProps.isClosed)) {
      const { clientX: x, clientY: y, currentTarget: divider } = event;
      const type = parentProps.isVGroup ? "horizontal" : "vertical";

      transformContext.startResize(
        x,
        y,
        divider,
        pane,
        paneIndex,
        type,
        false,
        () => {
          // toggleTabs();
          clearTimeout(resizeTimeout);
        }
      );
    }
  }

  function onResizeEqual(event) {
    clearTimeout(resizeTimeout);
    if (!isInner || (!props.isClosed && !parentProps.isClosed)) {
      const { clientX: x, clientY: y, currentTarget: divider } = event;
      const type = parentProps.isVGroup ? "horizontal" : "vertical";

      transformContext.startResize(
        x,
        y,
        divider,
        pane,
        paneIndex,
        type,
        true,
        () => {
          // toggleTabs();
        }
      );
    }
  }

  /** Respond to Window Resize */
  /*******************************/

  function handleWindowResize(node) {
    if (!isWindowResizing) {
      isWindowResizing = true;
    }
    if (!windowResizeTimeOut) {
      windowResizeTimeOut = setTimeout(() => {
        windowResizeTimeOut = null;
        isWindowResizing = false;
        //paneSizeNow = null;
      }, 1500);
    }

    // paneSizeNow = {
    //   width: node.clientWidth,
    //   height: node.clientHeight,
    // };
  }

  /** Receive Updates from children */
  /*******************************/

  function onChildUpdate(status) {
    if (hasChildren && allowChildUpdates) {
      childUpdates++;
      if (props.isHGroup) {
        calculatedMinSize += status.paneMinSize + DIVIDER_SIZE;
      } else {
        calculatedMinSize = Math.max(status.paneMinSize, calculatedMinSize);
      }
      if (childUpdates === childCount) {
        // console.groupCollapsed("ContainerPane");
        // console.log("onChildUpdate ", pane.id, "minsize", calculatedMinSize);
        // console.groupEnd();
        allowChildUpdates = false;
        if (typeof updateParent === "function") {
          updateParent({
            id: pane.id,
            paneMinSize: calculatedMinSize,
          });
        }
        paneMinSize = calculatedMinSize;
      }
    }
  }

  /** Handle component events */
  /*******************************/

  onMount(() => {});

  beforeUpdate(() => {
    if (hasChildren) {
      childUpdates = 0;
      calculatedMinSize = 0;
      allowChildUpdates = true;
    }
  });

  afterUpdate(() => {
    // console.groupCollapsed("ContainerPane");
    // console.log(
    //   "Pane updated :::",
    //   pane.id,
    //   pane.props.paneType,
    //   pane.props.groupType,
    //   pane.placement,
    //   pane
    // );
    // console.groupEnd();
    // if (settingx && settingx.tabs && settingx.tabs.length) {
    //   console.log(settingx.tabs);
    // }
    // console.log(pane.placement);
    // console.log(paneOrientation);
    // console.log(props.isMovedPane);
    if (
      props.isMovedPane &&
      paneElement &&
      paneElement.classList.contains("zero-size") &&
      paneOpenTimeOut === null
    ) {
      paneOpenTimeOut = setTimeout(() => {
        paneElement.classList.add("moved-pane");
        paneElement.classList.remove("zero-size");
        paneOpenTimeOut = null;
      }, 10);
      setTimeout(() => {
        panesContext.clearMovedPane(pane);
      }, 300);
    }

    if ($activeDrag.toPane !== pane.id && newPanes.length > 0) {
      newPanes = [];
    }

    if (!hasChildren && typeof updateParent === "function") {
      updateParent({
        id: pane.id,
        paneMinSize,
      });
    }
  });

  /** Build Pane Styles */
  /*******************************/

  function getStyle(type, activeDrag) {
    if (type === PANE_TYPE_PANE) {
      return clsx(
        `pane ${paneOrientation}`,
        parentProps.isTabsGroup && "pane-tabbed",
        isClosed && "closed",
        isAutosize && (!isClosed || parentProps?.isClosed)
          ? "auto-size"
          : "normal-size",
        isInner && "inner",
        isLeftOrRight && "no-top-bottom-border",
        isContainerCenter && "no-left-right-border",
        isContainerCenterBottom && "pane-center-bottom",
        isContainerCenterMain && "pane-container-center-main",
        pane.next === null && "last-pane",
        props.noBorder === true && "no-border",
        props.isMovedPane && "zero-size",
        props.noOverflow && "no-overflow",
        activeDrag.isMouseDown && "active-drag",
        paneElement != null && paneElement === activeDrag.source && "dnd-source"
      );
    } else if (type === PANE_TYPE_GROUP) {
      return clsx(
        `pane pane-group`,
        parentProps.isTabsGroup && "pane-tabbed",
        isClosed && "closed",
        props.isHGroup && "h-group",
        props.isVGroup && "v-group",
        parentProps.isHGroup && props.isTabsGroup && "vertical-tabs",
        parentProps.isVGroup && props.isTabsGroup && "horizontal-tabs",
        props.isFixedGroup && "fixed-group",
        props.isCustomGroup && "custom-group",
        parentProps.isFixedGroup && "fixed-item",
        props.isMovedPane && "zero-size",
        isAutosize && (!isClosed || parentProps?.isClosed)
          ? "auto-size"
          : "normal-size",
        isContainerCenterBottom && "pane-center-bottom",
        pane.next === null && "last-pane",
        paneElement != null && paneElement === activeDrag.source && "dnd-source"
      );
    }
  }

  /** Reactive Variables */
  /*******************************/

  let parent: Pane;

  let props: PaneProps;
  let content: PaneContent;

  let parentProps: PaneProps;

  let dropNorth = false;
  let dropSouth = false;
  let dropWest = false;
  let dropEast = false;

  let dropSouthEdge = false;
  let dropWestEdge = false;
  let dropEastEdge = false;
  let dropEdge = false;

  let disabledTooltip = true;

  let children: Pane[] = [];
  let hasChildren = false;
  let childCount = 0;

  let panesList: Pane[] = [];
  let hasTabs = false;
  let activeIndex = 0;

  let prev: Pane;
  let next: Pane;

  let prevProps: PaneProps;
  let nextProps: PaneProps;

  let dividerOrientation: string;

  let isClosed: boolean;

  let paneSize: string;
  let paneMinSize: number;

  let borderAdjust: number;

  let paneOrientation: string;

  let isLeft: boolean;
  let isRight: boolean;
  let isLeftOrRight: boolean;

  let isLeftInner: boolean;
  let isRightInner: boolean;
  let isLeftOrRightInner: boolean;

  let isContainer: boolean;
  let isContainerCenter: boolean;
  let isContainerCenterMain: boolean;
  let isContainerCenterBottom: boolean;
  let isContainerCenterBottomInner: boolean;
  let isInner: boolean;

  let isAutosize: boolean;

  let paneWidth: string;
  let paneHeight: string;

  let minWidth: string;
  let minHeight: string;

  // let marginLeft = `${isContainerCenterBottom ? -DIVIDER_SIZE : 0}px`;
  // let marginRight = `${isContainerCenterBottom ? -DIVIDER_SIZE : 0}px`;

  let marginLeft: string;
  let marginRight: string;

  let showGrip: boolean;

  let dropArea: string;
  let dropZone: string;
  let dropAreaHidden: boolean;

  let dropAllowed: FlagIndex;
  let hasDropAllowed: boolean;

  let dropDenined: FlagIndex;
  let hasDropDenied: boolean;

  let dropAllowedAll: boolean;

  let dividerDrop: boolean;
  let dividerDropSide: string;

  let insertDropNo: boolean;

  let isWindowResizing: boolean;
  let paneSizeNow;

  let newPanes;

  $: props = pane.props;
  $: paneContent = pane.content;

  $: children = pane.children;
  $: hasChildren = children && children.length > 0;
  $: childCount = hasChildren ? children.length : 0;

  $: panesList = props?.groupType === PANE_GROUP_TABS ? pane.children : [];
  $: hasTabs = panesList !== undefined && panesList.length > 1;
  $: activeIndex = props.activeChild;

  $: parent = {
    id: undefined,
    placement: undefined,
    type: undefined,
  };
  $: {
    if (parent) {
      parent = pane.parent;
    }
  }
  $: parentProps = {};
  $: {
    if (parent && parent.props !== undefined) {
      parentProps = parent.props;
    }
  }

  $: prev = pane.prev;
  $: next = pane.next;

  $: prevProps = prev ? prev.props : null;
  $: nextProps = next ? next.props : null;

  $: dividerOrientation = parentProps.isHGroup ? "vertical" : "horizontal";

  $: isClosed =
    props.isClosed ||
    (parent?.type === PANE_TYPE_GROUP && parentProps.isClosed === true);

  $: borderAdjust = 0;
  $: {
    if (parent && parent.children && parent.children.length > 0) {
      borderAdjust =
        ((parent.children.length - 1) * DIVIDER_SIZE) / parent.children.length;
    }
  }

  $: paneOrientation = (() => {
    const vRegExp = new RegExp(
      `${PLACEMENT_CONTAINER_LEFT}|${PLACEMENT_CONTAINER_RIGHT}`
    );
    const hRegExp = new RegExp(`${PLACEMENT_CONTAINER_CENTER}`);
    if (vRegExp.test(pane.placement)) {
      return "vertical";
    } else if (hRegExp.test(pane.placement)) {
      return "horizontal";
    }
    return "";
  })();

  $: isLeft = pane.placement === PLACEMENT_CONTAINER_LEFT;
  $: isRight = pane.placement === PLACEMENT_CONTAINER_RIGHT;
  $: isLeftOrRight = isLeft || isRight;

  $: isLeftInner = pane.placement === PLACEMENT_CONTAINER_LEFT_INNER;
  $: isRightInner = pane.placement === PLACEMENT_CONTAINER_RIGHT_INNER;
  $: isLeftOrRightInner = isLeftInner || isRightInner;

  $: isContainer = pane.placement === PLACEMENT_CONTAINER;
  $: isContainerCenter = pane.placement === PLACEMENT_CONTAINER_CENTER;
  $: isContainerCenterMain = pane.placement === PLACEMENT_CONTAINER_CENTER_MAIN;
  $: isContainerCenterBottom =
    pane.placement === PLACEMENT_CONTAINER_CENTER_BOTTOM;
  $: isContainerCenterBottomInner =
    pane.placement === PLACEMENT_CONTAINER_CENTER_BOTTOM + PLACEMENT_INNER;
  $: isInner = /:inner/.test(pane.placement);

  $: isAutosize =
    pane.props.hasAutosize ||
    pane.size === "auto" ||
    !parent ||
    (parent.placement !== PLACEMENT_CONTAINER &&
      parent.placement !== PLACEMENT_CONTAINER_CENTER);

  $: {
    paneSize = `${parentProps.isHGroup ? PANE_MIN_WIDTH : PANE_MIN_HEIGHT}px`;
    if (isClosed && !parentProps.isClosed) {
      paneSize = `${PANE_CLOSED_SIZE}px`;
    } else {
      if (pane.size === "auto" || pane.size === undefined) {
        // paneSize = "auto";
      } else {
        if (pane.size !== undefined && pane.size !== "auto") {
          paneSize = `calc(${pane.size}px - ${borderAdjust}px)`;
        }
        if (/%$/.test(pane.size as string)) {
          paneSize = `calc(${pane.size} - ${borderAdjust}px)`;
        }
      }
    }
  }
  $: paneMinSize = parentProps.isHGroup ? PANE_MIN_WIDTH : PANE_MIN_HEIGHT;

  // $: paneWidth =
  //   parentProps.isHGroup === true
  //     ? paneSize
  //     : `calc(100% + ${isContainerCenterBottom ? 2 * DIVIDER_SIZE : 0}px)`;
  $: paneWidth = parentProps.isHGroup === true ? paneSize : `100%`;
  $: paneHeight = parentProps.isVGroup === true ? paneSize : "100%";

  $: minWidth = isClosed
    ? "unset"
    : props.minWidth !== undefined && paneMinSize <= props.minWidth
      ? `${props.minWidth}px`
      : `${props.isVGroup ? PANE_MIN_WIDTH : paneMinSize}px`;
  $: minHeight = isClosed
    ? "unset"
    : props.minHeight !== undefined && paneMinSize <= props.minHeight
      ? `${props.minHeight}px`
      : `${props.isHGroup ? PANE_MIN_HEIGHT : paneMinSize}px`;

  $: {
    if(parentProps.isCustomGroup){
      minWidth = "";
      minHeight = "";
    }
  }

  // $: marginLeft = `${isContainerCenterBottom ? -DIVIDER_SIZE : 0}px`;
  // $: marginRight = `${isContainerCenterBottom ? -DIVIDER_SIZE : 0}px`;

  $: marginLeft = `0px`;
  $: marginRight = `0px`;

  $: showGrip = false;

  $: dropArea = dropArea || "none";
  $: dropZone = "none";
  $: dropAreaHidden = false;

  $: dropAllowed = props.dropAllowed || {};
  $: dropDenined = props.dropDenied || {};

  $: hasDropAllowed = typeof props.dropAllowed === "object";
  $: hasDropDenied = !hasDropAllowed && typeof props.dropDenied === "object";

  $: dropAllowedAll = !hasDropAllowed && !hasDropDenied;

  $: dividerDrop = false;
  $: dividerDropSide = "none";

  $: {
    // if (
    //   pane.placement === PLACEMENT_CONTAINER_LEFT ||
    //   pane.placement ===
    //     `${PLACEMENT_CONTAINER_CENTER_BOTTOM}${PLACEMENT_INNER}`
    // ) {
    //   dividerDropSide = "left-after";
    // } else if (
    //   pane.placement === PLACEMENT_CONTAINER_RIGHT ||
    //   pane.placement === PLACEMENT_CONTAINER_CENTER
    // ) {
    //   dividerDropSide = "right-before";
    // } else if (
    //   pane.placement === PLACEMENT_CONTAINER_CENTER_BOTTOM ||
    //   pane.placement === PLACEMENT_BOTTOM ||
    //   pane.placement === PLACEMENT_CONTAINER_CENTER_MAIN ||
    //   pane.placement === `${PLACEMENT_CONTAINER_LEFT}${PLACEMENT_INNER}` ||
    //   pane.placement === `${PLACEMENT_CONTAINER_RIGHT}${PLACEMENT_INNER}`
    // ) {
    //   dividerDropSide = "bottom-before";
    // }
    if (parentProps.isHGroup) {
      dividerDropSide = "left-after";
    } else if (parentProps.isVGroup) {
      dividerDropSide = "bottom-before";
    }
  }

  $: isWindowResizing = false;
  $: paneSizeNow = null;

  $: newPanes = newPanes || [];

  $: dropNorth =
    dropArea === NORTH &&
    dropZone === NORTH &&
    (!pane.prev || parentProps.isHGroup);
  $: dropSouth =
    dropArea === SOUTH &&
    dropZone === SOUTH &&
    (!pane.next || parentProps.isHGroup);
  $: dropWest =
    dropArea === WEST &&
    dropZone === WEST &&
    (!pane.prev || parentProps.isVGroup);
  $: dropEast =
    dropArea === EAST &&
    dropZone === EAST &&
    (!pane.next || parentProps.isVGroup);

  $: dropSouthEdge =
    $activeDrag.edgeDropArea === SOUTH_EDGE &&
    isContainerCenter &&
    !pane.next &&
    dndContext.dnd.currentPane?.id === pane.id;
  $: dropWestEdge =
    $activeDrag.edgeDropArea === WEST_EDGE &&
    isContainerCenterMain &&
    !pane.prev &&
    dndContext.dnd.currentPane?.id === pane.id;
  $: dropEastEdge =
    $activeDrag.edgeDropArea === EAST_EDGE &&
    isContainerCenterMain &&
    !pane.next &&
    dndContext.dnd.currentPane?.id === pane.id;

  $: dropEdge =
    (dropSouthEdge && isContainer) ||
    ((dropWestEdge || dropEastEdge) && isContainer);

  $: {
    if (pane.type === PANE_TYPE_PANE) {
      disabledTooltip =
        !insertDropNo ||
        dividerDrop ||
        (!dropNorth && !dropSouth && !dropWest && !dropEast);
    } else {
      disabledTooltip = !dropEdge || !$activeDrag.insertDropNo || dividerDrop;
    }
  }

  $: {
    // console.log("pane ...", pane);
  }
</script>

{#if pane !== undefined}
  {#if pane.type === PANE_TYPE_PANE}
    <div
      id={pane.id}
      bind:this={paneElement}
      data-type={PANE_TYPE_PANE}
      data-dndtype={PANE_TYPE_PANE}
      data-placement={pane.placement}
      class={getStyle(PANE_TYPE_PANE, $activeDrag)}
      style={`width: ${paneWidth}; height: ${paneHeight}; margin-left: ${marginLeft}; margin-right: ${marginRight}; min-width:${minWidth}; min-height:${minHeight}; --drop-size: ${EDGE_THRESHOLD}px`}
      use:watchResize={handleWindowResize}
      use:addPaneHandlers
      use:globalContext.actions.paneAction={[pane]}
    >
      <!-- <div class="size-info">
        <div
          class="size-info-text"
          class:info-shown={!isClosed &&
            isWindowResizing &&
            paneSizeNow !== null}
        >
          {#if paneSizeNow !== null}
            {paneSizeNow.width}x{paneSizeNow.height}
          {/if}
        </div>
      </div> -->

      <!-- <div class="pane-single">SINGLE</div> -->
      <svelte:component
        this={component}
        pane={{
          ...pane,
        }}
      />
      <div
        class="drop-zone"
        class:none={dropArea === "none" ||
          !$activeDrag.isMouseDown ||
          (!isClosed && $activeDrag.onTabs)}
        class:north={dropArea === NORTH && (isClosed || !hasTabs)}
        class:south={dropArea === SOUTH}
        class:west={dropArea === WEST}
        class:east={dropArea === EAST}
        use:dropZoneHandler
      />
      <div
        class="drop-area"
        class:none={dropArea === "none" || !$activeDrag.isMouseDown}
        class:north={dropNorth}
        class:south={dropSouth}
        class:west={dropWest}
        class:east={dropEast}
        class:south-edge={dropSouthEdge}
        class:west-edge={dropWestEdge}
        class:east-edge={dropEastEdge}
        class:center={dropArea === CENTER}
        class:hide={dropAreaHidden}
        class:drop-limited={(paneOrientation === "horizontal" &&
          (dropArea === NORTH || dropArea === SOUTH)) ||
          (paneOrientation === "vertical" &&
            (dropArea === WEST || dropArea === EAST))}
        class:no-drop={insertDropNo && !dividerDrop}
        use:globalContext.actions.dropAreaAction={[
          pane,
          disabledTooltip,
          dropArea,
          isContainerCenter,
        ]}
      />
    </div>
    {#if pane.next && (parentProps.isHGroup || parentProps.isVGroup)}
      <PaneDivider
        {pane}
        orientation={dividerOrientation}
        isDropping={$activeDrag.isMouseDown || dividerDrop}
        isPaneClosed={props.isClosed}
        isPrevClosed={prevProps && prevProps.isClosed}
        isNextClosed={nextProps && nextProps.isClosed}
        isNoResize={isInner && props.isClosed}
        dropSide={dividerDrop ? dividerDropSide : "none"}
        dropNotAllowed={insertDropNo}
        class={clsx(
          "after-pane",
          $activeDrag.onTabs ? "pointer-events-none" : ""
        )}
        data-dndtype="after-pane"
        {dividerHandlers}
        on:mousedown={onResize}
        on:dblclick={onResizeEqual}
      />
    {/if}
  {:else if pane.type === PANE_TYPE_GROUP}
    <div
      id={pane.id}
      bind:this={paneElement}
      data-type={PANE_TYPE_GROUP}
      data-dndtype="pane-group"
      data-placement={pane.placement}
      class={getStyle(PANE_TYPE_GROUP, $activeDrag)}
      style={`width: ${paneWidth};
              height: ${paneHeight};
              margin-left: ${marginLeft};
              margin-right: ${marginRight};
              min-width:${minWidth};
              min-height:${minHeight};
              --drop-size: ${EDGE_THRESHOLD}px;
              --drop-size-north: ${EDGE_THRESHOLD_NORTH}px`}
      use:addPaneHandlers
      use:globalContext.actions.paneAction={[pane]}
    >
      {#if props?.isHGroup || props?.isVGroup}
        {#each pane.children as innerPane, i (innerPane.id)}
          <svelte:component
            this={paneComponent}
            {customPaneComponent}
            {paneComponent}
            {component}
            pane={innerPane}
            paneIndex={i}
            updateParent={onChildUpdate}
          />
        {/each}
      {:else if props?.isTabsGroup}
        {#if isClosed === true}
          {#if isLeftOrRight || isLeftOrRightInner}
            <div
              class={clsx(
                "panel-open-box",
                (isLeftOrRight || isLeftOrRightInner) &&
                  "panel-open-box-left-right",
                (isLeft || isLeftInner) && "panel-open-box-left",
                (isRight || isRightInner) && "panel-open-box-right",
                // (isContainerCenterBottom || isContainerCenterBottomInner) &&
                //   "panel-open-box-bottom"
                isLeftOrRight || (isLeftOrRightInner && paneIndex === 0)
                  ? ""
                  : "panel-open-box-hidden",
                paneElement === $activeDrag.source && "hidden"
              )}
            >
              <div
                class="panel-collapse-icon"
                on:click={() => {
                  panesContext.expand(pane);
                }}
              >
                <Icon
                  icon="panel-collapse"
                  width="8"
                  height="8"
                  fill="none"
                  class={clsx(
                    COLLAPSE_ICON_CLASS,
                    (isRight || isRightInner) && "open-right"
                    // (isContainerCenterBottom || isContainerCenterBottomInner) &&
                    //   "open-bottom"
                  )}
                />
              </div>
            </div>
          {/if}

          <div
            class={clsx(
              "empty-space start",
              !dropAreaHidden &&
                ((paneOrientation === "vertical" && dropArea === NORTH) ||
                  (paneOrientation === "horizontal" && dropArea === WEST)) &&
                "no-show"
            )}
          />

          <div
            class={clsx(
              `closed-pane ${paneOrientation}`
              // paneDragElement === $activeDrag.source && "dnd-source"
            )}
            use:globalContext.actions.paneAction={[pane]}
            bind:this={paneDragElement}
          >
            <!-- {#if props.isFixed !== true}
              <FlexPaneGrip
                class=""
                orientation={paneOrientation}
                opened={false}
                dragSource={$activeDrag.source}
                data={{
                  "data-dndtype": PANE_TYPE_PANE,
                  "data-type": "pane-closed",
                }}
                {dragHandlers}
              />
            {/if} -->

            {#if panesList instanceof Array}
              <PaneTabs
                {pane}
                tabs={panesList}
                newTabs={newPanes}
                mode="closed"
                paneData={{
                  "data-dndtype": PANE_TYPE_PANE,
                  "data-type": "pane-closed",
                }}
                tabsData={panesList.map((pane, i) => ({
                  "data-dndtype": "tab",
                  "data-type": "tab-closed",
                  "data-index": i,
                  "data-tabindex": i,
                  "data-tabname": pane.content?.view?.name,
                  "data-tablabel": pane.content?.view?.label,
                }))}
                newTabsData={newPanes.map((pane, i) => ({
                  "data-dndtype": "tab",
                  "data-type": "tab-closed",
                  "data-index": panesList.length + i,
                  "data-tabindex": panesList.length + i,
                  "data-tabname": pane.content?.view?.name,
                  "data-tablabel": pane.content?.view?.label,
                }))}
                {activeIndex}
                {paneIndex}
                {isInner}
                showIcon={true}
                dragSource={(dropArea === "none" ||
                  (dropArea === CENTER && $activeDrag.onTabs)) &&
                $activeDrag.edgeDropArea === "none"
                  ? $activeDrag.source
                  : null}
                dragSourceProxy={$activeDrag.sourceProxy}
                dragType={$activeDrag.type}
                tabType="tab-closed"
                isMouseDown={(dropArea === "none" ||
                  (dropArea === CENTER && $activeDrag.onTabs)) &&
                  $activeDrag.isMouseDown}
                isDropTarget={dropArea === CENTER}
                iconSize={PANEL_ICON_SIZE}
                tabLabelClass={""}
                {dragHandlers}
                {onTabMove}
                {paneOrientation}
                {getTabProps}
                on:tabchange={onActiveTabChange}
                let:activeTab
              />
            {/if}
          </div>
          <div class={`closed-pane-filler ${paneOrientation}`} />
          <div
            class={clsx(
              "empty-space end",
              !dropAreaHidden &&
                ((paneOrientation === "vertical" && dropArea === SOUTH) ||
                  (paneOrientation === "horizontal" && dropArea === EAST)) &&
                "no-show"
            )}
          />
          {#if isContainerCenterBottom || isContainerCenterBottomInner}
            <div
              class={clsx(
                "panel-open-box",
                // isLeft && "panel-open-box-left",
                // isRight && "panel-open-box-right",
                // (isLeft || isRight) && "panel-open-box-left-right",
                (isContainerCenterBottom || isContainerCenterBottomInner) &&
                  "panel-open-box-bottom",
                isContainerCenterBottom ||
                  (isContainerCenterBottomInner && pane.next === null)
                  ? ""
                  : "panel-open-box-hidden",
                paneElement === $activeDrag.source && "hidden"
              )}
            >
              <div
                class="panel-collapse-icon"
                on:click={() => {
                  panesContext.expand(pane);
                }}
              >
                <Icon
                  icon="panel-collapse"
                  width="8"
                  height="8"
                  fill="none"
                  class={clsx(
                    COLLAPSE_ICON_CLASS,
                    // isRight && "open-right"
                    (isContainerCenterBottom || isContainerCenterBottomInner) &&
                      "open-bottom"
                  )}
                />
              </div>
            </div>
          {/if}
        {:else if panesList instanceof Array}
          <!-- {#if props.isFixed !== true}
              <div class={clsx(`tabs-open-grip`, showGrip && "show-grip")}>
                <FlexPaneGrip
                  class={""}
                  opened={true}
                  dragSource={$activeDrag.source}
                  data={{
                    "data-dndtype": PANE_TYPE_PANE,
                    "data-type": "pane-open",
                  }}
                  {dragHandlers}
                />
              </div>
            {/if} -->
          <PaneTabs
            {pane}
            tabs={panesList}
            newTabs={newPanes}
            paneData={{
              "data-dndtype": PANE_TYPE_PANE,
              "data-type": "pane-open",
            }}
            tabsData={panesList.map((pane, i) => ({
              "data-dndtype": "tab",
              "data-type": "tab-open",
              "data-index": i,
              "data-tabindex": i,
              "data-tabname": pane.content?.view?.name,
              "data-tablabel": pane.content?.view?.label,
            }))}
            newTabsData={newPanes.map((pane, i) => ({
              "data-dndtype": "tab",
              "data-type": "tab-closed",
              "data-index": panesList.length + i,
              "data-tabindex": panesList.length + i,
              "data-tabname": pane.content?.view?.name,
              "data-tablabel": pane.content?.view?.label,
            }))}
            {activeIndex}
            {paneIndex}
            {isInner}
            dragSource={$activeDrag.source}
            dragSourceProxy={$activeDrag.sourceProxy}
            dragType={$activeDrag.type}
            tabType="tab-open"
            isMouseDown={$activeDrag.isMouseDown}
            isDropTarget={dropArea === CENTER}
            iconSize={PANEL_ICON_SIZE}
            tabsClass={TABS_CLASS}
            tabsListClass={TABLIST_CLASS}
            tabClass={""}
            tabLabelClass={""}
            {dragHandlers}
            {dropZoneHandler}
            {onTabMove}
            {paneOrientation}
            {getTabProps}
            on:tabchange={onActiveTabChange}
            let:activeTab
          >
            <div slot="activeTab" class={TAB_ACTIVE_CLASS}>
              <svelte:component
                this={paneComponent}
                {customPaneComponent}
                {paneComponent}
                {component}
                pane={panesList[activeIndex]}
                paneIndex={activeIndex}
                updateParent={onChildUpdate}
              />
              <!-- <svelte:component
                  this={component}
                  pane={{
                    ...pane,
                    content: {
                      ...pane.content,
                      view: activeTab,
                    },
                  }}
                /> -->
            </div>

            <div
              class={clsx(
                "pane-options",
                PANE_OPTIONS_CLASS,
                (isContainerCenterBottom || isContainerCenterBottomInner) &&
                  "w-3",
                !isInner ||
                  (isLeftOrRightInner && paneIndex === 0) ||
                  (isContainerCenterBottomInner && pane.next === null)
                  ? ""
                  : "pane-options-hidden"
              )}
              slot="tabsOptions"
            >
              {#if pane.props.isClosable && !pane.props.isFixed}
                <div
                  class={clsx(
                    "panel-collapse-box",
                    (isContainerCenterBottom || isContainerCenterBottomInner) &&
                      "bottom"
                  )}
                >
                  <div
                    class="panel-collapse-icon"
                    on:click={() => {
                      panesContext.collapse(pane);
                    }}
                  >
                    <Icon
                      icon="panel-collapse"
                      width="8"
                      height="8"
                      fill="none"
                      class={clsx(
                        COLLAPSE_ICON_CLASS,
                        (isLeft || isLeftInner) && "collapse-left",
                        (isContainerCenterBottom ||
                          isContainerCenterBottomInner) &&
                          "collapse-bottom"
                      )}
                    />
                  </div>
                </div>
              {/if}

              <!-- <div class="panel-settingx">
                  <Icon
                    icon="panel-settingx"
                    size="14"
                    fill="none"
                    class={SETTINGS_ICON_CLASS}
                  />
                </div> -->
            </div>
          </PaneTabs>
        {:else if paneContent.view !== undefined}
          <!-- {#if props.isFixed !== true}
              <div class={clsx(`view-open-grip`, showGrip && "show-grip")}>
                <FlexPaneGrip class={""} opened={true} />
              </div>
            {/if} -->
          <svelte:component this={component} {pane} />
        {/if}
      {:else if props.isFixedGroup}
        <svelte:component
          this={FixedContainerPane}
          {customPaneComponent}
          {paneComponent}
          {component}
          {pane}
          {paneIndex}
          children={pane.children}
          groupType={props.groupType}
          updateParent={onChildUpdate}
        />
      {:else if props.isEmbeddedGroup}
        <svelte:component
          this={EmbeddedContainerPane}
          {customPaneComponent}
          {paneComponent}
          {component}
          {pane}
          {paneIndex}
          children={pane.children}
          groupType={props.groupType}
          updateParent={onChildUpdate}
        />
      {:else if props.isCustomGroup}
        {#if customPaneComponent !== null}
          <svelte:component
            this={customPaneComponent}
            {customPaneComponent}
            {paneComponent}
            {component}
            {pane}
            {paneIndex}
            children={pane.children}
            groupType={props.groupType}
            updateParent={onChildUpdate}
          />
        {:else}
          {(console.log("Custom Pane Component is null"), "")}
        {/if}
      {/if}
      <!-- {#if props.isHGroup || props.isVGroup || props.isTabsGroup} -->
      <div
        class="drop-zone"
        class:none={dropArea === "none" ||
          !$activeDrag.isMouseDown ||
          (!isClosed && $activeDrag.onTabs)}
        class:north={dropArea === NORTH && isClosed}
        class:south={dropArea === SOUTH}
        class:west={dropArea === WEST}
        class:east={dropArea === EAST}
        use:dropZoneHandler
      />
      <div
        class="drop-area"
        class:none={dropArea === "none" || !$activeDrag.isMouseDown}
        class:north={dropNorth}
        class:south={dropSouth}
        class:west={dropWest}
        class:east={dropEast}
        class:south-edge={dropSouthEdge}
        class:west-edge={dropWestEdge}
        class:east-edge={dropEastEdge}
        class:center={dropArea === CENTER}
        class:hide={dropAreaHidden}
        class:drop-limited={(paneOrientation === "horizontal" &&
          (dropArea === NORTH || dropArea === SOUTH)) ||
          (paneOrientation === "vertical" &&
            (dropArea === WEST || dropArea === EAST))}
        class:no-drop={dropEdge && $activeDrag.insertDropNo && !dividerDrop}
        use:globalContext.actions.dropAreaAction={[
          pane,
          disabledTooltip,
          dropArea,
          isContainerCenter,
        ]}
      />
      <!-- {/if} -->
    </div>
    {#if pane.next && (parentProps.isHGroup || parentProps.isVGroup)}
      <PaneDivider
        {pane}
        isDropping={$activeDrag.isMouseDown || dividerDrop}
        isPaneClosed={props.isClosed}
        isPrevClosed={prevProps && prevProps.isClosed}
        isNextClosed={nextProps && nextProps.isClosed}
        isNoResize={isInner && props.isClosed}
        orientation={dividerOrientation}
        dropSide={dividerDrop ? dividerDropSide : "none"}
        dropNotAllowed={insertDropNo}
        class={clsx(
          "after-group",
          $activeDrag.onTabs ? "pointer-events-none" : ""
        )}
        data-dndtype="after-group"
        {dividerHandlers}
        on:mousedown={onResize}
        on:dblclick={onResizeEqual}
      />
    {/if}
    {#if pane.children !== undefined && pane.children.length > 0}
      {#if props.isTabsGroup && panesList && panesList.length > 0}
        <div class="hidden-holder">
          <svelte:component
            this={PaneTabsDummy}
            bind:dummy={paneDragDummy}
            activeItem={getTabProps(panesList[0], {
              id: "",
              name: "",
              label: "",
              icon: "",
            })}
            activeIndex={0}
            count={panesList.length}
            showIcon={isClosed}
            showLabel={!isClosed}
          />
        </div>
      {/if}
    {/if}
  {/if}
{/if}

<style lang="postcss">
  .pane {
    @apply max-h-full max-w-full relative;
    /* @apply border default-border; */

    /* new design remove all border */
    border: 0px !important;
  }

  /*
    Pane should have box shadow around them but not pane-group,
    because they will stack on each other and make box shadow
    around pane have darker color
  */
  :global(.workbook-sheets) .pane:not(.pane-group) {
    box-shadow: 0px 1px 6px rgba(55, 84, 170, 0.16);
  }

  /* Vertical and horizontal tabs should have box-shadow as well */
  .pane.horizontal-tabs,
  .pane.vertical-tabs {
    box-shadow: 0px 1px 6px rgba(55, 84, 170, 0.16)!important;
  }

  .pane:not(.pane-container-center-main):not(.pane-group):not(.pane-tabbed) {
    box-shadow: 0px 1px 6px rgba(55, 84, 170, 0.16)
  }

  .pane-group.fixed-item {
    box-shadow: 0px 1px 6px rgba(55, 84, 170, 0.16)
  }

  .pane.pane-group {
    @apply flex relative border-none pointer-events-none;
  }

  .pane.pane-group * {
    @apply pointer-events-auto;
  }

  .pane.h-group {
    @apply flex-row;
  }

  .pane.v-group {
    @apply flex-col;
  }

  .pane.fixed-group,
  .pane.tiled-group {
    @apply bg-white;
  }

  .pane.auto-size {
    @apply flex-auto;
  }

  .pane.auto-size-grow {
    @apply flex-none;
    @apply flex-grow;
  }

  .pane.auto-size-shrink {
    @apply flex-none;
    @apply flex-shrink;
  }

  /* .pane.pane-group.auto-size {
    @apply flex-auto;
    /* @apply flex-shrink-0;
  } */

  .pane.no-border {
    border-style: none;
  }

  .pane.no-top-bottom-border {
    @apply border-t-0 border-b-0;
  }

  .pane.no-left-right-border {
    @apply border-l-0 border-r-0;
  }

  .pane.pane-center-bottom {
    /* @apply border-l-0 border-r-0; */
    z-index: 999;
    max-width: none;
  }

  .pane.pane-center-bottom.last-pane {
    @apply border-b-0;
  }

  /* .pane.pane-center-bottom:last-child {

  } */

  .pane.horizontal-tabs.moved-pane,
  .pane.horizontal.moved-pane,
  .pane.vertical.inner.moved-pane {
    -webkit-transition: height 250ms ease;
    -moz-transition: height 250ms ease;
    -o-transition: height 250ms ease;
    transition: height 250ms ease;
  }

  .pane.horizontal-tabs.is-closing,
  .pane.horizontal.is-closing {
    -webkit-transition: height 50ms ease;
    -moz-transition: height 50ms ease;
    -o-transition: height 50ms ease;
    transition: height 50ms ease;
  }

  .pane.horizontal-tabs.zero-size,
  .pane.horizontal.zero-size,
  .pane.vertical.inner.zero-size {
    height: 4px !important;
    min-height: 0px !important;
  }

  .pane.vertical-tabs.moved-pane,
  .pane.vertical.moved-pane,
  .pane.horizontal.inner.moved-pane {
    -webkit-transition: width 250ms ease;
    -moz-transition: width 250ms ease;
    -o-transition: width 250ms ease;
    transition: width 250ms ease;
  }

  .pane.vertical-tabs.is-closing,
  .pane.vertical.is-closing {
    -webkit-transition: width 50ms ease;
    -moz-transition: width 50ms ease;
    -o-transition: width 50ms ease;
    transition: width 50ms ease;
  }

  .pane.vertical-tabs.zero-size,
  .pane.vertical.zero-size,
  .pane.horizontal.inner.zero-size {
    width: 4px !important;
    min-width: 0px !important;
  }

  .pane.closed:not(.inner) {
    flex-shrink: 0;
  }

  .pane.closed.horizontal {
    @apply flex flex-row justify-start items-center;
  }

  .pane.closed.vertical {
    @apply flex flex-col justify-start items-center;
  }

  .pane.closed.horizontal.hidden,
  .pane.closed.vertical.hidden {
    display: none;
  }

  .pane.closed .empty-space {
  }

  .pane.closed.horizontal .empty-space {
    @apply w-0 h-full;
    -webkit-transition: width 150ms ease-out;
    -moz-transition: width 150ms ease-out;
    -o-transition: width 150ms ease-out;
    transition: width 150ms ease-out;
  }

  .pane.closed.horizontal .empty-space.show {
    @apply w-1/2;
    -webkit-transition: width 250ms ease-out 500ms;
    -moz-transition: width 250ms ease-out 500ms;
    -o-transition: width 250ms ease-out 500ms;
    transition: width 250ms ease-out 500ms;
  }

  .pane.closed.vertical .empty-space {
    @apply w-full h-0;
    -webkit-transition: height 150ms ease-out;
    -moz-transition: height 150ms ease-out;
    -o-transition: height 150ms ease-out;
    transition: height 150ms ease-out;
  }

  .pane.closed.vertical .empty-space.show {
    @apply h-1/2;
    -webkit-transition: height 250ms ease-out 500ms;
    -moz-transition: height 250ms ease-out 500ms;
    -o-transition: height 250ms ease-out 500ms;
    transition: height 250ms ease-out 500ms;
  }

  .panel-settings {
    @apply w-6;
    height: 14px;
    padding-left: 5px;
    padding-right: 5px;
  }

  .closed-pane {
    @apply bg-white overflow-hidden flex flex-auto;
  }

  .closed-pane.horizontal {
    @apply w-auto h-full flex-row justify-start items-center border-r-0 pr-8;
  }

  .closed-pane.vertical {
    @apply w-full h-auto flex-col justify-start items-center border-b-0 pb-8;
  }

  /* This is now handled by FlexTabs */
  /* .closed-pane .icons {
    @apply flex w-full;
  }

  .closed-pane .icons.horizontal {
    @apply flex-row justify-start items-center;
  }

  .closed-pane .icons.vertical {
    @apply flex-col justify-start items-center;
  }

  .closed-pane .icons .tabs-list {
    @apply flex justify-start items-center;
  }

  .closed-pane .icons .tabs-list.horizontal {
    @apply h-full flex-row pl-2 mr-1;
  }

  .closed-pane .icons .tabs-list.vertical {
    @apply w-full flex-col pt-2 mb-1;
  }

  .closed-pane .icons .view {
    @apply flex flex-row justify-center;
  }

  .closed-pane .icons .view .view-label {
    @apply ml-1 text-13px leading-6;
  } */

  .closed-pane-filler {
    /* @apply flex-auto bg-white overflow-hidden; */
    @apply hidden;
  }

  .closed-pane-filler.vertical {
    /* @apply w-full flex-row justify-start items-center; */
  }

  .closed-pane-filler.horizontal {
    /* @apply h-full flex-col justify-start items-center; */
  }

  .pane.dnd-source {
    background: rgba(80, 88, 93, 0.06);
    border: 1px solid transparent;
    /* border: 1px dashed rgba(80, 88, 93, 0.2); */
  }

  .tabs-open-grip,
  .view-open-grip {
    @apply absolute left-0 top-0 w-full z-50 pointer-events-none;
    -webkit-transition: opacity 250ms ease-out 250ms;
    -moz-transition: opacity 250ms ease-out 250ms;
    -o-transition: opacity 250ms ease-out 250ms;
    transition: opacity 250ms ease-out 250ms;
  }

  .tabs-open-grip.show-grip,
  .view-open-grip.show-grip {
    @apply pointer-events-auto opacity-100;
  }

  :global(.dnd-source-proxy) {
    opacity: 1;
    pointer-events: none;
    position: absolute;
    /* margin-left: calc(width / 2);
    margin-top: calc(height / 2); */
  }

  :global(.dnd-source-copy) {
    position: absolute;
    left: 0;
    top: 0;
  }

  :global(.pane.dnd-source-copy) {
    z-index: 999;
  }

  :global(.active-drag) {
  }

  :global(.active-drag-item) {
  }

  :global(.dnd-item) {
  }

  .active-drag
    :not(.dnd-target):not(.dnd-item):not(.drop-zone):not(.closed-pane) {
    pointer-events: none;
  }

  .active-drag :global(.dnd-target),
  .active-drag :global(.dnd-item) {
    pointer-events: all;
  }

  /* .closed-pane.horizontal.dnd-source {
    @apply bg-panels-bg;
    background: rgba(80, 88, 93, 0.06);
    border: 1px dashed rgba(80, 88, 93, 0.2);
  }

  .closed-pane.vertical.dnd-source {
    @apply bg-panels-bg;
    background: rgba(80, 88, 93, 0.06);
    border: 1px dashed rgba(80, 88, 93, 0.2);
  }

  .closed-pane.dnd-source > :global(*) {
    visibility: hidden;
  } */

  :global(.pane-closed.dnd-source-proxy),
  :global(.pane-open.dnd-source-proxy) {
    /* @apply bg-white;
    box-shadow: 1px 2px 4px rgba(55, 84, 170, 0.12);
    border-radius: 3px; */
  }

  /* :global(.closed-pane.dnd-source-proxy)
    :global(.dnd-source-copy)
    :global(.pane-grip) {
    visibility: hidden;
  } */

  /* :global(.closed-pane.dnd-source-proxy)
    :global(.dnd-source-copy)
    :global(.open-box) {
    visibility: hidden;
  } */

  /* :global(.closed-pane.dnd-source-proxy) :global(.dnd-source-copy),
  :global(.closed-pane.dnd-source-proxy)
    :global(.dnd-source-copy)
    :global(.tabs-list) {
    background-color: transparent;
  } */

  :global(.dnd-source-copy) :global(.tabs-list) {
    -webkit-transition: all 100ms ease-out;
    -moz-transition: all 100ms ease-out;
    -o-transition: all 100ms ease-out;
    transition: all 100ms ease-out;
    background-color: transparent;
  }

  :global(.pane.dnd-source-copy) :global(.tabs-list) {
    -webkit-transition: transform 100ms ease-out, opacity 100ms ease-out;
    -moz-transition: transform 100ms ease-out, opacity 100ms ease-out;
    -o-transition: transform 100ms ease-out, opacity 100ms ease-out;
    transition: transform 100ms ease-out, opacity 100ms ease-out;
  }

  :global(.pane.dnd-source-copy) :global(.tab-active-content) {
    -webkit-transition: height 100ms ease-out 40ms;
    -moz-transition: height 100ms ease-out 40ms;
    -o-transition: height 100ms ease-out 40ms;
    transition: height 100ms ease-out 40ms;
  }

  :global(.pane.dnd-source-copy) :global(.pane-options),
  :global(.pane.dnd-source-copy) :global(.panel-open-box),
  :global(.pane.dnd-source-copy) :global(.closed-pane) {
    opacity: 0;
  }

  /* :global(.closed-pane.dnd-source-proxy.picked) {
  }

  :global(.closed-pane.dnd-source-proxy.vertical.picked) :global(.tabs-list) {
    transform: translateY(-40px);
    opacity: 0;
  }

  :global(.closed-pane.dnd-source-proxy.horizontal.picked) :global(.tabs-list) {
    transform: translateX(-40px);
    opacity: 0;
  } */

  :global(.pane.dnd-source-copy.picked) :global(.tabs-list) {
    transform: translateX(40px);
    opacity: 0;
  }

  :global(.pane.dnd-source-copy.picked) :global(.tab-active-content) {
    flex-grow: 0;
    flex-shrink: 1;
    height: 0;
  }

  :global(.pane-open.dnd-source-proxy.picked)
    :global(.drag-pane-dummy-open)
    :global(.drag-pane-dummy-tab.dummy-tab-2),
  :global(.pane-closed.dnd-source-proxy.picked)
    :global(.drag-pane-dummy-closed)
    :global(.drag-pane-dummy-tab.dummy-tab-2) {
    transform: translateY(0px);
  }
  :global(.pane-open.dnd-source-proxy.picked)
    :global(.drag-pane-dummy-open)
    :global(.drag-pane-dummy-tab.dummy-tab-3),
  :global(.pane-closed.dnd-source-proxy.picked)
    :global(.drag-pane-dummy-closed)
    :global(.drag-pane-dummy-tab.dummy-tab-3) {
    transform: translateY(0px);
  }

  .pane-closed.dnd-source-proxy.removed,
  .pane-open.dnd-source-proxy.removed,
  :global(.dnd-source-proxy.drag-pane-dummy-main.removed) {
    -webkit-transition: all 100ms ease-out;
    -moz-transition: all 100ms ease-out;
    -o-transition: all 100ms ease-out;
    transition: all 100ms ease-out;
    opacity: 0.4;
  }

  .pane.dnd-source > :global(*) {
    visibility: hidden;
  }

  .pane.dnd-source-proxy {
    @apply border default-border;
    -webkit-transition: transform 60ms ease-out, opacity 60ms ease-out;
    -moz-transition: transform 60ms ease-out, opacity 60ms ease-out;
    -o-transition: transform 60ms ease-out, opacity 60ms ease-out;
    transition: transform 60ms ease-out, opacity 60ms ease-out;
  }

  .pane.dnd-source-proxy :global(*) {
    pointer-events: none;
  }

  .pane.dnd-source-proxy .tabs-open-grip,
  .pane.dnd-source-proxy .view-open-grip {
    @apply pointer-events-none opacity-100;
  }

  .drop-zone {
    @apply absolute pointer-events-none bg-transparent;
    z-index: 999999;
    -webkit-transition: all 250ms ease-out;
    moz-transition: all 250ms ease-out;
    -o-transition: all 250ms ease-out;
    transition: all 250ms ease-out;
    /* background: rgba(80, 88, 93, 1); */
  }
  .drop-zone.none {
    @apply opacity-0 bg-transparent;
    -webkit-transition: none;
    moz-transition: none;
    -o-transition: none;
    transition: none;
  }
  /*
    North dropzone is not required. This
    will be handled by FlexTabs
  */
  .drop-zone.north {
    @apply opacity-100 pointer-events-auto;
    top: 0px;
    left: 0px;
    right: 0px;
    height: var(--drop-size-north);
  }
  .drop-zone.south {
    @apply opacity-100 pointer-events-auto;
    bottom: 0px;
    left: 0px;
    right: 0px;
    height: var(--drop-size);
  }
  .drop-zone.west {
    @apply opacity-100 pointer-events-auto;
    left: 0px;
    top: 0px;
    bottom: 0px;
    width: var(--drop-size);
  }
  .drop-zone.east {
    @apply opacity-100 pointer-events-auto;
    right: 0px;
    top: 0px;
    bottom: 0px;
    width: var(--drop-size);
  }

  .drop-area {
    @apply absolute pointer-events-none bg-transparent opacity-0 z-50;
    border: 4px solid transparent;
    z-index: 9999;
    /* width 250ms ease-out, height 250ms ease-out,
      top 250ms ease-out, left 250ms ease-out, */
    -webkit-transition: opacity 300ms ease-out;
    moz-transition: opacity 300ms ease-out;
    -o-transition: opacity 300ms ease-out;
    transition: opacity 300ms ease-out;
  }
  .drop-area.none {
    border: 4px solid transparent;
    /* -webkit-transition: none;
    moz-transition: none;
    -o-transition: none;
    transition: none; */
  }
  .drop-area.north {
    @apply opacity-100;
    top: 0px;
    left: 0px;
    width: 100%;
    height: 4px;
    /* max-height: 30px; */
    min-height: 4px;
    border: 2px solid #3bc7ff;
    /* background: rgba(80, 88, 93, 0.1); */
  }
  .drop-area.south {
    @apply opacity-100;
    top: calc(100% - 4px);
    left: 0px;
    width: 100%;
    height: 4px;
    /* max-height: 30px; */
    min-height: 4px;
    border: 2px solid #3bc7ff;
    /* background: rgba(80, 88, 93, 0.1); */
  }
  .drop-area.west {
    @apply opacity-100;
    top: 0px;
    left: 0px;
    width: 4px;
    height: 100%;
    min-width: 4px;
    border: 2px solid #3bc7ff;
    /* background: rgba(80, 88, 93, 0.1); */
  }
  .drop-area.east {
    @apply opacity-100;
    top: 0px;
    left: calc(100% - 4px);
    width: 4px;
    height: 100%;
    min-width: 4px;
    border: 2px solid #3bc7ff;
    /* background: rgba(80, 88, 93, 0.1); */
  }
  .drop-area.center {
    @apply opacity-100;
    top: 0px;
    left: 0px;
    width: 100%;
    height: 100%;
    border: 4px solid #3bc7ff;
    /* background: rgba(80, 88, 93, 0); */
  }

  .drop-area.south-edge {
    @apply opacity-100;
    bottom: 0;
    left: 0px;
    width: 100%;
    height: 4px;
    /* max-height: 30px; */
    min-height: 4px;
    border: 2px solid #3bc7ff;
    background: rgba(80, 88, 93, 0.1);
  }
  .drop-area.west-edge {
    @apply opacity-100;
    top: 0px;
    left: 0;
    width: 4px;
    height: 100%;
    min-width: 4px;
    border: 2px solid #3bc7ff;
    background: rgba(80, 88, 93, 0.1);
  }
  .drop-area.east-edge {
    @apply opacity-100;
    top: 0px;
    right: 0;
    width: 4px;
    height: 100%;
    min-width: 4px;
    border: 2px solid #3bc7ff;
    background: rgba(80, 88, 93, 0.1);
  }

  .drop-area.no-drop {
    border-color: #ea4821;
  }

  /* .drop-area.drop-limited.north,
  .drop-area.drop-limited.south {
    top: -36px;
    height: 36px;
  }
  .drop-area.drop-limited.south {
    top: 100%;
  }

  .drop-area.drop-limited.west,
  .drop-area.drop-limited.east {
    left: -36px;
    width: 36px;
  }
  .drop-area.drop-limited.east {
    left: 100%;
  }

  .pane.closed .drop-area.drop-limited.north,
  .pane.closed .drop-area.drop-limited.south {
    top: -18px;
    height: 18px;
  }
  .pane.closed .drop-area.drop-limited.south {
    top: 100%;
  }

  .pane.closed .drop-area.drop-limited.west,
  .pane.closed .drop-area.drop-limited.east {
    left: -18px;
    width: 18px;
  }
  .pane.closed .drop-area.drop-limited.east {
    left: 100%;
  } */

  .drop-area.hide {
    @apply opacity-0;
  }

  .size-info {
    @apply absolute left-0 top-0 w-full h-full flex justify-center items-center pointer-events-none;
    z-index: 100000;
  }

  .size-info-text {
    @apply text-sm p-2 opacity-0;
    -webkit-transition: opacity 250ms ease-out;
    moz-transition: opacity 250ms ease-out;
    -o-transition: opacity 250ms ease-out;
    transition: opacity 250ms ease-out;
  }

  .size-info-text.info-shown {
    @apply opacity-100;
  }

  .pane.dnd-source :global(.size-info) {
    display: none;
  }

  .panel-collapse-box {
    @apply w-3 h-3 flex flex-row justify-center items-start pointer-events-auto;
    /* padding: 0 1px; */
  }

  .panel-collapse-box.bottom {
    @apply justify-end;
  }

  :global(.collapse-left) {
    transform: rotate(-180deg);
  }

  :global(.collapse-bottom) {
    /* transform: translate(-2px, 0px) rotate(90deg); */
    transform: rotate(90deg);
  }

  .panel-open-box {
    display: flex;
    background-color: transparent;
    pointer-events: none;
  }

  .panel-open-box.hidden {
    display: none;
  }

  .pane-options-hidden :global(*),
  .panel-open-box-hidden :global(*) {
    opacity: 0;
    -webkit-transition: opacity 200ms ease;
    -moz-transition: opacity 200ms ease;
    -o-transition: opacity 200ms ease;
    transition: opacity 200ms ease;
  }

  .pane-options-hidden:hover :global(*),
  .panel-open-box-hidden:hover :global(*) {
    opacity: 100;
  }

  .panel-open-box-left-right {
    width: 100%;
    flex-direction: row;
    position: absolute;
    @apply top-0 left-0 right-0 h-3;
  }

  .panel-open-box-bottom {
    height: 100%;
    flex-direction: column;
    justify-content: flex-start;
    position: absolute;
    top: 0px;
    bottom: 0px;
    right: 0px;
  }

  .panel-open-box-left {
    justify-content: flex-end;
  }

  .panel-open-box-right {
    justify-content: flex-end;
  }

  .panel-collapse-icon {
    @apply w-3 h-3 p-0.5 cursor-pointer;
    /* background-color: transparent; */
    background-color: white;

    /* -webkit-filter: drop-shadow(0px 0px 10px rgba(0, 0, 0, 0.3));
    filter: drop-shadow(0px 0px 10px rgba(0, 0, 0, 0.3)); */

    box-shadow: 0px 0px 10px 0 0 10px rgba(55, 84, 170, 0.2);
    -webkit-box-shadow: 0 0 10px rgba(55, 84, 170, 0.2);
  }

  .panel-collapse-icon:hover {
    /* box-shadow: 0px 1px 6px rgba(55, 84, 170, 0.12); */

    /* -webkit-filter: drop-shadow(0px 0px 5px rgba(0, 0, 0, 0.4));
    filter: drop-shadow(0px 0px 5px rgba(0, 0, 0, 0.4)); */
    /* background-color: white; */

    box-shadow: 0 0 5px rgba(55, 84, 170, 0.3);
    -webkit-box-shadow: 0 0 5px rgba(55, 84, 170, 0.3);
  }

  :global(.open-left) {
    /* margin-left: 3px; */
  }

  :global(.open-right) {
    transform: rotate(-180deg);
    /* margin-right: 3px; */
  }

  :global(.open-bottom) {
    transform: rotate(-90deg);
  }

  .hidden-holder {
    display: none;
  }
</style>
