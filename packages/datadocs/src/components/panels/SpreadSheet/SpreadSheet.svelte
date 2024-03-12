<script lang="ts">
  import { debounce } from 'lodash-es';
  import { afterUpdate, onDestroy, onMount } from "svelte";
  import { watchResize } from "svelte-watch-resize";
  import clsx from "clsx";
  import {
    APP_EVENT_LAYOUT_RESIZE_END,
    APP_EVENT_LAYOUT_RESIZE_START,
  } from "../../../app/core/global/app-manager-events";

  import type { EventPayload } from "../../../app/core/global/app-manager";
  import { appManager } from "../../../app/core/global/app-manager";
  import {
    getGridInstance,
    updateGridStore,
    grid as storeGrid,
  } from "../../../app/store/grid/base";
  import { isTestQuery } from "../../../app/store/store-ui";
  import type { Pane, View, ViewConfig } from "src/layout/types/pane";
  import type { ContextMenuOptionsType } from "../../common/context-menu";
  import { contextMenuAction } from "../../common/context-menu";
  import type {
    MenuElementType,
    MenuItemType,
    MenuListType,
  } from "../../common/menu";
  import {
    MENU_DATA_ITEM_STATE_ENABLED,
    MENU_DATA_ITEM_TYPE_ELEMENT,
    MENU_DATA_ITEM_TYPE_LIST,
    MENU_DATA_ITEM_TYPE_SEPARATOR,
  } from "../../common/menu";

  import TestQuery from "../../grids/TestQuery.svelte";
  import { createPanelHandler, spreadsheetConfig } from "./SpreadSheet";
  import { useLayoutSheet } from "src/layout/store/pane";

  export let pane: Pane;

  export let view: View;

  let isReady: boolean = false;

  let viewConfig: ViewConfig;

  let viewObjects: Array<any> = null;

  let gridContainer: HTMLElement;
  let gridHolder: HTMLElement;
  let willResetGridSize = false;

  const { activePaneId } = useLayoutSheet();

  const contextMenuOptions: ContextMenuOptionsType = {
    menuItems: contextMenuItems,
    disabled: false,
    isAtMousePosition: true,
  };

  let isResizing = false;
  // this make resizing more smooth
  let gridWidth = 0;
  let gridHeight = 0;

  function contextMenuItems(clientX: number, clientY: number) {
    const grid = getGridInstanceProxy(view.id);
    if (!grid) return [];
    return createContextMenuListItems(
      grid.getContextMenuItems(clientX, clientY),
    );
  }

  function createContextMenuListItems(children: any[]) {
    const data: MenuItemType[] = [];
    children.forEach((item) => {
      if (item.type === "divider") {
        data.push({ type: MENU_DATA_ITEM_TYPE_SEPARATOR });
      } else if (item.type === "submenu") {
        data.push({
          type: MENU_DATA_ITEM_TYPE_LIST,
          label: item.title,
          // TODO: Enable icons once the alignment issue is gone.
          /* prefixIcon: item.prefixIcon, */
          state: MENU_DATA_ITEM_STATE_ENABLED,
          children: createContextMenuListItems(item.children()),
        } as MenuListType);
      } else if (item.type === "action") {
        data.push({
          type: MENU_DATA_ITEM_TYPE_ELEMENT,
          label: item.title,
          // TODO: Enable icons once the alignment issue is gone.
          /* prefixIcon: item.prefixIcon, */
          state: MENU_DATA_ITEM_STATE_ENABLED,
          active: item.active,
          action: item.action,
        } as MenuElementType);
      }
    });

    return data;
  }

  function createGrid() {
    if (!gridHolder) return;
    const grid = getGridInstanceProxy(view.id);
    gridHolder.innerHTML = "";
    updateGridStore(grid);
    gridHolder.appendChild(grid);
    grid.resize(true);
    storeGrid.set(grid);
  }

  function updateGrid() {
    let bounds: DOMRect;
    if (!gridHolder) return;
    bounds = gridHolder.getBoundingClientRect();
    if (bounds.width === 0 || bounds.height === 0) {
      setTimeout(createGrid, 500);
      return;
    }
    const grid = getGridInstanceProxy(view.id);
    if (grid.parentElement) {
      grid.parentElement.removeChild(grid);
    }
    gridHolder.innerHTML = "";
    updateGridStore(grid);
    gridHolder.appendChild(grid);
    grid.resize(true);
  }

  function setTempSize(type, bounds: DOMRect) {
    const datagrid = getGridInstanceProxy(view.id);
    if (!datagrid || !gridHolder) return;
    if (type === "vertical") {
      gridHolder.style.width = `auto`;
      gridHolder.style.height = "";
    } else {
      gridHolder.style.width = "";
      gridHolder.style.height = `${bounds.height}px`;
    }
    // datagrid.style.overflowX = "hidden";
    // datagrid.style.overflowY = "hidden";
    datagrid.resize(true);
  }

  function resetSize() {
    const datagrid = getGridInstanceProxy(view.id);
    if (!datagrid || !gridHolder) return;
    gridHolder.style.width = "";
    gridHolder.style.height = "";
    // datagrid.style.overflowX = "auto";
    // datagrid.style.overflowY = "auto";
    datagrid.resize(true);
  }

  function setupAppManager() {
    appManager.register(
      `${spreadsheetConfig.name}-${view.id}`,
      createPanelHandler(gridContainer, {}),
    );
    appManager.listen(
      APP_EVENT_LAYOUT_RESIZE_START,
      (eventData: EventPayload) => {
        const { bounds, type, panes } = eventData.data;
        isResizing = true;
      },
    );
    appManager.listen(APP_EVENT_LAYOUT_RESIZE_END, (eventData) => {
      isResizing = false;
      resetSize();
    });
  }

  function addListeners() {
    const datagrid = getGridInstanceProxy(view.id);
    if (!datagrid) return;
    datagrid.addEventListener("mouseup", (event) => {
      // Only need one active grid at a time. This will update appManager's activeGrid to change grid's passive to modify active status.
      storeGrid.set(datagrid);
      // Set this pane as active Pane.
      // appManager.setActivePane(pane, gridContainer);
      $activePaneId = pane.id;

      // event.NativeEvent.stopPropagation();
    });
  }

  function handleResize(node: HTMLElement) {
    // // Setting the width/height with property access through `datagrid.style`
    // // causes `resize` invocations (which is relatively expensive), so we
    // // avoid that using `setStyleProperty`.
    // // datagrid.setStyleProperty("width", newWidth + "px", false);
    // // datagrid.setStyleProperty("height", newHeight + "px", false);
    // if (isResizing) {
    //   // const datagrid = getGridInstanceProxy(view.id);
    //   // if (!datagrid) return;
    //   // datagrid.resize(false);
    // updateGrid();
    // resetSize();
    // }
    // console.log("resize");
    const datagrid = getGridInstanceProxy(view.id);
    if (!datagrid) return;
    // updateGrid();
    resetSize();
  }

  let handleResizeDebounced;

  function initResizeDebounced() {
    handleResizeDebounced = debounce(handleResize, 0); // Debounce for 300 milliseconds
  }

  function handleResizeDebouncedWrapper(event) {
    handleResizeDebounced(gridContainer);
  }

  // function onOverlayMouseDown(event, index) {
  //   const gridBounds = gridHolder.getBoundingClientRect();
  //   const targetBounds = event.target.getBoundingClientRect();
  //   dragTargetIndex = index;
  //   dragTarget = event.target;
  //   dragOffset.x = gridBounds.x;
  //   dragOffset.y = gridBounds.y;
  //   targetOffset.x = event.clientX - targetBounds.x;
  //   targetOffset.y = event.clientY - targetBounds.y;
  //   window.addEventListener("mousemove", onWindowMouseMove);
  //   window.addEventListener("mouseup", onWindowMouseUp);
  //   event.stopPropagation();
  // }

  // function onWindowMouseUp() {
  //   window.removeEventListener("mousemove", onWindowMouseMove);
  //   window.removeEventListener("mouseup", onWindowMouseUp);
  //   // view.objects[dragTargetIndex].transform.x = newPosition.x;
  //   // view.objects[dragTargetIndex].transform.y = newPosition.y;
  // }

  // function onWindowMouseMove(event: MouseEvent) {
  //   if (dragTarget) {
  //     newPosition.x = event.clientX - dragOffset.x - targetOffset.x;
  //     newPosition.y = event.clientY - dragOffset.y - targetOffset.y;
  //     dragTarget.style.left = newPosition.x + "px";
  //     dragTarget.style.top = newPosition.y + "px";
  //   }
  // }

  function getGridInstanceProxy(id: string, createNew?: boolean) {
    let gridInstance = getGridInstance(id, false);
    let gridExists: boolean =
      gridInstance !== null && gridInstance !== undefined;
    gridInstance = getGridInstance(id, createNew);
    if (!gridExists) {
      // if (!appManager.activePane.id) {
      //   appManager.setActivePane(pane, document.getElementById(pane.id));
      // }
      $activePaneId = pane.id;
    }
    return gridInstance;
  }

  afterUpdate(() => {
    const grid = getGridInstanceProxy(view.id);
    grid.endEdit(false);
  });

  onMount(() => {
    if (!isReady) {
      isReady = true;
      createGrid();
      setupAppManager();
      addListeners();
      console.log(" spreadsheet mount ---- ", pane?.content?.view.id);
    }
  });

  onDestroy(() => {
    console.log("spreadsheet destroy");
    const datagrid = getGridInstanceProxy(view.id);
    if (!datagrid || !gridHolder || datagrid.parentElement !== gridHolder)
      return;
    gridHolder.removeChild(datagrid);
    // isReady = false;
  });

  /*
  function updateGrid() {
    if (!gridContainer) return;
    const grid = getGridInstanceProxy(view.id);
    gridContainer.innerHTML = "";
    updateGridStore(grid);
    gridContainer.appendChild(grid);
    grid.resize(true);
  }

  onMount(() => {
    if (!gridContainer) return;

    gridContainer.innerHTML = "";
    const datagrid = CanvasDatagrid({
      parentNode: gridContainer,
      allowFreezingRows: true,
      sortFrozenRows: false,
      filterFrozenRows: false,
    });

    datagrid.dataSource = getGridDataSource();
    saveGrid(datagrid);
  });*/

  $: if (gridContainer) updateGrid();

  function handleAfterUpdateTestQuery() {
    if (willResetGridSize) {
      willResetGridSize = false;
      resetSize();
    }
  }

  $: {
    viewConfig = view.config;
    if (viewConfig && viewConfig.objects && viewConfig.objects.length > 0) {
      viewObjects = viewConfig.objects;
    } else {
      viewObjects = null;
    }
  }
  $: isQuery = $isTestQuery;
  $: isQuery,
    (() => {
      willResetGridSize = true;
    })();
  $: {
    initResizeDebounced(); // Initialize the debounced function
  }
