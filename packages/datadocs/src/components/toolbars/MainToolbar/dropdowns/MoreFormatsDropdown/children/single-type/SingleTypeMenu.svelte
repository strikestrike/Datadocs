<script lang="ts">
  import { getContext, onMount } from "svelte";
  import type {
    CellBooleanFormat,
    SelectionDataTypeListInformation,
  } from "@datadocs/canvas-datagrid-ng";
  import {
    changeCellsDataFormat,
    getActiveCellDataFormat,
    previewCellsDataFormat,
    // shouldApplyEntireColumn,
    // setApplyEntireColumn,
  } from "../../../../../../../app/store/store-toolbar";
  import SameTypeHeader from "../../components/same-type-header/SameTypeHeader.svelte";
  import { CLOSE_DROPDOWN_CONTEXT_NAME } from "../../../../../../common/dropdown";
  import { removeStylePreview } from "../../../../../../../app/store/store-toolbar";
  import { getDefaultDataFormat } from "@datadocs/canvas-datagrid-ng/lib/data/formatters/index";
  import {
    FIRST_SELECTED_STRING_DATA,
    areFormatsEqual,
    checkActiveFormat,
    getDataTypeFormatList,
  } from "../../util";
  import DataFormatItem from "./DataFormatItem.svelte";
  // import ApplyColumn from "../../components/ApplyColumn.svelte";
  import HyperlinkMenu from "../../components/hyperlink/HyperlinkMenu.svelte";
  import { isHyperlinkDataFormat } from "@datadocs/canvas-datagrid-ng/lib/data/formatters/index";

  export let dataType: string;

  const closeDropdown: () => void = getContext(CLOSE_DROPDOWN_CONTEXT_NAME);
  const firstStringData: SelectionDataTypeListInformation["firstString"] =
    getContext(FIRST_SELECTED_STRING_DATA);
  const formatList = getDataTypeFormatList(dataType);
  const defaultFormat = getDefaultDataFormat(dataType);
  let activeDataFormat = getActiveCellDataFormat();
  let isProcessing = false;

  if (!activeDataFormat || activeDataFormat.type !== defaultFormat.type) {
    activeDataFormat = defaultFormat;
  }

  async function selectItem(format: CellBooleanFormat) {
    if (isProcessing) return;
    isProcessing = true;
    await changeCellsDataFormat(format, firstStringData);
    closeDropdown();
  }

  onMount(() => {
    previewCellsDataFormat(undefined, dataType, false);
    return () => {
      removeStylePreview();
    };
  });

  // function onApplyModeChange() {
  //   setApplyEntireColumn(applyEntireColumn);
  //   previewCellsDataFormat(undefined, dataType, false);
  // }

  // onDestroy(() => {
  //   removeStylePreview();
  // });

  // let applyEntireColumn = shouldApplyEntireColumn();
  // $: applyEntireColumn, onApplyModeChange();
</script>

<SameTypeHeader {dataType} />

<div class:disabled={isProcessing}>
  {#each formatList as format}
    {@const isDefault = areFormatsEqual(defaultFormat, format)}
    {@const isActive = checkActiveFormat(activeDataFormat, format)}
    <div class="mx-1.5 text-13px">
      <DataFormatItem
        {format}
        {isDefault}
        {selectItem}
        {isActive}
        {dataType}
        stopPreviewing={isProcessing}
      />
    </div>
  {/each}

  {#if isHyperlinkDataFormat(activeDataFormat)}
    <div class="pl-5 pr-5 py-1 text-13px">
      <HyperlinkMenu />
    </div>
  {/if}

  <!-- <div class="mt-1 mx-5 text-13px">
    <ApplyColumn bind:checked={applyEntireColumn} />
  </div> -->
</div>

<style lang="postcss">
  .disabled :global(*) {
    @apply pointer-event-none;
  }
</style>
