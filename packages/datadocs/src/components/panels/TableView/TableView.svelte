<script lang="ts">
  import type {
    GridPublicAPI,
    TableDescriptor,
  } from "@datadocs/canvas-datagrid-ng";
  import { uniqueReadable } from "../../../app/store/readable-unique";
  import { selectedTable } from "../../../app/store/writables";
  import FieldManager from "./Fields/FieldManager.svelte";
  import TableLayout from "./TableLayout.svelte";
  import { getGridStore } from "../../../app/store/grid/base";
  import { onDestroy, onMount } from "svelte";
  import { isTableViewOpen } from "../../../app/store/panels/writables";

  const gridStore = getGridStore();
  const tableStore = uniqueReadable(selectedTable);

  // export let pane;

  $: update($tableStore);

  let grid: GridPublicAPI;
  let table: TableDescriptor | undefined;

  function update(currentTable: TableDescriptor) {
    grid = currentTable ? $gridStore : undefined;
    table = currentTable;
  }

  onMount(() => {
    $isTableViewOpen = true;
  });

  onDestroy(() => {
    $isTableViewOpen = false;
  })
</script>

<div class="flex flex-col h-full overflow-y-auto">
  {#if table}
    <FieldManager {grid} {table} />
    <TableLayout {grid} {table} />
  {:else}
    <p class="p-4">Select a table.</p>
  {/if}
</div>
