<script lang="ts">
  import { createEventDispatcher } from "svelte";

  export let content: string;
  export let index: number;

  const dispatch = createEventDispatcher();

  function onClick() {
    dispatch("select", { index, content });
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class="struct-chip" on:click={onClick}>
  <div>{content}</div>
</div>

<style lang="postcss">
  .struct-chip {
    @apply inline-block px-2.5 py-1px bg-light-100 cursor-pointer;
    @apply text-11px text-dark-300;
    border-radius: 40px;
  }

  .struct-chip div {
    @apply overflow-hidden overflow-ellipsis;
    max-width: 330px;
    white-space: nowrap;
  }
</style>
