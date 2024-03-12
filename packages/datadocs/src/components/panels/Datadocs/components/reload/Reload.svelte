<script lang="ts">
  import { getContext } from "svelte";
  import reloadIcon from "./reload.svg?raw";
  import type { DatadocsFileSystemAction } from "../file-system/action";
  import { FILE_SYSTEM_ACTION_CONTEXT, FILE_SYSTEM_STATE_MANAGER_CONTEXT } from "../../../../common/file-system/flat-file-system/constant";
  import { createSingleRunAsync } from "../../../../../utils/helpers";
  import type { DatadocsFileSystemManager } from "../file-system/datadocsFileSystemManager";

  const fileSystemActions: DatadocsFileSystemAction = getContext(
    FILE_SYSTEM_ACTION_CONTEXT,
  );

  const manager: DatadocsFileSystemManager = getContext(
    FILE_SYSTEM_STATE_MANAGER_CONTEXT
  );

  const reloadData = createSingleRunAsync(async () => {
    await fileSystemActions.refreshData();
    manager.dispatchEvent("refresh", {});
  });
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
  class="p-1 cursor-pointer rounded text-dark-300 hover:bg-primary-datadocs-blue hover:bg-opacity-10"
  on:click={reloadData}
>
  {@html reloadIcon}
</div>
