<script lang="ts">
  import type { Node } from "../../../../common/file-system/fileSystemStateManager";
  import type { DatadocsObjectNode } from "../type";
  import Icon from "../../../../common/icons/Icon.svelte";
  import FileSystemNode from "../../../../common/file-system/flat-file-system/FileSystemNode.svelte";
  import type { DatadocsFileSystemAction } from "../file-system/action";
  import type { DatadocsFileSystemManager } from "../file-system/datadocsFileSystemManager";
  import {
    FILE_SYSTEM_ACTION_CONTEXT,
    FILE_SYSTEM_STATE_MANAGER_CONTEXT,
  } from "../../../../common/file-system/flat-file-system/constant";
  import { getContext } from "svelte";
  import { createSingleRunAsync } from "../../../../../utils/helpers";
  import { openWorkbook } from "../utils";

  export let path: string;
  export let node: Node<DatadocsObjectNode>;

  const action: DatadocsFileSystemAction = getContext(
    FILE_SYSTEM_ACTION_CONTEXT,
  );
  const manager: DatadocsFileSystemManager = getContext(
    FILE_SYSTEM_STATE_MANAGER_CONTEXT,
  );

  function handleSearchNodeClick() {
    action.selectSearchNode(node.id);
    action.showNodeDetails(node.id);
  }

  const handleSearchNodeDblClick = createSingleRunAsync(async () => {
    if (isWorkbook) {
      await openWorkbook(node.dataNode.id, true);
    }
  });

  $: isWorkbook = node.dataNode.type === "wb";
</script>

<FileSystemNode
  nodeId={node.id}
  draggable={false}
  on:click={handleSearchNodeClick}
  on:dblclick={handleSearchNodeDblClick}
>
  <div
    class="search-node flex flex-row items-center rounded py-1.5 px-2"
    class:selected={manager.checkSearchNodeSelected(node.id)}
  >
    <div class="mr-1">
      <Icon icon={isWorkbook ? "panel-file" : "panel-folder"} size="20px" />
    </div>

    <div class="flex-grow flex-shrink w-0 flex flex-col">
      <div
        class="text-13px text-black overflow-hidden overflow-ellipsis whitespace-nowrap"
      >
        {node.name}
      </div>

      {#if path}
        <div
          class="text-11px text-dark-50 overflow-hidden overflow-ellipsis whitespace-nowrap"
        >
          {path}
        </div>
      {/if}
    </div>
  </div>
</FileSystemNode>

<style lang="postcss">
  .search-node.selected,
  .search-node:hover {
    @apply bg-primary-indigo-blue bg-opacity-10;
  }
</style>
