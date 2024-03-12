<script lang="ts">
  import { getContext } from "svelte";
  import RadioButton from "../../../../../../common/form/RadioButton.svelte";
  import { UPDATE_DROPDOWN_STYLE_CONTEXT_NAME } from "../../../../../../common/dropdown";
  import { type StructFormatOption, getStructFormatOptions } from "../../util";
  import {
    changeCellsDataFormat,
    getCellDataFormatByIndex,
    previewCellsDataFormat,
    // shouldApplyEntireColumn,
    // setApplyEntireColumn,
  } from "../../../../../../../app/store/store-toolbar";
  import type {
    CellStructFormat,
    SelectionDataTypeListInformation,
  } from "@datadocs/canvas-datagrid-ng";
  import { getStructDefaultFormat } from "@datadocs/canvas-datagrid-ng/lib/data/formatters/index";
  import DisplayFieldMenu from "../struct/DisplayFieldMenu.svelte";
  import ImageFieldMenu from "../struct/ImageFieldMenu.svelte";
  import ApplyColumn from "../../components/ApplyColumn.svelte";

  export let structData: SelectionDataTypeListInformation["firstStruct"];
  export let isProcessing: boolean;

  const updateDropdownStyle: () => void = getContext(
    UPDATE_DROPDOWN_STYLE_CONTEXT_NAME
  );
  const structFormatOptions = getStructFormatOptions();
  const defaultFormat = getStructDefaultFormat().format;
  let currentFormat = getCellDataFormatByIndex(
    structData.rowIndex,
    structData.columnIndex
  );
  let initOption = structFormatOptions.find(
    (option) => option.value === defaultFormat
  );

  if (
    currentFormat &&
    currentFormat.type === "struct" &&
    currentFormat.format
  ) {
    initOption = structFormatOptions.find(
      (option) => option.value === currentFormat.format
    );
  }

  async function onValueChange(event) {
    const option = event.detail.value as StructFormatOption;
    const format: CellStructFormat = {
      type: "struct",
      format: option.value,
    };

    await changeStructDataFormat(format);
    currentFormat = getCellDataFormatByIndex(
      structData.rowIndex,
      structData.columnIndex
    );
    setTimeout(updateDropdownStyle);
  }

  async function changeStructDataFormat(format: CellStructFormat) {
    if (isProcessing) isProcessing = true;
    await changeCellsDataFormat(format);
    isProcessing = false;
  }

  // function onApplyModeChange() {
  //   setApplyEntireColumn(applyEntireColumn);
  //   previewCellsDataFormat(undefined, "struct", true);
  // }

  // let applyEntireColumn = shouldApplyEntireColumn();
  // $: applyEntireColumn, onApplyModeChange();
</script>

<div class="mx-3.5">
  <div class="mt-3 mb-2 text-11px text-dark-50 font-medium uppercase">
    Display As
  </div>

  <RadioButton
    on:change={onValueChange}
    options={structFormatOptions}
    activeOption={initOption}
    direction="horizontal"
    name="struct"
    class="text-11px text-black"
  />

  {#if currentFormat?.format === "chip"}
    <div class="mt-3 mb-1 text-11px text-dark-50 font-medium uppercase">
      Display Field
    </div>
    <DisplayFieldMenu
      structTypeData={structData.typeData}
      cellRowIndex={structData.rowIndex}
      cellColumnIndex={structData.columnIndex}
      {changeStructDataFormat}
    />

    <div class="mt-3 mb-1 text-11px text-dark-50 font-medium uppercase">
      Image Field
    </div>
    <ImageFieldMenu
      structTypeData={structData.typeData}
      cellRowIndex={structData.rowIndex}
      cellColumnIndex={structData.columnIndex}
      {changeStructDataFormat}
    />
  {/if}

  <!-- <div class="mt-3 text-13px">
    <ApplyColumn bind:checked={applyEntireColumn} />
  </div> -->
</div>
