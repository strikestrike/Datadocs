<script lang="ts">
  import Icon from "../../../../common/icons/Icon.svelte";
  import type {
    MenuItemType,
    MenuElementType,
  } from "../../../../common/menu";
  import {
    MENU_DATA_ITEM_TYPE_ELEMENT,
    MENU_DATA_ITEM_STATE_ENABLED,
    CLOSE_ROOT_MENU_CONTEXT_NAME,
    Menu,
  } from "../../../../common/menu";
  import { DropdownWrapper } from "../../../../common/dropdown";
  import type { ConnectionSource } from "./type";
  import { setContext } from "svelte";

  export let connectionSource: ConnectionSource;

  let showDropdown = false;
  const listConnSources: ConnectionSource[] = ["MongoDB", "MySQL", "PostgreSQL"];

  function getConnectionDropdownItems(): MenuItemType[] {
    return listConnSources.map((source: ConnectionSource): MenuElementType => {
      return {
        type: MENU_DATA_ITEM_TYPE_ELEMENT,
        label: `<span class="text-dark-200 text-11px">${source}</span>`,
        state: MENU_DATA_ITEM_STATE_ENABLED,
        action: () => {
          connectionSource = source;
          closeDropdown();
        },
      };
    });
  }

  function closeDropdown() {
    showDropdown = false;
  }

  setContext(CLOSE_ROOT_MENU_CONTEXT_NAME, closeDropdown);
</script>

<DropdownWrapper
  bind:show={showDropdown}
  distanceToDropdown={4}
  closeOnEscapeKey={true}
  closeOnMouseDownOutside={true}
>
  <button
    slot="button"
    type="button"
    class="focusable relative w-full px-4 text-11px font-medium h-10 flex flex-row items-center border border-solid rounded border-light-100"
    on:click={() => {
      showDropdown = !showDropdown;
    }}
  >
    <span>{connectionSource}</span>
    <div
      class="absolute top-0 bottom-0 right-[18px] flex flex-row items-center"
    >
      <Icon icon="toolbar-arrow-dropdown" width="7px" height="4px" />
    </div>
  </button>

  <div class="p-0 m-0 h-[inherit]" slot="content">
    <Menu
      data={getConnectionDropdownItems()}
      menuClass="min-w-[220px]"
      isRoot
      isContextMenu={false}
    />
  </div>
</DropdownWrapper>

<style lang="postcss">
  button,
  button:active,
  button:hover,
  button:focus {
    border: 1px solid #E9EDF0!important;
  }
</style>
