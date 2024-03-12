<script lang="ts">
  import type {
    FilterableColors,
    GridHeader,
    GridSortLabels,
    GridSort,
    OrderDirection,
  } from "@datadocs/canvas-datagrid-ng";
  import ColorDropdown from "./ColorDropdown/ColorDropdown.svelte";
  import SortToggleButton from "../../../../common/form/button/SortToggleButton.svelte";
  import type { ColorFilter } from "./ColorDropdown/types";
  import {
    getColorFilterFromSort,
    getSortFromColorFilter,
  } from "./ColorDropdown/ColorDropdown";
  import { createEventDispatcher } from "svelte";
  import { getPathInfoFromSort } from "@datadocs/canvas-datagrid-ng/lib/data/data-source/sorters/utils";
  import { getPathInfoFromHeader } from "@datadocs/canvas-datagrid-ng/lib/data/data-source/filters/utils";

  const dispatch = createEventDispatcher<{ updated: { sort: GridSort } }>();

  export let header: GridHeader;
  export let sortLabels: GridSortLabels;
  export let filterableColors: FilterableColors;
  export let currentSort: GridSort;

  $: direction = currentSort?.type === "preset" && currentSort.dir;
  $: colorSort = getColorFilterFromSort(currentSort);
  $: pathInfo =
    getPathInfoFromSort(currentSort) ?? getPathInfoFromHeader(header);

  function onSortButtonClick(dir: OrderDirection) {
    if (!currentSort || currentSort.type !== "preset") {
      currentSort = {
        type: "preset",
        columnId: header.id,
        dir,
        on: { type: "value", pathInfo },
      };
    } else if (currentSort.dir === dir) {
      currentSort = undefined;
    } else {
      currentSort.dir = dir;
    }
    dispatch("updated", { sort: currentSort });
  }

  function updateWithColor(filter: ColorFilter) {
    currentSort = getSortFromColorFilter(header, filter, currentSort);
    dispatch("updated", { sort: currentSort });
  }
</script>

<div class="button-container mb-2.5">
  <SortToggleButton
    class="flex-grow basis-0"
    activated={direction === "asc"}
    icon="sort-text-ascending"
    on:click={() => onSortButtonClick("asc")}
  >
    {colorSort ? "On Top" : "Ascending"}
  </SortToggleButton>
  <SortToggleButton
    class="flex-grow basis-0"
    activated={direction === "desc"}
    icon="sort-text-descending"
    on:click={() => onSortButtonClick("desc")}
  >
    {colorSort ? "On Bottom" : "Descending"}
  </SortToggleButton>
</div>

<ColorDropdown
  color={colorSort}
  colors={filterableColors}
  on:selected={({ detail }) => updateWithColor(detail)}
/>

<style lang="postcss">
  .button-container {
    @apply flex flex-row;
    justify-content: stretch;
    column-gap: 6px;
  }
</style>
