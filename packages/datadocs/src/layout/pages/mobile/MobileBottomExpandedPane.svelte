<!-- @component
@packageModule(layout/MobileBottomExpandedPane)
-->
<script lang="ts">
  import { getContext } from "svelte";

  // import { GLOBAL_CONTEXT } from "../../core/constants";
  import DefaultPanel from "../default-panels/DefaultPanel.svelte";

  import type { Pane } from "src/layout/types/pane";

  export let pane: Pane;
  export let activeTabIndex: number;
  export let collapsePane: Function;

  export let PanelComponent = DefaultPanel;

  const PANE_HEIGHT_MIN = 180;

  // const globalContext: GlobalContext = getContext(GLOBAL_CONTEXT);

  // const Icon = globalContext.Icon;

  let paneElement: HTMLElement;
  let paneContainerElement: HTMLElement;
  let paneHeight: number = PANE_HEIGHT_MIN;
  let isPaneCollapsed = false;

  function handlePaneContainerClick() {
    collapsePane();
  }

  function handleSwitchTab(index: number) {
    activeTabIndex = index;
  }

  $: tabs = pane.children?.map((pane) => pane.content?.view);

  function closeBottomPaneOnCollapsing() {
    if (isPaneCollapsed) {
      collapsePane();
    }
  }

  function changePaneHeight(height: number) {
    if (height < PANE_HEIGHT_MIN / 3) {
      paneHeight = 0;
      isPaneCollapsed = true;
    } else {
      paneHeight = Math.max(PANE_HEIGHT_MIN, height);
      isPaneCollapsed = false;
    }
  }

  function resizePaneAction(triggerElement: HTMLElement) {
    let isResizing = false;
    let startTouchY: number;
    let paneStartHeight: number;
    let paneContainerHeight: number;

    function startResizing(event: TouchEvent) {
      const touch = event.touches[0];
      startTouchY = touch.clientY;
      paneStartHeight = paneElement.getBoundingClientRect().height;
      paneContainerHeight = paneContainerElement.getBoundingClientRect().height;

      isResizing = true;
      document.addEventListener("touchmove", handleWindowTouchMove);
      document.addEventListener("touchend", handleWindowTouchEnd);
    }

    function doResize(event: TouchEvent) {
      if (!isResizing) {
        return;
      }

      let newHeight: number;
      let touchDelta: number;
      let currentTouchY = event.touches[0].clientY;
      currentTouchY = Math.min(Math.max(0, currentTouchY), paneContainerHeight);
      touchDelta = startTouchY - currentTouchY;
      newHeight = Math.min(
        paneStartHeight + touchDelta,
        paneContainerHeight - 40
      );
      changePaneHeight(newHeight);
    }

    function stopResizing() {
      isResizing = false;
      closeBottomPaneOnCollapsing();
      document.removeEventListener("touchmove", handleWindowTouchMove);
      document.removeEventListener("touchend", handleWindowTouchEnd);
      document.removeEventListener(
        "touchstart",
        handleNewTouchOnResizing,
        true
      );
    }

    function handleWindowTouchEnd(event: TouchEvent) {
      stopResizing();
    }

    function handleWindowTouchMove(event: TouchEvent) {
      doResize(event);
    }

    function handleNewTouchOnResizing() {
      // stop resizing if receive multiple touch on screen
      stopResizing();
    }

    function handleTouchStart(event: TouchEvent) {
      if (event.touches.length > 1) {
        // not allow multiple touch point
        if (isResizing) {
          stopResizing();
        }
        return;
      }

      startResizing(event);
      document.addEventListener("touchstart", handleNewTouchOnResizing, true);
    }

    triggerElement.addEventListener("touchstart", handleTouchStart);

    return {
      destroy() {
        triggerElement.removeEventListener("touchstart", handleTouchStart);
      },
    };
  }

  $: activeTab = pane.children[activeTabIndex];
</script>

<div class="pane-container" bind:this={paneContainerElement}>
  {#if !isPaneCollapsed}
    <div class="pane-background" on:click={handlePaneContainerClick} />
  {/if}

  <div
    class="expand-pane"
    style="height: {paneHeight}px; max-height: calc(100% - 40px);"
    bind:this={paneElement}
  >
    <div class="relative w-full h-0">
      <div class="resize-bar" use:resizePaneAction>
        <div class="resize-bar-indicator" />
      </div>
    </div>

    <div class="tabs">
      {#each tabs as tab, i (tab.id)}
        {@const isActive = i === activeTabIndex}

        <div
          class="panel-button"
          class:active={isActive}
          on:click={() => handleSwitchTab(i)}
          on:keypress
        >
          <div class="mr-1">
            <!-- <Icon icon={tab.icon} size="14px" fill="currentColor" /> -->
          </div>

          <div class="panel-button-label">{tab.label}</div>

          {#if isActive}
            <div class="active-tab-border" />
          {/if}
        </div>
      {/each}
    </div>

    <div class="active-tab-body">
      <svelte:component
        this={PanelComponent}
        pane={{
          ...pane,
          content: {
            ...pane.content,
            view: activeTab.content?.view,
          },
        }}
      />
    </div>
  </div>
</div>

<style lang="postcss">
  .pane-container {
    position: fixed;
    z-index: 9999999;
    top: 0px;
    bottom: 0px;
    left: 0px;
    width: 100vw;
  }

  .pane-background {
    position: absolute;
    left: 0px;
    right: 0px;
    top: 0px;
    bottom: 0px;
    background: #50585d;
    opacity: 0.5;
  }

  .expand-pane {
    background-color: white;
    position: absolute;
    left: 0px;
    right: 0px;
    bottom: 0px;
    display: flex;
    flex-direction: column;
  }

  .panel-button {
    @apply relative flex flex-row items-center px-0;
    height: 100%;
    border-radius: 4px;
    flex-shrink: 1;
  }

  .tabs {
    @apply w-full flex flex-row items-center justify-evenly text-tabs-normal-color;
    height: 44px;
    border-bottom: 1px solid #e9edf0;
    font-size: 13px;
    font-weight: 500;
  }

  .panel-button.active {
    @apply text-tabs-active-color;
  }

  .active-tab-border {
    @apply bg-tabs-active-color;
    position: absolute;
    left: 0px;
    right: 0px;
    bottom: -1.5px;
    height: 2px;
    z-index: 10;
  }

  .panel-button-label {
    overflow: hidden;
    white-space: nowrap;
  }

  .active-tab-body {
    height: calc(100% - 44px);
    width: 100%;
    flex-shrink: 1;
    flex-grow: 1;
  }

  .resize-bar {
    position: absolute;
    /* background-color: aqua; */
    touch-action: none;
    top: -28px;
    bottom: 0px;
    left: calc(50% - 60px);
    width: 120px;
    display: flex;
    flex-direction: row;
    justify-content: center;
  }

  .resize-bar-indicator {
    height: 4px;
    width: 30px;
    margin: 4px 0px;
    border-radius: 20px;
    background-color: white;
    align-self: flex-end;
  }
</style>
