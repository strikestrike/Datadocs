<!-- @component
@packageModule(layout/PaneTabsOpenDummy)
-->
<script lang="ts">
  import PaneTab from "./PaneTab.svelte";

  export let activeItem = {};
  export let activeIndex = 0;
  export let count = 0;

  export let showIcon = false;
  export let showLabel = false;
</script>

<div class="drag-pane-dummy-open hidden">
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

<style lang="postcss">
  .drag-pane-dummy-open {
    @apply absolute inline-flex flex-col justify-center h-auto overflow-visible items-center pointer-events-none;
    z-index: 1000;
  }

  .drag-pane-dummy-open .drag-pane-dummy-tab {
    @apply absolute left-0 top-1 rounded;
    background: #ffffff;
    box-shadow: 1px 2px 6px rgba(55, 84, 170, 0.16);

    -webkit-transition: transform 100ms ease-in-out;
    -moz-transition: transform 100ms ease-in-out;
    -o-transition: transform 100ms ease-in-out;
    transition: transform 100ms ease-in-out;
  }

  .drag-pane-dummy-open .drag-pane-dummy-tab.dummy-tab-1 {
    @apply relative z-50 overflow-hidden flex justify-center items-center;
    width: auto;
    min-width: 91px;
    height: 30px;
  }

  .drag-pane-dummy-open .drag-pane-dummy-tab.dummy-tab-2 {
    @apply relative z-40;
    width: 95%;
    height: 30px;
    margin-top: -26px;
    transform: translateY(-4px);
  }

  .drag-pane-dummy-open .drag-pane-dummy-tab.dummy-tab-3 {
    @apply relative z-30;
    width: 90%;
    height: 30px;
    margin-top: -26px;
    transform: translateY(-8px);
  }

  .drag-pane-dummy-open .tab-count {
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

  .drag-pane-dummy-open .tab-count .tab-count-text {
    font-family: "Poppins";
    font-style: normal;
    font-weight: 600;
    font-size: 11px;
    line-height: 16px;
    /* identical to box height */

    color: #ffffff;
  }

  :global(.drag-pane-dummy-open.single) .drag-pane-dummy-tab.dummy-tab-1 {
    /* height: 40px; */
  }

  :global(.drag-pane-dummy-open.single) .drag-pane-dummy-tab.dummy-tab-2,
  :global(.drag-pane-dummy-open.single) .drag-pane-dummy-tab.dummy-tab-3,
  :global(.drag-pane-dummy-open.single) .tab-count {
    display: none;
  }
</style>
