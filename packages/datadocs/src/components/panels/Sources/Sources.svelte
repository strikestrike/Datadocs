<script lang="ts">
  import { watchResize } from "svelte-watch-resize";
  import SearchBar from "./components/SearchBar.svelte";
  import Content from "./components/Content.svelte";
  import { onMount, setContext } from "svelte";
  import {
    DATABASE_SOURCE_PANEL_ACTION_CONTEXT,
    DATABASE_STATE_MANAGER_CONTEXT,
    DETAIL_DEFAUT_HEIGHT,
    DETAIL_MIN_HEIGHT,
    DETAIL_TRANSFORM_CONTEXT,
    UPLOADED_FILES_SOURCE_PANEL_ACTION_CONTEXT,
    UPLOADED_FILES_STATE_MANAGER_CONTEXT,
  } from "./constant";
  import SourceToolbar from "./components/SourceToolbar.svelte";
  import {
    databasePanelActions,
    // remoteFileSystemActions,
    uploadedFileActions,
  } from "./manager/action";
  import { getDatabaseStateManager } from "./manager/databaseStateManager";
  import { getUploadedFilesStateManager } from "./manager/uploadedFileStateManager";
  import type { SourceStateManager } from "./manager/sourceStateManager";
  import type { SourceNodeItem } from "../../../app/store/panels/sources/type";
  import type { Node } from "../../common/file-system/fileSystemStateManager";
  import NodeDetail from "./components/node-detail/NodeDetail.svelte";
  import SearchViewContainer from "./components/search-view/SearchViewContainer.svelte";
  import { initialSourcePanel } from "../../../app/store/writables";
  import CircularSpinner from "../../common/spinner/CircularSpinner.svelte";
  import type { DetailTransformContext } from "./components/node-detail/type";
  import { getDetailTransformContext } from "./manager/detail-transform-context";

  let rootNode: ReturnType<SourceStateManager<SourceNodeItem>["getUIRoot"]> =
    null;
  let rootType: string = null;
  let currentNode: Node<SourceNodeItem> = null;
  let hasSearch: boolean = false;
  let sourceElement: HTMLElement;
  let sourceToolBarElement: HTMLElement;
  let searchElement: HTMLElement;
  let detailElement: HTMLElement;
  let detailHeight = 0;

  const detailTransformContext: DetailTransformContext =
    getDetailTransformContext(
      () => {
        return getMaxDetailHeight();
      },
      () => {
        return detailElement;
      },
    );

  const databaseStateManager = getDatabaseStateManager();
  const uploadedFileStateManager = getUploadedFilesStateManager();
  setContext(DATABASE_SOURCE_PANEL_ACTION_CONTEXT, databasePanelActions);
  setContext(DATABASE_STATE_MANAGER_CONTEXT, databaseStateManager);
  setContext(UPLOADED_FILES_SOURCE_PANEL_ACTION_CONTEXT, uploadedFileActions);
  setContext(UPLOADED_FILES_STATE_MANAGER_CONTEXT, uploadedFileStateManager);
  setContext(DETAIL_TRANSFORM_CONTEXT, detailTransformContext);

  function updateRootNode() {
    if (databaseStateManager.getUIRoot()) {
      rootNode = databaseStateManager.getUIRoot();
      rootType = "database";
    } else if (uploadedFileStateManager.getUIRoot()) {
      rootNode = uploadedFileStateManager.getUIRoot();
      rootType = "uploaded-files";
    } else {
      rootNode = null;
      rootType = null;
    }
  }

  function updateHasSearch() {
    if (rootNode === null) {
      hasSearch =
        databaseStateManager.hasSearch() ||
        uploadedFileStateManager.hasSearch();
    } else {
      if (rootType === "database") {
        hasSearch = databaseStateManager.hasSearch();
      } else if (rootType === "uploaded-files") {
        hasSearch = uploadedFileStateManager.hasSearch();
      } else {
        hasSearch =
          databaseStateManager.hasSearch() ||
          uploadedFileStateManager.hasSearch();
      }
    }
  }

  function getMaxDetailHeight(): number {
    return (
      sourceElement.offsetHeight -
      sourceToolBarElement.offsetHeight -
      searchElement.offsetHeight -
      4 - // padding top of detail height
      8 // padding bottom of detail height
    );
  }

  function updateDetailHeight() {
    detailHeight = getMaxDetailHeight();
    if (detailHeight > DETAIL_DEFAUT_HEIGHT) {
      detailHeight = DETAIL_DEFAUT_HEIGHT;
    }
    if (detailElement) detailElement.style.height = `${detailHeight}px`;
  }

  function onDatabaseDataChanged(event: any) {
    if (event && event.type === "opennode") {
      uploadedFileActions.resetUINode(false);
      rootNode = databaseStateManager.getUIRoot();
      rootType = "database";
    } else if (
      event &&
      event.type === "deletenode" &&
      rootType === "database" &&
      currentNode
    ) {
      const node = databaseStateManager.getNodeById(currentNode.id);
      // Reset if current node is delete node
      if (!node) {
        currentNode = null;
      }
    } else if (event && event.type === "searchdata") {
      updateHasSearch();
    }
  }

  function onUploadedFilesDataChanged(event: any) {
    if (event && event.type === "opennode") {
      databasePanelActions.resetUINode(false);
      rootNode = uploadedFileStateManager.getUIRoot();
      rootType = "uploaded-files";
    } else if (
      event &&
      event.type === "deletenode" &&
      rootType === "uploaded-files" &&
      currentNode
    ) {
      const node = uploadedFileStateManager.getNodeById(currentNode.id);
      // Reset if current node is delete node
      if (!node) {
        currentNode = null;
      }
    } else if (event && event.type === "searchdata") {
      updateHasSearch();
    }
  }

  function handleShowDatabaseNodeDetail(event: any) {
    const nodeId = event.nodeId;
    if (!nodeId) {
      currentNode = null;
    } else {
      const node = databaseStateManager.getNodeById(nodeId);

      if (node) {
        const prevNode = currentNode;
        currentNode = node;
        rootType = "database";
        if (!prevNode) updateDetailHeight();
      }
    }
  }

  function handleWindowResize(node: any) {
    if (detailElement && node === sourceElement) {
      const maxDetailHeight = getMaxDetailHeight();
      if (
        detailElement.offsetHeight > maxDetailHeight &&
        maxDetailHeight > DETAIL_MIN_HEIGHT
      ) {
        detailHeight = maxDetailHeight;
        detailElement.style.height = `${detailHeight}px`;
      }
    }
  }

  function handleShowUploadedFilesNodeDetail(event: any) {
    const nodeId = event.nodeId;
    if (!nodeId) {
      currentNode = null;
    } else {
      const node = uploadedFileStateManager.getNodeById(nodeId);

      if (node) {
        const prevNode = currentNode;
        currentNode = node;
        rootType = "uploaded-files";
        if (!prevNode) updateDetailHeight();
      }
    }
  }

  onMount(() => {
    updateRootNode();
    updateHasSearch();
    databaseStateManager.addListener("datachange", onDatabaseDataChanged);
    uploadedFileStateManager.addListener(
      "datachange",
      onUploadedFilesDataChanged,
    );
    databaseStateManager.addListener(
      "shownodedetails",
      handleShowDatabaseNodeDetail,
    );
    uploadedFileStateManager.addListener(
      "shownodedetails",
      handleShowUploadedFilesNodeDetail,
    );
    return () => {
      databaseStateManager.removeListener("datachange", onDatabaseDataChanged);
      uploadedFileStateManager.removeListener(
        "datachange",
        onUploadedFilesDataChanged,
      );
      databaseStateManager.removeListener(
        "shownodedetails",
        handleShowDatabaseNodeDetail,
      );
      uploadedFileStateManager.removeListener(
        "shownodedetails",
        handleShowUploadedFilesNodeDetail,
      );
    };
  });

  export let pane;
</script>

<div
  class="flex flex-col h-full"
  bind:this={sourceElement}
  use:watchResize={handleWindowResize}
>
  <div class="m-0.5" bind:this={sourceToolBarElement}>
    <SourceToolbar {rootType} />
  </div>
  <div class="mx-2 mt-2 mb-0" bind:this={searchElement}>
    <SearchBar {rootNode} {rootType} />
  </div>
  {#if !$initialSourcePanel}
    <div class="flex justify-center mt-2"><CircularSpinner size={50} /></div>
  {:else if hasSearch}
    <SearchViewContainer {rootNode} {rootType} />
  {:else}
    <Content {rootNode} {rootType} />
  {/if}

  {#if currentNode}
    <div
      class="flex-grow-0 flex-shrink-0 w-full pt-1 pb-2 overflow-x-hidden"
      bind:this={detailElement}
      style="height: {detailHeight}px;"
    >
      <NodeDetail data={currentNode} {rootType} />
    </div>
  {/if}
</div>
