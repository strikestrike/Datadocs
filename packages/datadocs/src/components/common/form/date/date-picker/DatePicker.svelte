<script lang="ts">
  import {
    createEventDispatcher,
    getContext,
    onMount,
    setContext,
  } from "svelte";
  import { UPDATE_DROPDOWN_STYLE_CONTEXT_NAME } from "../../../dropdown";
  import Icon from "../../../icons/Icon.svelte";
  import { NOTIFY_UPDATE_VIEW_CONTEXT_NAME, SWITCH_TO_DAY_VIEW_CONTEXT_NAME } from "./constants";
  import type { DatePickedEvent } from "./DatePicker";
  import DayView from "./DayView.svelte";
  import MonthView from "./MonthView.svelte";
  import YearView from "./YearView.svelte";

  setContext(SWITCH_TO_DAY_VIEW_CONTEXT_NAME, () => toggleView("day"));
  setContext(NOTIFY_UPDATE_VIEW_CONTEXT_NAME, () => notifyUpdate());

  const updateDropdown: () => void = getContext(
    UPDATE_DROPDOWN_STYLE_CONTEXT_NAME
  );

  const dispatch = createEventDispatcher<{ picked: DatePickedEvent }>();

  export let value: Date;
  export let showTimeInput = false;

  let activeView: "day" | "month" | "year" = "day";

  let dropdownElement: HTMLElement;

  $: if (activeView) setTimeout(updateDropdown);

  function previousMonth(e: Event) {
    value.setMonth(value.getMonth() - 1);
    value = value;
    e.preventDefault();

    notifyUpdate();
  }

  function nextMonth(e: Event) {
    value.setMonth(value.getMonth() + 1);
    value = value;
    e.preventDefault();

    notifyUpdate();
  }

  function notifyUpdate() {
    dispatch("picked", { date: value });
  }

  async function toggleView(view: typeof activeView) {
    setTimeout(() => (activeView = view));
  }

  onMount(() => {
    dropdownElement.focus();
  });
</script>

<div bind:this={dropdownElement} class="dropdown">
  <div class="header-bar">
    {#if activeView === "day"}
      <button class="button" on:click={() => toggleView("month")}>
        {value.toLocaleString(undefined, { month: "long" })}
      </button>
      <button class="button" on:click={() => toggleView("year")}>
        {value.toLocaleString(undefined, { year: "numeric" })}
      </button>
      <button class="button ml-auto" on:click={previousMonth}>
        <Icon icon="navigate-left" size="17px" />
      </button>
      <button class="button" on:click={nextMonth}>
        <Icon icon="navigate-right" size="17px" />
      </button>
    {:else}
      <button class="button" on:click={() => toggleView("day")}>
        <Icon icon="navigate-left" size="17px" />
      </button>
      <div class="flex-1 text text-center mr-[18px]">
        {#if activeView === "year"}Year{:else}Month{/if}
      </div>
    {/if}
  </div>
  <div class="flex flex-col text-[13px]">
    {#if activeView === "day"}
      <DayView bind:value {showTimeInput} />
    {:else if activeView === "month"}
      <MonthView bind:value />
    {:else if activeView === "year"}
      <YearView bind:value />
    {/if}
  </div>
</div>

<style lang="postcss">
  .dropdown {
    @apply flex flex-col relative text-[13px] bg-white rounded h-[inherit] overflow-x-hidden overflow-y-auto;
    box-shadow: 0px 5px 20px rgba(55, 84, 170, 0.16);
  }

  .header-bar {
    @apply flex flex-row items-center bg-primary-indigo-blue pt-2.5 pb-2 px-4 rounded-tl rounded-tr;
  }

  .header-bar .button,
  .header-bar .text {
    @apply text-white font-medium text-[15px];
    line-height: 22.5px;
  }

  .header-bar .button {
    @apply px-1 py-0.5 rounded border-none bg-transparent my-0 outline-none;
  }

  .header-bar .button:focus-visible,
  .header-bar .button:hover {
    background: rgba(255, 255, 255, 0.2);
  }
</style>
