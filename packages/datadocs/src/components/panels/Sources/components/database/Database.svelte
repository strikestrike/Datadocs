<script lang="ts">
  import { getContext, onMount } from "svelte";
  import type { DatabaseNodeItem } from "../../../../../app/store/panels/sources/type";
  import type DatabaseStateManager from "../../manager/databaseStateManager";
  import ManagedFiles from "./node/ManagedFiles.svelte";
  import DatabaseRoot from "./node/DatabaseRoot.svelte";
  import { DATABASE_STATE_MANAGER_CONTEXT } from "../../constant";
  import type { Node } from "../../../../common/file-system/fileSystemStateManager";

  const databaseStateManager: DatabaseStateManager<DatabaseNodeItem> =
    getContext(DATABASE_STATE_MANAGER_CONTEXT);

  let databaseValues: Node<DatabaseNodeItem>[] =
    databaseStateManager.getChildNodesById();

  function onDatabaseDataChanged() {
    databaseValues = databaseStateManager.getChildNodesById();
  }

  onMount(() => {
    databaseStateManager.addListener("datachange", onDatabaseDataChanged);
    return () => {
      databaseStateManager.removeListener("datachange", onDatabaseDataChanged);
    };
  });
</script>

{#each databaseValues as value}
  {#if value.type === "databaseroot"}
    <DatabaseRoot node={value} />
  {:else if value.type === "managedfiles"}
    <ManagedFiles node={value} />
  {/if}
{/each}
