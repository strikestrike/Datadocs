<script lang="ts">
  import type { BreadcrumbItem } from "./type";

  export let data: BreadcrumbItem;
  export let active: boolean;
  export let width: number;

  function onPathClick() {
    if (typeof data.action === "function") {
      data.action();
    }
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
  class="flex-grow-0 flex-shrink-0 overflow-hidden cursor-pointer {active
    ? 'text-dark-300'
    : 'text-dark-50'} text-center overflow-ellipsis hover:text-primary-indigo-blue"
  style="width: {width}px; max-width: {width}px;"
  on:click={onPathClick}
>
  {data.name}
</div>
