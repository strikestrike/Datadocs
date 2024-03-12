<script lang="ts">
  import { getContext, onMount } from "svelte";
  import type { DatabaseNodeItem } from "../../../../../app/store/panels/sources/type";
  import type { Node } from "../../../../common/file-system/fileSystemStateManager";
  import type DatabaseStateManager from "../../manager/databaseStateManager";
  import { DATABASE_STATE_MANAGER_CONTEXT } from "../../constant";
  import DatabaseTree from "./database-tree/DatabaseTree.svelte";
  import EmptyDatabase from "./EmptyDatabase.svelte";

  const sourceStateManager: DatabaseStateManager<DatabaseNodeItem> = getContext(
    DATABASE_STATE_MANAGER_CONTEXT,
  );

  let rootNode = sourceStateManager.getUIRoot();
  let childNodes: Node<DatabaseNodeItem>[] =
    sourceStateManager.getChildNodesById(rootNode.id);
  let isEmpty = !childNodes || childNodes.length === 0;

  function onDatabaseDataChanged(event: any) {
    rootNode = sourceStateManager.getUIRoot();
    childNodes = rootNode
      ? sourceStateManager.getChildNodesById(rootNode.id)
      : sourceStateManager.getRootChildNodes();
    isEmpty = !childNodes || childNodes.length === 0;
  }

  onMount(() => {
    sourceStateManager.addListener("datachange", onDatabaseDataChanged);
    return () => {
      sourceStateManager.removeListener("datachange", onDatabaseDataChanged);
    };
  });
</script>

{#if isEmpty}
  <EmptyDatabase />
{:else}
  <div class="tree-view-container">
    <div class="source-panel-tree-view database-tree-view">
      <DatabaseTree items={childNodes} />
    </div>
  </div>
{/if}

<style lang="postcss">
  .tree-view-container {
    @apply relative text-11px pl-1 mt-1;
  }
</style>
