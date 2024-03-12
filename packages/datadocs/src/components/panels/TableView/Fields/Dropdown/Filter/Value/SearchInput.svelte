<script lang="ts">
  import type { DatePickedEvent } from "../../../../../../common/form/date/date-picker/DatePicker";
  import Icon from "../../../../../../common/icons/Icon.svelte";
  import type { InputType } from "../FilterInput";

  export let value: string;
  export let inputType: InputType;

  let dateInput: Date = new Date();
  let showDatePicker = false;

  function toggleDatePicker() {
    showDatePicker = !showDatePicker;
  }

  function onDatePickedEvent(e: CustomEvent<DatePickedEvent>) {
    const { date } = e.detail;
    const get = (value: number) => {
      return (value < 10 ? "0" : "") + value;
    };
    let newValue =
      get(date.getFullYear()) +
      "-" +
      get(date.getMonth()) +
      "-" +
      get(date.getDate());

    if (inputType === "datetime") {
      newValue +=
        " " +
        get(date.getHours()) +
        ":" +
        get(date.getMinutes()) +
        ":" +
        get(date.getSeconds());
    }

    value = newValue;
  }
</script>

<div class="search-input-container">
  <div class="icon-container">
    <Icon icon="search" size="13px" />
  </div>
  <input bind:value class="search-input" placeholder="Search ..." type="text" />

  <!-- {#if inputType === "date" || inputType === "datetime"}
    <DropdownWrapper class="flex p-auto" bind:show={showDatePicker}>
      <button
        class="date-picker-button"
        slot="button"
        class:activated={showDatePicker}
        on:click={toggleDatePicker}
      >
        <Icon icon="calendar-pick" size="16px" />
      </button>
      <DatePicker
        bind:value={dateInput}
        on:picked={onDatePickedEvent}
        slot="content"
        showTimeInput={inputType === "datetime"}
      />
    </DropdownWrapper>
  {/if} -->
</div>

<style lang="postcss">
  .search-input-container {
    @apply flex rounded-tl rounded-tr border border-solid border-b-0 border-light-100 z-1;
    box-shadow: 0px 2px 2px -1px white;
  }

  .search-input {
    @apply flex bg-transparent border-transparent py-1 font-normal text-dark-50 text-[11px] outline-none border-none min-w-0 flex-grow m-0;
  }

  .search-input:focus {
    @apply text-dark-100;
  }

  .icon-container {
    @apply flex text-dark-50 px-2;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* .date-picker-button {
    @apply border-none outline-none bg-transparent text-dark-50 my-0 mx-1;
  }

  .date-picker-button.activated,
  .date-picker-button:hover {
    @apply text-dark-200;
  } */
</style>
