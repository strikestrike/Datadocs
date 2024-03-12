<script lang="ts">
  import type {
    FilterableValueDescriptor,
    GridFilterCondition,
    GridFilterValue,
    GridHeader,
    TableDescriptor,
  } from "@datadocs/canvas-datagrid-ng";
  import TimeInput from "../../../../../common/form/date/time-input/TimeInput.svelte";
  import DateInput from "../../../../../common/form/date/DateInput.svelte";
  import IntervalInput from "./Input/Interval/IntervalInput.svelte";
  import DropdownButton from "../../../../../common/form/button/DropdownButton.svelte";
  import { CLOSE_ROOT_MENU_CONTEXT_NAME } from "../../../../../common/menu";
  import ValuesHelper from "./Value/ValuesHelper.svelte";
  import { Dropdown } from "../../../../../common/dropdown";
  import { createEventDispatcher, onMount, setContext } from "svelte";
  import { getValueSuggestionsData } from "./Value/ValuesHelper";
  import type { Placement } from "../../../../../common/form/button/type";
  import { GRID_FILTER_CONDITION_NAME_CUSTOM_FORMULA } from "@datadocs/canvas-datagrid-ng/lib/data/data-source/filters/constants";
  import { getInputTypeFromCondition } from "./FilterInput";
  import type { FilterInputChangeSource } from "./type";

  const dispatch = createEventDispatcher<{
    updated: { value: GridFilterValue };
  }>();

  setContext(CLOSE_ROOT_MENU_CONTEXT_NAME, hideHelper);

  export let table: TableDescriptor;
  export let header: GridHeader;
  export let value: GridFilterValue | undefined;
  export let currentCondition: GridFilterCondition;
  export let placement: Placement;
  export let singleLineGroupInput: boolean;

  let stringValue = value?.valueType === "string" ? value.value : undefined;
  let numberValue = value?.valueType === "number" ? value.value : undefined;
  let dateValue = value?.valueType === "date" ? value.value : undefined;
  let booleanValue = value?.valueType === "boolean" ? value.value : undefined;
  let changeSource: FilterInputChangeSource | undefined;

  $: inputType = getInputTypeFromCondition(header, currentCondition);
  $: updateWithValue(value);

  let helperEnabled = false;
  let valueHelperValue = structuredClone(value);

  let element: HTMLElement;
  let elementContainer: HTMLElement;
  let valuesHelperContainer: HTMLElement;
  let helperTarget: HTMLElement;

  let staticValueSuggestions: FilterableValueDescriptor[] | undefined;

  $: if (inputType === "boolean") {
    loadStaticValueSuggestions();
  } else {
    staticValueSuggestions = undefined;
  }

  function increaseFilterValue() {
    if (numberValue === undefined) numberValue = 0;
    updateWithNumberValue(numberValue + 1);
    element.focus();
  }

  function descreaseFilterValue() {
    if (numberValue === undefined) numberValue = 0;
    updateWithNumberValue(numberValue - 1);
    element.focus();
  }

  function updateWithStringValue(strValue: string) {
    if (inputType !== "string") return;
    changeSource = "stringInput";
    value = !strValue ? undefined : { valueType: "string", value: strValue };
    requestValueHelper(value);
    notifyUpdate();
  }

  function updateWithNumberValue(numberValue: number | undefined) {
    if (inputType !== "number") return;
    changeSource = "numberInput";
    value =
      numberValue === undefined || numberValue === null
        ? undefined
        : { valueType: "number", value: numberValue };

    requestValueHelper(value);
    notifyUpdate();
  }

  function updateWithDateValue(date: Date) {
    if (inputType !== "date") return;
    changeSource = "dateInput";
    value =
      date === undefined || date === null
        ? undefined
        : {
            valueType: "date",
            value: date,
            coverage: inputType === "date" ? "day" : "minute",
          };
    notifyUpdate();
  }

  function updateWithRawValue(rawValue: string) {
    requestValueHelper(
      value ? { valueType: "string", value: rawValue } : undefined,
    );
  }

  function updateWithValuesHelper(newValue: GridFilterValue) {
    value = newValue;
    changeSource = "valuesHelper";
    notifyUpdate();
  }

  function notifyUpdate() {
    dispatch("updated", { value });
  }

  function updateWithValue(newValue: GridFilterValue) {
    if (!newValue?.valueType) {
      stringValue = undefined;
      numberValue = undefined;
      dateValue = undefined;
      booleanValue = undefined;
      return;
    }
    switch (newValue.valueType) {
      case "string":
        stringValue = newValue.value;
        break;
      case "number":
        numberValue = newValue.value;
        break;
      case "date":
        dateValue = newValue.value;
        break;
      case "boolean":
        booleanValue = newValue.value;
    }
  }

  function hideHelper() {
    setTimeout(() => {
      helperEnabled = false;
      helperTarget = undefined;
    }, 100);
  }

  function onWindowClick(e: Event) {
    const target = e.target;
    if (target instanceof Node && valuesHelperContainer?.contains(target)) {
      return;
    }
    if (
      target != helperTarget &&
      target instanceof HTMLElement &&
      target.dataset.ddShowValueHelper &&
      elementContainer.contains(target)
    ) {
      helperTarget = target;
      requestValueHelper(value);
    } else {
      hideHelper();
    }
  }

  function requestValueHelper(value: GridFilterValue) {
    valueHelperValue = value;
    helperEnabled = true;
  }

  async function loadStaticValueSuggestions() {
    const suggestions = await getValueSuggestionsData(
      table,
      header,
      currentCondition,
      undefined,
    );
    staticValueSuggestions = suggestions.data;
  }

  onMount(() => {
    window.addEventListener("click", onWindowClick, true);

    return () => {
      window.removeEventListener("click", onWindowClick, true);
    };
  });
