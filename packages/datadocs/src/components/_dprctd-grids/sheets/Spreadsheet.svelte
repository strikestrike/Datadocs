<script lang="ts">
  import { watchResize } from "svelte-watch-resize";
  import type { GridSheet } from "../../../app/store/store-sheets";
  import {
    getGrid,
    getGridInstance,
    updateGridStore,
  } from "../../../app/store/store-grid";
  import type {
    MenuElementType,
    MenuItemType,
    MenuListType} from "../../common/menu";
import {
  MENU_DATA_ITEM_STATE_ENABLED,
  MENU_DATA_ITEM_TYPE_ELEMENT,
  MENU_DATA_ITEM_TYPE_LIST,
  MENU_DATA_ITEM_TYPE_SEPARATOR,
} from "../../common/menu";
  import type {
    ContextMenuOptionsType} from "../../common/context-menu";
import {
  contextMenuAction
} from "../../common/context-menu";

  export let data: GridSheet;

  let gridContainer: HTMLElement;

  const contextMenuOptions: ContextMenuOptionsType = {
    menuItems: contextMenuItems,
    disabled: false,
    isAtMousePosition: true,
  };

  function contextMenuItems(clientX: number, clientY: number) {
    const grid = getGridInstance(data.id);
    if (!grid) return [];
    return createContextMenuListItems(
      grid.getContextMenuItems(clientX, clientY)
    );
  }

  function createContextMenuListItems(children: any[]) {
    const data: MenuItemType[] = [];
    children.forEach((item) => {
      if (item.type === 'divider') {
        data.push({ type: MENU_DATA_ITEM_TYPE_SEPARATOR });
      } else if (item.type === 'submenu') {
        data.push({
          type: MENU_DATA_ITEM_TYPE_LIST,
          label: item.title,
          // TODO: Enable icons once the alignment issue is gone.
          /* prefixIcon: item.prefixIcon, */
          state: MENU_DATA_ITEM_STATE_ENABLED,
          children: createContextMenuListItems(item.children()),
        } as MenuListType);
      } else if (item.type === 'action') {
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

  function handleResize(node: HTMLElement) {
    const newWidth = node.clientWidth;
    const newHeight = node.clientHeight;
    // console.log(">>>", newWidth, newHeight);
    const datagrid = getGrid();
    if (!datagrid) return;

    // Setting the width/height with property access through `datagrid.style`
    // causes `resize` invocations (which is relatively expensive), so we
    // avoid that using `setStyleProperty`.
    datagrid.setStyleProperty("width", newWidth + "px", false);
    datagrid.setStyleProperty("height", newHeight + "px", false);
    datagrid.resize(true);
  }

  function updateGrid() {
    if (!gridContainer) return;
    const grid = getGridInstance(data.id);
    gridContainer.innerHTML = "";
    updateGridStore(grid);
    gridContainer.appendChild(grid);
    grid.resize(true);
  }

  /*onMount(() => {
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
</script>

{#key data.id}
  <div
    bind:this={gridContainer}
    use:contextMenuAction={contextMenuOptions}
    use:watchResize={handleResize}
    class="grid-container h-full w-full flex"
    style:min-height="0"
  />
{/key}

<style>
  .grid-container :global(canvas-datagrid) {
    flex: 1;
    min-width: 0;
    min-height: 0;
  }
</style>
