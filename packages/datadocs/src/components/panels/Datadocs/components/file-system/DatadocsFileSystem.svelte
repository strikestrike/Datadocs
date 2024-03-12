<script lang="ts">
  import { onMount } from "svelte";
  import type { DataNodeBase } from "../../../../common/file-system/fileSystemStateManager";
  import FlatFileSystem from "../../../../common/file-system/flat-file-system/FlatFileSystem.svelte";
  import type { FlatFileSystemActions } from "../../../../common/file-system/flat-file-system/flatFileSystemActions";
  import type {
    FileSystemCustomNode,
    FlatFileSystemManager,
  } from "../../../../common/file-system/flat-file-system/flatFileSystemManager";

  export let fileSystemActions: FlatFileSystemActions<DataNodeBase>;
  export let stateManager: FlatFileSystemManager<DataNodeBase>;
  export let loadMoreNode: FileSystemCustomNode = null;

  let ignoreNodeChild = false;
  let metaKey = false;
  let shiftKey = false;

  function updateFileSystemStyle() {
    // Add DOM class to disable user action on node label or node `...` button when
    // 1. Multiple items are selected
    // 2. A user has selected one item and is holding the shift- or cmd/ctrl- key
    const selectionCount = stateManager.getSelectionCount();
    // console.log("debug here ==== ", { selectionCount, metaKey, shiftKey });

    if (selectionCount > 1) {
      // case #1
      ignoreNodeChild = true;
    } else if ((metaKey || shiftKey) && selectionCount === 1) {
      // case #2
      ignoreNodeChild = true;
    } else {
      ignoreNodeChild = false;
    }
  }

  function updateKeyState(event: KeyboardEvent) {
    if (metaKey === event.metaKey && shiftKey === event.shiftKey) {
      // The key state not change from previous one, do nothing
      return;
    }

    metaKey = event.metaKey;
    shiftKey = event.shiftKey;
    updateFileSystemStyle();
  }

  onMount(() => {
    document.addEventListener("keydown", updateKeyState, true);
    document.addEventListener("keyup", updateKeyState, true);
    stateManager.addListener("datachange", updateFileSystemStyle);

    return () => {
      document.removeEventListener("keydown", updateKeyState, true);
      document.removeEventListener("keyup", updateKeyState, true);
      stateManager.removeListener("datachange", updateFileSystemStyle);
    };
  });
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<div class="datadocs-panel-fs" class:ignore-node-child={ignoreNodeChild}>
  <FlatFileSystem {fileSystemActions} {stateManager} {loadMoreNode} />
</div>

<style lang="postcss">
  .datadocs-panel-fs:not(.ignore-node-child)
    :global(.panel-node-label-text:hover) {
    @apply cursor-pointer underline;
  }

  .datadocs-panel-fs.ignore-node-child :global(.panel-node-label-text),
  .datadocs-panel-fs.ignore-node-child :global(.panel-more-button) {
    @apply !pointer-events-none;
  }
</style>
