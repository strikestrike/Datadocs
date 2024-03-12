<script lang="ts">
  import type { CellDataFormat } from "@datadocs/canvas-datagrid-ng";
  import TextWithTickSign from "../../components/TextWithTickSign.svelte";
  import { previewCellsDataFormat } from "../../../../../../../app/store/store-toolbar";
  import { getDisplayDataForType, getHintTextStyle } from "../..//util";

  export let format: CellDataFormat;
  export let selectItem: (format: CellDataFormat) => void;
  export let isDefault: boolean;
  export let isActive: boolean;
  // export let applyEntireColumn = false;
  export let dataType: string;
  export let stopPreviewing = false;

  /** Indicate the component is part of multiple types menu  */
  export let multipleTypes = false;

  const { displayValue, hint } = getDisplayDataForType(
    dataType,
    format,
    isDefault
  );
  const hintTextStyle = getHintTextStyle(format);
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<div
  on:click={() => selectItem(format)}
  on:mouseover={() =>
    !stopPreviewing &&
    previewCellsDataFormat(format, dataType, multipleTypes)}
  on:mouseleave={() =>
    !stopPreviewing &&
    previewCellsDataFormat(
      undefined,
      dataType,
      multipleTypes,
    )}
>
  <TextWithTickSign {isActive} content={displayValue} {hint} {hintTextStyle} />
</div>

<style lang="postcss">
  div {
    @apply block pl-2.5 pr-3.5 py-1.5 rounded-sm cursor-pointer;
  }

  div:hover {
    @apply bg-dropdown-item-hover-bg;
  }

  div :global(*) {
    @apply pointer-event-none;
  }
</style>
