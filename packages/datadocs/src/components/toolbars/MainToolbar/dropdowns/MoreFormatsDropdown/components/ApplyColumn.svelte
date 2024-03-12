<script lang="ts">
  import { createEventDispatcher } from "svelte";

  export let checked = false;
  export let label = "Apply to entire column";
  export let size = 18;

  let className = "text-dark-300";
  export { className as class };

  const dispatch = createEventDispatcher();

  function onChange() {
    dispatch("checked", { value: checked });
  }
</script>

<label class="{className} cursor-pointer" class:checked>
  <input class="hidden" type="checkbox" bind:checked on:change={onChange} />

  <div class="flex flex-row items-center gap-1.5">
    <div class="check-button" style="width: {size}px; height: {size}px;">
      <svg viewBox="0 0 10 8" fill="white" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M 8.9355469,0 3.296875,5.8046875 1.0644531,3.5058594 0,4.6015625 3.2988281,8 10,1.0976562 Z"
        />
      </svg>
    </div>

    <div>{label}</div>
  </div>
</label>

<style lang="postcss">
  .check-button {
    @apply flex flex-row items-center justify-center p-1 rounded bg-light-100;
  }

  label.checked .check-button {
    @apply bg-primary-datadocs-blue;
  }

  label:not(.checked) .check-button * {
    @apply hidden;
  }
</style>
