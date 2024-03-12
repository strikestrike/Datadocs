<script lang="ts">
  import type { BreadcrumbDropdownItem } from "../type";

  export let value: BreadcrumbDropdownItem;
  export let active: boolean = false;
  export let handleSelectItem: (item: BreadcrumbDropdownItem) => void;

  let isSelected = false;
  let element: HTMLElement;
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
  bind:this={element}
  class="item flex flex-row justify-between gap-1 w-full"
  class:selected={isSelected}
  on:click={() => handleSelectItem(value)}
>
  <div class:active>
    {value.name}
  </div>
  {#if value.subtitle}
    <div class="text-dark-50">{value.subtitle}</div>
  {/if}
</div>

<style lang="postcss">
  .item {
    @apply px-1 py-2.5 cursor-pointer rounded-sm;
    min-width: 100px;
  }

  .active {
    color: #5f89ff;
  }

  .selected {
    @apply bg-dropdown-item-hover-bg;
  }
</style>
