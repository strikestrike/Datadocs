<script lang="ts">
  import type {
    NormalCellDescriptor,
    TableGroupSummary,
  } from "@datadocs/canvas-datagrid-ng";
  import type { SummaryItem } from "./type";
  import Summary from "./Summary.svelte";
  import { ensureAsync } from "@datadocs/canvas-datagrid-ng/lib/data/data-source/await";
  import { formatTableCellValue } from "@datadocs/canvas-datagrid-ng/lib/data/data-format";
  import { getContext } from "svelte";
  import { UPDATE_DROPDOWN_STYLE_CONTEXT_NAME } from "../../../common/dropdown";

  const updateDropdownStyle: () => void = getContext(
    UPDATE_DROPDOWN_STYLE_CONTEXT_NAME
  );

  export let data: NormalCellDescriptor;

  let summaryData: Promise<SummaryItem[]> = loadSummaryItems();

  function mapTableGroupSummary({
    group,
    headerDataType,
    summary,
    summaryDataType,
    summaryFn,
    subgroups,
  }: TableGroupSummary): SummaryItem {
    const formattedGroup = formatTableCellValue(group, headerDataType, {
      type: "string",
      format: "WithoutQuote",
    }, {
      isRoot: true,
    });
    const formattedSummary = formatTableCellValue(
      summary,
      summaryDataType,
      summaryFn.format
    );
    if (typeof formattedGroup !== "string") {
      throw "Formatted group is not string";
    }
    if (typeof formattedSummary !== "string") {
      throw "Formatted summary is not string";
    }
    setTimeout(updateDropdownStyle);
    return {
      group: formattedGroup || "(Blanks)",
      summary: formattedSummary,
      subgroups: subgroups?.length && {
        expanded: false,
        data: subgroups.map(mapTableGroupSummary),
      },
    };
  }

  async function loadSummaryItems() {
    const summaryList = await ensureAsync(
      data.table.dataSource.getGroupSummary(data.tableHeader.id, [])
    );

    return summaryList.map(mapTableGroupSummary);
  }
</script>

<div class="overflow-y-auto" style="max-height: 100%">
  <div class="summary-item-container">
    {#await summaryData then loadedData}
      {#each loadedData as item, i}
        {#if i > 0}
          <div style="grid-column: 1 / 4;" class="border-b border-light-100" />
        {/if}
        <Summary {item} />
      {/each}
    {/await}
  </div>
</div>

<style lang="postcss">
  .summary-item-container {
    @apply py-1.5;
    display: grid;
    grid-template-columns: auto auto auto;
    grid-auto-rows: minmax(12px, auto);
    align-items: center;
  }
</style>
