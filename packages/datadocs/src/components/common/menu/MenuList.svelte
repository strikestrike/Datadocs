<script lang="ts">
  import { getContext, onMount, tick } from "svelte";
  import type { Writable } from "svelte/store";
  import type { MenuListType, MenuDropdownType } from "./constant";
  import { MENU_DATA_ITEM_TYPE_LIST } from "./constant";
  import { MENU_DATA_ITEM_STATE_DISABLED } from "./constant";
  import Icon from "../icons/Icon.svelte";
  import { DropdownWrapper } from "../dropdown";
  import Menu from "./Menu.svelte";
  import MenuDropdown from "./MenuDropdown.svelte";
  import {
    MENU_CLASSNAME,
    MENU_LIST_CLASSNAME,
    MOUSE_ON_ROOT_MENU_CONTEXT_NAME,
    MOUSE_OVER_TARGET_CONTEXT_NAME,
    IS_IN_LEAF_MENU_CONTEXT_NAME,
    IS_IN_PARENT_OF_LEAF_MENU_CONTEXT_NAME,
    CONTROL_MENU_BY_KEY_CONTEXT_NAME,
  } from "./constant";
  import type {
    RegisterElementOptions,
    KeyControlActionOptions,
  } from "../key-control/listKeyControl";
  import { registerElement } from "../key-control/listKeyControl";
  import { scrollVerticalToVisible } from "../key-control/scrolling";

  export let data: MenuListType | MenuDropdownType;
  export let isContextMenu: boolean;
  export let keyControlActionOptions: KeyControlActionOptions;
  export let index: number;
  export let scrollContainer: HTMLElement = null;

  const TOGGLE_SUBMENU_DELAY = 220; // 220ms, a delay time for toggling open/close submenu
  const isMouseOnRootDropdownStore: Writable<boolean> = getContext(
    MOUSE_ON_ROOT_MENU_CONTEXT_NAME,
  );
  const mouseOverTargetStore: Writable<HTMLElement> = getContext(
    MOUSE_OVER_TARGET_CONTEXT_NAME,
  );
  const isInLeafMenu: Function = getContext(IS_IN_LEAF_MENU_CONTEXT_NAME);
  const isInParentOfLeafMenu: Function = getContext(
    IS_IN_PARENT_OF_LEAF_MENU_CONTEXT_NAME,
  );
  const controlMenuByKey: Function = getContext(
    CONTROL_MENU_BY_KEY_CONTEXT_NAME,
  );

  let menuListElement: HTMLElement;
  let buttonElement: HTMLElement;
  let showDropdown = false;
  let shouldSubmenuOpen = false;
  const isDisabled: boolean = data.state === MENU_DATA_ITEM_STATE_DISABLED;
  let isStyleActive = false;
  let openSubmenuTimeout = null;
  let closeSubmenuTimeout = null;
  let isSelected = false;

  function toggleOpenSubmenu(value: boolean) {
    if (shouldSubmenuOpen === value) {
      return;
    }

    shouldSubmenuOpen = value;
  }

  function notifyOpenSubmenu() {
    // console.log("notify OPEN submenu =============== ");
    if (closeSubmenuTimeout) {
      clearTimeout(closeSubmenuTimeout);
      closeSubmenuTimeout = null;
    }

    if (openSubmenuTimeout) {
      return;
    }

    openSubmenuTimeout = setTimeout(() => {
      openSubmenuTimeout = null;

      if (checkShouldDropdownOpen()) {
        toggleOpenSubmenu(true);
      }
    }, TOGGLE_SUBMENU_DELAY);
  }

  function notifyCloseSubmenu() {
    // console.log("notify CLOSE submenu =============== ");
    if (openSubmenuTimeout) {
      clearTimeout(openSubmenuTimeout);
      openSubmenuTimeout = null;
    }

    if (closeSubmenuTimeout) {
      return;
    }

    closeSubmenuTimeout = setTimeout(() => {
      closeSubmenuTimeout = null;

      if (!checkShouldDropdownOpen()) {
        toggleOpenSubmenu(false);
      }
    }, TOGGLE_SUBMENU_DELAY);
  }

  function handleButtonMouseOver() {
    if (isDisabled) {
      return;
    }

    notifyOpenSubmenu();
  }

  function handleButtonMouseLeave() {
    notifyCloseSubmenu();
  }

  function checkShouldDropdownOpen() {
    if (!menuListElement || !mouseOverTarget) {
      return false;
    }

    return (
      (showDropdown && !isOnMenuDropdown) || // keep menu open if already open and mouse is outside the root dropdown
      menuListElement.contains(mouseOverTarget) || // keep menu open if mouse is on the element inside the menu list element
      (showDropdown && checkMouseOverTargetContainMenuList()) // keep menu open if already open and mouse is on element that contain menu list element
    );
  }

  function getClosestParrent(classname: string): HTMLElement {
    if (!mouseOverTarget) {
      return null;
    }

    const parent = mouseOverTarget.closest(`.${classname}`) as HTMLElement;
    return parent;
  }

  function checkMouseOverTargetContainMenuList() {
    if (!mouseOverTarget || !menuListElement) {
      return false;
    }

    if (mouseOverTarget.contains(menuListElement)) {
      return true;
    }

    const menu = getClosestParrent(MENU_CLASSNAME);
    const list = getClosestParrent(MENU_LIST_CLASSNAME);

    return (
      !!menu && !!list && menu.contains(list) && list.contains(menuListElement)
    );
  }

  $: isOnMenuDropdown = $isMouseOnRootDropdownStore;

  $: showDropdown = !isDisabled && shouldSubmenuOpen;

  $: mouseOverTarget = $mouseOverTargetStore;

  $: isStyleActive =
    buttonElement &&
    menuListElement &&
    mouseOverTarget &&
    (buttonElement.contains(mouseOverTarget) ||
      (showDropdown &&
        (!isOnMenuDropdown ||
          menuListElement.contains(mouseOverTarget) ||
          checkMouseOverTargetContainMenuList())));

  $: if (showDropdown) {
    if (controlMenuByKey()) {
      // do nothing
    } else if (mouseOverTarget && !checkShouldDropdownOpen()) {
      notifyCloseSubmenu();
    }
  }

  // key control
  function handleKeyDown(event: KeyboardEvent) {
    switch (event.key) {
      case "Enter":
      case "ArrowRight": {
        if (isSelected && isInLeafMenu()) {
          toggleOpenSubmenu(true);
        }
        break;
      }
      case "ArrowLeft": {
        if (showDropdown && isInParentOfLeafMenu()) {
          toggleOpenSubmenu(false);

          // make sure the list item is selected in closing its' submenu
          isSelected = true;
          keyControlActionOptions.selectFromOutside(index);
        }
        break;
      }
      default:
        break;
    }
  }

  onMount(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  });

  async function onSelectCallback(byKey = true) {
    isSelected = true;
    if (!byKey) {
      return;
    }
    await tick();
    scrollVerticalToVisible(scrollContainer, buttonElement);
  }

  function onDeselectCallback() {
    isSelected = false;
    notifyCloseSubmenu();

    if (controlMenuByKey()) {
      isStyleActive = false;
    }
  }

  const options: RegisterElementOptions = {
    config: {
      isSelected: false,
      index,
      onSelectCallback,
      onDeselectCallback,
    },
    configList: keyControlActionOptions.configList,
    index,
    disabled: isDisabled,
  };
