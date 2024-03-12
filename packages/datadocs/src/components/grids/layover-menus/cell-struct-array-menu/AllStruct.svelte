<script lang="ts">
  import type { NormalCellDescriptor } from "@datadocs/canvas-datagrid-ng";

  import { createEventDispatcher, getContext } from "svelte";
  import StructChip from "./StructChip.svelte";
  import Pagination from "./Pagination.svelte";
  import { UPDATE_DROPDOWN_STYLE_CONTEXT_NAME } from "../../../common/dropdown";
  import { countStructArrayValue, getStructArrayChips } from "../util";

  export let data: NormalCellDescriptor;
  export let chipIndex: number;

  const updateDropdownStyle: () => void = getContext(
    UPDATE_DROPDOWN_STYLE_CONTEXT_NAME
  );

  const CHIPS_PER_PAGE = 50;
  const dispatch = createEventDispatcher();
  const chipsCount = data.chipsCount; //countStructArrayValue(data);
  const pageCount = Math.ceil(chipsCount / CHIPS_PER_PAGE);

  function onSelectChip(event) {
    dispatch("select", { ...event.detail });
  }

  function getChipStartIndex(pageIdx: number) {
    return pageIdx * CHIPS_PER_PAGE;
  }

  function getChipsData(pageIdx: number) {
    const startIndex = getChipStartIndex(pageIdx);
    const endIndex = startIndex + CHIPS_PER_PAGE - 1;
    // return data.chips.slice(startIndex, endIndex);
    return getStructArrayChips(data, startIndex, endIndex);
  }

  function onMenuChange() {
    setTimeout(updateDropdownStyle);
  }

  $: pageIndex = Math.floor(chipIndex / CHIPS_PER_PAGE);
  $: chips = getChipsData(pageIndex);
  $: pageIndex, onMenuChange();
</script>

<div class="w-[380px] max-h-full overflow-y-auto" on:mousemove|preventDefault>
  <div class="py-3 px-4 w-full flex flex-row items-center justify-between">
    <div class="flex flex-row items-center gap-1.5">
      <div class="title">All Structs</div>

      <div class="chip-count">{chipsCount}</div>
    </div>

    <Pagination {pageCount} bind:pageIndex />
  </div>

  {#key pageIndex}
    <div class="flex flex-row flex-wrap gap-1.5 pt-0 pb-3 px-4">
      {#each chips as chip, index}
        <StructChip
          on:select={onSelectChip}
          content={chip}
          index={getChipStartIndex(pageIndex) + index}
        />
      {/each}
    </div>
  {/key}
</div>

<style lang="postcss">
  .title {
    @apply text-15px text-black font-medium;
    font-family: roboto;
  }

  .chip-count {
    @apply text-11px text-white font-medium bg-primary-indigo-blue;
    @apply min-w-[18px] h-[18px] p-0.5 flex flex-row items-center justify-center;
    font-family: roboto;
    border-radius: 3px;
  }
</style>
