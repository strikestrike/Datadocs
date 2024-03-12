<script lang="ts">
  import { PaneGroupType } from "src/layout/enums/pane";
  import type { Pane } from "src/layout/types/pane";
  import TiledContainer from "./tiled/GridstackWrapper.svelte";

  /**
   *The Pane to be rendered
   * @type {Pane}
   */
  export let pane: Pane = null;
  /**
   *The index of pane
   * @type {number}
   */
  export let paneIndex = -1;
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
   *The Component to be rendered in a Pane
   * @type {any}
   */
  export let children: Pane[] = null;

  /**
   *Type of group
   * @type {any}
   */
  export let groupType = "";

  /**
   * Update parent Pane
   * @type {Function}
   *
   */
  export let updateParent: Function = null;
</script>

<div class="custom-container">
  {#if groupType === PaneGroupType.TILED}
    <TiledContainer
      {pane}
      {paneIndex}
      {paneComponent}
      {customPaneComponent}
      {component}
      {children}
      {groupType}
      {updateParent}
    />
  {/if}
  <!-- <ContainerTabPreview {pane} {component}>
    <ContainerTabPreviewIndicator>
      <div class="absolute top-4 w-[90%] z-50 h-[80px]" />
    </ContainerTabPreviewIndicator>
  </ContainerTabPreview> -->
</div>

<style lang="postcss">
  .custom-container {
    @apply w-full h-full overflow-auto bg-white;
  }
</style>
