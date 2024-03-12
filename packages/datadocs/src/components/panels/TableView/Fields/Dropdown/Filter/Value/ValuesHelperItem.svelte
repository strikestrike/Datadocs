<script lang="ts">
  import type {
    FilterableValueDescriptor,
    GridFilterValue,
  } from "@datadocs/canvas-datagrid-ng";
  import { createEventDispatcher, getContext, tick } from "svelte";
  import { CLOSE_ROOT_MENU_CONTEXT_NAME } from "../../../../../../common/menu";

  const notifyCloseDropdown: () => void = getContext(
    CLOSE_ROOT_MENU_CONTEXT_NAME,
  );
  const dispatch = createEventDispatcher<{
    selected: { value: GridFilterValue };
  }>();

  export let item: FilterableValueDescriptor;
  export let selected = false;

  function click(e: Event) {
    e.preventDefault();
    dispatch("selected", { value: item.filterValue });
    closeDropdown();
  }

  async function closeDropdown() {
    await tick();
    notifyCloseDropdown()
  }
</script>

<button class="value-item-container" class:selected on:click={click}>
  {item.title}
</button>

<style lang="postcss">
  .value-item-container {
    @apply flex-1 text-left rounded items-center outline-none pl-3.5 pr-2 mx-1.5 min-w-0 overflow-x-hidden overflow-ellipsis whitespace-nowrap;
    line-height: normal;

    &:hover,
    &:focus-visible,
    &.selected {
      @apply text-primary-datadocs-blue;
    }

    &:hover,
    &:focus-visible {
      @apply bg-primary-datadocs-blue bg-opacity-10;
    }
  }
</style>
