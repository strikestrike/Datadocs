<script lang="ts">
  import { getContext } from "svelte";
  import type { SourceNodeItem } from "../../../../../app/store/panels/sources/type";
  import type { SourceStateManager } from "../../manager/sourceStateManager";
  import SearchView from "./SearchView.svelte";
  import {
    DATABASE_SOURCE_PANEL_ACTION_CONTEXT,
    DATABASE_STATE_MANAGER_CONTEXT,
    UPLOADED_FILES_SOURCE_PANEL_ACTION_CONTEXT,
    UPLOADED_FILES_STATE_MANAGER_CONTEXT,
  } from "../../constant";
  import type { SourcePanelAction } from "../../manager/action";

  export let rootNode: ReturnType<
    SourceStateManager<SourceNodeItem>["getUIRoot"]
  >;
  export let rootType: string;

  const databaseManager: SourceStateManager<SourceNodeItem> = getContext(
    DATABASE_STATE_MANAGER_CONTEXT,
  );
  const databaseActions: SourcePanelAction = getContext(
    DATABASE_SOURCE_PANEL_ACTION_CONTEXT,
  );
  const uploadedFilesManager: SourceStateManager<SourceNodeItem> = getContext(
    UPLOADED_FILES_STATE_MANAGER_CONTEXT,
  );
  const uploadedFileActions: SourcePanelAction = getContext(
    UPLOADED_FILES_SOURCE_PANEL_ACTION_CONTEXT,
  );

  let manager: SourceStateManager<SourceNodeItem> = getManager();

  let actions: SourcePanelAction = getActions();

  function getManager() {
    return rootType === "database" ? databaseManager : uploadedFilesManager;
  }

  function getActions() {
    return rootType === "database" ? databaseActions : uploadedFileActions;
  }

  function onDoubleClick() {
    databaseActions.search("", null);
    uploadedFileActions.search("", null);
  }
</script>

<div class="gap-2 pt-2 overflow-y-auto">
  {#if rootNode}
    <SearchView {manager} {actions} {onDoubleClick} />
  {:else}
    <SearchView
      manager={databaseManager}
      actions={databaseActions}
      {onDoubleClick}
    />
    <div class="search-separator"></div>
    <SearchView
      manager={uploadedFilesManager}
      actions={uploadedFileActions}
      {onDoubleClick}
    />
  {/if}
</div>

<style lang="postcss">
  .search-separator {
    border: 1px solid #e9edf0;
  }
</style>
