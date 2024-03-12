<script lang="ts">
  import MainStatusBar from "../../toolbars/MainStatusBar/MainStatusBar.svelte";
  import WorkSheet from "./WorkSheet.svelte";
  import {
    getCurrentActiveSheet,
    getSheetsData,
    sheetsDataStore,
  } from "../../../app/store/store-worksheets";
  import checkMobileDevice from "../../common/is-mobile";
  import { activeWorkbookStore } from "../../../app/store/store-workbooks";

  export let hasNextPane = false;
  export let pane: any = {};

  const isMobile = checkMobileDevice();
  let activeSheet = getCurrentActiveSheet();
  let numberOfSheets = getSheetsData().length;

  $: data = $sheetsDataStore;
  $: if (data) {
    activeSheet = getCurrentActiveSheet();
    numberOfSheets = data.length;
  }
  $: activeWorkbook = $activeWorkbookStore;
</script>

<div
  class="workbook-sheets"
  class:has-next-pane={hasNextPane}
  class:mobile={isMobile}
>
  {#if activeWorkbook}
    <div class="sheets-content h-[calc(100%-34px)]">
      <div
        class="pb-1 h-full flex-grow flex-shrink relative overflow-hidden box-border"
      >
        <div
          class="w-full h-full"
          style="box-shadow: 0px 1px 6px rgba(55, 84, 170, 0.16);"
        >
          {#if activeSheet}
            <WorkSheet data={activeSheet} />
          {/if}
        </div>
      </div>

      <!-- <div class="sheet-bottom flex-shrink-0 flex-grow-0">
        <div class="top-box-shadow" />
      </div> -->
    </div>

    <div class="status-bar-holder">
      <MainStatusBar {numberOfSheets} />
    </div>
  {/if}
</div>

<style lang="postcss">
  .workbook-sheets {
    @apply flex flex-col flex-shrink-0;
    /* width: calc(100% - 4px); */
    height: 100%;
    margin: 0px 0px 2px;
    --status-bar-height: 34px;
  }

  .workbook-sheets.has-next-pane {
    height: calc(100% - 3px);
    margin: 0px 0px 2px 0px;
  }

  .workbook-sheets.mobile {
    height: calc(100% - 2px);
    width: 100%;
    margin: 0px 0px 2px 0px;
  }

  .sheets-content {
    @apply flex-grow flex-shrink flex flex-col bg-white;
    box-shadow: 0px 1px 6px rgba(55, 84, 170, 0.16);
    z-index: 1000;
  }

  /*
    Dashboard container-layout should have overflow hidden
    to make sure the box shadow from inner container stack
    on each other and make the design looks bad
  */
  .workbook-sheets :global(.containers-layout) {
    overflow: hidden;
  }

  /* .sheet-bottom {
    @apply relative h-1 text-center italic font-medium text-dark-100 rounded-br rounded-bl bg-white select-text;
    font-size: 11px;
  }

  .sheet-bottom .top-box-shadow {
    @apply absolute w-full top-0 left-0 right-0 h-px;
    z-index: -1;
    box-shadow: 0px -2px 4px rgba(55, 84, 170, 0.16);
  } */

  .status-bar-holder {
    height: 34px;
  }
</style>
