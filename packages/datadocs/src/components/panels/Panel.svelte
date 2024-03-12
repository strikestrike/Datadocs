<!-- @component
@packageModule(layout/Panel)
-->
<script lang="ts">
  import { afterUpdate } from "svelte";
  import Dashboard from "../dashboard/Dashboard/Dashboard.svelte";
  import { dashboardConfig } from "../dashboard/Dashboard/Dashboard";
  // import DataGrid from "../../../components/grids/Ingest.svelte";
  // import DataGrid from "../../../components/grids/MainGridPanel.svelte";
  import { panelComponents } from "./panels-config";
  import type { Pane, PaneContent, View } from "src/layout/types/pane";

  /**
   * Specify the pane to be rendered
   * @type {"any"}
   */
  export let pane: Pane = null;

  let paneContent: PaneContent;
  let view: View;
  let isDashboard = false;

  $: paneContent = pane?.content || null;
  $: view = paneContent?.view || null;
  $: isDashboard = view?.name === dashboardConfig.name;

  afterUpdate(() => {
    // console.log("Panel updated XXX ", pane.placement, pane.id);
  });
</script>

<div id={pane.id} class="panel">
  {#if view !== null}
    {#if isDashboard}
      <Dashboard {pane} />
    {:else if panelComponents[view.name] !== undefined}
      <div class="feature">
        <svelte:component this={panelComponents[view.name]} {pane} />
      </div>
    {:else}
      <div class="feature-not-found">
        Feature not found - {paneContent?.view?.label ||
          pane?.placement ||
          view?.id ||
          pane?.id}
      </div>
    {/if}
  {:else}
    <div class="view-not-defined">
      View not defined - {pane.id}
    </div>
  {/if}
</div>

<style lang="postcss">
  .panel {
    @apply w-full h-full relative;
  }

  .feature {
    @apply w-full h-full bg-white overflow-hidden;
  }

  .feature-not-found {
    @apply w-full h-full bg-white overflow-hidden p-2 justify-center items-center uppercase;
  }

  .view-not-defined {
    @apply w-full h-full bg-white overflow-hidden justify-center items-center uppercase;
  }
</style>
