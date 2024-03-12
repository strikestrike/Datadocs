<script lang="ts">
  import { setContext, getContext } from "svelte";
  import type { MenuItemType } from "../../../../common/menu";
  import {
    MENU_DATA_ITEM_TYPE_ELEMENT,
    MENU_DATA_ITEM_STATE_ENABLED,
    MENU_DATA_ITEM_STATE_DISABLED,
    CLOSE_ROOT_MENU_CONTEXT_NAME,
    Menu,
  } from "../../../../common/menu";
  import { CLOSE_DROPDOWN_CONTEXT_NAME } from "../../../../common/dropdown";
  import { getMergeIcon } from "../default";
  import {
    unmergeCells,
    mergeCells,
  } from "../../../../../app/store/store-toolbar";
  import {
    mergeCellsStateStore,
  } from "../../../../../app/store/writables";

  const closeDropdown: () => void = getContext(CLOSE_DROPDOWN_CONTEXT_NAME);

  function getMergeDropdownItems(): MenuItemType[] {
    return [
      {
        type: MENU_DATA_ITEM_TYPE_ELEMENT,
        label: `Merge All`,
        prefixIcon: getMergeIcon("merge_all"),
        state: mergeCellsState.canMergeAll
          ? MENU_DATA_ITEM_STATE_ENABLED
          : MENU_DATA_ITEM_STATE_DISABLED,
        action: () => {
          mergeCells("center");
          closeDropdown();
        },
      },
      {
        type: MENU_DATA_ITEM_TYPE_ELEMENT,
        label: `Merge Vertically`,
        prefixIcon: getMergeIcon("merge_vertical"),
        state: mergeCellsState.canMergeDirectionally
          ? MENU_DATA_ITEM_STATE_ENABLED
          : MENU_DATA_ITEM_STATE_DISABLED,
        action: () => {
          mergeCells("vertical");
          closeDropdown();
        },
      },
      {
        type: MENU_DATA_ITEM_TYPE_ELEMENT,
        label: `Merge Horizontally`,
        prefixIcon: getMergeIcon("merge_horizontal"),
        state: mergeCellsState.canMergeDirectionally
          ? MENU_DATA_ITEM_STATE_ENABLED
          : MENU_DATA_ITEM_STATE_DISABLED,
        action: () => {
          mergeCells("horizontal");
          closeDropdown();
        },
      },
      {
        type: MENU_DATA_ITEM_TYPE_ELEMENT,
        label: `Unmerge`,
        prefixIcon: getMergeIcon("merge_unmerge"),
        state: mergeCellsState.canUnmerge
          ? MENU_DATA_ITEM_STATE_ENABLED
          : MENU_DATA_ITEM_STATE_DISABLED,
        action: () => {
          unmergeCells();
          closeDropdown();
        },
      },
    ];
  }

  $: mergeCellsState = $mergeCellsStateStore;
  setContext(CLOSE_ROOT_MENU_CONTEXT_NAME, closeDropdown);
</script>

<div class="dropdown">
  <Menu
    data={getMergeDropdownItems()}
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