</script>

<div
  bind:this={menuListElement}
  on:mouseleave={handleButtonMouseLeave}
  class={MENU_LIST_CLASSNAME}
>
  <DropdownWrapper
    show={showDropdown}
    position="left-right"
    distanceToDropdown={-1}
    distanceToEdge={1}
    closeOnMouseDownOutside={false}
  >
    <div
      slot="button"
      class="flex flex-row w-full items-center justify-between mx-1.5 cursor-pointer rounded"
      class:disabled={isDisabled}
      class:active={isStyleActive || isSelected}
      style={data.style ?? ""}
      bind:this={buttonElement}
      on:mouseover={handleButtonMouseOver}
      on:focus
      use:registerElement={options}
    >
      {#if typeof data.label === "string"}
        <div class="flex flex-row pl-3.5 py-1.5 pointer-events-none">
          {#if data.prefixIcon}
            <div class="mr-1">
              <Icon
                class={data.type === MENU_DATA_ITEM_TYPE_LIST
                  ? data.prefixIconClass
                  : ""}
                icon={data.prefixIcon}
                size={isContextMenu ? "14px" : "20px"}
                fill={!isDisabled ? "currentColor" : "#A7B0B5"}
              />
            </div>
          {/if}

          <div class="font-medium leading-5 text-13px">
            {@html data.label}
          </div>
        </div>
      {:else}
        <svelte:component this={data.label} />
      {/if}

      <div class="ml-3 pr-2 pointer-events-none">
        <Icon icon="top-submenu-arrow" width="14px" height="14px" />
      </div>
    </div>

    <div
      slot="content"
      class="h-[inherit]"
      class:hidden={data.type === MENU_DATA_ITEM_TYPE_LIST &&
        (!data?.children || data.children.length === 0)}
    >
      {#if data.type === MENU_DATA_ITEM_TYPE_LIST}
        <Menu data={data.children} {isContextMenu} />
      {:else}
        <MenuDropdown>
          <svelte:component this={data.dropdown} />
        </MenuDropdown>
      {/if}
    </div>
  </DropdownWrapper>
</div>

<style lang="postcss">
  .active {
    @apply bg-dropdown-item-hover-bg;
  }

  .disabled {
    color: #a7b0b5;
    pointer-events: none;
  }
</style>
