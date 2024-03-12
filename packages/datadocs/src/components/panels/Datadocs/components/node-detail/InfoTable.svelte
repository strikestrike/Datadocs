<script lang="ts">
  import type { NodeDetailItemData } from "./type";

  export let items: NodeDetailItemData[];
</script>

<div class="node-info space-y-2.5">
  {#each items as item (item.title)}
    <div class="text-12px w-full">
      <div class="w-26 text-dark-50">{item.title}</div>
      <div
        class="text-black whitespace-nowrap overflow-hidden overflow-ellipsis"
      >
        {item.value}
      </div>
    </div>
  {/each}
</div>
