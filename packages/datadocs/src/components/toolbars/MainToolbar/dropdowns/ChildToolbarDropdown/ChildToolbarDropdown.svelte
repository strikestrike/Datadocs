<script lang="ts">
  import { getContext, setContext } from "svelte";
  import { CLOSE_DROPDOWN_CONTEXT_NAME } from "../../../../common/dropdown";
  import type { ChildToolbar } from "../default";
  import type { MenuItemType } from "../../../../common/menu";
  import {
    MENU_DATA_ITEM_TYPE_ELEMENT,
    MENU_DATA_ITEM_STATE_ENABLED,
    CLOSE_ROOT_MENU_CONTEXT_NAME,
    Menu,
  } from "../../../../common/menu";
  import { switchChildToolbar } from "../../../../../app/store/store-toolbar"

  const closeDropdown: () => void = getContext(CLOSE_DROPDOWN_CONTEXT_NAME);
  setContext(CLOSE_ROOT_MENU_CONTEXT_NAME, closeDropdown);
  const childToolbarList: ChildToolbar[] = ["home", "image"];

  function handleSelectChildToolbar(value: ChildToolbar) {
    switchChildToolbar(value);
  }

  function getMenuItems() {
    const menuItems: MenuItemType[] = [];
    for (let i = 0; i < childToolbarList.length; i++) {
      const childToolbar = childToolbarList[i];
      menuItems.push({
        type: MENU_DATA_ITEM_TYPE_ELEMENT,
        label: `<span class="capitalize">${childToolbar}</span>`,
        state: MENU_DATA_ITEM_STATE_ENABLED,
        action: () => {
          handleSelectChildToolbar(childToolbar);
          closeDropdown();
        },
      });
    }
    return menuItems;
  }
</script>

<div class="dropdown">
  <Menu data={getMenuItems()} isRoot isContextMenu={false} />
</div>

<style lang="postcss">
  .dropdown :global(.menu-content) {
    min-width: 100px !important;
  }
</style>
