<script lang="ts">
  import { getContext, setContext } from "svelte";
  import { DropdownWrapper } from "../../common/dropdown";
  import MenuDropdown from "./MenuDropdown.svelte";
  import type { MenuItemType } from "../../common/menu";
  import { CLOSE_ROOT_MENU_CONTEXT_NAME } from "../../common/menu";

  export let label: string;
  export let data: MenuItemType[] = [];
  export let menuClass = "min-w-[240px] max-w-[300px]";

  let showDropdown = false;
  const menuLeftContext: any = getContext("MenuLeftContext");

  function handleMouseEnter() {
    if (!menuLeftContext.hasActiveMenu || showDropdown) {
      return;
    }

    menuLeftContext.closeActiveMenu();
    toggleDropdownActive(true);
  }

  function toggleDropdownActive(value?: boolean) {
    if (typeof value === "undefined") {
      showDropdown = !showDropdown;
    } else {
      showDropdown = value;
    }
  }

  function handleButtonMouseDown() {
    toggleDropdownActive();
  }

  function handleOpenDropdown() {
    menuLeftContext.hasActiveMenu = true;
    menuLeftContext.closeActiveMenu = () => {
      toggleDropdownActive(false);
    };
  }

  function handleCloseDropdown() {
    menuLeftContext.hasActiveMenu = false;
    menuLeftContext.closeActiveMenu = () => {};
  }

  function closeDropdown() {
    toggleDropdownActive(false);
  }

  $: if (showDropdown) {
    handleOpenDropdown();
  } else {
    handleCloseDropdown();
  }

  setContext(CLOSE_ROOT_MENU_CONTEXT_NAME, closeDropdown);
</script>

{#if data.length > 0}
  <DropdownWrapper
    bind:show={showDropdown}
    distanceToDropdown={4}
    closeOnEscapeKey={true}
    closeOnMouseDownOutside={true}
  >
    <div
      class="menu-item px-2 py-0.5 rounded cursor-pointer"
      class:active={showDropdown}
      on:mousedown={handleButtonMouseDown}
      on:mouseenter={handleMouseEnter}
      slot="button"
    >
      <div class="text-white font-normal text-12px">
        {label}
      </div>
    </div>

    <MenuDropdown {data} slot="content" {menuClass} />
  </DropdownWrapper>
{:else}
  <div
    class="menu-item px-2 py-0.5 rounded cursor-pointer"
    class:active={showDropdown}
    on:mousedown={handleButtonMouseDown}
  >
    <div class="text-white font-normal text-12px">
      {label}
    </div>
  </div>
{/if}

<style lang="postcss">
  .menu-item:hover,
  .active {
    background: rgba(255, 255, 255, 0.2);
  }

  .menu-item {
    letter-spacing: 0.2px;
  }
</style>
