<script lang="ts">
  // import type { SvelteComponent } from "svelte";
  import { tick } from "svelte";
  import type {
    GridKeyControlActionOptions,
    RegisterElementOptions,
  } from "../../../../common/key-control/gridKeyControl";
  import { registerElement } from "../../../../common/key-control/gridKeyControl";
  import { scrollVerticalToVisible } from "../../../../common/key-control/scrolling";

  export let tab: {
    id: string;
    label: string;
    isActive: boolean;
    // component: typeof SvelteComponent;
  };
  export let handleSwitchTab: (id: string) => void;
  export let gridKeyControlOptions: GridKeyControlActionOptions;
  export let scrollContainer: HTMLElement = null;
  export let ridx: number;
  export let cidx: number;

  let isSelected = false;
  let element: HTMLElement = null;

  async function onSelectCallback(byKey = true) {
    isSelected = true;

    if (!byKey) return;

    await tick();
    scrollVerticalToVisible(scrollContainer, element);
    element.focus();
  }

  function onDeselectCallback() {
    isSelected = false;
  }

  const options: RegisterElementOptions = {
    gridKeyControlOptions,
    ridx,
    cidx,
    config: {
      ridx,
      cidx,
      isSelected,
      onDeselectCallback,
      onSelectCallback,
    },
  };
</script>

<button
  bind:this={element}
  class="tab bg-transparent"
  class:tab-active={tab.isActive}
  on:click={() => {
    handleSwitchTab(tab.id);
  }}
  use:registerElement={options}
  tabindex={-1}
>
  <div
    class="absolute -top-px left-0 right-0 -bottom-px py-px"
    class:selected={isSelected}
  >
    {tab.label}
  </div>

  {#if tab.isActive}
    <div class="tab-active-bottom-border" />
  {/if}
</button>

<style lang="postcss">
  .tab {
    @apply relative h-[15px] text-[#A7B0B5] font-medium text-center border-none outline-none cursor-pointer;
    font-size: 10px;
    width: 50%;
  }

  .tab-active {
    color: #3bc7ff;
  }

  .tab-active-bottom-border {
    @apply absolute left-0 right-0 top-0 bottom-0;
    border-bottom: 2px solid #3bc7ff;
    margin-bottom: -2.5px;
  }

  .selected {
    background-color: #f0f0f0;
  }
</style>
