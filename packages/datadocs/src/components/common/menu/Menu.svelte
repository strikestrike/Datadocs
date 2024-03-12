<script lang="ts">
  import {
    MENU_DATA_ITEM_TYPE_ELEMENT,
    MENU_DATA_ITEM_TYPE_LIST,
    MENU_DATA_ITEM_TYPE_DROPDOWN,
    MENU_CLASSNAME,
    MOUSE_ON_ROOT_MENU_CONTEXT_NAME,
    MOUSE_OVER_TARGET_CONTEXT_NAME,
    IS_IN_LEAF_MENU_CONTEXT_NAME,
    IS_IN_PARENT_OF_LEAF_MENU_CONTEXT_NAME,
    SUBMENU_CHANGE_CONTEXT_NAME,
    CONTROL_MENU_BY_KEY_CONTEXT_NAME,
    MENU_DATA_ITEM_TYPE_COMPONENT,
    MENU_DATA_ITEM_TYPE_TITLE,
  } from "./constant";
  import type { MenuItemType } from "./constant";
  import MenuElement from "./MenuElement.svelte";
  import MenuList from "./MenuList.svelte";
  import MenuSeparator from "./MenuSeparator.svelte";
  import { onMount, setContext, getContext } from "svelte";
  import type { Writable } from "svelte/store";
  import { writable } from "svelte/store";
  import type {
    KeyControlActionOptions,
    KeyControlConfig,
  } from "../key-control/listKeyControl";
  import { keyControlAction } from "../key-control/listKeyControl";
  import DropdownSectionTitle from "../../toolbars/MainToolbar/dropdowns/common/DropdownSectionTitle.svelte";

  export let data: MenuItemType[];
  export let menuClass = "";
  export let isContextMenu = false;
  export let isRoot = false;
  /**
   * Indicate that the menu is in a dropdown, so we don't need to wrap
   * menu with dropdown style.
   */
  export let embeded = false;
  export let allowMinimalWidth = false;

  let isLeafMenu = true;
  let isParentOfLeafMenu = false;
  let menuElement: HTMLElement;
  let mouseOnMenuDropdown: Writable<boolean>;
  let previousMouseOnDropdown: boolean;
  let mouseOverTarget: Writable<HTMLElement>;
  let handleWindowMouseOver: (e: MouseEvent) => void;
  let handleParentSubmenuChange: Function;
  let controlMenuByKey = false;
  let handleWindowKeydown: (e: KeyboardEvent) => void;

  if (isRoot) {
    mouseOnMenuDropdown = writable(false);
    previousMouseOnDropdown = false;
    mouseOverTarget = writable(null);

    handleWindowMouseOver = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const isOverDropdown = menuElement.contains(target);

      if (previousMouseOnDropdown !== isOverDropdown) {
        mouseOnMenuDropdown.set(isOverDropdown);
        previousMouseOnDropdown = isOverDropdown;
      }

      if (isOverDropdown) {
        controlMenuByKey = false;
      }

      mouseOverTarget.set(target);
    };

    handleWindowKeydown = (event: KeyboardEvent) => {
      if (
        event.key === "ArrowDown" ||
        event.key === "ArrowUp" ||
        event.key === "Enter" ||
        event.key === "ArrowLeft" ||
        event.key === "ArrowRight"
      ) {
        controlMenuByKey = true;
      }
    };

    setContext(MOUSE_ON_ROOT_MENU_CONTEXT_NAME, mouseOnMenuDropdown);
    setContext(MOUSE_OVER_TARGET_CONTEXT_NAME, mouseOverTarget);
    setContext(CONTROL_MENU_BY_KEY_CONTEXT_NAME, () => {
      return controlMenuByKey;
    });
  } else {
    handleParentSubmenuChange = getContext(SUBMENU_CHANGE_CONTEXT_NAME);
  }

  function onSubmenuChange() {
    const numberOfChildMenu = menuElement.querySelectorAll(
      `.${MENU_CLASSNAME}`
    ).length;
    isLeafMenu = numberOfChildMenu === 0;
    isParentOfLeafMenu = numberOfChildMenu === 1;

    onParentSubmenuChange();
  }

  function onParentSubmenuChange() {
    if (typeof handleParentSubmenuChange === "function") {
      handleParentSubmenuChange();
    }
  }

  onMount(() => {
    onParentSubmenuChange();
    if (isRoot) {
      document.addEventListener("mouseover", handleWindowMouseOver, true);
      document.addEventListener("keydown", handleWindowKeydown, true);
    }
    return () => {
      onParentSubmenuChange();
      if (isRoot) {
        document.removeEventListener("mouseover", handleWindowMouseOver, true);
        document.removeEventListener("keydown", handleWindowKeydown, true);
      }
    };
  });

  // key control
  const configList: KeyControlConfig[] = [];
  let disabledKeyControl = false;
  let keyControlOptions: KeyControlActionOptions = {
    configList: configList,
    disabled: disabledKeyControl,
  };

  setContext(IS_IN_LEAF_MENU_CONTEXT_NAME, () => {
    return isLeafMenu;
  });
  setContext(IS_IN_PARENT_OF_LEAF_MENU_CONTEXT_NAME, () => {
    return isParentOfLeafMenu;
  });
  setContext(SUBMENU_CHANGE_CONTEXT_NAME, onSubmenuChange);

  $: disabledKeyControl = !isLeafMenu;
  $: keyControlOptions = {
    ...keyControlOptions,
    disabled: disabledKeyControl,
  };
</script>

<div
  bind:this={menuElement}
  class="{MENU_CLASSNAME} {!embeded &&
    'default-dropdown-box-shadow h-[inherit] overflow-y-auto overflow-x-hidden bg-white rounded'} {menuClass}"
  use:keyControlAction={keyControlOptions}
>
  <div
    class="menu-content flex flex-col {allowMinimalWidth
      ? ''
      : isContextMenu
      ? 'min-w-[150px] max-w-[300px]'
      : 'min-w-[200px]'}"
  >
    <div class="w-full flex-shrink-0 h-1.5" />

    {#each data as item, index}
      {#if item.type === MENU_DATA_ITEM_TYPE_ELEMENT}
        <MenuElement
          data={item}
          {isContextMenu}
          {index}
          keyControlActionOptions={keyControlOptions}
          scrollContainer={menuElement}
        />
      {:else if item.type === MENU_DATA_ITEM_TYPE_LIST || item.type === MENU_DATA_ITEM_TYPE_DROPDOWN}
        <MenuList
          data={item}
          {isContextMenu}
          {index}
          keyControlActionOptions={keyControlOptions}
          scrollContainer={menuElement}
        />
      {:else if item.type === MENU_DATA_ITEM_TYPE_COMPONENT}
        <svelte:component
          this={item.component}
          keyControlActionOptions={keyControlOptions}
          {index}
          {...item.props}
        />
      {:else if item.type === MENU_DATA_ITEM_TYPE_TITLE}
        <DropdownSectionTitle title={item.title} spacing="m my-1 mx-2.5" />
      {:else}
        <MenuSeparator />
      {/if}
    {/each}

    <div class="w-full flex-shrink-0 h-1.5" />
  </div>
</div>
