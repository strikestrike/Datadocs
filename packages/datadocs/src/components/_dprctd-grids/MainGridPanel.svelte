<script lang="ts">

  import type {
    GridSheet} from "../../app/store/store-sheets";
import {
  BLANK_CANVAS,
  SPREADSHEET
} from "../../app/store/store-sheets";
  
  import BlankCanvas from "./sheets/BlankCanvas.svelte";
  import Graph from "./sheets/Graph.svelte";
  import Spreadsheet from "./sheets/Spreadsheet.svelte";
  import MainGridTabs from "./tabs/MainGridTabs.svelte";
  import TestQuery from "./TestQuery.svelte";
  import { isTestQuery } from "../../app/store/store-ui";
  import { PANEL_TAB_CONTEXT } from "./constants"
  import { setContext } from "svelte";

  export let data: GridSheet[];

  let activeSheet: GridSheet;
  let testQuery: boolean;
  isTestQuery.subscribe((value) => {
    testQuery = value;
  });

  function updateData(newData: GridSheet[]) {
    data.length = newData.length;
    for (let i = 0; i < newData.length; i++) {
      data[i] = newData[i];
    }
  }

  $: activeSheet = data.filter((s) => s.isActive)[0];

  setContext(PANEL_TAB_CONTEXT, {
    updateData,
  });
</script>

<div class="h-full w-full flex flex-col p-1.5">
  {#if testQuery}
    <div class="flex-grow-0 flex-shrink-0">
      <TestQuery />
    </div>
  {/if}

  <div class="grid-tabs">
    <MainGridTabs bind:data />
  </div>

  <div class="grid-container relative bg-white flex-auto" style:min-height="0">
    <div
      class="absolute mt-1 left-0 right-0 top-0 bottom-0 border border-solid border-light-100"
    >
      {#if activeSheet.type === SPREADSHEET}
        <Spreadsheet data={activeSheet} />
      {:else if activeSheet.type === BLANK_CANVAS}
        <BlankCanvas data={activeSheet} />
      {:else}
        <Graph data={activeSheet} />
      {/if}
    </div>
  </div>
</div>

<style lang="postcss">
  .grid-container {
    box-shadow: 0px 1px 6px rgba(55, 84, 170, 0.16);
    z-index: 1000;
  }
</style>
