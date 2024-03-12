<script lang="ts">
  import { GridItemHTMLElement, GridStackNode } from "gridstack";
  import type { Pane } from "src/layout/types/pane";
  import ContainerPane from "src/layout/pages/sheet/components/Main/index.svelte";

  /**
   *The Pane to be rendered
   * @type {Pane}
   */
  export let pane: Pane = null;
  /**
   *The index of pane
   * @type {number}
   */
  export let paneIndex: number = -1;
  /**
   *The Pane Component to be rendered  as children
   * @type {any}
   */
  export let paneComponent: any = null;
  /**
   *Custom Pane Component to render  children
   * @type {any}
   */
  export let customPaneComponent: any = null;
  /**
   *The Component to be rendered in a Pane
   * @type {any}
   */
  export let component: any = null;

  /**
   * Update parent Pane
   * @type {Function}
   *
   */
  export let updateParent: Function = null;

  $: {
    // console.log(pane, paneIndex, paneComponent, customPaneComponent, component, updateParent)
  }
</script>

<div class="tiled-container-item">
  <ContainerPane {pane} />
  <!-- <svelte:component
    this={paneComponent}
    {customPaneComponent}
    {paneComponent}
    {component}
    pane={innerPane}
    paneIndex={i}
    {updateParent}
  /> -->
</div>

<style lang="postcss">
  .tiled-container-item {
    @apply w-full h-full p-1 bg-white;
  }
</style>
