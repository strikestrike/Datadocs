<!-- @component
@packageModule(layout/PaneTabsDummy)
-->
<script lang="ts">
  import clsx from "clsx";
  import PaneTabsClosedDummy from "./PaneTabsClosedDummy.svelte";
  import PaneTabsOpenDummy from "./PaneTabsOpenDummy.svelte";

  export let dummy = null;

  export let showIcon = false;

  export let showLabel = false;
</script>

<div
  class={clsx("drag-pane-dummy-main hidden", showLabel && "open")}
  bind:this={dummy}
>
  <div class={clsx(showLabel && "show")}>
    <PaneTabsOpenDummy {...$$restProps} showIcon={false} showLabel={true} />
  </div>
  <div class={clsx(showIcon && "show")}>
    <PaneTabsClosedDummy {...$$restProps} showIcon={true} showLabel={false} />
  </div>
</div>

<style lang="postcss">
  .drag-pane-dummy-main {
    @apply absolute overflow-visible pointer-events-none;
    display: inline-flex;
  }

  .drag-pane-dummy-main.open {
    @apply absolute overflow-visible pointer-events-none;
    width: 91px;
  }

  :global(.drag-pane-dummy-main.horizontal) {
    flex-direction: row;
    justify-content: center;
  }

  :global(.drag-pane-dummy-main.vertical) {
    justify-content: center;
  }

  .drag-pane-dummy-main > :global(div) {
    display: none;
  }

  .drag-pane-dummy-main > :global(div.pane) {
    display: none !important;
  }

  .drag-pane-dummy-main > :global(div.show) {
    display: inline-flex;
  }

  :global(.drag-pane-dummy-main.open.toggle) {
    @apply relative overflow-visible pointer-events-none;
    display: inline-flex;
    width: auto !important;
  }

  :global(.drag-pane-dummy-main.toggle) :global(div.show) {
    display: none;
  }

  :global(.drag-pane-dummy-main.toggle) :global(div) {
    display: inline-flex;
  }

  :global(.drag-pane-dummy-main.toggle) > :global(div.pane) {
    display: none !important;
  }
</style>
