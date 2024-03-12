<script lang="ts">
  import { tick } from "svelte";
  import { registerElement } from "../../../../common/key-control/listKeyControl";
  import type {
    RegisterElementOptions,
    KeyControlConfig,
  } from "../../../../common/key-control/listKeyControl";
  import { scrollVerticalToVisible } from "../../../../common/key-control/scrolling";
  import { previewFontSize, removeStylePreview } from "../../../../../app/store/store-toolbar";

  export let value: number;
  export let activeValue: number;
  export let index: number;
  export let keyControlList: KeyControlConfig[];
  export let updateInputValue: (v: string) => void;
  export let handleSelectItem: (v: number) => void;
  export let scrollContainer: HTMLElement;

  let isSelected = false;
  let element: HTMLElement;

  async function onSelectCallback(byKey = true) {
    isSelected = true;
    previewFontSize(value);
    if (!byKey) {
      return;
    }
    updateInputValue(value.toString());
    await tick();
    scrollVerticalToVisible(scrollContainer, element);
  }

  function onDeselectCallback() {
    isSelected = false;
    removeStylePreview();
  }

  const options: RegisterElementOptions = {
    config: {
      isSelected: false,
      index,
      onSelectCallback,
      onDeselectCallback,
    },
    configList: keyControlList,
    index,
  };
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
  bind:this={element}
  class="item"
  class:active={activeValue === value}
  class:selected={isSelected}
  data-grideditorcompanion="true"
  use:registerElement={options}
  on:click={() => handleSelectItem(value)}
>
  <div class="leading-5 text-center" data-grideditorcompanion="true">{value}</div>
</div>

<style lang="postcss">
  .item {
    @apply mx-1.5 px-3.5 py-1.5 cursor-pointer rounded-sm;
  }

  .active {
    color: #3bc7ff;
  }

  .selected {
    @apply bg-dropdown-item-hover-bg;
  }
</style>
