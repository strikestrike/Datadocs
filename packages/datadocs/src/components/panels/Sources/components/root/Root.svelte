<script lang="ts">
  import {
    GROUP_ROOT_DATABASE_NAME,
    GROUP_ROOT_UPLOADED_FILES_NAME,
    UPLOADED_FILES_SOURCE_PANEL_ACTION_CONTEXT,
    UPLOADED_FILES_STATE_MANAGER_CONTEXT,
  } from "../../constant";
  import UploadedFiles from "../file/UploadedFiles.svelte";
  import Database from "../database/Database.svelte";
  import Icon from "../../../../common/icons/Icon.svelte";
  import { getContext } from "svelte";
  import type { SourceStateManager } from "../../manager/sourceStateManager";
  import type { SourceNodeItem } from "../../../../../app/store/panels/sources/type";
  import type { SourcePanelAction } from "../../manager/action";

  const uploadedFileStateManager: SourceStateManager<SourceNodeItem> =
    getContext(UPLOADED_FILES_STATE_MANAGER_CONTEXT);

  const uploadedFileActions: SourcePanelAction = getContext(
    UPLOADED_FILES_SOURCE_PANEL_ACTION_CONTEXT,
  );

  function addNewFolder() {
    uploadedFileActions.addNewNodePlaceholder({
      parent: uploadedFileStateManager.getUIRoot()?.id ?? null,
      name: "New Folder",
      type: "folder",
    });
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class="absolute top-0 bottom-0 left-0 right-0 my-1">
  <div class="h-full max-h-full flex flex-col justify-between overflow-y-auto">
    <div class="pt-2 pl-3 pr-1">
      <div class="section-title">{GROUP_ROOT_DATABASE_NAME}</div>
      <div class="tree-view-container">
        <Database />
      </div>

      <div class="section-title relative h-5 w-full pr-6 flex items-center mt-7">
        <div>
          {GROUP_ROOT_UPLOADED_FILES_NAME}
        </div>
        <div
          class="absolute cursor-pointer right-1.5 w-5 h-5 top-0 hover:bg-primary-datadocs-blue hover:bg-opacity-10"
          on:click={addNewFolder}
        >
          <Icon icon="panel-add-folder" size="20px" />
        </div>
      </div>
      <div class="tree-view-container">
        <UploadedFiles place="root" />
      </div>

    </div>
  </div>
</div>

<style lang="postcss">
  .section-title {
    @apply text-11px font-semibold text-dark-50 uppercase;
  }

  .tree-view-container {
    @apply relative text-11px pl-1 mt-1;
  }
</style>
