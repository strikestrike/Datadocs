<!-- @component
@packageModule(layout/Panel)
-->
<script lang="ts">
  import { afterUpdate } from "svelte";
  import { sheetPanelComponents } from "./sheet-panels-config";

  /**
   * Specify the pane to be rendered
   * @type {"any"}
   */
  export let pane: any = null;

  export let isInTab = false;

  export let tabIndex = -1;

  $: view = pane.settings?.view || null;

  afterUpdate(() => {
    console.groupCollapsed("SheetPanel");
    console.log(
      "Panel updated XXX ",
      pane.placement,
      pane.id,
      tabIndex,
      isInTab
    );
    console.groupEnd();
  });
</script>

<div id={pane.id} class="sheet-panel ">
  {#if view !== null}
    {#if sheetPanelComponents[view.name] !== undefined}
      <div class="feature">
        <svelte:component
          this={sheetPanelComponents[view.name]}
          {pane}
          {isInTab}
          {tabIndex}
          {view}
        />
      </div>
    {:else}
      <div class="feature-not-found">
        Feature not found - {pane.settings?.view?.label ||
          pane.settings?.placement ||
          pane.settings?.id ||
          pane?.id}
      </div>
    {/if}
  {:else}
    <div class="view-not-defined ">
      View not defined - {pane.id}
    </div>
  {/if}
</div>

<style lang="postcss">
  .sheet-panel {
    @apply w-full h-full relative p-2 bg-white;
  }

  .feature {
    @apply bg-white overflow-hidden w-full h-full flex flex-col;
  }

  .feature-not-found {
    @apply w-full h-full bg-white overflow-hidden p-2 justify-center items-center uppercase;
  }

  .view-not-defined {
    @apply w-full h-full bg-white overflow-hidden justify-center items-center uppercase;
  }
</style>
