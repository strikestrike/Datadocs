<script lang="ts">
  import { getContext, tick } from "svelte";
  import { getCurrentActiveWorkspace } from "../../../../../app/store/store-workspaces";
  import { resetWorkspace } from "./utils";
  import Icon from "../../../../common/icons/Icon.svelte";
  import { CLOSE_ROOT_MENU_CONTEXT_NAME } from "../../../../common/menu";
  import { registerElement } from "../../../../common/key-control/listKeyControl";
  import type {
    RegisterElementOptions,
    KeyControlActionOptions,
  } from "../../../../common/key-control/listKeyControl";
  import { scrollVerticalToVisible } from "../../../../common/key-control/scrolling";

  export let keyControlActionOptions: KeyControlActionOptions;
  export let index: number;
  export let scrollContainer: HTMLElement = null;

  const closeMainDropdown: () => void = getContext(CLOSE_ROOT_MENU_CONTEXT_NAME);
  const activeWorkspace = getCurrentActiveWorkspace();
  let element: HTMLElement;
  let isSelected = false;

  function handleResetWorkspaceClick() {
    resetWorkspace();
    closeMainDropdown();
  }

  async function onSelectCallback(byKey = true) {
    isSelected = true;
    if (!byKey) {
      return;
    }
    await tick();
    scrollVerticalToVisible(scrollContainer, element);
  }

  function onDeselectCallback() {
    isSelected = false;
  }

  function onEnterKeyCallback(event: KeyboardEvent) {
    if (event.key === "Enter" && isSelected) {
      handleResetWorkspaceClick();
    }
  }

  const options: RegisterElementOptions = {
    config: {
      isSelected: false,
      index,
      onSelectCallback,
      onDeselectCallback,
      onEnterKeyCallback,
    },
    configList: keyControlActionOptions.configList,
    index,
  };
</script>

<div
  bind:this={element}
  class="mx-1.5 px-3.5 py-1.5 rounded cursor-pointer"
  class:selected={isSelected}
  on:click={handleResetWorkspaceClick}
  use:registerElement={options}
>
<div class="flex flex-row items-center justify-start w-full">
  <div class="mr-2 flex-shrink-0">
    <Icon icon="top-menu-view-reset" size="18px" fill="none"/>
  </div>

  <div class="text-13px h-5 font-medium flex-shrink whitespace-nowrap overflow-hidden overflow-ellipsis">
    Reset {activeWorkspace.name}
  </div>
</div>
</div>

<style lang="postcss">
  .selected {
    @apply bg-dropdown-item-hover-bg;
  }
</style>
