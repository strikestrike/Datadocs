<script lang="ts">
  import { columnTypeToString } from "@datadocs/canvas-datagrid-ng/lib/utils/column-types";
  import {
    beginEdit,
    hasGridEditor,
    onFormulaBarKeydown as onFormulaBarKeyDown,
    onFormulaBarMouseUp,
    updateFormulaPreview,
  } from "../../../app/store/store-toolbar";
  import Icon from "../../common/icons/Icon.svelte";
  import NameBox from "./name-box/NameBox.svelte";
  import CellPreview from "../../grids/cell-helper/CellPreview.svelte";
  import { getGridStore } from "../../../app/store/grid/base";
  import type { DropdownTriggerRect } from "../../common/dropdown/type";
  import { formulaBarValue } from "../../../app/store/writables";
  import DataTypeIcon from "./DataTypeIcon.svelte";

  const gridStore = getGridStore();
  let formulaBarInput: HTMLDivElement;
  let _formulaBarValue = $formulaBarValue;
  let showFormulaPreview: boolean = false;
  let previewMessage: string = "";
  let triggerRect: DropdownTriggerRect;
  let previewFontFamily: string;
  let previewFontSize: number;
  let inFormulaMode: boolean = false;

  $: if (document.activeElement == formulaBarInput) {
    // The formula bar is focused, so let it update the cell value.
    $formulaBarValue = _formulaBarValue;
    onShowFormulaPreview();
  } else {
    // The formula bar is NOT focused, so update it.
    _formulaBarValue = $formulaBarValue;
    onHideFormulaPreview();
  }

  function onFormulaBarFocusIn() {
    if (hasGridEditor()) return;
    beginEdit();
    formulaBarInput.focus();
  }

  function getHSeparator(marginX: string = "mx-3") {
    return `<div class="w-0px h-4 ${marginX} p-0 border-r border-collapse border-width-0 border-right-width-1px border-radius-0 border-solid border-light-100"/>`;
  }

  function onShowFormulaPreview() {
    if (!grid || document.activeElement !== formulaBarInput) return;
    updateFormulaPreview();
    const preview = grid.getCellPreviewMessage();
    if (!preview || !preview.value) return onHideFormulaPreview();
    previewMessage = preview.value;
    previewFontFamily = grid.style.editCellPreviewFontFamily;
    previewFontSize = grid.style.editCellPreviewFontSize;
    triggerRect = formulaBarInput.getBoundingClientRect();
    showFormulaPreview = true;
  }

  function onHideFormulaPreview() {
    showFormulaPreview = false;
    triggerRect = null;
    previewMessage = "";
  }

  function onPaste(e: ClipboardEvent) {
    e.preventDefault();

    // Only allow text/plain content into cell editor
    const text = e.clipboardData ? e.clipboardData.getData("text/plain") : "";
    if (document.queryCommandSupported("insertHTML")) {
      document.execCommand("insertHTML", false, text);
    } else {
      const textNode = document.createTextNode(text);
      const range = document.getSelection().getRangeAt(0);
      range.deleteContents();
      range.insertNode(textNode);
      range.selectNodeContents(textNode);
      range.collapse(false);

      const selection = document.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      formulaBarInput.dispatchEvent(new Event("input"));
    }
  }

  $: grid = $gridStore;
  $: inFormulaMode = _formulaBarValue.startsWith?.("=");
</script>

<div class="flex flex-row items-center w-full">
  <NameBox />

  {@html getHSeparator("mx-3")}

  <div class="flex flex-row items-center gap-0.5 text-dark-300">
    <Icon icon="query-editor-formula" size="19px" />
    <DataTypeIcon />
  </div>

  {@html getHSeparator("mx-3")}

  <div class="ml-0.5 mr-1 h-5 flex-grow flex-shrink">
    <div
      class="formula-input max-w-full w-full h-full border-none outline-none"
      class:formula-mode={inFormulaMode}
      contenteditable="true"
      data-grideditorcompanion="true"
      data-formulainput="true"
      bind:this={formulaBarInput}
      bind:textContent={_formulaBarValue}
      on:focusin={onFormulaBarFocusIn}
      on:keydown={onFormulaBarKeyDown}
      on:focus={onShowFormulaPreview}
      on:blur={onHideFormulaPreview}
      on:paste={onPaste}
      on:mouseup={onFormulaBarMouseUp}
      style:overflow-y="auto"
      spellcheck="false"
    />

    {#if showFormulaPreview && previewMessage && triggerRect}
      <CellPreview
        message={previewMessage}
        {triggerRect}
        fontSize={previewFontSize}
        fontFamily={previewFontFamily}
        height={22}
        marginBottom={4}
        controlByEvent={false}
      />
    {/if}
  </div>
</div>

<style lang="postcss">
  .formula-input,
  .formula-input :global(*) {
    @apply !bg-white !font-normal !text-dark-300 !text-13px !leading-5 !font-normal;
    @apply !cursor-text !whitespace-normal !break-words;
    font-family: Roboto !important;
  }

  .formula-input.formula-mode,
  .formula-input.formula-mode :global(*) {
    font-family: Inconsolata, monospace, arial, sans, sans-serif !important;
  }

  .formula-input :global(*) {
    @apply !pointer-events-none;
    display: inline !important;
  }
</style>
