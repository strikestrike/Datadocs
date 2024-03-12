<script lang="ts">
  import { getContext } from "svelte";
  import {} from "../../../../../app/store/store-toolbar";
  import { CLOSE_DROPDOWN_CONTEXT_NAME } from "../../../dropdown";
  import BreadscrumbDropdownElement from "./BreadscrumbDropdownElement.svelte";
  import type { BreadcrumbDropdownItem } from "../type";

  export let breadscrumbItems: BreadcrumbDropdownItem[];
  export let activeId: string;

  const closeDropdown: () => void = getContext(CLOSE_DROPDOWN_CONTEXT_NAME);
  let isProcessing = false;

  async function handleSelectItem(item: BreadcrumbDropdownItem) {
    if (isProcessing) {
      return;
    }
    isProcessing = true;
    if (item.action) {
      await item.action();
    }
    closeDropdown();
  }

  let element: HTMLElement = null;
</script>

<div bind:this={element} class="dropdown" class:disabled={isProcessing}>
  <div class="flex flex-col text-11px font-medium gap-1 p-1.5 rounded-[6px]">
    {#each breadscrumbItems as value, i}
      <BreadscrumbDropdownElement
        {handleSelectItem}
        {value}
        active={activeId === value.id}
      />
    {/each}
  </div>
</div>

<style lang="postcss">
  .dropdown {
    @apply relative bg-white rounded py-1.5 h-[inherit] overflow-y-auto overflow-x-hidden;
    box-shadow: 0px 5px 20px rgba(55, 84, 170, 0.16);
  }

  .disabled :global(*) {
    @apply pointer-event-none;
  }
</style>
