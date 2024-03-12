<script lang="ts">
  import { setContext, onMount } from "svelte";
  import {
    FILE_SYSTEM_ACTION_CONTEXT,
    FILE_SYSTEM_STATE_MANAGER_CONTEXT,
  } from "../../../../common/file-system/flat-file-system/constant";
  import type { Node } from "../../../../common/file-system/fileSystemStateManager";
  import type { SourcePanelAction } from "../../manager/action";
  import type { UploadedFilesStateManager } from "../../manager/uploadedFileStateManager";
  import type { SourceNodeItem } from "../../../../../app/store/panels/sources/type";
  import type { NewNodePlaceHolder } from "../../../../common/file-system/flat-file-system/flatFileSystemManager";
  import NewFolder from "../../../../common/file-system/flat-file-system/NewFolder.svelte";

  export let fileSystemActions: SourcePanelAction;
  export let stateManager: UploadedFilesStateManager<SourceNodeItem>;
  export let NewFolderComponent = NewFolder;

  setContext(FILE_SYSTEM_ACTION_CONTEXT, fileSystemActions);
  setContext(FILE_SYSTEM_STATE_MANAGER_CONTEXT, stateManager);

  let rootNode: Node<SourceNodeItem>;
  let childNodes: Node<SourceNodeItem>[];
  let newFolderPlaceholder: NewNodePlaceHolder;

  function onFileSystemStateChange() {
    rootNode = stateManager.getUIRoot();
    childNodes = stateManager.getRootChildNodesWithViewAll();
    childNodes = childNodes ?? [];
    newFolderPlaceholder = stateManager.getNewFolderPlaceholder();
  }

  onMount(() => {
    stateManager.addListener("datachange", onFileSystemStateChange);
    return () => {
      stateManager.removeListener("datachange", onFileSystemStateChange);
    };
  });

  onFileSystemStateChange();
</script>

{#if newFolderPlaceholder}
  <svelte:component
    this={NewFolderComponent}
    label={newFolderPlaceholder.name}
    parentId={rootNode ? rootNode.id : null}
    type="folder"
  />
{/if}

{#each childNodes as node (node.id)}
  {@const component = stateManager.getNodeComponent(node)}
  {#if component}
    <svelte:component this={component} {node} />
  {/if}
{/each}
