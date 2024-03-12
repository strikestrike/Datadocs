<script lang="ts">
  import { onMount } from "svelte";
  import DatabaseTree from "./DatabaseTree.svelte";
  import CommonTree from "./CommonTree.svelte";
  import type { TreeViewStateManager, DBTable } from "../../tree-view";
  import {
    databasesSectionManager,
    fileSystemSectionManager,
    getColumnTree,
    sourcesPanelActiveFileSystem,
    sourcesPanelUpdateActiveTable,
  } from "../../../../../../app/store/panels/store-sources-panel";
  import type { SourcesPanelActiveTableEvent } from "../../tree-view/manager/tree-group-manager";

  let activeTable: DBTable = null;
  let columnTreeStateManager: TreeViewStateManager;

  const listDBTree = databasesSectionManager.listTreeViewManagerStore;
  const listFSTree = fileSystemSectionManager.listTreeViewManagerStore;

  function onDBTreeSelected() {
    fileSystemSectionManager.deselectAllComponents();
    sourcesPanelUpdateActiveTable(true);
    fireSourcesPanelActiveFileChanged();
  }

  function onFileSystemSelected() {
    databasesSectionManager.deselectAllComponents();
    sourcesPanelActiveFileSystem(true);
    fireSourcesPanelActiveFileChanged();
  }

  function fireSourcesPanelActiveFileChanged() {
    // const e = new Event("sourcesPanelActiveFileChanged");
    databasesSectionManager.dispatchEvent("sourcesPanelActiveFileChanged", []);
  }

  function updateActiveTable(dbtable: DBTable) {
    activeTable = dbtable && dbtable.type === "dbtable" ? dbtable : null;
  }

  function onActiveNodeChanged(event: SourcesPanelActiveTableEvent) {
    updateActiveTable(event ? event.activeTable : null);
  }

  onMount(() => {
    databasesSectionManager.addEventListener(
      "sourcesPanelActiveNodeChanged",
      onActiveNodeChanged
    );
    return () => {
      databasesSectionManager.removeEventListener(
        "sourcesPanelActiveNodeChanged",
        onActiveNodeChanged
      );
    };
  });

  $: databasesTreeManagers = $listDBTree;
  $: fsTreeManagers = $listFSTree;
  $: columnTreeStateManager = activeTable ? getColumnTree(activeTable) : null;
  $: if (databasesTreeManagers) sourcesPanelUpdateActiveTable(true);
</script>

<div class="absolute top-0 bottom-0 left-0 right-0 my-1">
  <div class="h-full max-h-full flex flex-col justify-between overflow-y-auto">
    <div class="pt-2 pl-3 pr-1">
      <div class="section-title">Databases</div>
      <div class="tree-view-container">
        {#each databasesTreeManagers as manager (manager.id)}
          <DatabaseTree
            on:treeNodeSelected={onDBTreeSelected}
            treeStateManager={manager}
          />
        {/each}
      </div>

      <div class="section-title mt-1.5">File System</div>
      <div class="tree-view-container">
        {#each fsTreeManagers as manager (manager.id)}
          <CommonTree
            on:treeNodeSelected={onFileSystemSelected}
            treeStateManager={manager}
          />
        {/each}
      </div>
    </div>

    {#if columnTreeStateManager && activeTable}
      <div class="mt-1.5 mb-1 pl-3 pr-1 border-t border-solid border-light-100">
        <div class="section-title mt-2.5">{activeTable.name}</div>
        {#key columnTreeStateManager.id}
          <div class="tree-view-container">
            <CommonTree treeStateManager={columnTreeStateManager} />
          </div>
        {/key}
      </div>
    {/if}
  </div>
</div>

<style lang="postcss">
  .section-title {
    @apply text-10px font-semibold text-dark-50 uppercase;
  }

  .tree-view-container {
    @apply relative text-11px pl-1 mt-1;
  }
</style>
