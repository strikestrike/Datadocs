<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";

  export let checked = false;
  export let indeterminate = false;

  export let size = "20px";

  export let width = size;
  export let height = size;

  export let id = "";
  export let label = "";
  if (!id && label) {
    // generate id automatically for linking label and checkbox
    id = "checkbox_" + String(Date.now()).slice(-8);
  }

  let className = "";
  export { className as class };

  const dispatch = createEventDispatcher<{ checked: { value: boolean } }>();

  let checkboxElement: HTMLInputElement;

  $: if (checkboxElement) {
    checkboxElement.indeterminate = indeterminate;
  }

  function onChanged() {
    dispatch("checked", { value: checked });
  }

  onMount(() => {
    checkboxElement.indeterminate = indeterminate;
  });
</script>

<div class="checkbox-container" style:height>
  <input
    bind:this={checkboxElement}
    bind:checked
    on:change={onChanged}
    type="checkbox"
    {...$$restProps}
    class="checkbox {className}"
    style:width
    style:height
    {id}
    on:keydown
    on:keyup
  />
  {#if label}
    <label for={id}>{label}</label>
  {/if}
</div>

<style lang="postcss">
  :root {
    --checkbox-mark: url("data:image/svg+xml;charset=UTF-8,<svg width='10' height='8' viewBox='0 0 10 8' fill='white' xmlns='http://www.w3.org/2000/svg'><path d='M 8.9355469,0 3.296875,5.8046875 1.0644531,3.5058594 0,4.6015625 3.2988281,8 10,1.0976562 Z' /></svg>");
    --checkbox-mark-im: url("data:image/svg+xml;charset=UTF-8,<svg width='8' height='3' viewBox='0 0 8 3' fill='white' xmlns='http://www.w3.org/2000/svg'><path d='M0 3H8V0H0V3Z' /></svg>");
  }

  .checkbox-container {
    @disply flex flex-row;
    align-items: center;
    justify-content: flex-start;
  }
  .checkbox-container label {
    @apply ml-2 text-dark-200 text-[0.85em] cursor-pointer;
  }

  .checkbox {
    @apply rounded border-none bg-light-100 outline-none text-14px cursor-pointer;
    appearance: none;
    transition: background-color 0.15s ease-in-out;
  }

  .checkbox:focus-visible {
    @apply outline outline-primary-datadocs-blue;
    outline-offset: 1px;
  }

  .checkbox:hover {
    @apply bg-light-200;
  }

  .checkbox:checked:hover {
    opacity: 0.75;
  }

  .checkbox:checked,
  .checkbox:indeterminate {
    @apply bg-primary-datadocs-blue;
  }

  .checkbox:checked {
    content: var(--checkbox-mark);
    padding: calc(100% * 0.25);
  }

  .checkbox:indeterminate {
    content: var(--checkbox-mark-im);
    padding: calc(100% * 0.3);
  }
</style>
