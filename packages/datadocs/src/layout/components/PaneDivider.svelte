<!-- @component
@packageModule(layout/PaneDivider)
-->
<script lang="ts">
  import clsx from "clsx";
  import { getContext } from "svelte";
  import type { Pane } from "src/layout/types/pane";

  import { DIVIDER_SIZE } from "src/layout/constants/size";
  import { Split } from "src/layout/enums/split";
  import { useLayoutSheet, useLayoutWorkBook } from "src/layout/store/pane";
  import { appDnd } from "src/app/core/global/app-dnd";
  import type { DND } from "src/layout/enums/dnd";
  import { CONTEXT_TYPE } from "../constants/context";
  import { ContextType } from "../enums/context";
  import type { Type } from "../types/context";
  import { useTab } from "./Container/src/ContainerTab/useTab";
  import { Orientation } from "src/layout/enums/divider";
  import Drop from "./DragDrop/src/Drop.svelte";
  import { PANE_MIN_WIDTH } from "../_dprctd/core/constants";
  import { useSplit } from "../store/split/useSplit";
  import { appManager } from "src/app/core/global/app-manager";
  import {
    APP_EVENT_LAYOUT_RESIZE_END,
    APP_EVENT_LAYOUT_RESIZE_START,
  } from "src/app/core/global/app-manager-events";

  export let pane: Pane;

  /**s
   * Internal variable for additional css classes
   */

  let className = "";

  /**
   * Additional css classes to be added PanelsLayout
   * @type { string }
   */
  export { className as class };

  /**
   * Side on which a tab or Pane will be dropped
   * @type { string }
   */
  export let dropSide = "none";

  /**
   * Flag that decides whether drop is allowed or not on this border
   * @type { boolean }
   */
  export let dropNotAllowed = false;

  /**
   * Orientatiion of the divider
   * @type {"horizontal" | "vertical"}
   */
  export let orientation: Orientation = Orientation.HORIZONTAL;

  /**
   * This flag turns true when dragging touches is border
   * @type {boolean}
   */
  export let isDropping = false;

  /**
   * This flag denotes whether the parent Pane is closed or not
   * @type {boolean}
   */
  export let isPaneClosed = false;

  /**
   * This flag denotes whether the previous Pane is closed or not
   * @type {boolean}
   */
  export let isPrevClosed = false;

  /**
   * This flag denotes whether the next Pane is closed or not
   * @type {boolean}
   */
  export let isNextClosed = false;

  /**
   * This flag decides whether Resizing is allowed or not
   * @type {boolean}
   */
  export let isNoResize = false;

  /**
   * Svelte handlers for this dividers
   * @type {() => {}}
   */
  export let dividerHandlers: Function = null;

  export let allowDrop: DND[] = [];

  export let size = DIVIDER_SIZE;

  const type = getContext<Type>(CONTEXT_TYPE);
  const {
    getNextById,
    sync,
    changeSizeByTwoId,
    split,
    isDashboard,
    getById,
    setCollapseById,
    getRealSizeById,
    isTabGroupDeep,
    isCollapse,
    getParentById,
    isHGroup,
    isVGroup,
    isCollaspeGroup,
    getMinSizeById,
  } = type === ContextType.SHEET ? useLayoutSheet() : useLayoutWorkBook();
  const { createTabFromPane } = useTab();
  const { getLevelByPaneIdAndDirection } = useSplit();

  let isVertical: boolean;
  let isHorizontal: boolean;
  let isMoving: boolean = false;

  let noDrop;

  let elementRoot: HTMLElement = null;
  let position: number = 0;
  let allowSplit = false;

  $: isVertical = orientation === "vertical";
  $: isHorizontal = orientation === "horizontal";

  $: noDrop = dropNotAllowed;
  $: isDnd = !!$appDnd;
  $: dragAction = $appDnd?.action;
  $: parent = getParentById(pane.id);

  $: {
    allowSplit = allowDrop.includes(dragAction);
    // if (type === ContextType.WORKBOOK) {
    //   const next = getNextById(pane.id);
    //   allowSplit = allowSplit && !isDashboard(pane) && isDashboard(next);
    // }
  }

  function computeStyle() {
    let style = {};
    const offset = 5;
    let offsetLeft =
      ($appDnd?.data?.offsetLeft || 0) +
      getLevelByPaneIdAndDirection(pane.id, Split.WEST_EDGE) +
      offset;
    let offsetRight =
      ($appDnd?.data?.offsetRight || 0) +
      getLevelByPaneIdAndDirection(pane.id, Split.EAST_EDGE) +
      offset;
    let offsetTop =
      ($appDnd?.data?.offsetTop || 0) +
      getLevelByPaneIdAndDirection(pane.id, Split.NORTH_EDGE) +
      offset;
    let offsetBottom =
      ($appDnd?.data?.offsetBottom || 0) +
      getLevelByPaneIdAndDirection(pane.id, Split.SOUTH_EDGE) +
      offset;

    if (isCollapse(pane) || isCollapse(getNextById(pane.id))) {
      offsetTop = 4;
      offsetBottom = 4;
      offsetLeft = 4;
      offsetRight = 4;
    } else {
      if (isTabGroupDeep(pane)) {
        if (isVertical) {
          offsetRight = offset;
        }
      }
      if (isTabGroupDeep(getNextById(pane.id))) {
        if (isVertical) {
          offsetLeft = offset;
        }
        if (isHorizontal) {
          offsetTop = offset;
        }
      }
    }

    const width = offsetLeft + offsetRight;
    const height = offsetTop + offsetBottom;

    if (isVertical) {
      style = {
        width: `${width}px`,
        left: `-${offsetRight}px`,
        "padding-left": `${offsetRight}px`,
      };
    } else {
      style = {
        height: `${height}px`,
        top: `-${offsetBottom}px`,
        "padding-top": `${offsetBottom}px`,
      };
    }
    // convert style object to string
    return Object.entries(style).reduce((acc, [key, value]) => {
      return `${acc}${key}:${value};`;
    }, "");
  }

  function onMouseDown(event: MouseEvent) {
    // if (isCollapse(pane) || isCollapse(getNextById(pane.id))) {
    //   // todo disable resize when pane is collapsed
    //   return;
    // }
    isMoving = true;
    position = orientation === "vertical" ? event.clientX : event.clientY;
    document.body.style.cursor = orientation === "vertical" ? 'ew-resize' : 'ns-resize';
    appManager.trigger(APP_EVENT_LAYOUT_RESIZE_START, {
      data: event.detail,
    });
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }

  function onMouseMove(event: MouseEvent) {
    if (isMoving) {
      const change =
        (orientation === Orientation.VERTICAL ? event.clientX : event.clientY) -
        position;
      const paneNext = getNextById(pane.id);
      const bound = elementRoot.getBoundingClientRect();
      const dividerPosition =
        orientation === Orientation.VERTICAL ? bound.left : bound.top;
      // Do resize when both pane are not collapsed.
      if (!isCollapse(pane) && !isCollapse(paneNext)) {
        // Do resize when mouse move over the divider.
        if (
          (change > 0 && position > dividerPosition) ||
          (change < 0 && position < dividerPosition)
        ) {
          changeSizeByTwoId({
            leftId: pane.id,
            rightId: paneNext.id,
            change,
            orientation,
          });
        }
      }
      setCollapse({ id: paneNext.id, orientation, event, position: "next" });
      setCollapse({ id: pane.id, orientation, event, position: "prev" });

      position =
        orientation === Orientation.VERTICAL ? event.clientX : event.clientY;
    }
  }

  // This is not working well. Need to fix it.
  function setCollapse({
    id,
    orientation,
    event,
    position,
  }: {
    id: string;
    orientation: Orientation;
    event: MouseEvent;
    position: "prev" | "next";
  }) {
    const element = document.getElementById(id);
    const realSize = getRealSizeById(id, orientation);
    const movedPane = getById(id);

    if (isCollaspeGroup(parent) || type !== ContextType.WORKBOOK) {
      return;
    }
    if (element) {
      const bound = element.getBoundingClientRect();
      const { left, top } = bound;
      const mousePosition =
        orientation === Orientation.VERTICAL ? event.clientX : event.clientY;
      // Collapse pane when mouse move over half MIN_WIDTH.
      const minSize = getMinSizeById(id, orientation);
      if (realSize <= minSize && !isCollapse(movedPane)) {
        const halfPosition =
          orientation === Orientation.VERTICAL
            ? (minSize * 2) / 3 + left
            : (minSize * 2) / 3 + top;
        const isOver =
          position === "prev"
            ? mousePosition < halfPosition
            : mousePosition > halfPosition;
        if (isOver) {
          setCollapseById(id, true);
        }
      } else if (isCollapse(movedPane)) {
        let halfPosition = 0;
        if (position === "prev") {
          halfPosition =
            orientation === Orientation.VERTICAL
              ? (minSize * 2) / 3 + left
              : (minSize * 2) / 3 + top;
        } else {
          halfPosition =
            orientation === Orientation.VERTICAL
              ? left - (minSize * 2) / 3
              : top - (minSize * 2) / 3;
        }
        const isOver =
          position === "prev"
            ? mousePosition > halfPosition
            : mousePosition < halfPosition;
        if (isOver) {
          setCollapseById(id, false);
        }
      }
    }
  }

  function onMouseUp() {
    isMoving = false;
    position = 0;
    document.body.style.cursor = 'default';
    appManager.trigger(APP_EVENT_LAYOUT_RESIZE_END, {});
    sync();
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  }

  function onSplit() {
    let newPane = $appDnd?.data?.pane;
    if (type === ContextType.WORKBOOK) {
      newPane = createTabFromPane({ pane: $appDnd?.data?.pane });
      newPane.size =
        isDashboard(pane) || orientation === Orientation.VERTICAL
          ? "18.46%"
          : "auto";
    }
    split({
      source: newPane,
      targetId: pane.id,
      edge:
        orientation === Orientation.HORIZONTAL
          ? Split.SOUTH_EDGE
          : Split.EAST_EDGE,
    });
    sync();
  }

  $: {
    // console.groupCollapsed("PaneDivider");
    // console.log("paneDivider ", pane.prev, pane.next);
    // console.groupEnd();
  }
