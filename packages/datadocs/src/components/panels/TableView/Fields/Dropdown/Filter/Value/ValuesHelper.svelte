<script lang="ts">
  import type {
    FilterableValueDescriptor,
    GridFilterCondition,
    GridFilterValue,
    GridHeader,
    TableDescriptor,
  } from "@datadocs/canvas-datagrid-ng";
  import { createEventDispatcher, getContext, onMount } from "svelte";
  import { UPDATE_DROPDOWN_STYLE_CONTEXT_NAME } from "../../../../../../common/dropdown";
  import { tick } from "svelte";
  import { getValueSuggestionsData } from "./ValuesHelper";
  import ValuesHelperItem from "./ValuesHelperItem.svelte";
  import BetterVirtualList from "./BetterVirtualList.svelte";
  import tooltipAction from "../../../../../../common/tooltip";
  import GradientSpinner from "../../../../../../common/spinner/GradientSpinner.svelte";

  const dispatch = createEventDispatcher<{ select: GridFilterValue }>();
  const updateDropdown: () => void = getContext(
    UPDATE_DROPDOWN_STYLE_CONTEXT_NAME,
  );

  export let table: TableDescriptor;
  export let header: GridHeader;
  export let currentCondition: GridFilterCondition;
  export let value: GridFilterValue;
  export let staticValueSuggestions: FilterableValueDescriptor[] = undefined;

  export let loaderId = 0;

  const supportSearch =
    typeof table.dataSource.getFilterableValuesForColumn === "function";

  $: if (supportSearch && !staticValueSuggestions) {
    scheduleSearch(value);
  }

  let data: FilterableValueDescriptor[] = [];
  let searchTimeout: NodeJS.Timeout | undefined;
  let lastExecDuration = 0;
  let limited = false;
  let loading = false;

  function scheduleSearch(input: GridFilterValue) {
    loading = true;

    if (searchTimeout) clearTimeout(searchTimeout);

    searchTimeout = setTimeout(() => {
      searchFor(input);
      searchTimeout = undefined;
    }, lastExecDuration);
  }

  async function searchFor(value: GridFilterValue | undefined) {
    const startTime = Date.now();
    const localLoaderId = ++loaderId;
    const suggestions = await getValueSuggestionsData(
      table,
      header,
      currentCondition,
      value,
    );

    // Adjust how much we wait before starting to search based on how much each
    // search takes so that when it doesn't take too long, we can start loading
    // instantly or when it starts too long, we don't queue too many new
    // searches.
    lastExecDuration = (lastExecDuration + (Date.now() - startTime)) / 2;

    if (localLoaderId !== loaderId) {
      // Another search has been started, ignoring the result.
      return;
    }

    limited = suggestions.limited;
    await loadStaticValues(suggestions.data);
  }

  async function loadStaticValues(values: FilterableValueDescriptor[]) {
    data = values;
    loading = false;
  }

  onMount(() => {
    if (staticValueSuggestions) loadStaticValues(staticValueSuggestions);
  });
</script>

<div class="dropdown" class:invisible={data.length === 0 && !loading}>
  {#if loading}
    <div class="loading-placeholder-container">
      {#each { length: 10 } as _, i}
        <GradientSpinner clazz={i % 2 ? "mr-5" : "mr-2"} />
      {/each}
    </div>
  {:else}
    <div class="values-container">
      <BetterVirtualList
        items={data}
        defaultItemHeight={30}
        itemSpacing={4}
        paddingTop={6}
        paddingBottom={6}
        clazz="flex-1"
        on:refreshed={async () => {
          await tick();
          updateDropdown();
        }}
        let:item
      >
        <ValuesHelperItem
          {item}
          on:selected={({ detail }) => dispatch("select", detail.value)}
        />
      </BetterVirtualList>

      {#if limited}
        <div
          class="item-limit-container"
          use:tooltipAction={{
            content:
              "Results are limited to " +
              data.length.toLocaleString() +
              " items.",
            position: "vertical",
          }}
        >
          Showing
          <span class="font-medium">{data.length.toLocaleString()}</span>
          results
        </div>
      {/if}
    </div>
  {/if}
</div>

<style lang="postcss">
  .dropdown {
    @apply flex flex-col relative text-13px bg-white rounded overflow-x overflow-y-hidden h-inherit min-w-0 max-w-300px;
    box-shadow: 0px 5px 20px rgba(55, 84, 170, 0.16);

    .values-container {
      @apply flex flex-col flex-1 items-stretch min-h-0 rounded;

      .item-limit-container {
        @apply border-t border-solid border-light-100 text-11px text-dark-200 px-3 py-2 font-normal;
      }
    }

    .loading-placeholder-container {
      @apply flex flex-col p-3;
      row-gap: 8px;
    }
  }
</style>
