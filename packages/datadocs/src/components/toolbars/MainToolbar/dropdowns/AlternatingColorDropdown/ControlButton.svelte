<script lang="ts">
  import { onMount, tick } from "svelte";
  import type {
    GridKeyControlActionOptions,
    RegisterElementOptions,
  } from "../../../../common/key-control/gridKeyControl";
  import { registerElement } from "../../../../common/key-control/gridKeyControl";
  import { scrollVerticalToVisible } from "../../../../common/key-control/scrolling";

  export let ridx: number;
  export let cidx: number;
  export let gridKeyControlOptions: GridKeyControlActionOptions;
  export let scrollContainer: HTMLElement;

  let isSelected = false;
  let buttonElement: HTMLButtonElement;
  let containerElement: HTMLElement;

  async function onSelectCallback(byKey = true) {
    isSelected = true;
    if (buttonElement) buttonElement.focus();
    if (!byKey) return;
    await tick();
    scrollVerticalToVisible(scrollContainer, buttonElement);
  }

  function onDeselectCallback() {
    isSelected = false;
    if (buttonElement && document.activeElement === buttonElement)
      buttonElement.blur();
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

  onMount(() => {
    buttonElement = containerElement.querySelector("button");
  });
</script>

<div
  bind:this={containerElement}
  class="w-full h-full"
  use:registerElement={options}
>
  <slot selected={isSelected} />
</div>

<style lang="postcss">
  div :global(button) {
    @apply outline-none;
  }
</style>
