<script lang="ts">
  import { onMount, setContext } from "svelte";
  import { enableDevMenu } from "../../app/store/store-ui";
  import {
    localAppVersion,
    latestAppVersion,
    didWeAskServiceWorkerVersion,
    askServiceWorkerVersion,
  } from "../../app/store/store-app-ver";

  import LeftMenuItem from "./components/LeftMenuItem.svelte";
  import viewItems from "./items/viewItems";
  import fileItems from "./items/fileItems";
  import devItems from "./items/devItems";
  import editItems from "./items/editItems";
  import insertItems from "./items/insertItems";
  import arrangeItems from "./items/arrangeItems";

  $localAppVersion;
  $latestAppVersion;
  onMount(() => {
    if (!didWeAskServiceWorkerVersion()) askServiceWorkerVersion(true);
  });

  setContext("MenuLeftContext", {
    hasActiveMenu: false,
    closeActiveMenu: function () {},
  });
</script>

<div class="flex flex-row items-center justify-start text-12px font-medium">
  <LeftMenuItem label="File" data={fileItems} />
  <LeftMenuItem label="Edit" data={editItems} />

  <LeftMenuItem label="View" data={viewItems} />

  <LeftMenuItem label="Insert" data={insertItems} />
  <LeftMenuItem label="Arrange" data={arrangeItems} />

  {#if $enableDevMenu}
    <LeftMenuItem label="Dev" data={devItems} />
  {/if}
  <!-- <div
    class="text-white px-4"
    on:click={() => {
      // loads default workspace
      loadWorkspace();
    }}
  >
    New
  </div>
  <div
    class="text-white px-4"
    on:click={() => {
      // save  workspace
      workSpaceData = getWorkSpace();
    }}
  >
    Save
  </div>
  <div
    class="text-white px-4"
    on:click={() => {
      // load saved  workspace
      loadWorkspace(workSpaceData);
    }}
  >
    Load
  </div> -->
</div>