</script>

<div
  bind:this={elementRoot}
  class={clsx("pane-divider", className)}
  class:horizontal={orientation === "horizontal"}
  class:vertical={orientation === "vertical"}
  class:resize-horizontal={!isDropping &&
    !isNoResize &&
    !isDnd &&
    orientation === "horizontal"}
  class:resize-vertical={!isDropping &&
    !isNoResize &&
    !isDnd &&
    orientation === "vertical"}
  class:dropping={isDropping}
  class:moving={isMoving}
  class:pane-closed={isPaneClosed}
  class:prev-closed={isPrevClosed}
  class:next-closed={isNextClosed}
  style={`width: ${isVertical ? `${size}px` : "100%"}; height: ${
    isHorizontal ? `${size}px` : "100%"
  }`}
  on:mousedown={onMouseDown}
  on:focus
  on:dblclick
  {...$$restProps}
>
  <!-- use:paneDividerAction={[pane, noDrop, orientation]} -->
  <!-- {#if true}
    <div class="divider-proxy" />
  {/if}
  <div class={`drop-area ${dropSide}`} class:no-drop={noDrop} /> -->
  {#if isDnd && allowSplit}
    <!-- <Drop on:drop={onSplit}>

    </Drop> -->
    <div class="split" style={computeStyle()} on:mouseup={onSplit}>
      <!-- use:globalContext.actions.paneAction={[pane]} -->
      <div
        class="split-line"
        style={`width: ${isVertical ? `${size}px` : "100%"}; height: ${
          isHorizontal ? `${size}px` : "100%"
        }`}
      />
    </div>
  {/if}
</div>

<!-- <svelte:window on:mousemove={onMouseMove} on:mouseup={onMouseUp} /> -->

<style lang="postcss">
  :root {
    --divider-moving-bg: #b9c1c7;
  }
  .pane-divider {
    @apply flex-grow-0 flex-shrink-0 relative bg-gray-200;
  }

  .pane-divider:hover {
    @apply bg-[var(--divider-moving-bg)];
  }

  .pane-divider.horizontal {
  }

  .pane-divider.vertical {
  }

  .pane-divider.resize-horizontal {
    @apply cursor-n-resize;
  }

  .pane-divider.resize-vertical {
    @apply cursor-w-resize;
  }

  .pane-divider.dropping {
    cursor: default;
  }

  .pane-divider.moving {
    @apply bg-[var(--divider-moving-bg)];
  }

  .divider-proxy {
    @apply absolute left-0 right-0 top-0 bottom-0;
  }

  .pane-divider.horizontal .divider-proxy {
    @apply -top-0.5 -bottom-0.5;
  }

  .pane-divider.horizontal.pane-closed .divider-proxy {
    @apply -top-0.5;
  }

  .pane-divider.horizontal.next-closed .divider-proxy {
    @apply -bottom-0.5;
  }

  .pane-divider.vertical .divider-proxy {
    @apply -left-0.5 -right-0.5;
  }

  .pane-divider.vertical.pane-closed .divider-proxy {
    @apply -left-0.5;
  }

  .pane-divider.vertical.next-closed .divider-proxy {
    @apply -right-0.5;
  }
  .pane-divider {
    .split {
      @apply absolute top-0 left-0 w-full h-full opacity-70 z-1011;
      .split-line {
        @apply opacity-0 bg-primary-datadocs-blue transition-all duration-300 ease-out;
      }
      &:hover .split-line {
        @apply opacity-100;
      }
    }
  }

  .drop-area {
    @apply absolute pointer-events-none;
    -webkit-transition: all 250ms ease-out;
    moz-transition: all 250ms ease-out;
    -o-transition: all 250ms ease-out;
    transition: all 250ms ease-out;

    top: 0px;
    bottom: 0px;
    left: 0px;
    right: 0px;
  }

  .drop-area.none {
    @apply opacity-0 bg-transparent;
    -webkit-transition: none;
    moz-transition: none;
    -o-transition: none;
    transition: none;
  }

  .drop-area.left-after {
    @apply opacity-100;
    /* left: -2px;
    right: -2px; */
    background: #3bc7ff;
  }

  .drop-area.right-before {
    @apply opacity-100;
    /* left: -2px;
    right: -2px; */
    background: #3bc7ff;
  }

  .drop-area.bottom-before {
    @apply opacity-100;
    /* left: -1px;
    right: -1px;
    top: -2px;
    bottom: -2px; */
    background: #3bc7ff;
  }

  .drop-area.no-drop {
    background: #ea4821;
  }
</style>
