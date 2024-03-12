<script lang="ts">
  import clsx from "clsx";
  import { dragDrop } from "src/actions/drag-drop/drag-drop";
  import type { Pane } from "src/layout/types/pane";
  import type { DragInfo } from "src/actions/drag-drop/drag-drop-types";
  import { createEventDispatcher, getContext, onMount, tick } from "svelte";
  import { writable, type Writable } from "svelte/store";
  import { getGridInstance, grid } from "src/app/store/grid/base";
  import ContainerPane from "../../../Main/index.svelte";
  import { useLayoutSheet } from "src/layout/store/pane";

  /**
   *The Pane to be rendered
   * @type {Pane}
   */
  export let pane: Pane = null;
  /**
   *The index of pane
   * @type {number}
   */
  export let paneIndex = 0;

  /**
   * Update parent Pane
   * @type {Function}
   *
   */
  export let updateParent: Function = null;

  export let disablePointer: boolean = false;

  /**
   * The Scroll Container style
   */
  interface ContainerStyle {
    scrollLeft: number;
    scrollTop: number;
    // The real size of container
    maxScrollLeft: number;
    maxScrollTop: number;
  }

  export let containerStyle: ContainerStyle = {
    scrollLeft: 0,
    scrollTop: 0,
    maxScrollLeft: 0,
    maxScrollTop: 0,
  };

  let isDraging: boolean = false;
  let isResizing: boolean = false;
  let prevX: number = 0;
  let prevY: number = 0;
  let element: HTMLElement = null;
  let transformX: number = 0;
  let transformY: number = 0;
  let width: number = 0;
  let height: number = 0;
  let oldScrollLeft: number = 0;
  let oldScrollTop: number = 0;
  let isMounted: boolean = false;
  let isFocusStyle: boolean = true;

  const dispatch = createEventDispatcher<{
    scroll: { left: number; top: number };
    update: { pane: Pane };
  }>();

  const { activePaneId, isFixedGroup } = useLayoutSheet();

  $: id = pane?.id;
  $: transform = pane?.content?.view?.config?.transform || {};
  $: parentElement = element?.parentElement;

  $: isMoveBar = !isFixedGroup(pane) && pane.content.view.name !== "shape";
  $: gridThis = getGridInstance(pane.content.view.id);
  $: isFocus = $focusPane?.id === pane.id;
  $: isHover = $hoverPane?.id === pane.id;

  // update pane transform
  $: {
    if (element && isMounted) {
      element.style.transform = `translate3d(${transformX}px, ${transformY}px, 0)`;
      element.style.width = `${width}px`;
      element.style.height = `${height}px`;
      pane.content.view.config.transform = {
        ...pane.content.view.config.transform,
        width,
        height,
        x: transformX,
        y: transformY,
      };
    }
    isDraging;
  }

  // update transform when scrolling
  $: {
    const { scrollLeft = 0, scrollTop = 0 } = containerStyle;
    // change after mounted
    if (!isDraging && isMounted) {
      if (scrollTop !== oldScrollTop) {
        transformY -= scrollTop - oldScrollTop;
      }
      if (scrollLeft !== oldScrollLeft) {
        transformX -= scrollLeft - oldScrollLeft;
      }
    }
    oldScrollTop = scrollTop;
    oldScrollLeft = scrollLeft;
  }

  grid.subscribe((g) => {
    isFocusStyle = g !== gridThis;
  });

  // context
  const focusPane = getContext<Writable<Pane>>("focusPane");
  const focusPause = getContext<Writable<boolean>>("focusPause");
  const hoverPane = getContext<Writable<Pane>>("hoverPane");
  const isMoving = getContext<Writable<boolean>>("isMoving") || writable(false);

  const autoScroll = {
    id: null,
    speedX: 0,
    speedY: 0,
    scrolling: false,
    disabledX: false,
    disabledY: false,
    init() {
      this.speedX = 0;
      this.speedY = 0;
    },
    start() {
      this.scrolling = true;
    },
    run() {
      if (this.id || (!this.speedX && !this.speedY)) {
        cancelAnimationFrame(this.id);
        this.id = null;
      }
      if (this.scrolling) {
        const speedX = this.speedX / 4;
        const speedY = this.speedY / 4;
        dispatch("scroll", {
          left: this.disabledX ? 0 : speedX,
          top: this.disabledY ? 0 : speedY,
        });
        this.id = requestAnimationFrame(() => {
          this.run();
        });
      }
    },
    stop() {
      this.scrolling = false;
      this.speedX = 0;
      this.speedY = 0;
    },
  };

  const bounding = {
    get element() {
      return element.getBoundingClientRect();
    },
    get container() {
      return parentElement.getBoundingClientRect();
    },
  };

  function isOverLeft() {
    return bounding.element.x < bounding.container.x;
  }
  function isOverRight() {
    return (
      bounding.element.width + bounding.element.x >
      bounding.container.width + bounding.container.x
    );
  }
  function isOverBottom() {
    return (
      bounding.element.height + bounding.element.y >
      bounding.container.height + bounding.container.y
    );
  }
  function isOverTop() {
    return bounding.element.y < bounding.container.y;
  }
  function isMatchLeft() {
    return bounding.element.x <= bounding.container.x;
  }
  function isMatchRight() {
    return (
      bounding.element.width + bounding.element.x >=
      bounding.container.width + bounding.container.x
    );
  }
  function isMatchBottom() {
    return (
      bounding.element.height + bounding.element.y >=
      bounding.container.height + bounding.container.y
    );
  }
  function isMatchTop() {
    return bounding.element.y <= bounding.container.y;
  }

  function onDragStart(dragInfo: DragInfo, isAfter: boolean) {
    // console.log("dragstart", dragInfo, isAfter);
    if (!isAfter) {
      const target = dragInfo.event.target;
      if (!isFocus) {
        return false;
      }
      if (
        target instanceof Element &&
        target.classList.contains("move-bar-handler")
      ) {
      } else if (isFixedGroup(pane)) {
        if (target instanceof Element) {
          // disable drag when drag item in fixed container
          return target.classList.contains("fixed-container");
        }
      } else if (pane.content.view.name !== "shape") {
        return false;
      }

      dragInfo.event.stopPropagation();
      return !isResizing;
      // return dragInfo.event.currentTarget === dragInfo.event.target;
    }
    isMoving.set(true);
    isDraging = true;
    prevX = dragInfo.x;
    prevY = dragInfo.y;
    autoScroll.start();
    autoScroll.run();

    autoScroll.disabledX = isOverLeft() || isOverRight();
    autoScroll.disabledY = isOverBottom() || isOverTop();
  }

  function onDragEnd(dragInfo: DragInfo, isAfter: boolean) {
    if (!isAfter) {
      return !isResizing;
    }
    autoScroll.stop();
    transformX += dragInfo.changeX || 0;
    transformY += dragInfo.changeY || 0;
    isDraging = false;
    isMoving.set(false);
    dragInfo.event.stopPropagation();
    dispatch("update", { pane });
  }

  function onDrag(dragInfo: DragInfo, isAfter: boolean) {
    // console.log(dragInfo, isAfter);
    if (!isAfter) {
      return isDraging && !isResizing;
    }

    // make grid scroll
    if (isMatchLeft() || isMatchRight()) {
      autoScroll.speedX += dragInfo.x - prevX;
    } else {
      autoScroll.speedX = 0;
      autoScroll.disabledX = false;
    }
    if (isMatchTop() || isMatchBottom()) {
      autoScroll.speedY += dragInfo.y - prevY;
    } else {
      autoScroll.speedY = 0;
      autoScroll.disabledY = false;
    }
    prevX = dragInfo.x;
    prevY = dragInfo.y;
  }

  function onOverflowX() {
    return autoScroll.disabledX;
  }
  function onOverflowY() {
    return autoScroll.disabledY;
  }

  const HANDLER = {
    N: "handler-n",
    S: "handler-s",
    E: "handler-e",
    W: "handler-w",
    NE: "handler-ne",
    NW: "handler-nw",
    SE: "handler-se",
    SW: "handler-sw",
  };
  const CURSOR = {
    [HANDLER.N]: "!cursor-n-resize",
    [HANDLER.S]: "!cursor-s-resize",
    [HANDLER.E]: "!cursor-e-resize",
    [HANDLER.W]: "!cursor-w-resize",
    [HANDLER.NE]: "!cursor-ne-resize",
    [HANDLER.NW]: "!cursor-nw-resize",
    [HANDLER.SE]: "!cursor-se-resize",
    [HANDLER.SW]: "!cursor-sw-resize",
  };
  function applyResize(
    itemElement: HTMLElement,
    { direction }: { direction: (typeof HANDLER)[keyof typeof HANDLER] }
  ) {
    let originMouseX = 0;
    let originMouseY = 0;
    let originL = 0;
    let originT = 0;
    let originR = 0;
    let originB = 0;
    // when press shift key, lock ratio
    let lockRatio = false;
    let ratio = 0;
    // when press alt key, resize from the both side
    let bothSide = false;
    let mouseX = 0;
    let mouseY = 0;

    function initPosition(isBothSide = false) {
      const calDirection = direction.replace(/handler-/g, "");
      if (!isBothSide) {
        originL = transformX;
        originT = transformY;
        originR = transformX + width;
        originB = transformY + height;
      } else {
        let changeX = mouseX - originMouseX;
        let changeY = mouseY - originMouseY;
        if (calDirection.includes("w")) {
          changeX = -changeX;
        }
        if (calDirection.includes("n")) {
          changeY = -changeY;
        }
        originL = originL - changeX;
        originT = originT - changeY;
        originR = originR + changeX;
        originB = originB + changeY;
      }
      originMouseX = mouseX;
      originMouseY = mouseY;
    }

    function onMouseDown(e: MouseEvent) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      isResizing = true;
      initPosition();
      itemElement.parentElement.classList.add(CURSOR[direction]);

      window.addEventListener("mouseup", onMouseUp);
      document.addEventListener("mousemove", onResize);
      e.stopPropagation();
    }
    function onResize(e: MouseEvent) {
      if (!isResizing) {
        return;
      }

      mouseX = e.clientX;
      mouseY = e.clientY;
      const changeX = mouseX - originMouseX;
      const changeY = mouseY - originMouseY;
      // remember the current mouse position when set bothside to true

      function calTransX(originMove, originBase) {
        let originBaseT = originBase;
        if (bothSide) {
          originBaseT = originBase - changeX;
        }
        transformX = Math.min(originMove + changeX, originBaseT);
        width = Math.abs(originMove + changeX - originBaseT);
        const { scrollLeft, maxScrollLeft } = containerStyle;
        // resize to the left
        if (transformX < -scrollLeft) {
          transformX = -scrollLeft;
          width = originBaseT + scrollLeft;
        } else if (
          transformX + width >
          bounding.container.width + maxScrollLeft - scrollLeft
        ) {
          // resize to the right
          width =
            bounding.container.width + maxScrollLeft - scrollLeft - transformX;
        }

        if (lockRatio) {
          width = height * ratio;
        }
      }

      function calTransY(originMove, originBase) {
        let originBaseT = originBase;
        if (bothSide) {
          originBaseT = originBase - changeY;
        }
        transformY = Math.min(originMove + changeY, originBaseT);
        height = Math.abs(originMove + changeY - originBaseT);
        const { scrollTop, maxScrollTop } = containerStyle;
        // resize to the top
        if (transformY < -scrollTop) {
          transformY = -scrollTop;
          height = originBaseT + scrollTop;
        } else if (
          transformY + height >
          bounding.container.height + maxScrollTop - scrollTop
        ) {
          // resize to the bottom
          height =
            bounding.container.height + maxScrollTop - scrollTop - transformY;
        }
      }

      const calDirection = direction.replace(/handler-/g, "");
      if (calDirection.includes("n")) {
        calTransY(originT, originB);
      }
      if (calDirection.includes("s")) {
        calTransY(originB, originT);
      }
      if (calDirection.includes("e")) {
        calTransX(originR, originL);
      }
      if (calDirection.includes("w")) {
        calTransX(originL, originR);
      }
    }
    function onMouseUp(e: MouseEvent) {
      // dispatch("update", { pane });
      itemElement.parentElement.classList.remove(CURSOR[direction]);
      setTimeout(() => {
        isResizing = false;
        isDraging = false;
      });

      window.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("mousemove", onResize);
      e.stopPropagation();
    }

    function onKeyDown(e: KeyboardEvent) {
      // just lock ratio in both resizing width & height
      if (
        e.key === "Shift" &&
        direction.replace(/handler-/g, "").length === 2
      ) {
        ratio = width / height;
        lockRatio = true;
      }
      if (e.key === "Alt") {
        // reset origin position
        bothSide = true;
        initPosition();
      }
    }
    function onKeyUp(e: KeyboardEvent) {
      if (e.key === "Shift") {
        lockRatio = false;
        ratio = 0;
      }
      if (e.key === "Alt") {
        bothSide = false;
        initPosition(true);
      }
    }
    itemElement.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);

    return {
      destroy() {
        itemElement.removeEventListener("mousedown", onMouseDown);
        document.removeEventListener("keydown", onKeyDown);
        document.removeEventListener("keyup", onKeyUp);
      },
    };
  }

  function applyFocus(itemElement: HTMLElement) {
    function onFocus(e?: MouseEvent) {
      focusPane?.set(pane);
      $activePaneId = pane.id;
    }
    itemElement.addEventListener("mousedown", onFocus, true);
    setTimeout(() => {
      onFocus();
    });

    return {
      destroy() {
        itemElement.removeEventListener("mousedown", onFocus);
      },
    };
  }

  // trick the spreadsheet hover effect
  function onSpreadSheetHover(e) {
    const cell = e.cell || {};
    if (!isFocus) {
      return;
    }
    if (
      (cell.nodeType === "canvas-datagrid-cell" &&
        (cell.style === "cell" || cell.style === "activeCell")) ||
      cell.nodeType === "selection-handle"
    ) {
      isFocusStyle = false;
    } else {
      isFocusStyle = true;
    }
  }

  function applyHover(itemElement: HTMLElement) {
    function onMouseEnter(e: MouseEvent) {
      if ($isMoving) {
        return;
      }
      hoverPane?.set(pane);
      e.stopPropagation();
    }
    function onMouseLeave() {
      hoverPane?.set(null);
    }
    itemElement.addEventListener("mouseover", onMouseEnter);
    itemElement.addEventListener("mouseleave", onMouseLeave);
    return {
      destroy() {
        itemElement.removeEventListener("mouseover", onMouseEnter);
        itemElement.removeEventListener("mouseleave", onMouseLeave);
      },
    };
  }

  onMount(async () => {
    await tick();
    const { scrollTop, scrollLeft } = containerStyle;
    element = element;
    oldScrollLeft = scrollLeft || 0;
    oldScrollTop = scrollTop || 0;
    width = transform.width || 400;
    height = transform.height || 300;
    transformX = transform.x || 0;
    transformY = transform.y || 0;
    if (pane.content.view?.config?.dropEvent) {
      transformX =
        pane.content.view?.config?.dropEvent.clientX - bounding.container.left;
      transformY =
        pane.content.view?.config?.dropEvent.clientY - bounding.container.top;
      pane.content.view.config.dropEvent = null;
    }
    isMounted = true;
    // dispatch("update", { pane });
    gridThis?.addEventListener("cellmouseover", onSpreadSheetHover);
  });

  export function getPane() {
    return pane;
  }

  $: {
    // console.log(pane, isFocus, !$focusPause, !isDraging);
    // console.groupCollapsed("EmbeddedObject");
    // console.groupEnd();
  }
