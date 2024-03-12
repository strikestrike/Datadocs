<script lang="ts">
  import { getContext, onMount } from "svelte";
  import { NOTIFY_UPDATE_VIEW_CONTEXT_NAME, SWITCH_TO_DAY_VIEW_CONTEXT_NAME } from "./constants";

  const months = loadMonths();
  const notifyUpdate: Function = getContext(NOTIFY_UPDATE_VIEW_CONTEXT_NAME);
  const switchToDay: Function = getContext(SWITCH_TO_DAY_VIEW_CONTEXT_NAME);

  /**
   * Between 0-11.
   */
  export let value: Date;

  function loadMonths() {
    const months = [];
    const date = new Date("2000");

    for (let i = 0; i <= 11; i++) {
      date.setMonth(i);
      months.push(date.toLocaleString(undefined, { month: "long" }));
    }

    return months;
  }

  function focusActivatedMonth() {
    const el = document.querySelector("button.month.activated");
    if (!(el instanceof HTMLElement)) return;
    el.focus();
  }

  onMount(() => {
    focusActivatedMonth();
  });
</script>

<div class="container">
  {#each months as month, i}
    <button
      class="month"
      class:activated={value.getMonth() === i}
      on:click={() => {
        value.setMonth(i);
        value = value;

        notifyUpdate();
        switchToDay();
      }}
    >
      <span class="name">{month}</span>
    </button>
  {/each}
</div>

<style lang="postcss">
  .container {
    @apply grid w-[280px] pt-3 pb-5;
    grid-template-columns: repeat(auto-fit, 72px);
    column-gap: 4px;
    row-gap: 10px;
    justify-content: center;
  }

  .month {
    @apply border-none font-medium p-1 text-[11px] text-left rounded whitespace-nowrap overflow-hidden overflow-ellipsis bg-transparent my-0 outline-none;
  }

  .month.activated {
    @apply bg-primary-datadocs-blue text-white;
    box-shadow: 1px 2px 6px rgba(55, 84, 170, 0.16);
  }

  .month:not(.activated):hover,
  .month:not(.activated):focus {
    @apply bg-light-100 text-dark-200;
  }

  .month .name {
    line-height: 16.5px;
  }
</style>
