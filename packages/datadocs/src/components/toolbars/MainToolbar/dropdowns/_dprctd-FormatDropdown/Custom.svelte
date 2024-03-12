<script lang="ts">
  import { registerElement } from "../../../../common/key-control/listKeyControl";
  import type {
    RegisterElementOptions,
    KeyControlConfig,
  } from "../../../../common/key-control/listKeyControl";
  import { scrollVerticalToVisible } from "../../../../common/key-control/scrolling";
  import { tick } from "svelte";

  export let index: number;
  export let configList: KeyControlConfig[];
  export let scrollContainer: HTMLElement;

  let element: HTMLElement;
  let isSelected = false;

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

  const options: RegisterElementOptions = {
    config: {
      isSelected: false,
      index,
      onSelectCallback,
      onDeselectCallback,
    },
    configList: configList,
    index,
  };
</script>

<div
  bind:this={element}
  class="block px-2.5 py-1.5 rounded-[3px] mx-1.5 cursor-pointer"
  class:active={isSelected}
  use:registerElement={options}
>
  <div class="inline-block w-full h-5">Custom format</div>
</div>

<style lang="postcss">
  .active {
    @apply bg-dropdown-item-hover-bg;
  }
</style>
