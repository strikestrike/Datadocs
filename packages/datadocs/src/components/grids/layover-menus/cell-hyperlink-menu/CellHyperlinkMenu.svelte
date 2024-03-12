<script lang="ts">
  import type {
    MetaRun,
    NormalCellDescriptor,
  } from "@datadocs/canvas-datagrid-ng";
  import HyperlinkCard from "../../hyperlink/hyperlink-card/HyperlinkCard.svelte";
  import { getGridStore } from "../../../../app/store/grid/base";
  import { editCellMeta } from "../../../../app/store/store-toolbar";
  import {
    getTableCellStringValue,
    getHyperlinkData,
  } from "@datadocs/canvas-datagrid-ng/lib/utils/hyperlink";

  export let data: NormalCellDescriptor;
  const MAX_CARD_NUMBER = 20;

  const linkRuns = data.linkRuns ?? [];
  const limitedLinkRuns = linkRuns.slice(0, MAX_CARD_NUMBER);
  const gridStore = getGridStore();

  function handleRemoveLink(linkRun: MetaRun) {
    const runs: MetaRun[] = [];
    linkRuns.forEach((run) => {
      if (run !== linkRun) {
        runs.push(run);
      }
    });

    const { rowIndex, columnIndex } = data;
    const meta = grid.dataSource.getCellMeta(rowIndex, columnIndex) ?? {};

    editCellMeta(rowIndex, columnIndex, {
      ...meta,
      linkData: getHyperlinkData(
        runs,
        getTableCellStringValue(data.value),
        data.isValueReadOnly
      ),
    });
  }

  $: grid = $gridStore;
</script>

<div class="flex flex-col px-3 py-1 max-h-full overflow-y-auto">
  {#each limitedLinkRuns as run}
    <HyperlinkCard
      gridCellRowIndex={data.rowIndex}
      gridCellColumnIndex={data.columnIndex}
      linkRun={run}
      readonly={data.inferLink}
      {handleRemoveLink}
    />
  {/each}
</div>