</script>

{#key view.id}
  <div class="flex-grow-0 flex-shrink-0" class:mb-1={isQuery}>
    <TestQuery
      viewId={view.id}
      on:updatedTestQuery={handleAfterUpdateTestQuery}
    />
  </div>
  <div
    bind:this={gridContainer}
    use:contextMenuAction={contextMenuOptions}
    class={clsx(
      "grid-container",
      isResizing ? "pointer-events-none" : "pointer-events-auto",
    )}
    style:min-height="0"
    bind:offsetWidth={gridWidth}
    bind:offsetHeight={gridHeight}
    use:watchResize={handleResizeDebouncedWrapper}
    on:click|stopPropagation
    on:keypress|stopPropagation
    on:keyup|stopPropagation
  >
    <div class="grid-holder" bind:this={gridHolder} />
    <!-- {#if viewObjects !== null && viewObjects.length > 0}
      <div class="grid-objects">
        {#each viewObjects as viewObject, index}
          <GridObject
            gridObject={viewObject}
            {index}
            onObjectChange={(objectData) => updateObject(index, objectData)}
          />
        {/each}
      </div>
    {/if} -->
  </div>
{/key}

<style lang="postcss">
  .grid-container {
    @apply flex-auto w-full overflow-hidden relative z-0;
    /* border: 1px solid #3bc7ff00; */
    /* pointer-events: none; */
  }

  .grid-container.contains-selected-grid {
    border: 1px solid #3bc7ff80;
  }
  .grid-holder {
    @apply h-full w-full flex z-30;
  }
  .grid-container :global(canvas-datagrid) {
    flex: 1;
    min-width: 0;
    min-height: 0;
  }

  /* .grid-objects {
    @apply h-full w-full flex z-40 pointer-events-none absolute top-0 left-0 overflow-hidden;
  } */
</style>
