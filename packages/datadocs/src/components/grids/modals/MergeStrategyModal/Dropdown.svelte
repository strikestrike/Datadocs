<script lang="ts">
  import { onMount } from "svelte";
  import { TabIndexManager } from "../../../../utils/tab-index";
  import { createEventDispatcher } from "svelte";
  import { MergeStrategyModalResult } from "./types";

  const dispatch = createEventDispatcher<{
    change: { optionValue: MergeStrategyModalResult };
  }>();

  let wrapperElement: HTMLElement;
  const tabIndexes = new TabIndexManager(true);

  function onClick(ev: { target: any }) {
    const optionValue = getOptionValue(ev.target);
    // console.log("click: " + optionValue);
    dispatch("change", { optionValue });
  }
  function onKeyDown(ev: KeyboardEvent) {
    tabIndexes.onKeyDown(ev);
    if (ev.key === "Enter" || ev.key === "Space") return onClick(ev);
  }
  function getOptionValue(el: Element) {
    if (!el) return -1;
    const v = el.getAttribute?.("data-option");
    if (v) {
      const num = parseInt(v, 10);
      return isNaN(num) ? -1 : num;
    }
    return -1;
  }
  onMount(() => {
    tabIndexes.onMount(wrapperElement.querySelectorAll("div[role=button]"));
  });
</script>

<div class="wrapper" bind:this={wrapperElement}>
  <div
    class="p-2 item focusable"
    role="button"
    data-option={MergeStrategyModalResult.last_write_win}
    tabIndex="-1"
    on:keydown={onKeyDown}
    on:keyup={tabIndexes.onKeyUp}
    on:click={onClick}
  >
    Last Write Win (default)
  </div>
  <div
    class="p-2 item focusable"
    role="button"
    tabIndex="-1"
    data-option={MergeStrategyModalResult.local_changes_win}
    on:keydown={onKeyDown}
    on:keyup={tabIndexes.onKeyUp}
    on:click={onClick}
  >
    Local Changes Win
  </div>
  <div
    class="p-2 item focusable"
    role="button"
    tabIndex="-1"
    data-option={MergeStrategyModalResult.server_changes_win}
    on:keydown={onKeyDown}
    on:keyup={tabIndexes.onKeyUp}
    on:click={onClick}
  >
    Server Changes Win
  </div>
</div>

<style lang="postcss">
  .wrapper {
    background-color: #fefefe;
    border-radius: 0.25rem;
    border: 1px solid rgb(245 245 244);
  }
  .wrapper .item {
    padding-left: 16px;
    cursor: pointer;
    border-top: 1px solid rgb(245 245 244);
  }
  .wrapper .item:hover,
  .wrapper .item:focus {
    background-color: #ecf9ff;
  }
  .wrapper .item:first-child {
    border-top: none;
  }
</style>
