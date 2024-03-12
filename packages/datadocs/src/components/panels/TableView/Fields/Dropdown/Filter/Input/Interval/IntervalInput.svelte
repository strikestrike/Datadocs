<script lang="ts">
  import IntervalInputField from "./IntervalInputField.svelte";
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher<{
    updated: { date: Date };
  }>();

  export let date: Date | undefined;

  let className = "";
  export { className as class };

  let years: number | null = null;
  let months: number | null = null;
  let days: number | null = null;
  let hours: number | null = null;
  let minutes: number | null = null;
  let seconds: number | null = null;

  function update() {
    if (
      years !== null ||
      months !== null ||
      days !== null ||
      hours !== null ||
      minutes !== null ||
      seconds !== null
    ) {
      date = new Date();
      if (years !== null) date.setFullYear(date.getFullYear() + years);
      if (months !== null) date.setMonth(date.getMonth() + months);
      if (days !== null) date.setDate(date.getDate() + days);
      if (hours !== null) date.setHours(date.getHours() + hours);
      if (minutes !== null) date.setMinutes(date.getMinutes() + minutes);
      if (seconds !== null) date.setSeconds(date.getSeconds() + seconds);
    } else {
      date = undefined;
    }
    dispatch("updated", { date });
  }
</script>

<div class="interval-input-container {className}">
  <IntervalInputField bind:value={years} title="Years" on:updated={update} />
  <IntervalInputField bind:value={months} title="Months" on:updated={update} />
  <IntervalInputField bind:value={days} title="Days" on:updated={update} />
  <IntervalInputField bind:value={hours} title="Hours" on:updated={update} />
  <IntervalInputField
    bind:value={minutes}
    title="Minutes"
    on:updated={update}
  />
  <IntervalInputField
    bind:value={seconds}
    title="Seconds"
    on:updated={update}
  />
</div>

<style lang="postcss">
  .interval-input-container {
    @apply flex flex-row items-center;
    column-gap: 4px;
  }
</style>
