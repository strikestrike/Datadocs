<script lang="ts">
  import { registerElement } from "../../../../common/key-control/listKeyControl";
  import type {
    RegisterElementOptions,
    KeyControlConfig,
  } from "../../../../common/key-control/listKeyControl";
  import Icon from "../../../../common/icons/Icon.svelte";
  import tooltipAction from "../../../../common/tooltip";

  export let value: number;
  export let label: string;
  export let icon: string;
  export let active: boolean;
  export let index: number;
  export let handleSelectItem: (v: number) => void;
  export let keyControlList: KeyControlConfig[];

  let buttonElement: HTMLButtonElement;
  let isSelected = false;
  const tooltipContent = label;
  const options: RegisterElementOptions = {
    config: {
      isSelected: false,
      index,
      onSelectCallback: () => {
        isSelected = true;
        buttonElement.focus();
      },
      onDeselectCallback: () => {
        isSelected = false;
      },
    },
    configList: keyControlList,
    index,
  };
</script>

<button
  bind:this={buttonElement}
  class="p-0.5 rounded cursor-pointer"
  class:active
  class:selected={isSelected}
  tabindex={-1}
  use:tooltipAction={{ content: tooltipContent }}
  use:registerElement={options}
  on:click={() => handleSelectItem(value)}
>
  <Icon {icon} size="24px" />
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
