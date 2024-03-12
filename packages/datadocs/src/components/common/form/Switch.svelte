<script lang="ts">
  import { createEventDispatcher } from "svelte";

  export let on = true;

  const dispatch = createEventDispatcher();

  $: dispatch("checked", { value: on });
</script>

<label class="inline-block relative cursor-pointer">
  <input
    class="absolute w-0 h-0 opacity-0"
    bind:checked={on}
    type="checkbox"
    {...$$restProps}
  />

  <div class="switch-bar" class:on>
    <div class="switch-circle" />
  </div>
</label>

<style lang="postcss">
  .switch-bar {
    @apply relative w-[30px] h-5 rounded-[10px] bg-light-100;
  }

  .switch-circle {
    @apply absolute w-3.5 h-3.5 rounded-full bg-white;
    left: 3px;
    top: 3px;
    transition: left 0.15s ease-in-out;
  }

  .on {
    @apply bg-primary-datadocs-blue;
  }

  .on .switch-circle {
    left: calc(100% - 17px);
    top: 3px;
  }
</style>
