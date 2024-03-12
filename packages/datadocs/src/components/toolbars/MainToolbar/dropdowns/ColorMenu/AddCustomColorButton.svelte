<script lang="ts">
  import { getContext, tick } from "svelte";
  import { OPEN_COLOR_PICKER_MENU } from "../default";
  import Icon from "../../../../common/icons/Icon.svelte";
  import type {
    GridKeyControlActionOptions,
    RegisterElementOptions,
  } from "../../../../common/key-control/gridKeyControl";
  import { registerElement } from "../../../../common/key-control/gridKeyControl";
  import { scrollVerticalToVisible } from "../../../../common/key-control/scrolling";

  export let gridKeyControlOptions: GridKeyControlActionOptions;
  export let scrollContainer: HTMLElement = null;
  export let ridx: number;
  export let cidx: number;

  const openColorPickerMenu = getContext(OPEN_COLOR_PICKER_MENU);
  const buttonCircle = `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="8" r="7.5" stroke="#3BC7FF"/>
    </svg>
  `;
  let isSelected = false;
  let element: HTMLElement;

  function handleAddCustomColor() {
    if (typeof openColorPickerMenu === "function") {
      openColorPickerMenu();
    }
  }

  async function onSelectCallback(byKey = true) {
    isSelected = true;
    element.focus();
    if (!byKey) return;
    await tick();
    scrollVerticalToVisible(scrollContainer, element);
  }

  function onDeselectCallback() {
    if (document.activeElement === element) element.blur();
    isSelected = false;
  }

  const options: RegisterElementOptions = {
    gridKeyControlOptions,
    ridx,
    cidx,
    config: {
      ridx,
      cidx,
      isSelected,
      onDeselectCallback,
      onSelectCallback,
    }
  };
</script>

<button
  class="relative flex flex-row items-center justify-center w-4 h-4 rounded-full outline-none border-none cursor-pointer"
  class:selected={isSelected}
  use:registerElement={options}
  bind:this={element}
  on:click={handleAddCustomColor}
  tabindex={-1}
>
  <div class="absolute w-4 h-4 left-0 right-0 top-0 bottom-0 pointer-events-none">
    {@html buttonCircle}
  </div>

  <div class="p-1">
    <Icon icon="toolbar-add-custom-color" size="8px" fill="none"/>
  </div>
</button>

<style lang="postcss">
  .selected {
    background-color: #f0f0f0;
    box-shadow: 0px 0px 3px 1px #bdc1c6;
  }
</style>
