<script lang="ts">
  import { registerElement } from "../../../../common/key-control/listKeyControl";
  import type {
    RegisterElementOptions,
    KeyControlConfig,
  } from "../../../../common/key-control/listKeyControl";
  import Icon from "../../../../common/icons/Icon.svelte";
  import { getTextWrappingIcon } from "../default";
  import type { TextWrappingValue } from "../default";
  import tooltipAction from "../../../../common/tooltip";

  export let value: TextWrappingValue;
  export let active: boolean;
  export let index: number;
  export let handleSelectItem: (v: TextWrappingValue) => void;
  export let keyControlList: KeyControlConfig[];

  let buttonElement: HTMLButtonElement;
  let isSelected = false;
  const tooltipContent = value.charAt(0).toUpperCase() + value.slice(1); // capitalize string
  const options: RegisterElementOptions = {
    config: {
      isSelected: false,
      index,
      onSelectCallback: () => {
        isSelected = true;
        buttonElement.focus();
      },
      onDeselectCallback: () => { isSelected = false;},
    },
    configList: keyControlList,
    index,
  };

  $: icon = getTextWrappingIcon(value);
</script>

<button
  bind:this={buttonElement}
  class="p-1.5 rounded cursor-pointer"
  class:active
  class:selected={isSelected}
  tabindex={-1}
  use:tooltipAction={{ content: tooltipContent }}
  use:registerElement={options}
  on:click={() => handleSelectItem(value)}
>
  <Icon {icon} size="20px" />
</button>

<style lang="postcss">
  .active {
    @apply text-primary-datadocs-blue;
  }

  .selected {
    @apply bg-light-50;
  }

  button {
    @apply border-none outline-none;
  }
</style>
