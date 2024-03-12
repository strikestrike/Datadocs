<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import DropdownWrapper from "../../dropdown/DropdownWrapper.svelte";
  import Icon from "../../icons/Icon.svelte";
  import DatePicker from "./date-picker/DatePicker.svelte";

  const dispatch = createEventDispatcher<{
    updated: { date: Date };
    search: { value: string };
  }>();

  export let date: Date | undefined;
  export let isDateTime = false;
  export let changedExternally = false;

  let inputValue = date ? getDateString(date) : undefined;

  // This ensures the value is updated when the parent updates the value.
  $: updateWithDate(date);
  $: isInvalid = inputValue && isNaN(Date.parse(inputValue));

  let datePickerButton: HTMLButtonElement;
  let selected = false;

  let showDatePicker = false;
  let editing = false;

  function updateWithInput(newValue: string | null) {
    dispatch("search", { value: newValue ?? "" });

    const time = Date.parse(newValue);
    if (newValue) {
      if (isNaN(time)) return;
      date = new Date(time);
    } else {
      date = undefined;
    }
    notifyUpdate();
  }

  function updateWithDate(newDate: Date | undefined) {
    if (editing && !changedExternally) return;
    inputValue = newDate ? getDateString(newDate) : "";
  }

  function toggleDatePicker(e: Event) {
    e.preventDefault();

    showDatePicker = !showDatePicker;
    if (!showDatePicker) datePickerButton.blur();
  }

  function getDateString(date: Date) {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    };
    if (isDateTime) {
      options.hour = "2-digit";
      options.minute = "2-digit";
    }
    return date.toLocaleDateString(undefined, options);
  }

  function notifyUpdate() {
    dispatch("updated", { date });
  }

  function onFocusIn() {
    editing = true;
  }

  function onFocusOut() {
    editing = false;
    updateWithDate(date);
  }
</script>

<div
  class="input-container"
  class:selected
  class:invalid={isInvalid}
  class:show-date-picker={showDatePicker}
>
  <input
    bind:value={inputValue}
    on:input={() => updateWithInput(inputValue)}
    on:focusin={onFocusIn}
    on:focusout={onFocusOut}
    data-dd-show-value-helper={true}
    data-dd-filter-input-with-raw-value={true}
    type="text"
    class="input"
    placeholder="E.g., {getDateString(new Date())}"
  />
  <DropdownWrapper class="flex p-auto" bind:show={showDatePicker}>
    <button
      bind:this={datePickerButton}
      class="date-picker-button"
      slot="button"
      class:activated={showDatePicker}
      on:click={toggleDatePicker}
    >
      <Icon icon="calendar-pick" height="14px" width="22px" />
    </button>
    <DatePicker
      slot="content"
      value={date ?? new Date()}
      showTimeInput={isDateTime}
      on:picked={({ detail }) => {
        date = detail.date;
        notifyUpdate();
      }}
    />
  </DropdownWrapper>
</div>

<style lang="postcss">
  .input-container {
    @apply flex flex-1 flex-row border-0 bg-transparent min-w-0 items-stretch;

    /* &.selected,
    &.show-date-picker,
    &:focus-within,
    &:hover {
      box-shadow: 0px 4px 6px rgba(55, 84, 170, 0.16);
    } */

    &.invalid .input {
      @apply !border-tertiary-error text-tertiary-error;
    }

    .input {
      @apply flex-1 border-0 bg-transparent pl-2.5 m-0 outline-none min-w-0 text-13px font-normal items-center;
      line-height: normal;
      box-sizing: border-box;

      &:placeholder-shown {
        @apply overflow-hidden overflow-ellipsis whitespace-nowrap text-dark-100;
      }
    }

    .date-picker-button {
      @apply border-none outline-none bg-transparent text-dark-50 my-0 ml-1 mr-1.5;

      &.activated,
      &:hover,
      &:focus-visible {
        @apply text-dark-200;
      }
    }
  }
</style>
