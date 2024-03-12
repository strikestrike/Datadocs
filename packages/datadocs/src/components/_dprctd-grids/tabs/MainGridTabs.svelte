<script lang="ts">
  import type { GridSheet } from "../../../app/store/store-sheets";
  import GridTab from "./GridTab.svelte";
  import type { ReorderTabOptions } from "../../common/tabs";
import { getReorderTabAction } from "../../common/tabs";

  export let data: GridSheet[];

  const reorderTabAction = getReorderTabAction();
  let reorderOptions: ReorderTabOptions<GridSheet>;
  let tabListElement: HTMLElement;

  function handleSwitchSheet(id: string) {
    const sheet = data.filter((s) => s.id === id)[0];
    if (sheet.isActive) return;

    data.forEach((s) => {
      s.isActive = false;
    });

    sheet.isActive = true;
    data = data;
  }

  function getTabZIndex(tabIndex: number): string {
    return `--left-active-tab-zindex: ${tabIndex + 1};--right-active-tab-zindex: ${100 - tabIndex};`;
  }

  $: reorderOptions = {
    tabs: data,
    reorderTabs: (newData: GridSheet[], activeIndex: number) => {
      for (let i = 0; i < newData.length; i++) {
        data[i] = newData[i];
        data[i].isActive = i === activeIndex;
      }
    },
    tabListElement,
  }

</script>

<div class="flex flex-row mx-2.5 space-x-px" bind:this={tabListElement}>
  {#each data as sheet, index (sheet.id)}
    {@const zIndexVariable = getTabZIndex(index)}
    <div
      class="tab-container"
      style="{zIndexVariable}"
      class:active={sheet.isActive}
      data-tabindex={index}
      on:mousedown|capture={() => handleSwitchSheet(sheet.id)}
      use:reorderTabAction={reorderOptions}
    >
      <GridTab tabs={data} data={sheet} />
    </div>
  {/each}
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

  .tab-container:global(.tab-removed) {
    -webkit-transition: left 80ms ease-out, top 80ms ease-out;
    -moz-transition: left 80ms ease-out, top 80ms ease-out;
    -o-transition: left 80ms ease-out, top 80ms ease-out;
    transition: left 80ms ease-out, top 80ms ease-out;
  }
</style>
