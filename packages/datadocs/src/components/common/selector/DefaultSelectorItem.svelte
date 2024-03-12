<script lang="ts">
  export let id: string | number;
  export let title: string;
  export let subtitle: string;
</script>

<div class="flex flex-1 px-4 py-2 justify-between" data-id={id}>
  <span class="text-dark-200 text-11px">{title}</span>
  <span class="text-gray-300 text-10px ml-1">{subtitle}</span>
</div>

<style lang="postcss">
</style>
