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
  import { supportedLocaleList } from "../../../../../app/store/parser/freeform/constants";
  import { localeStore } from "../../../../../app/store/writables";
  import { changeLocale } from "../../../../../app/store/store-toolbar";

  const closeDropdown: () => void = getContext(CLOSE_DROPDOWN_CONTEXT_NAME);

  function getLocaleDropdownItems(): MenuItemType[] {
    let menuItemList: MenuItemType[] = [];
    for (const [key, localeitem] of Object.entries(supportedLocaleList)) {
      menuItemList.push({
        type: MENU_DATA_ITEM_TYPE_ELEMENT,
        label: localeitem.name,
        state: MENU_DATA_ITEM_STATE_ENABLED,
        action: () => {
          if (!locale || locale.locale !== key) {
            changeLocale(key);
          }
          closeDropdown();
        },
        active: key === locale.locale,
      });
    }
    return menuItemList;
  }

  setContext(CLOSE_ROOT_MENU_CONTEXT_NAME, closeDropdown);

  $: locale = $localeStore;
</script>

<div class="dropdown">
  <Menu
    data={getLocaleDropdownItems()}
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
