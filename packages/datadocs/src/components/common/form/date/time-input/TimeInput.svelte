<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";
  import { MENU_DATA_ITEM_TYPE_ELEMENT } from "../../../menu";
  import type { MenuItemType } from "../../../menu";
  import DropdownButton from "../../button/DropdownButton.svelte";
  import TimeInputField from "./TimeInputField.svelte";

  type TimeFormat = "AM" | "PM";

  const dispatch = createEventDispatcher<{ updated: { date: Date } }>();
  const timeOptions: (MenuItemType & { label: TimeFormat })[] = [
    {
      type: MENU_DATA_ITEM_TYPE_ELEMENT,
      label: "AM",
      state: "enabled",
      action: () => {
        time = "AM";
        updateValue();
      },
    },
    {
      type: MENU_DATA_ITEM_TYPE_ELEMENT,
      label: "PM",
      state: "enabled",
      action: () => {
        time = "PM";
        updateValue();
      },
    },
  ];

  export let date: Date;

  let className = "";
  export { className as class };

  let hours: number;
  let minutes: number;
  let seconds: number;
  let time: TimeFormat;

  loadDateValues(date);

  $: loadDateValues(date);

  function updateValue() {
    if (time === "AM") {
      if (hours === 12) hours = 0;
    } else if (hours < 12) {
      hours += 12;
    }
    date.setHours(hours, minutes, seconds);
    date = date;

    dispatch("updated", { date });
  }

  function loadDateValues(date: Date) {
    if (!date) date = new Date();

    const hour12 = date
      .toLocaleTimeString("en-US", {
        hour12: true,
        hour: "numeric",
      })
      .split(" ");
    hours = parseInt(hour12[0], 10);
    time = hour12[1] as TimeFormat;
    minutes = date.getMinutes();
    seconds = date.getSeconds();
  }

  onMount(() => {
    loadDateValues(date);
  });
</script>

<div class="time-input-container {className}">
  <TimeInputField
    bind:value={hours}
    minValue={1}
    maxValue={12}
    on:updated={updateValue}
  />
  <span>:</span>
  <TimeInputField
    bind:value={minutes}
    minValue={0}
    maxValue={59}
    on:updated={updateValue}
  />
  <span>:</span>
  <TimeInputField
    bind:value={seconds}
    minValue={0}
    maxValue={59}
    on:updated={updateValue}
  />
  <span />
  <DropdownButton
    autoWidth
    data={timeOptions}
    class="flex-grow"
    allowMinimalWidth={true}
    cidx={3}
  >
    <span slot="value">{time}</span>
  </DropdownButton>
</div>

<style lang="postcss">
  .time-input-container {
    @apply flex flex-row items-center;
    column-gap: 4px;
  }
</style>
