<script lang="ts">
  import { getContext, onMount } from "svelte";
  import { CLOSE_DROPDOWN_CONTEXT_NAME } from "../../../../../../common/dropdown";
  import type { CellDataFormat } from "@datadocs/canvas-datagrid-ng";
  // import ApplyColumn from "../../components/ApplyColumn.svelte";
  import { FIRST_SELECTED_STRING_DATA, areFormatsEqual, checkActiveFormat, getDataTypeFormatList } from "../../util";
  import {
    changeCellsDataFormat,
    getCellDataFormatByIndex,
    previewCellsDataFormat,
    // shouldApplyEntireColumn,
    // setApplyEntireColumn,
  } from "../../../../../../../app/store/store-toolbar";
  import { getDefaultDataFormat } from "@datadocs/canvas-datagrid-ng/lib/data/formatters/index";
  import type { SelectionDataTypeListInformation } from "@datadocs/canvas-datagrid-ng";
  import DataFormatItem from "../single-type/DataFormatItem.svelte";
  import HyperlinkMenu from "../../components/hyperlink/HyperlinkMenu.svelte";
  import { isHyperlinkDataFormat } from "@datadocs/canvas-datagrid-ng/lib/data/formatters/util";

  export let type: string;
  export let firstCells: SelectionDataTypeListInformation["firstCells"];
  export let isProcessing: boolean;

  const closeDropdown: () => void = getContext(CLOSE_DROPDOWN_CONTEXT_NAME);
  const firstStringData: SelectionDataTypeListInformation["firstString"] =
    getContext(FIRST_SELECTED_STRING_DATA);
  let formatList: CellDataFormat[] = [];
  let defaultFormat: CellDataFormat;
  let currentFormat: CellDataFormat;
  // let applyEntireColumn = shouldApplyEntireColumn();

  async function selectItem(format: CellDataFormat) {
    if (isProcessing) return;
    isProcessing = true;
    await changeCellsDataFormat(format, firstStringData);
    closeDropdown();
    isProcessing = false;
  }

  function onDataTypeChange() {
    formatList = getDataTypeFormatList(type);
    defaultFormat = getDefaultDataFormat(type);
    updateCurrentFormat();
  }

  function updateCurrentFormat() {
    const { rowIndex, columnIndex } = firstCells[type] ?? {};
    currentFormat = getCellDataFormatByIndex(rowIndex, columnIndex);
    if (!currentFormat || currentFormat.type !== defaultFormat.type) {
      currentFormat = defaultFormat;
    }
  }

  onMount(() => {
    previewCellsDataFormat(undefined, type, true);
  });

  // function onApplyModeChange() {
  //   setApplyEntireColumn(applyEntireColumn);
  //   previewCellsDataFormat(undefined, type, true);
  // }

  $: type, onDataTypeChange();
  // $: applyEntireColumn, onApplyModeChange();
</script>

{#key type}
  {#if formatList.length > 0}
    {#each formatList as format}
      {@const isDefault = areFormatsEqual(defaultFormat, format)}
      {@const isActive = checkActiveFormat(currentFormat, format)}

      <DataFormatItem
        {format}
        {isDefault}
        {selectItem}
        {isActive}
        dataType={type}
        multipleTypes={true}
        stopPreviewing={isProcessing}
      />
    {/each}

    {#if isHyperlinkDataFormat(currentFormat)}
      <div class="pl-5 pr-5 py-1 text-13px">
        <HyperlinkMenu />
      </div>
    {/if}

    <!-- <div class="mt-1 mx-2.5 text-13px">
      <ApplyColumn bind:checked={applyEntireColumn} />
    </div> -->
  {/if}
{/key}
