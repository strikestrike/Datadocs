<!-- @component
@packageModule(layout/PaneTabsClosedDummy)
-->
<script lang="ts">
  import PaneTab from "./PaneTab.svelte";

  export let dummy = null;

  export let activeItem = {};
  export let activeIndex = 0;
  export let count = 0;

  export let showIcon = false;
  export let showLabel = false;
</script>

<div class="drag-pane-dummy-closed">
  <div class="tab-count">
    <div class="tab-count-text">
      {#if count > 5}
        5+
      {:else}
        {count}
      {/if}
    </div>
  </div>
  <div class="drag-pane-dummy-tab dummy-tab-1">
    <PaneTab
      tab={activeItem}
      tabIndex={0}
      {activeIndex}
      isActive={true}
      activeFillColor={"#3bc7ff"}
      tabClass={"pointer-events-none"}
      iconSize={"16px"}
      {showIcon}
      {showLabel}
      data={{}}
      pane={undefined}
    />
  </div>
  <div class="drag-pane-dummy-tab dummy-tab-2" />
  <div class="drag-pane-dummy-tab dummy-tab-3" />
</div>

<style>
  .drag-pane-dummy-closed {
    @apply relative inline-flex flex-col justify-center h-auto overflow-visible items-center pointer-events-none z-50;
    overflow: visible;
    width: 26px;
    height: 32px;
  }

  .drag-pane-dummy-closed .tab-count {
    position: absolute;
    top: -7px;
    left: -7px;
    z-index: 9999;
    background: #3bc7ff;
    box-shadow: 1px 2px 6px rgb(59 199 255 / 25%);
    width: 18px;
    height: 18px;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    -webkit-transition: all 150ms ease-out;
    -moz-transition: all 150ms ease-out;
    -o-transition: all 150ms ease-out;
    transition: all 150ms ease-out;
  }

  .drag-pane-dummy-closed .tab-count .tab-count-text {
    font-family: "Poppins";
    font-style: normal;
    font-weight: 600;
    font-size: 11px;
    line-height: 16px;
    /* identical to box height */

    color: #ffffff;
  }

  .drag-pane-dummy-closed .drag-pane-dummy-tab {
    @apply relative;
    background: #ffffff;
    box-shadow: 1px 2px 6px rgba(55, 84, 170, 0.16);
    border-radius: 3px;
  }

  .drag-pane-dummy-closed .drag-pane-dummy-tab.dummy-tab-1 {
    @apply absolute z-50;
    width: 26px;
    height: 26px;
  }

  .drag-pane-dummy-closed .drag-pane-dummy-tab.dummy-tab-2 {
    @apply absolute z-40;
    width: 22px;
    height: 22px;
    top: 10px;
    left: 2px;
  }

  .drag-pane-dummy-closed .drag-pane-dummy-tab.dummy-tab-3 {
    @apply absolute z-30;
    width: 18px;
    height: 18px;
    top: 17px;
    left: 4px;
  }

  .drag-pane-dummy-main.hidden .drag-pane-dummy-closed {
    @apply hidden;
  }

  .drag-pane-dummy-main.hidden .tab-count {
    opacity: 0;
  }

  :global(.drag-pane-dummy-closed.single) .drag-pane-dummy-tab.dummy-tab-2, 
  :global(.drag-pane-dummy-closed.single) .drag-pane-dummy-tab.dummy-tab-3,
  :global(.drag-pane-dummy-closed.single) .tab-count  {
    display: none;
  }

</style>
