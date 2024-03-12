<script lang="ts">
  import { switchTab } from "../../../../common/tabs";
  import All from "./all/All.svelte";
  import Recent from "./Recent.svelte";
  import Active from "./Active.svelte";

  let tabs: { id: string; name: string; isActive: boolean }[] = [
    { id: "1", name: "all", isActive: true },
    { id: "2", name: "recent", isActive: false },
    { id: "3", name: "active", isActive: false },
  ];
  let value: string;

  function handleSwitchTab(id: string) {
    switchTab(tabs, id);
    tabs = tabs;
  }

  $: value = tabs.find((t) => t.isActive).name;
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class="h-full flex flex-col mt-3">
  <div class="tabs-container">
    {#each tabs as tab (tab.id)}
      <div
        class="tab-item capitalize"
        class:active={tab.isActive}
        on:click={() => handleSwitchTab(tab.id)}
      >
        {tab.name}
      </div>
    {/each}
  </div>

  <div class="relative h-full">
    {#if value === "all"}
      <All />
    {:else if value === "recent"}
      <Recent />
    {:else}
      <Active />
    {/if}
  </div>
</div>

<style lang="postcss">
  .tabs-container {
    @apply flex flex-row items-center mx-2 space-x-1.5 text-dark-50;
    @apply border-b border-solid border-light-100;
    font-size: 11px;
  }

  .tab-item {
    @apply relative py-0.5 px-1.5 cursor-pointer;
  }

  .tab-item.active {
    @apply text-dark-300 font-semibold;
  }

  .tab-item.active::after {
    @apply absolute h-0.5 -left-px -right-px rounded bg-dark-300;
    content: "";
    top: calc(100% - 0.5px);
  }
</style>
