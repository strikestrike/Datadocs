<script lang="ts">
  import { tick } from "svelte";
  import Icon from "../../../../../common/icons/Icon.svelte";
  import type { BorderStyle } from "../../default";
  import { getBorderStyleSvg } from "./utils";
  import { registerElement } from "../../../../../common/key-control/listKeyControl";
  import type {
    RegisterElementOptions,
    KeyControlActionOptions,
  } from "../../../../../common/key-control/listKeyControl";
  import { scrollVerticalToVisible } from "../../../../../common/key-control/scrolling";

  export let style: BorderStyle;
  export let activeStyle: BorderStyle;
  export let keyControlOptions: KeyControlActionOptions;
  export let index: number;
  export let scrollContainer: HTMLElement;
  export let handleSelectItem = (style: BorderStyle) => {};

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
    isSelected = false;
    if (element === document.activeElement) element.blur();
  }

  const options: RegisterElementOptions = {
    config: {
      isSelected: false,
      index,
      onSelectCallback,
      onDeselectCallback,
    },
    configList: keyControlOptions.configList,
    index,
  };
</script>

<button
  class="flex flex-row items-center w-full h-7 pl-1 pr-3 rounded-sm border-none outline-none"
  class:selected={isSelected}
  bind:this={element}
  use:registerElement={options}
  on:click={() => handleSelectItem(style)}
  tabindex={-1}
>
  <div class="w-5 h-5">
    {#if style === activeStyle}
      <Icon icon="top-menu-item-tick" size="20px" />
    {/if}
  </div>
  <div class="flex-shrink flex-grow flex flex-row items-center justify-center">
    {@html getBorderStyleSvg(style)}
  </div>
</button>

<style lang="postcss">
  button.selected {
    @apply bg-light-50;
  }
</style>
