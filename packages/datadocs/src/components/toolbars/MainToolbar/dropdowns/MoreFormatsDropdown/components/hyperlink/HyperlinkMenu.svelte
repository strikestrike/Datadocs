<script lang="ts">
  import { getContext } from "svelte";
  import type {
    CellStringFormat,
    SelectionDataTypeListInformation,
  } from "@datadocs/canvas-datagrid-ng";
  import { getCellDataFormatByIndex } from "../../../../../../../app/store/store-toolbar";
  import { isHyperlinkDataFormat } from "@datadocs/canvas-datagrid-ng/lib/data/formatters/util";
  import { FIRST_SELECTED_STRING_DATA } from "../../util";
  import LabelMenu from "./LabelMenu.svelte";
  import RefMenu from "./RefMenu.svelte";

  const firstStringData: SelectionDataTypeListInformation["firstString"] =
    getContext(FIRST_SELECTED_STRING_DATA);
  const format = firstStringData
    ? (getCellDataFormatByIndex(
        firstStringData.rowIndex,
        firstStringData.columnIndex
      ) as CellStringFormat)
    : null;
  const isLink = isHyperlinkDataFormat(format);
  const isLinkLabel =
    isLink &&
    (format?.style === "lcolumn" ||
      format?.style === "ltext" ||
      format?.style === "lformula" ||
      format?.style === "lempty");
  const isLinkRef =
    isLink &&
    (format?.style === "rcolumn" ||
      format?.style === "rtext" ||
      format?.style === "rformula" ||
      format?.style === "rempty");
</script>

{#if isLink}
  {#if isLinkLabel}
    <LabelMenu {format} />
  {:else if isLinkRef}
    <RefMenu {format} />
  {/if}
{/if}
