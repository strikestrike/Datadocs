<script lang="ts">
  import Root from "./root/Root.svelte";
  import ManagedDatabaseFiles from "./database/ManagedDatabaseFiles.svelte";
  import type { SourceStateManager } from "../manager/sourceStateManager";
  import type { SourceNodeItem } from "../../../../app/store/panels/sources/type";
  import UploadedFiles from "./file/UploadedFiles.svelte";
  import DatabaseContent from "./database/DatabaseContent.svelte";
  // import RemoteFilesContent from "./remote-file/RemoteFilesContent.svelte";
  import { FILE_SYSTEM_VIEW_ALL_FILES_ID } from "../constant";

  export let rootNode: ReturnType<
    SourceStateManager<SourceNodeItem>["getUIRoot"]
  > = null;
  export let rootType: string = null;
</script>

<div class="h-full flex flex-col overflow-y-auto mt-3">
  <div class="relative h-full">
    {#if rootNode && rootType}
      {#if rootNode.type === "databaseroot"}
        <DatabaseContent />
      {:else if rootNode.type === "managedfiles"}
        <ManagedDatabaseFiles />
      {:else if (rootNode.type === "folder" || rootNode.id === FILE_SYSTEM_VIEW_ALL_FILES_ID) && rootType === "uploaded-files"}
        <UploadedFiles place="flat" />
        <!-- {:else if (rootNode.type === "remote-storage" || rootNode.type === "folder") && rootType === "remote-files"}
        <RemoteFilesContent /> -->
      {/if}
    {:else}
      <Root />
    {/if}
  </div>
</div>