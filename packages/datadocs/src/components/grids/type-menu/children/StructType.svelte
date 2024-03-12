<script lang="ts">
  import type { StructDetailTypeData } from "@datadocs/canvas-datagrid-ng";
  import TypeTreeNode from "../components/TypeTreeNode.svelte";

  export let dataType: StructDetailTypeData;

  // console.log("debug here ===  StructType ==== ", {dataType});
</script>

<div class="data-type-tree-node text-left">
  <ul>
    {#each dataType.children as child}
      <TypeTreeNode data={child} level={0} />
    {/each}
  </ul>
</div>

<style lang="postcss">
  :global(.tooltip_container .tooltip) {
    max-width: none !important;
  }

  :global(.data-type-tree-node ul > li) {
    @apply ml-2;
  }

  :global(.data-type-tree-node > ul > li) {
    @apply ml-0;
  }

  /* :global(.data-type-tree-node ul) {
    @apply border-l border-solid border-light-50;
  }

  :global(.data-type-tree-node > ul) {
    @apply border-none;
  } */
</style>
