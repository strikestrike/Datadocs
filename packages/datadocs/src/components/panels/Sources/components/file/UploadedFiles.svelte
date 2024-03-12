<script lang="ts">
  import { getContext, onMount, setContext } from "svelte";
  import FlatFileSystem from "../../../../common/file-system/flat-file-system/FlatFileSystem.svelte";
  import {
    FILE_SYSTEM_ACTION_CONTEXT,
    FILE_SYSTEM_STATE_MANAGER_CONTEXT,
  } from "../../../../common/file-system/flat-file-system/constant";
  import type { SourceStateManager } from "../../manager/sourceStateManager";
  import type { SourceNodeItem } from "../../../../../app/store/panels/sources/type";
  import {
    UPLOADED_FILES_SOURCE_PANEL_ACTION_CONTEXT,
    UPLOADED_FILES_STATE_MANAGER_CONTEXT,
  } from "../../constant";
  import type { SourcePanelAction } from "../../manager/action";
  import FlatFileSystemWithViewAll from "./FlatFileSystemWithViewAll.svelte";
  import { handleDropFileFolder } from "./upload-file-folder";

  export let place: "root" | "flat";

  let dropArea: HTMLElement;
  let isHighlight: boolean;

  const uploadedFileStateManager: SourceStateManager<SourceNodeItem> =
    getContext(UPLOADED_FILES_STATE_MANAGER_CONTEXT);

  const uploadedFileActions: SourcePanelAction = getContext(
    UPLOADED_FILES_SOURCE_PANEL_ACTION_CONTEXT,
  );

  let showNoFiles = false;

  function getShowNoFiles(): boolean {
    return (
      !uploadedFileStateManager.hasChild(null) &&
      uploadedFileStateManager.getNewFolderPlaceholder() === null
    );
  }

  function checkShowNoFiles(e: any) {
    if (place === "root") {
      if (
        e.type === "newnodeplaceholder" ||
        e.type === "deletenode" ||
        e.type === "addnode"
      ) {
        showNoFiles = getShowNoFiles();
      }
    }
  }

  function highlight(e: DragEvent) {
    e.preventDefault();
    isHighlight = true;
  }

  function unhighlight(e: DragEvent) {
    e.preventDefault();
    isHighlight = false;
  }

  function handleDrop(e: DragEvent) {
    unhighlight(e);
    e.preventDefault();

    handleDropFileFolder(e);
  }

  setContext(FILE_SYSTEM_ACTION_CONTEXT, uploadedFileActions);
  setContext(FILE_SYSTEM_STATE_MANAGER_CONTEXT, uploadedFileStateManager);

  onMount(() => {
    uploadedFileStateManager.addListener("datachange", checkShowNoFiles);
    showNoFiles = getShowNoFiles();

    return () => {
      uploadedFileStateManager.removeListener("datachange", checkShowNoFiles);
    };
  });
</script>

<div
  class="drop-area"
  bind:this={dropArea}
  on:dragenter={highlight}
  on:dragover={highlight}
  on:dragleave={unhighlight}
  on:drop={handleDrop}
  class:highlight={isHighlight}
>
  {#if place === "root"}
    {#if showNoFiles}
      <div class="filesys-nofile">No files yet</div>
    {:else}
      <FlatFileSystemWithViewAll
        fileSystemActions={uploadedFileActions}
        stateManager={uploadedFileStateManager}
      />
    {/if}
  {:else}
    <FlatFileSystem
      fileSystemActions={uploadedFileActions}
      stateManager={uploadedFileStateManager}
    />
  {/if}
</div>

<style lang="postcss">
  .filesys-nofile {
    @apply text-11px font-normal text-dark-50;
  }

  .drop-area {
    border: 2px dashed #cccccc00;
    border-radius: 20px;
  }
  .drop-area.highlight {
    border-color: purple;
    border-radius: 20px;
  }
</style>
