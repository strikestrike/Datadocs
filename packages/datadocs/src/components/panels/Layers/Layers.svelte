<script lang="ts">
  import { onMount, setContext } from "svelte";
  import type { Writable} from "svelte/store";
  import { writable } from "svelte/store";
  import { appManager } from "../../../app/core/global/app-manager";
  import type {
    LayerItem as LayerEntry,
    LayersContext,
  } from "../../../app/core/layers/layers-types";
  import {
    getCurrentActiveSheet,
    getSheetsData,
    sheetsDataStore,
  } from "../../../app/store/store-worksheets";
  import type { WorkbookSheet } from "../../../app/store/types";
  import type { Pane } from "../../../layout/main/panels-layout/types";
  import DropdownWrapper from "../../common/dropdown/DropdownWrapper.svelte";
  import Icon from "../../common/icons/Icon.svelte";
  import { switchSheet } from "../../toolbars/MainStatusBar/utils";
  import LayerItem from "./components/LayerItem.svelte";
  import { createPanelHandler, layersConfig } from "./Layers";

  let panelElement: HTMLElement;

  let layers: Writable<Array<LayerEntry>>;

  const layersContext: LayersContext = {
    isReordering: writable(false),
    drag: {
      active: false,
      sourceIndex: -1,
      targetIndex: -1,
      sourceId: null,
      targetId: null,
    },
    resetDrag() {
      this.isReordering.set(false);
      this.drag.active = false;
      this.drag.sourceIndex = -1;
      this.drag.targetIndex = -1;
      this.drag.sourceId = null;
      this.drag.targetId = null;
      console.groupCollapsed("Layers");
      console.log("resetDrag", this.drag, this.drag.active);
      console.groupEnd();
    },
  };

  export let pane: Pane;

  let showWorkseets: boolean;

  let workSheets: WorkbookSheet[];
  let activeSheet;

  function toggleWorksheets() {
    showWorkseets = !showWorkseets;
  }

  setContext("layersContext", layersContext);

  onMount(() => {
    appManager.register(
      `panel-${layersConfig.name}`,
      createPanelHandler(panelElement)
    );
  });

  sheetsDataStore.subscribe(() => {
    activeSheet = getCurrentActiveSheet();
    workSheets = getSheetsData();
  });

  $: {
    layers = appManager.layerManager.layers;
  }
  $: showWorkseets = false;
  $: workSheets;
  $: activeSheet;
</script>

<div class="panel-layers" bind:this={panelElement}>
  <div class="layers-options">
    <div class="layers-options-left">
      <div class="worksheets-list">
        <div>
          <Icon icon="layers-grid" size="10" />
        </div>
        <DropdownWrapper
          bind:show={showWorkseets}
          distanceToDropdown={8}
          closeOnMouseDownOutside={true}
          alignment="right"
        >
          <div
            class="flex flex-row justify-start items-center space-x-1 mx-1"
            on:mousedown={(event) => toggleWorksheets()}
            slot="button"
          >
            <div class="worksheet-label">{activeSheet?.name}</div>
            <Icon
              icon="layers-label-arrow"
              width="8px"
              height="5px"
              fill="none"
            />
          </div>

          <div class="worksheets-list-list" slot="content">
            <!-- {#each workSheets as workSheet}
              <div
                on:click={() => {
                  toggleWorksheets();
                  switchSheet(workSheet.id);
                }}
                class="worksheets-list-item"
              >
                {workSheet.name}
              </div>
            {/each} -->
          </div>
        </DropdownWrapper>
      </div>
    </div>
    <div class="layers-options-right">
      <div>
        <Icon icon="layers-filters" size="18" />
      </div>
      <div class="hidden">
        <Icon icon="layers-exapand-collapse" size="18" />
      </div>
      <div>
        <Icon icon="layers-folder" size="18" />
      </div>
    </div>
  </div>
  <div class="layers-items">
    {#if $layers.length && $layers.length > 0}
      {#each $layers as layer, index}
        <LayerItem layerItem={layer} {index} />
      {/each}
    {/if}
  </div>
</div>

<style lang="postcss">
  .panel-layers {
    @apply flex flex-col justify-start h-full;
  }
  .layers-options {
    @apply flex flex-row justify-between items-center px-2;
    height: 30px;
    box-shadow: 0px 2px 4px rgba(55, 84, 170, 0.1);
  }
  .layers-options-left {
    @apply flex flex-row min-w-0 justify-start items-center px-1;
  }
  .layers-options-right {
    @apply flex flex-row justify-end items-center space-x-2;
  }
  .layers-options-left .worksheets-list {
    @apply flex flex-row justify-start items-center overflow-hidden;
  }
  .layers-options-left .worksheets-list .worksheet-label {
    @apply flex flex-grow-0 min-w-0 text-11px font-medium leading-[16px] whitespace-nowrap overflow-ellipsis;
  }
  .layers-options-left .worksheets-list-list {
    /* @apply flex flex-col default-dropdown-box-shadow py-2 rounded-sm space-y-1 bg-white; */
    @apply flex flex-col py-2 rounded-sm space-y-1 bg-white;
    box-shadow: 0px 5px 20px rgba(55, 84, 170, 0.16);
  }
  .layers-options-left .worksheets-list-list .worksheets-list-item {
    @apply w-auto h-6 flex flex-row items-center mx-1.5 px-1.5 text-14px;
  }
  .layers-options-left .worksheets-list-list .worksheets-list-item:hover {
    background-color: var(--dropdown-item-hover-bg);
    /* background-color: red; */
  }

  .layers-items {
    @apply flex flex-col-reverse justify-end h-full px-3 py-3;
  }
</style>
