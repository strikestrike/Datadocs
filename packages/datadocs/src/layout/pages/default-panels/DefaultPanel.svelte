<!-- @component
@packageModule(layout/Panel)
-->
<script lang="ts">
  import { afterUpdate } from "svelte";
  import type { Pane } from "src/layout/types/pane";

  /**
   * Specify the pane to be rendered
   * @type {"any"}
   */
  export let pane: Pane = null;

  $: view = pane.content?.view || null;
  afterUpdate(() => {
    // console.log("Panel updated XXX ", pane.placement, pane.id);
  });
</script>

<div id={pane.id} class="panel">
  {#if view !== null}
    {#if view.name !== undefined}
      <div class="feature">
        {view.name}
      </div>
    {:else}
      <div class="feature-not-found">
        Feature not found - {pane.content?.view?.label ||
          pane?.placement ||
          pane.content?.view?.id ||
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
    @apply w-full h-full bg-white overflow-hidden flex justify-center items-center;
  }

  .feature-not-found {
    @apply w-full h-full bg-white overflow-hidden p-2 justify-center items-center uppercase;
  }

  .view-not-defined {
    @apply w-full h-full bg-white overflow-hidden justify-center items-center uppercase;
  }
</style>
