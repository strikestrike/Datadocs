<script lang="ts">
  export let count: number;
</script>

<div>{count}</div>

<style lang="postcss">
  div {
    @apply flex flex-row items-center justify-center w-[15px] h-[15px];
    @apply text-dark-300 text-11px;
    @apply border border-light-200 rounded-sm;
  }
</style>
