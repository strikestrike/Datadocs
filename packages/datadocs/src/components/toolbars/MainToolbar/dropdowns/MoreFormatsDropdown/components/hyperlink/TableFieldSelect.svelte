<script lang="ts">
  import TableFieldButton from "./TableFieldButton.svelte";

  export let label: string;
</script>

<div class="item">
  <TableFieldButton {label} />
</div>

<style lang="postcss">
  .item {
    @apply pl-2.5 pr-3.5 py-1.5 mx-1.5 text-13px font-medium rounded-sm cursor-pointer;
  }

  .item:hover {
    @apply bg-dropdown-item-hover-bg;
  }

  .item :global(*) {
    @apply pointer-event-none;
  }
</style>
