<script lang="ts">
  import clsx from "clsx";
  import type { Pane } from "src/layout/types/pane";
  import type {
    GridPublicAPI,
    NormalCellDescriptor,
    ScrollBoxEntity,
  } from "@datadocs/canvas-datagrid-ng";
  import EmbeddedObject from "./Object.svelte";
  import { afterUpdate, onDestroy, onMount, setContext, tick } from "svelte";
  import { pickBy } from "lodash-es";
  import { getGridInstance, grid } from "src/app/store/grid/base";
  import { writable } from "svelte/store";
  import { useLayoutSheet } from "src/layout/store/pane";
  import { appManager } from "src/app/core/global/app-manager";
  import {
    APP_EVENT_LAYOUT_RESIZE_END,
    APP_EVENT_LAYOUT_RESIZE_START,
  } from "src/app/core/global/app-manager-events";
  
  /**
   *The Pane to be rendered
   * @type {Pane}
   */
  export let pane: Pane = null;

  /**
   * Update parent Pane
   * @type {Function}
   *
   */
  export let updateParent: Function = null;

  const { sync, update } = useLayoutSheet();

  let objectsStyle = "";
  let containerStyle = {
    scrollTop: 0,
    scrollLeft: 0,
    maxScrollLeft: 0,
    maxScrollTop: 0,
  };

  // children instances
  let panes: Record<string, InstanceType<typeof EmbeddedObject & Pane>> = {};

  // cache grid instance
  let gridInstance: GridPublicAPI = null;

  let isLayoutResizing = false;

  // use context for all nested children, focusPane for focus on object, focusPause for mouse leave container now
  let focusPane = writable<Pane>(null);
  let hoverPane = writable<Pane>(null);
  let isMoving = writable(false);
  setContext("focusPane", focusPane);
  setContext("hoverPane", hoverPane);
  setContext("isMoving", isMoving);

  $: children = pane.children || [];

  focusPane.subscribe((val) => {
    // set grid de-active when focus on other pane
    gridInstance?.setPassive(!!val);
  });

  function setupAppManager() {
    appManager.listen(APP_EVENT_LAYOUT_RESIZE_START, (eventData) => {
      isLayoutResizing = true;
    });
    appManager.listen(APP_EVENT_LAYOUT_RESIZE_END, (eventData) => {
      isLayoutResizing = false;
    });
  }

  // cache the grid style to avoid unactive
  let gridCache: any = {};
  function getGridStyle() {
    const visible = gridInstance?.visibleCells || [];
    const ratio = window.devicePixelRatio;

    function findStyle(nodeType, styleName, style) {
      const pixel =
        visible.find(
          (item: NormalCellDescriptor | ScrollBoxEntity) =>
            item.nodeType === nodeType && item?.style === styleName
        )?.[style] || 0;
      return pixel / ratio;
    }
    const scrollBar = gridInstance?.style?.scrollBarWidth || 0;
    if (gridInstance) {
      gridCache = {
        top: findStyle("canvas-datagrid-cell", "columnHeaderCell", "height"),
        left: findStyle("canvas-datagrid-cell", "rowHeaderCell", "width"),
        right: scrollBar,
        bottom: scrollBar,
        cellWidth: findStyle("canvas-datagrid-cell", "cell", "width"),
        cellHeight: findStyle("canvas-datagrid-cell", "cell", "height"),
      };
    }
    return gridCache;
  }

  function updateObjectsStyle() {
    objectsStyle = Object.entries({
      width: `calc(100% - ${getGridStyle().left}px - ${
        getGridStyle().right
      }px)`,
      height: `calc(100% - ${getGridStyle().top}px - ${
        getGridStyle().bottom
      }px)`,
      left: `${getGridStyle().left}px`,
      top: `${getGridStyle().top}px`,
    })
      .map(([key, value]) => `${key}: ${value}`)
      .join("; ");
    // console.log("containerSize", objectsStyle);
  }

  function onScroll() {
    containerStyle.scrollTop = gridInstance?.scrollTop || 0;
    containerStyle.scrollLeft = gridInstance?.scrollLeft || 0;
    updateObjectsStyle();
  }

  function onUpdateScroll({ detail }) {
    if (gridInstance) {
      gridInstance.scrollTop += detail.top;
      gridInstance.scrollLeft += detail.left;
    }
  }

  async function updateAll() {
    const scrollIndex = gridInstance.scrollIndexRect;
    const positionHelper: any = gridInstance.dataSource.positionHelper;
    positionHelper.visibleScrollIndexes.rowIndex = scrollIndex.top;
    positionHelper.visibleScrollIndexes.columnIndex = scrollIndex.left;
    // Cause set transform is async, so we need to wait for the next tick
    await tick();
    update();
    sync();
  }

  function onUnFocus(e: MouseEvent) {
    focusPane.set(null);
  }

  onMount(() => {
    // get grid in this view, maybe not currently actived
    gridInstance = getGridInstance(pane.content.view.id);
    containerStyle.maxScrollLeft = gridInstance.scrollWidth;
    containerStyle.maxScrollTop = gridInstance.scrollHeight;
    updateObjectsStyle();
    setupAppManager();
    onScroll();
    gridInstance?.addEventListener("scroll", onScroll);
    document.addEventListener("mousedown", onUnFocus, true);
  });
  onDestroy(() => {
    gridInstance?.removeEventListener("scroll", onScroll);
    document.removeEventListener("mousedown", onUnFocus);
  });

  afterUpdate(() => {
    // update panes when children changed
    panes = pickBy(panes, (item) => !!item);
  });

  $: {
    // console.log("embedded", $dndStatus, appManager);
    // console.log(appManager, PaneData.panes)
    // console.log(Object.values(panes).map(item => item.getPane()),)
    // console.log(JSON.stringify(pane));
  }
</script>

<div
  class={clsx(
    "embedded-container absolute w-full h-full top-0 left-0",
    "z-1100"
  )}
>
  <!-- <div
    class={clsx("embedded-main-content", {
      passive: $dndStatus !== null,
    })}
  >
    <svelte:component
      this={component}
      pane={{
        ...pane,
      }}
    />
  </div> -->
  <div class={clsx("embedded-objects")} style={objectsStyle}>
    {#if children instanceof Array && children.length > 0}
      {#each pane.children as innerPane, i (innerPane.id)}
        <EmbeddedObject
          bind:this={panes[innerPane.id]}
          pane={innerPane}
          disablePointer={isLayoutResizing}
          paneIndex={i}
          {updateParent}
          {containerStyle}
          on:update={updateAll}
          on:scroll={onUpdateScroll}
        />
      {/each}
    {/if}
  </div>
</div>

<style lang="postcss">
  .embedded-container {
    @apply w-full h-full bg-white overflow-hidden bg-transparent pointer-events-none;
  }

  .embedded-main-content {
    @apply w-full h-full relative overflow-hidden z-0;
  }

  .embedded-main-content.passive {
    @apply pointer-events-none;
  }

  .embedded-objects {
    @apply w-full h-full bg-transparent absolute overflow-hidden top-0 left-0 z-1 pointer-events-none;
  }
</style>
