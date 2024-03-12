<script lang="ts">
  import type { DatadocsObjectNode } from "./components/type";
  import type { Node } from "../../common/file-system/fileSystemStateManager";
  import { datadocsPanelActions } from "./components/file-system/action";
  import { getDatadocsFileSystemManager } from "./components/store";
  import {
    getFolderData,
    loadNextPageData,
    checkListDirNextPage,
  } from "./components/utils";
  import {
    FILE_SYSTEM_ACTION_CONTEXT,
    FILE_SYSTEM_STATE_MANAGER_CONTEXT,
  } from "../../common/file-system/flat-file-system/constant";
  import DatadocsToolbar from "./components/DatadocsToolbar.svelte";
  import SearchBar from "./components/SearchBar.svelte";
  import { onDestroy, onMount, setContext } from "svelte";
  import NodeDetail from "./components/node-detail/NodeDetail.svelte";
  import SearchView from "./components/search-view/SearchView.svelte";
  import type { FileSystemCustomNode } from "../../common/file-system/flat-file-system/flatFileSystemManager";
  import DatadocsFileSystem from "./components/file-system/DatadocsFileSystem.svelte";
  import { getDatadocsPanelSyncManager } from "../../../api/datadocs-panel";
  import { userInformationStore } from "../../../api/store";
  import { datadocsPanelFileSystemStore } from "../../../app/store/writables";

  export let pane: any;

  const stateManager = getDatadocsFileSystemManager();
  const datadocsPanelSyncManager = getDatadocsPanelSyncManager();
  let currentNode: Node<DatadocsObjectNode>;
  let hasSearch: boolean;
  let loadMoreNode: FileSystemCustomNode = null;
  let hasSearchNextPage: boolean = false;
  let selectionCount = 0;
  let uiRootId = stateManager.getUIRootId();

  function handleShowNodeDetail(event: any) {
    const nodeId = event.nodeId;
    let node: Node<DatadocsObjectNode>;

    if (stateManager.hasSearch()) {
      node = stateManager.getSearchNodeById(nodeId)?.node;
    } else {
      node = stateManager.getNodeById(nodeId);
    }

    if (node) {
      // Only change when the node does exist in file system
      currentNode = node;
    }
  }

  function handleDataChange() {
    selectionCount = stateManager.getSelectionCount();
    hasSearch = stateManager.hasSearch();
    loadMoreNode = checkListDirNextPage(stateManager)
      ? { type: "custom", name: "loadnextpage" }
      : null;
    if (hasSearch) {
      hasSearchNextPage = datadocsPanelActions.hasSearchNextPage();
    }
  }

  function handleObjectsDelete(event: { objectIds: string[] }) {
    if (event.objectIds.includes(currentNode.id)) {
      currentNode = null;
    }
  }

  onMount(() => {
    stateManager.addListener("shownodedetails", handleShowNodeDetail);
    stateManager.addListener("datachange", handleDataChange);
    stateManager.addListener("rootchange", onUIRootChange);
    stateManager.addListener("sortchange", updateFolderData);
    stateManager.addListener("delete", handleObjectsDelete);

    return () => {
      stateManager.removeListener("shownodedetails", handleShowNodeDetail);
      stateManager.removeListener("datachange", handleDataChange);
      stateManager.removeListener("rootchange", onUIRootChange);
      stateManager.removeListener("sortchange", updateFolderData);
      stateManager.removeListener("delete", handleObjectsDelete);
    };
  });

  setContext(FILE_SYSTEM_ACTION_CONTEXT, datadocsPanelActions);
  setContext(FILE_SYSTEM_STATE_MANAGER_CONTEXT, stateManager);

  async function updateFolderData() {
    const data = getFolderData(stateManager);

    if (data) {
      const newFileSystemNodes = [...(data.path ?? []), ...data.children];
      stateManager.rebuildFileSystem(newFileSystemNodes);
    } else {
      await loadNextPageData(stateManager);
    }

    selectionCount = stateManager.getSelectionCount();
  }

  async function onUIRootChange() {
    await updateFolderData();
    if (uiRootId !== stateManager.getUIRootId()) {
      datadocsPanelSyncManager.unsync(uiRootId);
      uiRootId = stateManager.getUIRootId();
    }
    datadocsPanelSyncManager.sync(uiRootId);
  }

  onDestroy(() => {
    datadocsPanelSyncManager.unsync(uiRootId);
  });

  $: if ($userInformationStore) {
    datadocsPanelSyncManager.sync(uiRootId);
  }

  $: if ($datadocsPanelFileSystemStore) {
    stateManager.setSelectedNodeForRebuild([
      ...stateManager.getSelectedNodes(),
    ]);
    updateFolderData();
  }
</script>

<div class="flex flex-col w-full h-full">
  <DatadocsToolbar />
  <SearchBar />

  <div
    class="flex-grow flex-shrink flex flex-col -mb-2 px-3 {currentNode
      ? 'pb-1'
      : 'pb-3'} overflow-y-hidden"
  >
    <div class="flex-grow flex-shrink h-0 overflow-y-auto">
      {#if hasSearch}
        <SearchView hasNextPage={hasSearchNextPage} />
      {:else}
        <DatadocsFileSystem
          fileSystemActions={datadocsPanelActions}
          {stateManager}
          {loadMoreNode}
        />
      {/if}
    </div>
  </div>

  {#if currentNode}
    {#key currentNode.id}
      <div
        class="flex-grow-0 flex-shrink-0 w-full h-[calc(30%)] pt-2 overflow-hidden"
      >
        <NodeDetail bind:data={currentNode} {selectionCount} {stateManager} />
      </div>
    {/key}
  {/if}
</div>
