<script lang="ts">
  import { tick } from "svelte";
  import Icon from "../../../../common/icons/Icon.svelte";
  import { getBorderIcon, getBorderTooltip } from "../default";
  import type { BorderValue } from "../default";
  import tooltipAction from "../../../../common/tooltip";
  import type {
    GridKeyControlActionOptions,
    RegisterElementOptions,
  } from "../../../../common/key-control/gridKeyControl";
  import { registerElement } from "../../../../common/key-control/gridKeyControl";
  import { scrollVerticalToVisible } from "../../../../common/key-control/scrolling";

  export let value: BorderValue;
  export let handleSelectItem = (v: BorderValue) => {};
  export let gridKeyControlOptions: GridKeyControlActionOptions;
  export let ridx: number;
  export let cidx: number;
  export let scrollContainer: HTMLElement;
  export let activeValue: BorderValue;

  const tooltipContent = getBorderTooltip(value);
  const icon = getBorderIcon(value);
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
  bind:this={element}
  class="flex flex-row items-center justify-center p-1.5 rounded cursor-pointer border-none outline-none"
  class:selected={isSelected}
  class:active={activeValue === value}
  tabindex={-1}
  use:tooltipAction={{ content: tooltipContent }}
  use:registerElement={options}
  on:click={() => handleSelectItem(value)}
>
  <Icon {icon} size="24px" />
</button>

<style lang="postcss">
  button.selected,
  button.active {
    @apply bg-light-50;
  }
</style>
