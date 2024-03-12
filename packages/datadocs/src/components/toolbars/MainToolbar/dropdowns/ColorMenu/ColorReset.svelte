<script lang="ts">
  import { getContext, tick } from "svelte";
  import { RESET_COLOR_CONTEXT_NAME } from "../default";
  import type {
    GridKeyControlActionOptions,
    RegisterElementOptions,
  } from "../../../../common/key-control/gridKeyControl";
  import { registerElement } from "../../../../common/key-control/gridKeyControl";
  import { scrollVerticalToVisible } from "../../../../common/key-control/scrolling";

  export let gridKeyControlOptions: GridKeyControlActionOptions;
  export let startRowIndex: number;
  export let scrollContainer: HTMLElement = null;

  const resetColor: () => void = getContext(RESET_COLOR_CONTEXT_NAME);
  let isSelected = false;
  let element: HTMLElement;

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
    ridx: startRowIndex,
    cidx: 0,
    config: {
      ridx: startRowIndex,
      cidx: 0,
      isSelected,
      onDeselectCallback,
      onSelectCallback,
    }
  };
</script>

<button
  class:selected={isSelected}
  on:click={resetColor}
  use:registerElement={options}
  bind:this={element}
  tabindex={-1}
>
  Reset
</button>

<style lang="postcss">
  button {
    @apply w-full py-1.5 rounded-sm text-center text-11px font-medium cursor-pointer outline-none border-none;
    line-height: 17px;
    background-color: #f7f9fa;
    color: #a7b0b5;
  }

  .selected {
    background-color: #f0f0f0;
  }
</style>