</script>

<div
  bind:this={elementContainer}
  class="container"
  class:single-line-group-input={singleLineGroupInput}
>
  {#if inputType === "string"}
    <div class="input-container">
      <input
        bind:this={element}
        bind:value={stringValue}
        on:input={() => updateWithStringValue(stringValue)}
        type="text"
        class="input text"
        placeholder={currentCondition.target.conditionName ===
        GRID_FILTER_CONDITION_NAME_CUSTOM_FORMULA
          ? "(value or formula)"
          : "(value)"}
        data-dd-show-value-helper="true"
      />
    </div>
  {:else if inputType === "number"}
    <div class="input-container">
      <input
        bind:this={element}
        bind:value={numberValue}
        on:input={() => updateWithNumberValue(numberValue)}
        type="number"
        class="input text"
        placeholder="(value)"
        data-dd-show-value-helper="true"
      />
      <!-- <div class="radio-button-container">
        <button class="radio-button increase" on:click={increaseFilterValue}>
          <Icon icon="input-increment" size="8px" fill="currentColor" />
        </button>
        <button class="radio-button descrease" on:click={descreaseFilterValue}>
          <Icon icon="input-decrement" size="8px" fill="currentColor" />
        </button>
      </div> -->
    </div>
  {:else if inputType === "date" || inputType === "datetime"}
    <DateInput
      date={dateValue}
      isDateTime={inputType === "datetime"}
      changedExternally={changeSource && changeSource !== "dateInput"}
      on:updated={({ detail }) => updateWithDateValue(detail.date)}
      on:search={({ detail }) => updateWithRawValue(detail.value)}
    />
  {:else if inputType === "time"}
    <TimeInput
      date={dateValue}
      class="flex-grow flex-shrink min-w-0"
      on:updated={({ detail }) => updateWithDateValue(detail.date)}
    />
  {:else if inputType === "interval"}
    <IntervalInput
      date={dateValue}
      class="flex-1 min-w-0"
      on:updated={({ detail }) => updateWithDateValue(detail.date)}
    />
  {:else if inputType === "boolean"}
    <DropdownButton
      class="flex-1"
      buttonClass="input-container"
      allowMinimalWidth
      autoWidth
      dynamicWidth
      freeFormHeight
      {placement}
    >
      <span slot="value" class="font-normal">
        {#if value?.valueType === "boolean"}
          {#if value.value}True{:else}False{/if}
        {:else if value?.valueType === "null"}
          (Blanks)
        {:else}
          (Select value)
        {/if}
      </span>

      <ValuesHelper
        on:select={({ detail }) => updateWithValuesHelper(detail)}
        slot="dropdown"
        {value}
        {table}
        {header}
        {currentCondition}
        {staticValueSuggestions}
      />
    </DropdownButton>
  {/if}
</div>

{#if helperEnabled}
  <div bind:this={valuesHelperContainer} class="absolute">
    <Dropdown
      wrapperElement={valuesHelperContainer}
      triggerElement={elementContainer}
      triggerRect={elementContainer.getBoundingClientRect()}
      onClose={() => undefined}
      alignment="left"
      autoWidth
      dynamicWidth
      freeFormHeight
    >
      <ValuesHelper
        on:select={({ detail }) => updateWithValuesHelper(detail)}
        slot="content"
        value={valueHelperValue}
        {table}
        {header}
        {currentCondition}
        {staticValueSuggestions}
      />
    </Dropdown>
  </div>
{/if}

<style lang="postcss">
  .container {
    @apply flex flex-row min-w-0 min-h-0 items-stretch;
    column-gap: 4px;

    &.single-line-group-input {
      .input-container {
        .input.text {
          @apply text-center;
        }

        .radio-button-container {
          @apply hidden;
        }
      }
    }

    .input-container {
      @apply flex rounded min-w-0 items-stretch flex-1 border-none bg-transparent;

      .input {
        @apply flex flex-1 rounded px-2.5 outline-none min-w-0 m-0 items-center;
        box-sizing: border-box;

        &.text {
          @apply flex text-13px;
          line-height: 19.5px;
        }
      }

      .radio-button-container {
        @apply flex flex-col align-center;
        column-gap: 4px;

        .radio-button {
          @apply flex flex-1 text-dark-50 cursor-pointer border-none bg-transparent outline-none px-2.5 py-0 m-0 align-center;

          &:hover,
          &:focus {
            @apply text-dark-200;
          }

          &.increase {
            align-items: end;
          }

          &.descrease {
            align-items: start;
          }
        }
      }
    }
  }
</style>
