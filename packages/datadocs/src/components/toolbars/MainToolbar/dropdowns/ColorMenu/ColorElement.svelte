<script lang="ts">
  import { getContext, tick } from "svelte";
  import {
    SELECT_COLOR_CONTEXT_NAME,
    HOVER_ON_COLOR_CONTEXT_NAME,
    GET_CURRENT_ACTIVE_COLOR,
    emptyFunction,
  } from "../default";
  import { normalizeHexColor } from "../utils/colorUtils";
  import type {
    GridKeyControlActionOptions,
    RegisterElementOptions,
  } from "../../../../common/key-control/gridKeyControl";
  import { registerElement } from "../../../../common/key-control/gridKeyControl";
  import { scrollVerticalToVisible } from "../../../../common/key-control/scrolling";

  export let color: string; // hex value of color element
  export let value: string = color; // name of color element, name is usually equal hex value, except for standard colors
  export let gridKeyControlOptions: GridKeyControlActionOptions;
  export let scrollContainer: HTMLElement = null;
  export let ridx: number;
  export let cidx: number;

  const selectColor: (v: string) => void =
    getContext(SELECT_COLOR_CONTEXT_NAME) || emptyFunction;
  const hoverOnColor: (v: string) => void =
    getContext(HOVER_ON_COLOR_CONTEXT_NAME) || emptyFunction;
  const getCurrentActiveColor: () => string =
    getContext(GET_CURRENT_ACTIVE_COLOR) || emptyFunction;
  const currentActiveColor = getCurrentActiveColor();
  const borderColor =
    normalizeHexColor(color) === normalizeHexColor("#ffffff")
      ? "#F7F7F7"
      : "transparent";
  const isActive =
    value !== color
      ? value === currentActiveColor
      : normalizeHexColor(color) === normalizeHexColor(currentActiveColor);
  let isSelected = false;
  let element: HTMLElement = null;

  function handleSelectColor() {
    selectColor(value);
  }

  async function onSelectCallback(byKey = true) {
    isSelected = true;
    element.focus();
    hoverOnColor(value);
    if (!byKey) return;
    await tick();
    scrollVerticalToVisible(scrollContainer, element);
  }

  function onDeselectCallback() {
    if (document.activeElement === element) element.blur();
    isSelected = false;
    hoverOnColor(null);
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
    },
  };
</script>

<button
  class="relative w-4 h-4 p-0 m-0 outline-none border-none bg-transparent"
  on:click={handleSelectColor}
  use:registerElement={options}
  bind:this={element}
  tabindex={-1}
>
  <div
    class="color-block"
    class:selected={isSelected}
    style="background-color: {color}; border-color: {isActive
      ? 'transparent'
      : borderColor};"
    data-grideditorcompanion="true"
  />

  {#if isActive}
    <div class="active-border" />
  {/if}
</button>

<style lang="postcss">
  .active-border {
    @apply absolute w-5 h-5 pointer-events-none;
    border: 1.5px solid #3bc7ff;
    border-radius: 50%;
    left: -2px;
    top: -2px;
  }

  .color-block {
    @apply w-4 h-4 cursor-pointer;
    border-radius: 50%;
    border: 1px solid transparent;
    box-sizing: border-box;
  }

  .selected {
    box-shadow: 0px 0px 3px 1px #bdc1c6;
  }
</style>
