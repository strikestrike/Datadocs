<script lang="ts">
  import icon_tick from "./tick.svg?raw";

  export let label: string;
  export let isActive: boolean;
</script>

<div class="w-full flex flex-row items-center px-3.5 py-1.5 min-w-[200px] text-13px">
  <div class="flex-grow pl-2.5">{label}</div>

  {#if isActive}
    <div>{@html icon_tick}</div>
  {/if}
</div>
