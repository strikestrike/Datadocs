<script lang="ts">
  import { getContext, tick } from "svelte";
  import { UPDATE_DROPDOWN_STYLE_CONTEXT_NAME } from "../../../common/dropdown";
  import Icon from "../../../common/icons/Icon.svelte";
  import type { SummaryItem } from "./type";

  const updateDropdownStyle: () => void = getContext(
    UPDATE_DROPDOWN_STYLE_CONTEXT_NAME
  );

  export let item: SummaryItem;
  export let level = 0;

  $: hasSubgroups = !!item.subgroups;

  async function toggleExpanded() {
    item.subgroups.expanded = !item.subgroups.expanded;
    await tick();
    updateDropdownStyle();
  }
</script>

<div class="button-container {hasSubgroups ? 'ml-2' : 'ml-3'}">
  {#if hasSubgroups}
    <button
      class="toggle-expanded-button"
      on:click={(e) => {
        e.preventDefault();
        toggleExpanded();
      }}
    >
      <Icon
        icon={item.subgroups.expanded
          ? "table-summary-collapse"
          : "table-summary-expand"}
        size="10px"
      />
    </button>
  {:else if level > 0}
    &nbsp;
  {/if}
</div>
<span class="name">{item.group}</span>
<span class="summary" class:with-subgroups={hasSubgroups}>{item.summary}</span>

{#if item.subgroups && item.subgroups.expanded}
  {#each item.subgroups.data as subitem}
    <svelte:self item={subitem} level={level + 1} />
  {/each}
{/if}

<style lang="postcss">
  .button-container {
    @apply flex items-center;

    .toggle-expanded-button {
      @apply mr-4px text-dark-50 outline-none;

      &:focus-visible,
      &:hover {
        @apply text-dark-200;
      }
    }
  }

  .name {
    @apply text-9px uppercase font-medium text-dark-200 pr-12px items-center;
    line-height: 19.5px;
  }

  .summary {
    @apply text-10px mr-3;
    line-height: 19.5px;

    &.with-subgroups {
      @apply mr-2 text-[#294EB7];
    }
  }
</style>
