<script lang="ts">
  import type {
    GridHeader,
    NormalCellDescriptor,
    TableDescriptor,
    TableSummaryFn,
  } from "@datadocs/canvas-datagrid-ng";
  import type { DropdownTriggerRect } from "../../../../common/dropdown/type";
  import Dropdown from "../../../../common/dropdown/Dropdown.svelte";
  import {
    type GridKeyControlActionOptions,
    type GridKeyControlConfig,
    gridKeyControlAction,
  } from "../../../../common/key-control/gridKeyControl";
  import {
    CLOSE_ROOT_MENU_CONTEXT_NAME,
    MENU_DATA_ITEM_TYPE_ELEMENT,
    type MenuItemType,
  } from "../../../../common/menu";
  import Menu from "../../../../common/menu/Menu.svelte";
  import { setContext } from "svelte";
  import { ensureAsync } from "@datadocs/canvas-datagrid-ng/lib/data/data-source/await";
  import { getTableSummaryFn } from "@datadocs/canvas-datagrid-ng/lib/data/table/util";

  export let triggerRect: DropdownTriggerRect;
  export let table: TableDescriptor;
  export let header: GridHeader;
  export let currentFn: TableSummaryFn | undefined;
  export let availableFns: Readonly<TableSummaryFn>[];
  export let cell: NormalCellDescriptor;
  export let onClose: () => any;

  setContext(CLOSE_ROOT_MENU_CONTEXT_NAME, onClose);

  let wrapperElement: HTMLElement;
  let dropdownElement: HTMLElement;

  const configList: GridKeyControlConfig[][] = [];
  const gridKeyControlOptions: GridKeyControlActionOptions = {
    configList: configList,
  };

  const menuData = createMenuData();

  function createMenuData() {
    const data: MenuItemType[] = availableFns.map((fn) => {
      return {
        type: MENU_DATA_ITEM_TYPE_ELEMENT,
        label: fn.title,
        state: "enabled",
        active: fn.name == currentFn?.name,
        action() {
          applyFn(fn);
        },
      };
    });

    data.splice(0, 0, {
      type: MENU_DATA_ITEM_TYPE_ELEMENT,
      label: "None",
      state: "enabled",
      active: !currentFn,
      action() {
        applyFn();
      },
    });

    return data;
  }

  async function applyFn(fn?: TableSummaryFn) {
    const result = await ensureAsync(
      table.dataSource.setAggregationFn(header.id, fn?.name ?? null)
    );
    if (result) {
      currentFn = getTableSummaryFn(header);
    }
  }
</script>

<div bind:this={wrapperElement}>
  <Dropdown
    {wrapperElement}
    {triggerRect}
    {onClose}
    position="bottom"
    closeOnMouseDownOutside
    freeFormWidth
    freeFormHeight
  >
    <div
      bind:this={dropdownElement}
      use:gridKeyControlAction={gridKeyControlOptions}
      class="dropdown"
      tabindex="-1"
      slot="content"
    >
      <Menu data={menuData} isRoot />
    </div>
  </Dropdown>
</div>

<style lang="postcss">
  .dropdown {
    @apply flex flex-col justify-stretch relative bg-white rounded overflow-y-auto overflow-x-hidden text-[13px] min-w-[100px] h-full outline-none;
    box-shadow: 0px 5px 20px rgba(55, 84, 170, 0.16);
  }
</style>
