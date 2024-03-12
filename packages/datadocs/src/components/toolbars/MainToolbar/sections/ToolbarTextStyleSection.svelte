<script lang="ts">
  import ToolbarButton from "../buttons/ToolbarButton.svelte";
  import ToolbarSplitButton from "../buttons/ToolbarSplitButton.svelte";
  import {
    getHAlignIcon,
    getVAlignIcon,
    getTextWrappingIcon,
  } from "../dropdowns/default";
  import {
    horizontalAlignValue,
    verticalAlignValue,
    textWrappingValue,
    textRotationValue,
  } from "../../../../app/store/writables";
  import { changeTextWrappingValue } from "../../../../app/store/store-toolbar";
  import HorizontalAlignDropdown from "../dropdowns/HorizontalAlignDropdown/HorizontalAlignDropdown.svelte";
  import VerticalAlignDropdown from "../dropdowns/VerticalAlignDropdown/VerticalAlignDropdown.svelte";
  import TextWrappingDropdown from "../dropdowns/TextWrappingDropdown/TextWrappingDropdown.svelte";
  import { applyStyleProTipStore } from "../dropdowns/ApplyStyleProTip";
  import TextRotationDropdown from "../dropdowns/TextRotationDropdown/TextRotationDropdown.svelte";

  $: showApplyStyleProTip = $applyStyleProTipStore;

  $: hAlign = $horizontalAlignValue;
  $: hAlignIcon = getHAlignIcon(hAlign);

  $: vAlign = $verticalAlignValue;
  $: vAlignIcon = getVAlignIcon(vAlign);

  $: textWrapping = $textWrappingValue;
  $: textWrappingIcon = getTextWrappingIcon(textWrapping);

  $: textRotation = $textRotationValue;
</script>

<ToolbarButton
  icon={hAlignIcon}
  activeIcon={hAlignIcon}
  isDropdownChild
  hasArrow={true}
  tooltip="Horizontal align"
  {showApplyStyleProTip}
  disabledTooltipOnActive
  dropdownComponent={HorizontalAlignDropdown}
/>

<ToolbarButton
  icon={vAlignIcon}
  activeIcon={vAlignIcon}
  isDropdownChild
  hasArrow={true}
  tooltip="Vertical align"
  {showApplyStyleProTip}
  disabledTooltipOnActive
  dropdownComponent={VerticalAlignDropdown}
/>

<ToolbarSplitButton
  icon={textWrappingIcon}
  tooltip="Text wrapping"
  {showApplyStyleProTip}
  dropdownComponent={TextWrappingDropdown}
  on:click={() => changeTextWrappingValue(textWrapping)}
/>

<ToolbarButton
  icon="text-rotation-button"
  hasArrow={true}
  tooltip="Text rotation"
  disabledTooltipOnActive
  {showApplyStyleProTip}
  isDropdownChild
  dropdownComponent={TextRotationDropdown}
/>
