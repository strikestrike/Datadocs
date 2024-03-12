<script lang="ts">
  import { getContext, tick } from "svelte";
  import type {
    CellStructFormat,
    StructDetailTypeData,
  } from "@datadocs/canvas-datagrid-ng";
  import {
    changeCellsDataFormat,
    getActiveCellDataFormat,
    getActiveCellStructTypeData,
    // shouldApplyEntireColumn,
    // setApplyEntireColumn,
  } from "../../../../../../../app/store/store-toolbar";
  import SameTypeHeader from "../../components/same-type-header/SameTypeHeader.svelte";
  import { UPDATE_DROPDOWN_STYLE_CONTEXT_NAME } from "../../../../../../common/dropdown";
  import RadioButton from "../../../../../../common/form/RadioButton.svelte";
  import { getStructDefaultFormat } from "@datadocs/canvas-datagrid-ng/lib/data/formatters/index";
  import { type StructFormatOption, getStructFormatOptions } from "../../util";
  // import ApplyColumn from "../../components/ApplyColumn.svelte";
  import DisplayFieldMenu from "./DisplayFieldMenu.svelte";
  import ImageFieldMenu from "./ImageFieldMenu.svelte";

  export let dataType: string;
  let isProcessing: boolean = false;

  const updateDropdownStyle: () => void = getContext(
    UPDATE_DROPDOWN_STYLE_CONTEXT_NAME
  );
  const defaultFormat = getStructDefaultFormat().format;
  const structTypeData = getActiveCellStructTypeData() as StructDetailTypeData;
  let currentFormat = getActiveCellDataFormat() as CellStructFormat;
  const structFormatOptions = getStructFormatOptions();
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
    currentFormat = getActiveCellDataFormat() as CellStructFormat;
    await tick();
    updateDropdownStyle();
  }

  async function changeStructDataFormat(format: CellStructFormat) {
    if (isProcessing) isProcessing = true;
    await changeCellsDataFormat(format);
    isProcessing = false;
  }

  // function onApplyModeChange() {
  //   setApplyEntireColumn(applyEntireColumn);
  // }

  // let applyEntireColumn = shouldApplyEntireColumn();
  // $: applyEntireColumn, onApplyModeChange();
</script>

<SameTypeHeader dataType="struct" />

<div class="mx-3.5" class:disabled={isProcessing}>
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
      Display field
    </div>
    <DisplayFieldMenu {structTypeData} {changeStructDataFormat} />

    <div class="mt-3 mb-1 text-11px text-dark-50 font-medium uppercase">
      Image field
    </div>
    <ImageFieldMenu {structTypeData} {changeStructDataFormat} />

    <!-- <div class="mt-3 mb-1 text-11px text-dark-50 font-medium uppercase">
      Display Field
    </div>
    <SelectDisplayFieldMenu {structTypeData} {changeStructDataFormat} />

    <div class="mt-3 mb-1 text-11px text-dark-50 font-medium uppercase">
      Image Field
    </div>
    <SelectImageFieldMenu {structTypeData} {changeStructDataFormat} /> -->
  {/if}

  <!-- <div class="mt-3 text-13px">
    <ApplyColumn bind:checked={applyEntireColumn} />
  </div> -->
</div>

<style lang="postcss">
  .disabled :global(*) {
    @apply pointer-event-none;
  }
</style>
