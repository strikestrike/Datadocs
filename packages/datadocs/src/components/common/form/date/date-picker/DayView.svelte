<script lang="ts">
  import { getContext } from "svelte";
  import { CLOSE_DROPDOWN_CONTEXT_NAME } from "../../../dropdown";
  import TimeInput from "../time-input/TimeInput.svelte";
  import { MIN_YEAR, NOTIFY_UPDATE_VIEW_CONTEXT_NAME } from "./constants";
  import DropdownSectionTitle from "../../../../toolbars/MainToolbar/dropdowns/common/DropdownSectionTitle.svelte";

  const notifyUpdate: Function = getContext(NOTIFY_UPDATE_VIEW_CONTEXT_NAME);
  const closeDropdown: Function = getContext(CLOSE_DROPDOWN_CONTEXT_NAME);

  export let value: Date = new Date();
  export let showTimeInput: boolean;

  let days: Date[] = loadDays(value);
  $: days = loadDays(value);

  let element: HTMLElement;

  function loadDays(now?: Date) {
    if (!now) now = new Date();

    // The day the 1st day of the month corresponds to.
    const cachedDate = new Date(value);
    cachedDate.setDate(1);

    const firstDayOfMonth = sundayToMonday(cachedDate.getDay());

    //cachedDate.setMonth(value.getMonth() + 1);
    //cachedDate.setDate(0);

    //const daysInMonth = cachedDate.getDate();
    //const lastDayOfMonth = sundayToMonday(cachedDate.getDay());

    // Go the previous month if Monday is not the start of the month, and
    // display them at the start of the calendar.
    cachedDate.setDate(-firstDayOfMonth);

    const days: Date[] = [];
    for (let i = -firstDayOfMonth; days.length / 7 < 6; i++) {
      cachedDate.setDate(cachedDate.getDate() + 1);
      days.push(new Date(cachedDate));
    }

    return days;
  }

  function sundayToMonday(day: number) {
    return --day < 0 ? 6 : day;
  }

  function setValue(date: Date, close = false) {
    value = date;
    notifyUpdate();
    if (close) closeDropdown();
  }

  function isEqualToValue(date: Date) {
    return (
      date.getFullYear() === value.getFullYear() &&
      date.getMonth() === value.getMonth() &&
      date.getDate() === value.getDate()
    );
  }

  function isDifferentMonth(date: Date) {
    return (
      date.getFullYear() !== value.getFullYear() ||
      date.getMonth() !== value.getMonth()
    );
  }

  function isDisabled(date: Date) {
    date.getFullYear() < MIN_YEAR;
  }

  function getDayLetter(date: Date) {
    return date.toLocaleDateString(undefined, { weekday: "long" }).slice(0, 2);
  }

  function handleWheel(event: WheelEvent) {
    if (event.defaultPrevented || !event.deltaY || event.shiftKey) return;

    event.preventDefault();
    const change = -(event.deltaY / 100);

    value.setMonth(value.getMonth() - change);
    value = value;

    notifyUpdate();
  }
</script>

<div class="flex flex-col">
  <div bind:this={element} on:wheel={handleWheel} class="days-container">
    {#each { length: 7 } as _, i}
      <div class="day-of-week">
        <span class="name">{getDayLetter(days[i])}</span>
      </div>
    {/each}
    {#each days as date}
      <button
        class="day"
        class:different-month={isDifferentMonth(date)}
        class:activated={isEqualToValue(date)}
        class:disabled={isDisabled(date)}
        on:click={() => setValue(date)}
        on:dblclick={() => setValue(date, true)}
      >
        <span class="name">{date.getDate()}</span>
      </button>
    {/each}
  </div>

  {#if showTimeInput}
    <div class="flex flex-col mx-5 mb-4">
      <DropdownSectionTitle title="Enter Time" />
      <TimeInput bind:date={value} class="flex-grow" />
    </div>
  {/if}
</div>

<style lang="postcss">
  .days-container {
    @apply grid w-263px pt-2.5 pb-5 justify-center;
    grid-template-columns: repeat(7, 25px);
    column-gap: 4px;
    row-gap: 10px;

    .day-of-week {
      @apply text-dark-100 text-11px text-center font-normal py-1;
      line-height: 16.5px;
    }

    .day {
      @apply border-none font-medium text-11px rounded whitespace-nowrap overflow-hidden overflow-ellipsis py-1 bg-transparent my-0 outline-none;

      &.activated {
        @apply bg-primary-datadocs-blue text-white;
        box-shadow: 1px 2px 6px rgba(55, 84, 170, 0.16);
      }

      &.disabled {
        @apply text-light-50 pointer-events-none;
      }

      &:not(.activated) {
        &:focus-visible,
        &:hover {
          @apply bg-light-100 text-dark-200;
        }
      }

      &.different-month {
        @apply text-dark-50;
      }

      .name {
        line-height: 16.5px;
      }
    }
  }
</style>