</script>

<div
  class={clsx(
    "embedded-object relative",
    isMoveBar ? "!cursor-auto" : "",
    isFocusStyle ? "" : "hide",
    isFocus && !$focusPause && !isDraging ? "focus" : "",
    isFocus && $focusPause ? "pause-focus" : "",
    isHover ? "hover" : "",
    disablePointer ? "pointer-events-disabled" : ""
  )}
  bind:this={element}
  use:dragDrop={{
    useTranslate: true,
    overflow: false,
    onDragStart,
    onDragEnd,
    onDrag,
    onOverflowX,
    onOverflowY,
    data: {
      pane,
      config: pane?.content?.view?.config,
    },
  }}
  use:applyFocus
  use:applyHover
  style:z-index={(paneIndex + 1) * 10}
  on:click|stopPropagation
>
  {#if isMoveBar}
    <div class={clsx("move-bar-handler", { "!flex": isDraging })}>
      <div class="move-bar-circle" />
      <div class="move-bar-circle" />
      <div class="move-bar-circle" />
    </div>
  {/if}
  {#each Object.values(HANDLER) as handler (id + handler)}
    <div
      class={clsx(
        handler,
        "handler",
        handler.replace("handler-", "").length === 1
          ? "handler-line"
          : "handler-circle"
      )}
      use:applyResize={{ direction: handler }}
    />
  {/each}
  <!-- When draging, disable all the event -->
  {#if isDraging}
    <div class="absolute top-0 left-0 w-full h-full bg-transparent z-300" />
  {/if}
  <!-- <div class="embedded-object-grip" /> -->
  <div class="embedded-object-item">
    <ContainerPane {pane} allowSplit={false} />
  </div>
</div>

<style lang="postcss">
  .embedded-object.default-size {
    width: 400px;
    height: 300px;
  }

  .embedded-object {
    @apply absolute p-0 cursor-move shadow-md overflow-visible pointer-events-auto;
  }
  .embedded-object.pointer-events-disabled {
    @apply pointer-events-none;
  }
  .embedded-object.hover:hover::before,
  .embedded-object.pause-focus::before {
    @apply content-[""] absolute w-full h-full top-0 left-0 border border-solid border-neutral-300 box-border z-200 pointer-events-none;
  }
  /* .embedded-object::before :global(*):hover {
    @apply hidden;
  } */
  .embedded-object.focus > .handler {
    @apply block;
  }
  .embedded-object > .move-bar-handler {
    @apply absolute w-8 h-3 -top-1.5 left-1/2 cursor-move bg-white transform -translate-x-1/2 z-300 rounded-sm hidden text-white pointer-events-auto hidden items-center justify-around px-1;
    box-shadow: 0 0 6px 0 rgba(0, 0, 0, 0.2);
  }
  .embedded-object.hover:hover > .move-bar-handler {
    @apply flex;
  }
  .embedded-object.focus > .move-bar-handler {
    @apply flex;
    /* background-color: var(--tabs-active-color); */
  }
  .embedded-object.hide > .handler,
  .embedded-object.hide > .move-bar-handler,
  .embedded-object.hide::before {
    @apply !hidden;
  }
  .embedded-object-item {
    @apply w-full h-full;
  }
  .move-bar-circle {
    @apply w-1 h-1 box-border border border-solid bg-gray-400 transform z-200 rounded pointer-events-none;
  }
  .handler {
    @apply absolute !pointer-events-auto hidden z-200;
  }
  .handler-circle {
    @apply w-2 h-2 box-border border border-solid bg-white transform rounded;
    border-color: var(--tabs-active-color);
  }
  .handler-line {
    @apply w-[1px] h-[1px] z-200;
    background-color: var(--tabs-active-color);
  }
  .handler-n {
    @apply w-full top-0 !cursor-n-resize;
  }
  .handler-s {
    @apply w-full bottom-0 cursor-s-resize;
  }
  .handler-w {
    @apply h-full left-0 cursor-w-resize;
  }
  .handler-e {
    @apply h-full right-0 cursor-e-resize;
  }
  .handler-ne {
    @apply top-0 right-0 translate-x-1/2 -translate-y-1/2 cursor-ne-resize;
  }
  .handler-nw {
    @apply top-0 left-0 -translate-x-1/2 -translate-y-1/2 cursor-nw-resize;
  }
  .handler-se {
    @apply bottom-0 right-0 translate-x-1/2 translate-y-1/2 cursor-se-resize;
  }
  .handler-sw {
    @apply bottom-0 left-0 -translate-x-1/2 translate-y-1/2 cursor-sw-resize;
  }
</style>
