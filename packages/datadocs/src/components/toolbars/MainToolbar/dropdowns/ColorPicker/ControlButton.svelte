<script lang="ts">
  import { registerElement } from "../../../../common/key-control/listKeyControl";
  import type {
    RegisterElementOptions,
    KeyControlActionOptions,
  } from "../../../../common/key-control/listKeyControl";
  import { scrollVerticalToVisible } from "../../../../common/key-control/scrolling";
  import { onMount, tick } from "svelte";
  import Icon from "../../../../common/icons/Icon.svelte";

  export let handleSelect: Function;
  export let index: number;
  export let keyControlActionOptions: KeyControlActionOptions;
  export let content = "";
  export let icon = "";
  export let iconSize = "11px";
  export let type: "primary" | "secondary" | "svgButton";
  export let scrollContainer: HTMLElement = null;

  let isSelected = false;
  let element: HTMLElement = null;

  async function onSelectCallback(byKey = false) {
    isSelected = true;
    if (byKey) {
      await tick();
      scrollVerticalToVisible(scrollContainer, element);
    }
    element.focus();
  }

  function onDeselectCallback() {
    if (document.activeElement === element) element.blur();
    isSelected = false;
  }

  function handleWindowMouseDown(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (element.contains(target)) {
      return;
    }

    isSelected = false;
    if (document.activeElement === element) element.blur();
    keyControlActionOptions.deselectFromOutside(index);
  }

  const options: RegisterElementOptions = {
    config: {
      isSelected: false,
      index,
      onSelectCallback,
      onDeselectCallback,
    },
    configList: keyControlActionOptions.configList,
    index,
    selectOnHover: false,
  };

  onMount(() => {
    document.addEventListener("mousedown", handleWindowMouseDown, true);
    return () => {
      document.removeEventListener("mousedown", handleWindowMouseDown, true);
    };
  });
</script>

<button
  bind:this={element}
  class="control-btn {type}"
  class:selected={isSelected}
  on:click={() => handleSelect()}
  use:registerElement={options}
  tabindex={-1}
>
  {#if content}
    {@html content}
  {:else}
    <Icon size={iconSize} {icon} />
  {/if}
</button>

<style lang="postcss">
  button {
    @apply border-none outline-none;
  }

  .control-btn:not(.svgButton) {
    @apply rounded-sm px-2.5 py-1.5 font-bold cursor-pointer;
    line-height: 17px;
  }

  .primary {
    color: #ffffff;
    background-color: #3bc7ff;
  }

  .primary:hover,
  .primary.selected {
    background-color: #08b9ff;
    box-shadow: 0px 2px 6px rgba(8, 185, 255, 0.2);
  }

  .secondary {
    color: #a7b0b5;
    background-color: #f7f7f7;
  }

  .secondary:hover,
  .secondary.selected,
  .svgButton:hover,
  .svgButton.selected {
    background-color: #f0f0f0;
  }

  .svgButton {
    @apply p-0.5 rounded-sm;
  }
</style>
