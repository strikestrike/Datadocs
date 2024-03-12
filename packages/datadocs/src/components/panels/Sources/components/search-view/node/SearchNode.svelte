<script lang="ts">
  import { getContext } from "svelte";
  import type { SourceNodeItem } from "../../../../../../app/store/panels/sources/type";
  import type { Node } from "../../../../../common/file-system/fileSystemStateManager";
  import FileSystemNode from "../../../../../common/file-system/flat-file-system/FileSystemNode.svelte";
  import Icon from "../../../../../common/icons/Icon.svelte";
  import {
    FILE_SYSTEM_ACTION_CONTEXT,
    FILE_SYSTEM_STATE_MANAGER_CONTEXT,
  } from "../../../../../common/file-system/flat-file-system/constant";
  import type { SourcePanelAction } from "../../../manager/action";
  import type { SourceStateManager } from "../../../manager/sourceStateManager";

  export let path: string;
  export let node: Node<SourceNodeItem>;
  export let onDoubleClick: () => void = null;

  const stateManager: SourceStateManager<SourceNodeItem> = getContext(
    FILE_SYSTEM_STATE_MANAGER_CONTEXT,
  );
  const actions: SourcePanelAction = getContext(FILE_SYSTEM_ACTION_CONTEXT);

  function handleDoubleClick() {
    if (node.type === "folder") {
      actions.openNode(node.id);
      if (onDoubleClick) {
        onDoubleClick();
      }
    }
  }
</script>

<FileSystemNode
  nodeId={node.id}
  draggable={false}
  on:dblclick={handleDoubleClick}
>
  <div
    class="search-node flex flex-row items-center rounded py-1.5 px-2"
    class:selected={node.selected}
  >
    <div class="mr-1">
      <Icon icon={stateManager.getNodeIcon(node.id)} size="20px" fill="none" />
    </div>

    <div class="flex-grow flex-shrink w-0 flex flex-col">
      <div class="text-13px text-black overflow-hidden overflow-ellipsis">
        {node.name}
      </div>

      {#if path}
        <div class="text-11px text-dark-50 overflow-hidden overflow-ellipsis">
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
