<script lang="ts">
  import { tick } from "svelte";
  import Icon from "../../../../common/icons/Icon.svelte";
  import type {
    GridKeyControlActionOptions,
    RegisterElementOptions,
  } from "../../../../common/key-control/gridKeyControl";
  import { registerElement } from "../../../../common/key-control/gridKeyControl";
  import { scrollVerticalToVisible } from "../../../../common/key-control/scrolling";

  export let gridKeyControlOptions: GridKeyControlActionOptions;
  export let ridx: number;
  export let cidx: number;
  export let handleAddNewCustomColor: () => void;
  export let scrollContainer: HTMLElement;

  let isSelected = false;
  let element: HTMLButtonElement;

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
    },
  };
</script>

<div class="color-container" class:selected={isSelected}>
  <button
    class="relative block w-full h-full rounded overflow-hidden outline-none border border-solid border-light-100"
    on:click={handleAddNewCustomColor}
    bind:this={element}
    use:registerElement={options}
    tabindex={-1}
  >
    <div class="w-full h-full flex flex-row items-center justify-center">
      <Icon icon="plus-sign" size="16px" />
    </div>
  </button>
</div>

<style lang="postcss">
  .color-container {
    @apply relative w-full h-[30px];
  }

  .color-container.selected::before {
    @apply absolute -top-1 -bottom-1 -left-1 -right-1 border-[2.5px] rounded-lg border-solid border-primary-datadocs-blue bg-transparent pointer-events-none;
    z-index: 10;
    content: "";
  }
</style>
