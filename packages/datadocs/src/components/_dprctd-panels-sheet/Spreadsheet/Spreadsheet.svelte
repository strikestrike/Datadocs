<script lang="ts">
  import { afterUpdate, onMount } from "svelte";
  import { watchResize } from "svelte-watch-resize";
  import { console } from "../../../utils/console";
  import {
    APP_EVENT_LAYOUT_RESIZE_END,
    APP_EVENT_LAYOUT_RESIZE_START,
  } from "../../../app/core/global/app-manager-events";

  import type { EventPayload } from "../../../app/core/global/app-manager";
  import { appManager } from "../../../app/core/global/app-manager";
  import {
    getGridInstance,
    updateGridStore,
  } from "../../../app/store/grid/base";
  import { activeView } from "../../../app/store/store-main";
  import { isTestQuery } from "../../../app/store/store-ui";
  import type {
    Pane,
    View,
    ViewConfig,
  } from "../../../layout/main/panels-layout/types";
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
  import type { ViewObject } from "../../objects/Object/objects-types";
  import GridObject from "./GridObject.svelte";
  import { createPanelHandler, spreadsheetConfig } from "./Spreadsheet";
  import { WS_ADD_OBJECT } from "../../panels/WorkBook/worksheet-actions";
  import { APP_SHEET_CONTENT } from "../../../app/core/global/app-manager-constants";

  export let pane: Pane;

  export let view: View;

  export let isInTab = false;

  export let tabIndex = -1;

  let isReady = false;

  let viewConfig: ViewConfig;

  let viewObjects: Array<any> = null;

  let gridContainer: HTMLElement;
  let gridHolder: HTMLElement;
  let willResetGridSize = false;

  const contextMenuOptions: ContextMenuOptionsType = {
    menuItems: contextMenuItems,
    disabled: false,
    isAtMousePosition: true,
  };

  let isResizing = false;

  let dragTargetIndex = -1;
  let dragTarget = null;
  const dragOffset = {
    x: 0,
    y: 0,
  };
  const targetOffset = {
    x: 0,
    y: 0,
  };
  const newPosition = {
    x: 0,
    y: 0,
  };

  function contextMenuItems(clientX: number, clientY: number) {
    const grid = getGridInstance(view.id);
    if (!grid) return [];
    return createContextMenuListItems(
      grid.getContextMenuItems(clientX, clientY)
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
    const grid = getGridInstance(view.id);
    gridHolder.innerHTML = "";
    updateGridStore(grid);
    gridHolder.appendChild(grid);
    grid.resize(true);
  }

  function setTempSize(type, bounds: DOMRect) {
    const datagrid = getGridInstance(view.id);
    if (!datagrid || !gridHolder) return;
    if (type === "vertical") {
      gridHolder.style.width = `${bounds.width}px`;
      gridHolder.style.height = "";
    } else {
      gridHolder.style.width = "";
      gridHolder.style.height = `${bounds.height}px`;
    }
    datagrid.style.overflowX = "hidden";
    datagrid.style.overflowY = "hidden";
    datagrid.resize(true);
  }

  function resetSize() {
    const datagrid = getGridInstance(view.id);
    if (!datagrid || !gridHolder) return;
    gridHolder.style.width = "";
    gridHolder.style.height = "";
    datagrid.style.overflowX = "auto";
    datagrid.style.overflowY = "auto";
    datagrid.resize(true);
  }

  function setupAppManager() {
    appManager.register(
      `${spreadsheetConfig.name}-${view.id}`,
      createPanelHandler(gridContainer, {})
    );
    appManager.listen(
      APP_EVENT_LAYOUT_RESIZE_START,
      (eventData: EventPayload) => {
        console.log(eventData.data);
        const { bounds, type, panes } = eventData.data;
        // if (panes[appManager.sheetsLayout.parentPaneId] || panes[pane.id]) {
        setTempSize(type, bounds);
        // }
        // console.log(
        //   "grid resize",
        //   panes,
        //   appManager.sheetsLayout.parentPaneId,
        //   pane.id
        // );
        isResizing = true;
      }
    );
    appManager.listen(APP_EVENT_LAYOUT_RESIZE_END, (eventData) => {
      isResizing = false;
      resetSize();
    });
  }

  function addListeners() {
    const datagrid = getGridInstance(view.id);
    if (!datagrid) return;
    datagrid.addEventListener("click", () => {
      appManager.activeView = {
        id: view.id,
        type: spreadsheetConfig.name,
      };
    });
  }

  function handleResize(node: HTMLElement) {
    console.groupCollapsed("Spreadsheet");
    console.log("handleResize");
    if (!isResizing) {
      const newWidth = node.clientWidth;
      const newHeight = node.clientHeight;
      console.log(">>>", newWidth, newHeight);
      const datagrid = getGridInstance(view.id);
      if (!datagrid) return;

      // Setting the width/height with property access through `datagrid.style`
      // causes `resize` invocations (which is relatively expensive), so we
      // avoid that using `setStyleProperty`.
      // datagrid.setStyleProperty("width", newWidth + "px", false);
      // datagrid.setStyleProperty("height", newHeight + "px", false);
      datagrid.resize(true);
    }
    console.groupEnd();
  }

  function onOverlayMouseDown(event, index) {
    const gridBounds = gridHolder.getBoundingClientRect();
    const targetBounds = event.target.getBoundingClientRect();
    dragTargetIndex = index;
    dragTarget = event.target;
    dragOffset.x = gridBounds.x;
    dragOffset.y = gridBounds.y;
    targetOffset.x = event.clientX - targetBounds.x;
    targetOffset.y = event.clientY - targetBounds.y;
    window.addEventListener("mousemove", onWindowMouseMove);
    window.addEventListener("mouseup", onWindowMouseUp);
    event.stopPropagation();
  }

  function onWindowMouseUp() {
    window.removeEventListener("mousemove", onWindowMouseMove);
    window.removeEventListener("mouseup", onWindowMouseUp);
    // view.objects[dragTargetIndex].transform.x = newPosition.x;
    // view.objects[dragTargetIndex].transform.y = newPosition.y;
  }

  function onWindowMouseMove(event: MouseEvent) {
    if (dragTarget) {
      newPosition.x = event.clientX - dragOffset.x - targetOffset.x;
      newPosition.y = event.clientY - dragOffset.y - targetOffset.y;
      dragTarget.style.left = newPosition.x + "px";
      dragTarget.style.top = newPosition.y + "px";
    }
  }

  function updateObject(index, objectData) {
    if (pane) {
      const view: View = pane.settings.view;
      if (view) {
        const viewConfig: ViewConfig = view.config;
        if (viewConfig) {
          const objects: Array<ViewObject> = viewConfig.objects;
          if (objects && objects.length > 0) {
            const object = objects[index];
            objects[index] = {
              ...object,
              ...objectData,
            };
            appManager.sheetsLayout.panesContext.updatePane(pane);
          }
        }
      }
    }
  }

  function onMouseUp(event: MouseEvent) {
    if (appManager.activeDrag) {
      const view: View = pane.settings.view;
      const bounds: DOMRect = gridHolder.getBoundingClientRect();
      appManager.send(APP_SHEET_CONTENT, {
        message: WS_ADD_OBJECT,
        data: {
          id: view?.id,
          objectData: {
            ...appManager.activeDrag,
            transform: {
              x: event.clientX - bounds.x,
              y: event.clientY - bounds.y,
            },
          },
        },
      });
      appManager.activeDrag = null;
    }
  }

  afterUpdate(() => {
    if (!isReady) {
      createGrid();
      setupAppManager();
      addListeners();
      isReady = true;
    }
  });

  onMount(() => {
    createGrid();
    setupAppManager();
    addListeners();
  });

  /*
  function updateGrid() {
    if (!gridContainer) return;
    const grid = getGridInstance(view.id);
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

  // $: if (gridContainer) updateGrid();

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
</script>

{#key view.id}
  <div class="flex-grow-0 flex-shrink-0 mb-1">
    <TestQuery
      viewId={view.id}
      on:updatedTestQuery={handleAfterUpdateTestQuery}
    />
  </div>
  <div
    bind:this={gridContainer}
    use:contextMenuAction={contextMenuOptions}
    class="grid-container"
    class:contains-selected-grid={$activeView.id === view.id}
    style:min-height="0"
  >
    <div
      class="grid-holder"
      bind:this={gridHolder}
      use:watchResize={handleResize}
    />
    {#if viewObjects !== null && viewObjects.length > 0}
      <div class="grid-objects">
        {#each viewObjects as viewObject, index}
          <GridObject
            gridObject={viewObject}
            {index}
            onObjectChange={(objectData) => updateObject(index, objectData)}
          />
        {/each}
      </div>
    {/if}
  </div>
{/key}

<style lang="postcss">
  .grid-container {
    @apply flex-auto w-full overflow-hidden;
    border: 1px solid #3bc7ff00;
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

  .grid-objects {
    @apply h-full w-full flex z-40 pointer-events-none absolute top-0 left-0 overflow-hidden;
  }
</style>
