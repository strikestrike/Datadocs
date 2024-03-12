<script lang="ts">
  import { getContext, onMount } from "svelte";
  import {
    MIN_YEAR as minYear,
    NOTIFY_UPDATE_VIEW_CONTEXT_NAME,
    SWITCH_TO_DAY_VIEW_CONTEXT_NAME,
  } from "./constants";

  export let value: Date;

  const maxYear = getCurrentYear();
  const notifyUpdate: Function = getContext(NOTIFY_UPDATE_VIEW_CONTEXT_NAME);
  const switchToDay: Function = getContext(SWITCH_TO_DAY_VIEW_CONTEXT_NAME);

  let scrollContainer: HTMLElement;

  function getCurrentYear() {
    return new Date().getFullYear();
  }

  function scrollToCurrentValue() {
    const el = document.querySelector("button.year.activated");
    if (!el) return;

    el.scrollIntoView({ block: "center" });
    if (el instanceof HTMLElement) {
      el.focus();
    }
  }

  function isSame(date: Date, year: number) {
    return date.getFullYear() === year;
  }

  function setYear(date: Date, year: number) {
    date.setFullYear(year);
    value = date;

    switchToDay();
    notifyUpdate();
  }

  onMount(() => {
    scrollToCurrentValue();
  });
</script>

<div bind:this={scrollContainer} class="container">
  {#each { length: Math.max(maxYear, value.getFullYear()) - minYear + 1 } as _, i}
    <button
      class="year"
      class:activated={isSame(value, minYear + i)}
      on:click={() => setYear(value, minYear + i)}
    >
      <span class="name">{minYear + i}</span>
    </button>
  {/each}
</div>

<style lang="postcss">
  .container {
    @apply grid w-[276px] py-4 max-h-[195px] overflow-y-auto;
    grid-template-columns: repeat(5, 40px);
    column-gap: 4px;
    row-gap: 10px;
    justify-content: center;
  }

  .year {
    @apply border-none font-medium p-1 text-[11px] rounded bg-transparent my-0 outline-none;
  }

  .year.activated {
    @apply bg-primary-datadocs-blue text-white whitespace-nowrap overflow-hidden overflow-ellipsis;
    box-shadow: 1px 2px 6px rgba(55, 84, 170, 0.16);
  }

  .year:not(.activated):focus,
  .year:not(.activated):hover {
    @apply bg-light-100 text-dark-200;
  }

  .year .name {
    line-height: 16.5px;
  }
</style>
