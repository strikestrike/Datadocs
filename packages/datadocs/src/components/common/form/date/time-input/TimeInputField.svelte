<script lang="ts">
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher<{ updated: { value: number } }>();

  export let value: number;
  export let minValue: number;
  export let maxValue: number;

  let className = "";
  export { className as class };

  $: inputValue = valueToInputValue(value);

  let selected = false;

  function valueToInputValue(value: number) {
    return (value >= 0 && value < 10 ? "0" : "") + value;
  }

  function limit(value: number) {
    if (isNaN(value)) return minValue;
    return Math.min(Math.max(value, minValue), maxValue);
  }

  function sanitizeUserInput() {
    let input = minValue;
    try {
      input = parseInt(inputValue, 10);
    } catch {}
    input = limit(input);
    value = input;

    dispatch("updated", { value });
  }
</script>

<div class="container {className}" class:selected>
  <input
    bind:value={inputValue}
    type="text"
    class="input text"
    on:input={sanitizeUserInput}
  />
</div>

<style lang="postcss">
  .container {
    @apply flex rounded border border-solid border-light-100 bg-white min-w-0 h-[32px] w-[40px];
    align-items: stretch;
    flex-shrink: 0;
  }

  .container:focus-within,
  .container:hover {
    box-shadow: 0px 4px 6px rgba(55, 84, 170, 0.16);
  }

  .input {
    @apply flex flex-grow rounded border border-solid border-transparent bg-white outline-none min-w-0 m-0;
    align-items: center;
    box-sizing: border-box;
    text-align: center;
    flex-basis: 0;
  }

  .input.text {
    @apply font-medium flex justify-start text-dark-200;
    font-size: 13px;
    line-height: 19.5px;
  }
</style>
