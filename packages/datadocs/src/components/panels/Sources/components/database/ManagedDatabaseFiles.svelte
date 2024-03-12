<script lang="ts">
  import { onMount } from "svelte";
  import type { DatabaseNodeItem } from "../../../../../app/store/panels/sources/type";
  import type { Node } from "../../../../common/file-system/fileSystemStateManager";
  import { getDatabaseStateManager } from "../../manager/databaseStateManager";
  import DatabaseTree from "./database-tree/DatabaseTree.svelte";
  import EmptyDatabase from "./EmptyDatabase.svelte";

  const databaseStateManager = getDatabaseStateManager();
  let rootNode = databaseStateManager.getUIRoot();
  let childNodes: Node<DatabaseNodeItem>[] =
    databaseStateManager.getChildNodesById(rootNode.id);
  let isEmpty = !childNodes || childNodes.length === 0;

  function onManagedFileStateChange() {
    rootNode = databaseStateManager.getUIRoot();
    childNodes = rootNode
      ? databaseStateManager.getChildNodesById(rootNode.id)
      : databaseStateManager.getRootChildNodes();
    childNodes = childNodes ?? [];
    isEmpty = !childNodes || childNodes.length === 0;
  }

  onMount(() => {
    databaseStateManager.addListener("datachange", onManagedFileStateChange);
    return () => {
      databaseStateManager.removeListener(
        "datachange",
        onManagedFileStateChange,
      );
    };
  });
</script>

{#if isEmpty}
  <EmptyDatabase />
{:else}
  <DatabaseTree items={childNodes} />
{/if}
