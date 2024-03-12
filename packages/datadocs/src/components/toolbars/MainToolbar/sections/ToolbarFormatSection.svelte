<script lang="ts">
  import ToolbarButton from "../buttons/ToolbarButton.svelte";
  import CurrencyFormatDropdown from "../dropdowns/CurrencyFormatDropdown/CurrencyFormatDropdown.svelte";
  import ToolbarSplitButton from "../buttons/ToolbarSplitButton.svelte";
  // import UnimplementedDropdown from "../dropdowns/UnimplementedDropdown/UnimplementedDropdown.svelte";
  import MoreFormatsDropdown from "../dropdowns/MoreFormatsDropdown/MoreFormatsDropdown.svelte";
  import {
    changeCellsDataFormat,
    increaseNumberOfDecimalPlaces,
    previewCellsDataFormat,
    previewIncreaseDecreaseDecimalPlaces,
    removeStylePreview,
  } from "../../../../app/store/store-toolbar";
  import { applyStyleProTipStore } from "../dropdowns/ApplyStyleProTip";
  import type { CellNumberFormat } from "@datadocs/canvas-datagrid-ng";

  const currencyFormat: CellNumberFormat = {
    type: "number",
    format: "currency",
    currency: "usd",
    decimalPlaces: 2,
  };

  const percentFormat: CellNumberFormat = {
    type: "number",
    format: "percent",
    decimalPlaces: 2,
  };

  async function onChangeCurrencyFormat() {
    await changeCellsDataFormat(currencyFormat);
  }

  async function onChangePercentFormat() {
    await changeCellsDataFormat(percentFormat);
  }

  async function onIncreaseDecreaseDecimalPlaces(
    mode: "increase" | "decrease"
  ) {
    const delta = mode === "increase" ? 1 : -1;
    await increaseNumberOfDecimalPlaces(delta);
    removeStylePreview();
  }

  function onPreviewIncreaseDecreaseDecimalPlaces(
    mode: "increase" | "decrease"
  ) {
    const delta = mode === "increase" ? 1 : -1;
    previewIncreaseDecreaseDecimalPlaces(delta);
  }

  function onHoverCurrencyButton() {
    previewCellsDataFormat(currencyFormat, "number", false);
  }

  function onHoverPercentButton() {
    previewCellsDataFormat(percentFormat, "number", false);
  }

  function onMouseLeave() {
    removeStylePreview();
  }

  $: showApplyStyleProTip = $applyStyleProTipStore;
</script>

<ToolbarSplitButton
  icon="num-fmt-currency"
  tooltip="Format as currency"
  on:click={onChangeCurrencyFormat}
  on:mouseOverIconButton={onHoverCurrencyButton}
  on:mouseLeaveIconButton={onMouseLeave}
  dropdownComponent={CurrencyFormatDropdown}
  {showApplyStyleProTip}
/>

<ToolbarButton
  icon="num-fmt-percent"
  tooltip="Format as percent"
  on:click={onChangePercentFormat}
  on:mouseover={onHoverPercentButton}
  on:mouseleave={onMouseLeave}
  {showApplyStyleProTip}
/>

<ToolbarButton
  icon="num-fmt-decimal-decrease"
  tooltip="Decrease decimal places"
  on:click={() => onIncreaseDecreaseDecimalPlaces("decrease")}
  on:mouseover={() => onPreviewIncreaseDecreaseDecimalPlaces("decrease")}
  on:mouseleave={onMouseLeave}
  {showApplyStyleProTip}
/>

<ToolbarButton
  icon="num-fmt-decimal-increase"
  tooltip="Increase decimal places"
  on:click={() => onIncreaseDecreaseDecimalPlaces("increase")}
  on:mouseover={() => onPreviewIncreaseDecreaseDecimalPlaces("increase")}
  on:mouseleave={onMouseLeave}
  {showApplyStyleProTip}
/>

<ToolbarButton
  icon="num-fmt-other"
  hasArrow={true}
  isDropdownChild
  tooltip="More formats"
  disabledTooltipOnActive
  dropdownComponent={MoreFormatsDropdown}
  {showApplyStyleProTip}
/>
