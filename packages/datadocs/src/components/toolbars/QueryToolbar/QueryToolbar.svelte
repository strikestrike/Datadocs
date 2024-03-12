<script lang="ts">
  import CollapsedToolbar from "./CollapsedToolbar.svelte";
  import ExpandedToolbar from "./ExpandedToolbar.svelte";

  export let isCollapsed: boolean;
  export let height: number;
  export let queryToolbarElement: HTMLElement;

  // const COLLAPSE_TOOLBAR_HEIGHT = 40;
  // const EXPAND_TOOLBAR_HEIGHT = 200;

  // $: toolbarHeight = isCollapsed
  //   ? COLLAPSE_TOOLBAR_HEIGHT
  //   : height;
</script>

<div style="height: {height}px" bind:this={queryToolbarElement}>
  {#if isCollapsed}
    <CollapsedToolbar />
  {:else}
    <ExpandedToolbar />
  {/if}
</div>
