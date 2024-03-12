<script lang="ts">
  import { getContext } from "svelte";
  import type { DatabaseNodeItem } from "../../../../../../app/store/panels/sources/type";
  import type { Node } from "../../../../../common/file-system/fileSystemStateManager";
  import type DatabaseStateManager from "../../../manager/databaseStateManager";
  import DatabaseTreeNode from "./node/DatabaseTreeNode.svelte";
  import { DATABASE_STATE_MANAGER_CONTEXT } from "../../../constant";

  export let items: Node<DatabaseNodeItem>[];

  const databaseStateManager: DatabaseStateManager<DatabaseNodeItem> =
    getContext(DATABASE_STATE_MANAGER_CONTEXT);
</script>

<div class="flex flex-col w-full pl-3">
  {#if items}
    {#each items as node (node.id)}
      <DatabaseTreeNode node={databaseStateManager.getNodeById(node.id)} />
    {/each}
  {/if}
</div>
