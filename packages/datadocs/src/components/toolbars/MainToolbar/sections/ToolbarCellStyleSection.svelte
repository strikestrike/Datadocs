<script lang="ts">
  // import ToolbarButton from "../buttons/ToolbarButton.svelte";
  import BackgroundColorDropdown from "../dropdowns/BackgroundColorDropdown/BackgroundColorDropdown.svelte";
  import MergeCellsDropdown from "../dropdowns/MergeCellsDropdown/MergeCellsDropdown.svelte";
  import BordersDropdown from "../dropdowns/BordersDropdown/BordersDropdown.svelte";
  import ToolbarSplitButton from "../buttons/ToolbarSplitButton.svelte";
  import {
    backgroundColorValue,
    mergeCellsStateStore,
  } from "../../../../app/store/writables";
  import {
    changeBackgroundColorValue,
    editCellsBorderStyle,
    mergeCells,
    previewBackgroundColor,
    removeStylePreview,
  } from "../../../../app/store/store-toolbar";
  import { applyStyleProTipStore } from "../dropdowns/ApplyStyleProTip";

  function onPreviewBackgroundColor() {
    if (backgroundColor?.type === "cellcolor") {
      previewBackgroundColor(backgroundColor.value);
    }
  }

  function onMouseLeave() {
    removeStylePreview();
  }

  $: showApplyStyleProTip = $applyStyleProTipStore;
  $: mergeCellsState = $mergeCellsStateStore;
  $: isMergeCellsMenuDisabled =
    !mergeCellsState.canMergeAll &&
    !mergeCellsState.canMergeDirectionally &&
    !mergeCellsState.canUnmerge;
  $: backgroundColor = $backgroundColorValue;
</script>

<ToolbarSplitButton
  icon="fill-color"
  tooltip="Fill color"
  indicatorColor={backgroundColor.value}
  {showApplyStyleProTip}
  dropdownComponent={BackgroundColorDropdown}
  on:click={() => changeBackgroundColorValue(backgroundColor)}
  on:mouseOverIconButton={onPreviewBackgroundColor}
  on:mouseLeaveIconButton={onMouseLeave}
/>

<ToolbarSplitButton
  icon="toolbar-border"
  tooltip="Borders"
  {showApplyStyleProTip}
  dropdownComponent={BordersDropdown}
  on:click={() => editCellsBorderStyle("all_borders")}
/>

<ToolbarSplitButton
  icon="merge-cell"
  tooltip="Merge cells"
  {showApplyStyleProTip}
  dropdownComponent={MergeCellsDropdown}
  disabled={isMergeCellsMenuDisabled}
  on:click={() => {
    if (isMergeCellsMenuDisabled || !mergeCellsState.canMergeAll) return;
    mergeCells("center");
  }}
/>
