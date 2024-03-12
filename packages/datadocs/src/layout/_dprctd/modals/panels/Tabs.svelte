<!-- @component
@packageModule(layout/Tabs)
-->
<script lang="ts">
  import Tab from "./Tab.svelte";
  import type {
    ReorderTabOptions} from "../../../components/common/tabs";
import {
  getReorderTabAction
} from "../../../components/common/tabs";
  import type { Pane } from "../../main/panels-layout/types";

  export let pane: Pane;
  export let toggleTab: (v: number) => void;
  export let reorderTab: (newData: any[], activeIndex: number) => void;
  export let activeIndex: number;

  let tabListElement: HTMLElement = null;
  let reorderOptions: ReorderTabOptions<any>;
  let tabs: any[];
  const reorderAction = getReorderTabAction();

  function getTabZIndex(tabIndex: number): string {
    return `--left-active-tab-zindex: ${
      tabIndex + 1
    };--right-active-tab-zindex: ${100 - tabIndex};`;
  }

  function getTabProps(tab, props) {
    const tabPane: Pane = tab as Pane;
    if (tabPane !== undefined) {
      props.id = tabPane.content?.view?.id;
      props.name = tabPane.content?.view?.name;
      props.label = tabPane.content?.view?.label;
      props.icon = tabPane.content?.view?.icon;
    }
    return props;
  }

  $: tabs = pane.children;
  $: reorderOptions = {
    tabs: tabs,
    reorderTabs: reorderTab,
    tabListElement,
  };
</script>

<div class="pt-2.5">
  <div class="flex flex-row ml-2.5 space-x-px" bind:this={tabListElement}>
    {#each tabs as tab, index (tab.id)}
      {@const zIndexVariable = getTabZIndex(index)}
      <div
        class="tab-container"
        style={zIndexVariable}
        class:active={index === activeIndex}
        data-tabindex={index}
        on:mousedown|capture={() => toggleTab(index)}
        use:reorderAction={reorderOptions}
      >
        <Tab {tab} tabIndex={index} {activeIndex} {getTabProps} />
      </div>
    {/each}
  </div>
</div>

<style lang="postcss">
  .tab-container {
    @apply cursor-pointer flex-shrink flex-grow-0;
    min-width: 10px;
    z-index: var(--left-active-tab-zindex);
  }

  .tab-container.active {
    @apply flex-shrink-0;
    clip-path: inset(-10px -15px 0px -15px);
    z-index: 2000;
  }

  .tab-container.active ~ .tab-container:not(.active) {
    direction: rtl;
    z-index: var(--right-active-tab-zindex);
  }

  :global(.tab-removed) {
    -webkit-transition: left 80ms ease-out, top 80ms ease-out;
    -moz-transition: left 80ms ease-out, top 80ms ease-out;
    -o-transition: left 80ms ease-out, top 80ms ease-out;
    transition: left 80ms ease-out, top 80ms ease-out;
  }
</style>
