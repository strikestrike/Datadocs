<script lang="ts">
  import clsx from "clsx";
  import type { Pane } from "src/layout/types/pane";

  export let pane: Pane = null;

  $: list = pane?.children || [];
  $: activeId = pane?.props?.activeId || "";
  $: topPane = list.find((pane) => pane.id === activeId);
  $: otherChildren = list.filter((pane) => pane.id !== activeId);
  $: children = topPane ? [topPane, ...otherChildren] : list;

  $: {
  }
</script>

<div class="relative phantom-tabs">
  {#each children as child, i (child.id)}
    <div
      class={clsx(
        "phantom-tab w-[85px] h-7 text-[11px] flex items-center rounded font-medium absolute",
        child.id === activeId
          ? "active h-8 !text-tabs-active-color font-bold bg-white"
          : "bg-panels-bg"
      )}
      style:top={`${i > 0 ? (i + 1) * 4 : i}px`}
      style:left={`${i * 2.5}px`}
      style:z-index={`${50 - i}`}
      style:width={`${85 - i * 5}px`}
    >
      <div class="whitespace-nowrap px-3 overflow-hidden">
        {child?.content?.view?.label || ""}
      </div>
    </div>
  {/each}
  <div
    class="absolute bg-[#3bc7ff] w-5 h-5 -top-2.5 -left-2.5 text-xs leading-5 text-white rounded-1/2 z-99 text-center"
  >
    {children.length > 5 ? "5+" : children.length}
  </div>
</div>

<style lang="postcss">
  @keyframes expand {
    0% {
      top: 0;
    }
    100% {
    }
  }

  .phantom-tab {
    box-shadow: 0px 0px 4px rgba(55, 84, 170, 0.161);
    animation: expand 0.5s;
  }
</style>
