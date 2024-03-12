<script lang="ts">
  import { setContext, getContext } from "svelte";
  import type { MenuItemType } from "../../../../common/menu";
  import {
    MENU_DATA_ITEM_TYPE_ELEMENT,
    MENU_DATA_ITEM_STATE_ENABLED,
    // MENU_DATA_ITEM_STATE_DISABLED,
    CLOSE_ROOT_MENU_CONTEXT_NAME,
    Menu,
  } from "../../../../common/menu";
  import { CLOSE_DROPDOWN_CONTEXT_NAME } from "../../../../common/dropdown";
  import { clearCells } from "../../../../../app/store/store-toolbar";

  const closeDropdown: () => void = getContext(CLOSE_DROPDOWN_CONTEXT_NAME);

  function getClearCellsDropdownItems(): MenuItemType[] {
    return [
      {
        type: MENU_DATA_ITEM_TYPE_ELEMENT,
        label: "Clear All",
        // prefixIcon: "empty-rect",
        state: MENU_DATA_ITEM_STATE_ENABLED,
        action: () => {
          clearCells("all");
          closeDropdown();
        },
      },
      {
        type: MENU_DATA_ITEM_TYPE_ELEMENT,
        label: "Clear Contents",
        // prefixIcon: "empty-rect",
        state: MENU_DATA_ITEM_STATE_ENABLED,
        action: () => {
          clearCells("content");
          closeDropdown();
        },
      },
      {
        type: MENU_DATA_ITEM_TYPE_ELEMENT,
        label: "Clear Formats",
        // prefixIcon: "empty-rect",
        state: MENU_DATA_ITEM_STATE_ENABLED,
        action: () => {
          clearCells("format");
          closeDropdown();
        },
      },
    ];
  }

  setContext(CLOSE_ROOT_MENU_CONTEXT_NAME, closeDropdown);
</script>

<div class="dropdown">
  <Menu
    data={getClearCellsDropdownItems()}
    menuClass="min-w-[220px]"
    isRoot
    isContextMenu={false}
  />
</div>

<style lang="postcss">
  .dropdown :global(.menu-element:not(.disabled) svg) {
    @apply text-dark-100;
  }
</style>
