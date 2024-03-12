<script lang="ts">
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher<{ updated: { value: number } }>();

  export let value: number | undefined;
  export let title: string;

  let className = "";
  export { className as class };

  let selected = false;
</script>

<div class="container">
  <div class="input-container {className}" class:selected>
    <input
      bind:value
      placeholder="-"
      type="number"
      class="input text"
      on:input={() => {
        dispatch("updated", { value });
      }}
    />
  </div>
  <span class="title">{title}</span>
</div>

<style lang="postcss">
  .container {
    @apply flex flex-col min-w-0;
    row-gap: 2px;
  }

  .input-container {
    @apply flex rounded border border-solid border-light-100 bg-white min-w-0 h-[32px];
    align-items: stretch;
  }

  .input-container:focus-within,
  .input-container:hover {
    box-shadow: 0px 4px 6px rgba(55, 84, 170, 0.16);
  }

  .input {
    @apply flex flex-shrink rounded border-none bg-white outline-none min-w-0 m-0 w-[inherit];
    align-items: center;
    box-sizing: border-box;
    text-align: center;
  }

  .input.text {
    @apply font-medium flex justify-start text-dark-200;
    font-size: 13px;
    line-height: 19.5px;
  }

  .container .title {
    @apply text-dark-50 text-[10px] self-center font-normal whitespace-nowrap overflow-hidden overflow-ellipsis;
    line-height: 15px;
  }
</style>
