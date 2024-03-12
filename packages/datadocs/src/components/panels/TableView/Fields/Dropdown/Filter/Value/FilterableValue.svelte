<script lang="ts">
  import type { FilterableValueDescriptor } from "@datadocs/canvas-datagrid-ng";
  import Checkbox from "../../../../../../common/form/Checkbox.svelte";
  import Icon from "../../../../../../common/icons/Icon.svelte";
  import { getContext } from "svelte";
  import { TOGGLE_FILTER_CONTEXT_NAME } from "./ValuesWell";
  import type { ToggleFilterFunction } from "./type";

  const toggleFilter = getContext(
    TOGGLE_FILTER_CONTEXT_NAME
  ) as ToggleFilterFunction;

  export let descriptor: FilterableValueDescriptor;

  export let nest: boolean;
  export let level: number = 0;

  export let isFirst = false;
  export let isLast = false;

  export let updateTrigger = {};
  $: updateTrigger, reapplyDescriptor();

  const id = `${descriptor.value}_${Math.random()}`;

  let selected = false;

  async function toggleFiltered(e: Event) {
    toggleFilter(descriptor);
    e.preventDefault();
  }

  function reapplyDescriptor() {
    descriptor = descriptor;
  }

  function toggleExpanded(e: Event) {
    descriptor.expanded = !descriptor.expanded;
    e.preventDefault();
  }
</script>

<div
  class="value-container"
  class:first={isFirst}
  class:last={isLast && !descriptor.expanded}
>
  {#each { length: level } as _}
    <div class="level" />
  {/each}
  <label
    class="value-filter"
    class:selected
    class:nest
    class:last-child={nest && !descriptor.subvalues?.length}
    class:filtered={descriptor.filtered}
    for={id}
  >
    {#if nest && descriptor.subvalues?.length}
      <button class="expand-button" on:click={toggleExpanded}>
        <Icon
          icon={descriptor.expanded ? "arrow-dropdown" : "arrow-right"}
          size="7px"
        />
      </button>
    {/if}
    <Checkbox
      checked={!descriptor.filtered}
      class="relative"
      on:checked
      on:checked={toggleFiltered}
      size="17px"
      indeterminate={descriptor.indeterminate}
      {id}
    />
    <span class="value">
      {descriptor.title}
    </span>
  </label>
</div>

{#if descriptor.subvalues && descriptor.expanded}
  {#each descriptor.subvalues as subdescriptor}
    <svelte:self
      descriptor={subdescriptor}
      nest={true}
      level={level + 1}
      {updateTrigger}
    />
  {/each}
{/if}

<style lang="postcss">
  .value-container {
    @apply flex flex-row mx-1;

    &.last {
      @apply mb-1;
    }
  }

  .value-filter {
    @apply flex flex-row flex-1 rounded border border-solid border-transparent px-1 py-0.5 cursor-pointer overflow-hidden;

    &.nest {
      &:not(.last-child) {
        @apply pl-0;
      }

      &.last-child {
        @apply ml-[14px];
      }
    }

    &.selected,
    &:hover {
      @apply border bg-light-50;
    }

    &.filtered {
      .value {
        @apply text-dark-50;
      }
    }

    .value {
      @apply flex-1 text-dark-300 min-w-0 w-0 text-[11px] font-normal whitespace-nowrap overflow-hidden overflow-ellipsis ml-2;
      aling-items: center;
      line-height: 16.5px;
    }
  }

  .expand-button {
    @apply w-[12px] flex-shrink-0 p-0 m-0 flex border-none text-dark-50 mr-1.5 justify-center outline-none items-center bg-transparent;
  }

  .level {
    @apply w-[1px] bg-light-100 mx-1.5;
  }

  .expand-button:focus-visible,
  .expand-button:hover {
    @apply text-dark-200;
  }
</style>
