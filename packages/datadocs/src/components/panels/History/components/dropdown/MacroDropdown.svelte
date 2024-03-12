<script lang="ts">
  import { setContext, getContext } from "svelte";
  import type { MenuItemType } from "../../../../common/menu";
  import {
    MENU_DATA_ITEM_TYPE_ELEMENT,
    MENU_DATA_ITEM_STATE_ENABLED,
    CLOSE_ROOT_MENU_CONTEXT_NAME,
    Menu,
  } from "../../../../common/menu";
  import { CLOSE_DROPDOWN_CONTEXT_NAME } from "../../../../common/dropdown";
  import { activeMacroManager } from "../../../../../app/store/panels/writables";
  import type { MacroItem } from "../../types/macro/macro-item";
  import { handleMacroItem } from "../../../../../app/store/panels/store-history-panel";

  let macroItems: MacroItem[] = [];

  const closeDropdown: () => void = getContext(CLOSE_DROPDOWN_CONTEXT_NAME);

  function getMacroDropdownItems(): MenuItemType[] {
    let menuItems: MenuItemType[] = [];
    for (let idx = macroItems.length - 1; idx >= 0; idx--) {
      menuItems.push({
        type: MENU_DATA_ITEM_TYPE_ELEMENT,
        label: macroItems[idx].name,
        state: MENU_DATA_ITEM_STATE_ENABLED,
        action: () => {
          handleMacroItem(macroItems[idx].id);
          closeDropdown();
        },
      });
    }
    if (menuItems.length === 0) {
      menuItems.push({
        type: MENU_DATA_ITEM_TYPE_ELEMENT,
        label: "No macros yet...",
        state: "disabled",
        action: () => {},
      });
    }
    return menuItems;
  }

  $: macroManager = $activeMacroManager;
  $: macroManager,
    (() => {
      if (!macroManager) {
        return;
      }
      macroItems = macroManager.macroItems;
    })();
  setContext(CLOSE_ROOT_MENU_CONTEXT_NAME, closeDropdown);
</script>

<div class="dropdown">
  <Menu
    data={getMacroDropdownItems()}
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
