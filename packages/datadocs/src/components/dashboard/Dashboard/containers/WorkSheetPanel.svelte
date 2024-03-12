<!-- @component
@packageModule(layout/Panel)
-->
<script lang="ts">
  import { afterUpdate } from "svelte";
  import { appManager } from "../../../../app/core/global/app-manager";
  // import {
  //   OBJECT_TYPE_CHART,
  //   OBJECT_TYPE_IMAGE,
  // } from "../../../../layout/store/object/objects-constants";
  // import { getId } from "../../../../layout/main/panels-layout/core/utils";
  import type { Pane, View } from "src/layout/types/pane";
  import { panelComponents } from "../../../panels/panels-config";

  /**
   * Specify the pane to be rendered
   * @type {"any"}
   */
  export let pane: Pane = null;

  export let paneView: View = null;

  let blankCanvas: any = null;

  let view;
  let content;

  afterUpdate(() => {
    // console.groupCollapsed("WorkSheetContainer");
    // console.log(
    //   "Panel updated XXX ",
    //   pane.placement,
    //   pane.id,
    // );
    // console.groupEnd();
  });

  $: content = pane.content;
  $: view = content?.view || paneView || null;
</script>

<div id={pane.id} class="worksheet-panel">
  {#if view !== null}
    {#if panelComponents[view.name] !== undefined}
      <div class="feature">
        <svelte:component this={panelComponents[view.name]} {pane} {view} />
      </div>
    {:else}
      <div class="feature-not-found">
        Feature not found - {pane.content?.view?.label ||
          pane?.placement ||
          pane.content?.view.id ||
          pane?.id}
      </div>
    {/if}
  {:else}
    <div class="blank-canvas" bind:this={blankCanvas} />
  {/if}
</div>

<style lang="postcss">
  .worksheet-panel {
    @apply w-full h-full relative bg-white;
  }

  .feature {
    @apply bg-white overflow-hidden w-full h-full flex flex-col;
  }

  .feature-not-found {
    @apply w-full h-full bg-white overflow-hidden p-2 justify-center items-center uppercase;
  }

  .blank-canvas {
    @apply w-full h-full bg-white overflow-hidden justify-center items-center;
  }
</style>
