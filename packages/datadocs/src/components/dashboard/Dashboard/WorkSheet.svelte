<script lang="ts">
  import { appManager } from "../../../app/core/global/app-manager";
  import {
    APP_EVENT_LAYOUT_RESIZE_END,
    APP_EVENT_LAYOUT_RESIZE_START,
    APP_EVENT_SHEET_LAYOUT,
  } from "../../../app/core/global/app-manager-events";

  import type { WorkbookSheet } from "../../../app/store/types";
  import ContainersLayout from "src/layout/pages/sheet/index.svelte";
  import {
    containerPaneAction,
    onDividerDrag,
    onDividerDrop,
  } from "./worksheet-actions";
  import { sheetConfig } from "src/app/store/writables";

  export let data: WorkbookSheet;

  function onReady() {
    // appManager.layerManager.updateLayers(config);
  }

  function onLayout(event) {
    appManager.trigger(APP_EVENT_SHEET_LAYOUT, {
      data: event.detail,
    });
    appManager.layerManager.updateLayers(event.detail.layout);
    appManager.api.saveSheetContent(data.id, event.detail.layout);
  }

  $: {
    appManager.api.getSheetContent(data.id).then((configuration) => {
      sheetConfig.set(configuration);
      onReady();
    });
  }
</script>

{#if $sheetConfig !== null}
  <ContainersLayout />
{/if}

<style lang="postcss">
  /* .work-sheet-overlays {
    @apply absolute top-0 left-0 w-full h-full z-999999 pointer-events-none;
  } */
</style>
