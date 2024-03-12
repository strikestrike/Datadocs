<script lang="ts">
  import { getContext, onMount } from "svelte";
  import type { SelectionDataTypeListInformation } from "@datadocs/canvas-datagrid-ng";
  import { UPDATE_DROPDOWN_STYLE_CONTEXT_NAME } from "../../../../../../common/dropdown";
  // import TypeChip from "./TypeChip.svelte";
  import TypeMenu from "./TypeMenu.svelte";
  import StructMenu from "./StructMenu.svelte";
  import SelectTypeMenu from "./select-type/SelectTypeMenu.svelte";
  import {
    previewCellsDataFormat,
    removeStylePreview,
  } from "../../../../../../../app/store/store-toolbar";

  export let types: string[];
  export let structData: SelectionDataTypeListInformation["firstStruct"];
  export let firstCells: SelectionDataTypeListInformation["firstCells"];

  let isStructProcessing = false;
  let isTypeProcessing = false;

  const updateDropdownStyle: () => void = getContext(
    UPDATE_DROPDOWN_STYLE_CONTEXT_NAME
  );

  let activeType: string = types[0];

  onMount(() => {
    previewCellsDataFormat(
      undefined,
      activeType,
      true,
    );
    return () => {
      removeStylePreview();
    };
  });

  function onActiveTypeChange() {
    setTimeout(updateDropdownStyle);
    previewCellsDataFormat(
      undefined,
      activeType,
      true
    );
  }

  $: isStruct = activeType === "struct";
  $: activeType, onActiveTypeChange();
  $: isProcessing = isStructProcessing || isTypeProcessing;
</script>

<div class="w-[360px]" class:disabled={isProcessing}>
  <div
    class="mt-3 mx-3 px-3 py-1 rounded flex flex-row items-center gap-1 bg-primary-indigo-blue bg-opacity-[0.08] text-13px"
  >
    <div>
      <svg
        width="14"
        height="14"
        viewBox="0 0 15 15"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style="rotate: 180deg;"
      >
        <path
          d="M7.5 1.25C6.26387 1.25 5.0555 1.61656 4.02769 2.30332C2.99988 2.99007 2.1988 3.96619 1.72576 5.10823C1.25271 6.25027 1.12894 7.50693 1.37009 8.71932C1.61125 9.9317 2.20651 11.0453 3.08059 11.9194C3.95466 12.7935 5.06831 13.3888 6.28069 13.6299C7.49307 13.8711 8.74974 13.7473 9.89177 13.2742C11.0338 12.8012 12.0099 12.0001 12.6967 10.9723C13.3834 9.94451 13.75 8.73613 13.75 7.5C13.7474 5.84321 13.088 4.25503 11.9165 3.0835C10.745 1.91197 9.15679 1.25264 7.5 1.25V1.25ZM7.03125 5C7.03125 4.87568 7.08064 4.75645 7.16855 4.66854C7.25645 4.58064 7.37568 4.53125 7.5 4.53125C7.62432 4.53125 7.74355 4.58064 7.83146 4.66854C7.91937 4.75645 7.96875 4.87568 7.96875 5V8.125C7.96875 8.24932 7.91937 8.36855 7.83146 8.45646C7.74355 8.54436 7.62432 8.59375 7.5 8.59375C7.37568 8.59375 7.25645 8.54436 7.16855 8.45646C7.08064 8.36855 7.03125 8.24932 7.03125 8.125V5ZM8.075 10.2375C8.0448 10.314 8.00025 10.384 7.94375 10.4438C7.88297 10.4989 7.81322 10.5433 7.7375 10.575C7.66266 10.608 7.58178 10.625 7.5 10.625C7.41823 10.625 7.33735 10.608 7.2625 10.575C7.18679 10.5433 7.11704 10.4989 7.05625 10.4438C6.99975 10.384 6.9552 10.314 6.925 10.2375C6.89201 10.1627 6.87497 10.0818 6.87497 10C6.87497 9.91822 6.89201 9.83733 6.925 9.7625C6.95307 9.68494 6.99786 9.6145 7.05618 9.55618C7.11451 9.49785 7.18494 9.45307 7.2625 9.425C7.41467 9.36249 7.58534 9.36249 7.7375 9.425C7.81506 9.45307 7.8855 9.49785 7.94382 9.55618C8.00215 9.6145 8.04693 9.68494 8.075 9.7625C8.10799 9.83733 8.12503 9.91822 8.12503 10C8.12503 10.0818 8.10799 10.1627 8.075 10.2375Z"
          fill="#5F89FF"
        />
      </svg>
    </div>

    <div>Multiple types is selected.</div>
  </div>

  <div class="mt-3 mx-3">
    <!-- {#each types as type}
      <TypeChip
        {type}
        selected={type === activeType}
        on:selected={onTypeChange}
      />
    {/each} -->
    <div class="mb-1 text-11px text-dark-50 font-medium uppercase">
      Choose type to format
    </div>
    <SelectTypeMenu {types} bind:activeType />
  </div>

  {#if !isStruct}
    <div class="max-w-full px-3 pt-4 text-13px">
      <TypeMenu
        bind:isProcessing={isTypeProcessing}
        type={activeType}
        {firstCells}
      />
    </div>
  {:else}
    <StructMenu bind:isProcessing={isStructProcessing} {structData} />
  {/if}
</div>

<style lang="postcss">
  .disabled :global(*) {
    @apply pointer-event-none;
  }
</style>
