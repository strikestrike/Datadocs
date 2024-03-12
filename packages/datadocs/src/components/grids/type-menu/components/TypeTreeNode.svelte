<script lang="ts">
  import type { CellDetailTypeData } from "@datadocs/canvas-datagrid-ng";
  import FieldContent from "./FieldContent.svelte";

  export let data: { key: string; dataType: CellDetailTypeData };
  export let level: number;

  const { key, dataType } = data;

  // console.log("debug here ==== type tree node ====== ", data);
</script>

{#if typeof dataType === "string"}
  <li>
    <FieldContent {key} {dataType} indentLevel={level} />
  </li>
{:else}
  <li>
    <FieldContent {key} dataType={dataType.type} indentLevel={level} />
    <ul>
      {#each dataType.children as child}
        <svelte:self data={child} level={level + 1} />
      {/each}
    </ul>
  </li>
{/if}
