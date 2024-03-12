<!-- @component
@packageModule(layout/MobileBottomPanel)
-->
<script lang="ts">
  import { getContext } from "svelte";
  // import { GLOBAL_CONTEXT } from "../../core/constants";
  import DefaultPanel from "../default-panels/DefaultPanel.svelte";

  import type { Pane } from "src/layout/types/pane";

  import MobileBottomExpandedPane from "./MobileBottomExpandedPane.svelte";

  export let pane: Pane;

  /**
   * Panel Component
   */
  export let PanelComponent: any = DefaultPanel;

  let activeTabIndex = 0;
  let isExpanded = false;

  // const globalContext: GlobalContext = getContext(GLOBAL_CONTEXT);

  // const Icon = globalContext.Icon;

  function handleTabClick(index: number) {
    activeTabIndex = index;
    isExpanded = true;
  }

  function collapsePane() {
    isExpanded = false;
  }

  $: tabs = pane.children?.map((pane) => pane.content?.view);
</script>

<div class="bottom-panel">
  {#each tabs as tab, i (tab.id)}
    <div class="panel-button" on:click={() => handleTabClick(i)}>
      <div class="mr-1">
        <!-- <Icon icon={tab.icon} width="14px" height="14px" fill="currentColor" /> -->
      </div>

      <div class="panel-button-label">{tab.label}</div>
    </div>
  {/each}
</div>

{#if isExpanded}
  <MobileBottomExpandedPane
    {pane}
    {activeTabIndex}
    {collapsePane}
    {PanelComponent}
  />
{/if}

<style lang="postcss">
  .bottom-panel {
    @apply w-full h-full flex flex-row items-center justify-evenly text-tabs-normal-color;
    background: white;
    box-shadow: 0px 1px 6px rgba(55, 84, 170, 0.16);
    font-size: 13px;
    font-weight: 500;
  }

  .panel-button {
    @apply flex flex-row items-center px-0;
    height: 100%;
    border-radius: 4px;
    flex-shrink: 1;
  }

  .panel-button-label {
    overflow: hidden;
    white-space: nowrap;
  }
</style>
