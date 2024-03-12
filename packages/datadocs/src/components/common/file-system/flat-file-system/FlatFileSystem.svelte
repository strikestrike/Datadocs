<script lang="ts">
  import { setContext, onMount } from "svelte";
  import FileSystemFolder from "./FileSystemFolder.svelte";
  import NewFolder from "./NewFolder.svelte";
  import type { FlatFileSystemActions } from "./flatFileSystemActions";
  import type {
    FileSystemCustomNode,
    FlatFileSystemManager,
    NewNodePlaceHolder,
  } from "./flatFileSystemManager";
  import {
    FILE_SYSTEM_ACTION_CONTEXT,
    FILE_SYSTEM_STATE_MANAGER_CONTEXT,
  } from "./constant";
  import type { DataNodeBase, Node } from "../fileSystemStateManager";
  import { watchResize } from "svelte-watch-resize";
  import { scrollVertical } from "../../../../utils/scroll";

  export let fileSystemActions: FlatFileSystemActions<DataNodeBase>;
  export let stateManager: FlatFileSystemManager<DataNodeBase>;
  export let FolderComponent = FileSystemFolder;
  export let NewFolderComponent = NewFolder;
  export let loadMoreNode: FileSystemCustomNode = null;

  setContext(FILE_SYSTEM_ACTION_CONTEXT, fileSystemActions);
  setContext(FILE_SYSTEM_STATE_MANAGER_CONTEXT, stateManager);

  let rootNode: Node<DataNodeBase>;
  let childNodes: Node<DataNodeBase>[];
  let newFolderPlaceholder: NewNodePlaceHolder;
  let fileSytemElement: HTMLElement;
  let topBoundary: number;
  let bottomBoundary: number;
  let autoScrollInterval: ReturnType<typeof setInterval>;

  function onFileSystemStateChange(data?: { type: string }) {
    rootNode = stateManager.getUIRoot();
    childNodes = rootNode
      ? stateManager.getChildNodesById(rootNode.id)
      : stateManager.getRootChildNodes();
    childNodes = childNodes ?? [];
    newFolderPlaceholder = stateManager.getNewFolderPlaceholder();

    if (data?.type === "dragend") {
      clearAutoScroll();
    }
  }

  function onFileSystemSizeChange() {
    const bound = fileSytemElement.getBoundingClientRect();
    topBoundary = bound.top;
    bottomBoundary = bound.bottom;
  }

  function handleDragMouseMove(event: MouseEvent) {
    if (!stateManager.isDragging()) {
      return;
    }
    const mouseY = event.clientY;
    const delta = 5;

    if (mouseY < topBoundary) {
      clearAutoScroll();
      autoScrollInterval = setInterval(() => {
        scrollVertical(fileSytemElement, delta, "top")
      }, 10);
    } else if (mouseY > bottomBoundary) {
      clearAutoScroll();
      autoScrollInterval = setInterval(() => {
        scrollVertical(fileSytemElement, delta, "bottom");
      }, 10);
    } else {
      clearAutoScroll();
    }
  }

  function clearAutoScroll() {
    if (autoScrollInterval) {
      clearInterval(autoScrollInterval);
      autoScrollInterval = null;
    }
  }

  onMount(() => {
    stateManager.addListener("datachange", onFileSystemStateChange);
    document.addEventListener("mousemove", handleDragMouseMove);
    return () => {
      stateManager.removeListener("datachange", onFileSystemStateChange);
      document.removeEventListener("mousemove", handleDragMouseMove);
    };
  });

  onFileSystemStateChange();
  $: loadMoreNode, onFileSystemStateChange();
</script>

<div
  bind:this={fileSytemElement}
  class="flat-file-system w-full h-full overflow-y-auto"
  use:watchResize={onFileSystemSizeChange}
>
  {#if rootNode}
    {#key rootNode.id}
      <svelte:component
        this={FolderComponent}
        node={rootNode}
        isParentPath={true}
      />
    {/key}
  {/if}

  {#if newFolderPlaceholder}
    <svelte:component
      this={NewFolderComponent}
      label={newFolderPlaceholder.name}
      type={newFolderPlaceholder.type}
      parentId={rootNode ? rootNode.id : null}
    />
  {/if}

  {#each childNodes as node (node.id)}
    {@const component = stateManager.getNodeComponent(node)}
    {#if component}
      <svelte:component this={component} {node} />
    {/if}
  {/each}

  {#if loadMoreNode}
    {@const component = stateManager.getNodeComponent(loadMoreNode)}
    {#if component}
      <svelte:component this={component} node={loadMoreNode} />
    {/if}
  {/if}
</div>
