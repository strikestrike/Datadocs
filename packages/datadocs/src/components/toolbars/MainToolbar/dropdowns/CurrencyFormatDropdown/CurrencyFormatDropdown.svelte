<script lang="ts">
  import { getContext, onMount, setContext } from "svelte";
  import { CLOSE_DROPDOWN_CONTEXT_NAME } from "../../../../common/dropdown";
  import type { MenuItemType } from "../../../../common/menu";
  import {
    MENU_DATA_ITEM_TYPE_ELEMENT,
    MENU_DATA_ITEM_STATE_ENABLED,
    CLOSE_ROOT_MENU_CONTEXT_NAME,
    Menu,
  } from "../../../../common/menu";
  import type {
    CellNumberCurrencyFormat,
    CurrencyType,
  } from "@datadocs/canvas-datagrid-ng";
  import { changeCellsDataFormat } from "../../../../../app/store/store-toolbar";
  import {
    previewCellsDataFormat,
    removeStylePreview,
  } from "../../../../../app/store/store-toolbar";

  const closeDropdown: () => void = getContext(CLOSE_DROPDOWN_CONTEXT_NAME);
  setContext(CLOSE_ROOT_MENU_CONTEXT_NAME, () => {});

  let isProcessing = false;

  function getCurrencyFormat(currency: CurrencyType): CellNumberCurrencyFormat {
    return { type: "number", format: "currency", currency, decimalPlaces: 2 };
  }

  async function changeDataFormat(currency: CurrencyType) {
    if (isProcessing) {
      return;
    }
    isProcessing = true;

    const dataFormat = getCurrencyFormat(currency);
    await changeCellsDataFormat(dataFormat);
  }

  const menuItems: MenuItemType[] = [
    {
      type: MENU_DATA_ITEM_TYPE_ELEMENT,
      label: '<span class="capitalize">dollar</span>',
      prefixIcon: "currency-format-dollar",
      state: MENU_DATA_ITEM_STATE_ENABLED,
      action: async () => {
        await changeDataFormat("usd");
        closeDropdown();
      },
      enterAction: () => {
        previewCellsDataFormat(getCurrencyFormat("usd"), "number", false);
      },
      leaveAction: () => {
        previewCellsDataFormat(null, "number", false);
      },
    },
    {
      type: MENU_DATA_ITEM_TYPE_ELEMENT,
      label: '<span class="capitalize">euro</span>',
      prefixIcon: "currency-format-euro",
      state: MENU_DATA_ITEM_STATE_ENABLED,
      action: async () => {
        await changeDataFormat("euro");
        closeDropdown();
      },
      enterAction: () => {
        previewCellsDataFormat(getCurrencyFormat("euro"), "number", false);
      },
      leaveAction: () => {
        previewCellsDataFormat(null, "number", false);
      },
    },
    {
      type: MENU_DATA_ITEM_TYPE_ELEMENT,
      label: '<span class="capitalize">pound</span>',
      prefixIcon: "currency-format-pound",
      state: MENU_DATA_ITEM_STATE_ENABLED,
      action: async () => {
        await changeDataFormat("pounds");
        closeDropdown();
      },
      enterAction: () => {
        previewCellsDataFormat(getCurrencyFormat("pounds"), "number", false);
      },
      leaveAction: () => {
        previewCellsDataFormat(null, "number", false);
      },
    },
  ];

  onMount(() => {
    previewCellsDataFormat(null, "number", false);
    return () => {
      removeStylePreview();
    };
  });
</script>

<div class="dropdown" class:disabled={isProcessing}>
  <Menu data={menuItems} isRoot isContextMenu={false} />
</div>

<style lang="postcss">
  .disabled :global(*) {
    @apply pointer-event-none;
  }
</style>
