<script lang="ts">
  import { getContext, onMount } from "svelte";
  import Icon from "../../../../../common/icons/Icon.svelte";
  import type { FileSystemNode, TreeViewContext, TreeNodeComponent } from "../type";
  import { TREE_VIEW_CONTEXT_NAME } from "../type";

  export let data: FileSystemNode;

  const treeViewContext: TreeViewContext = getContext(TREE_VIEW_CONTEXT_NAME);
  const expandArrowIcon = "tw-expand-arrow";
  let isOpen = false;
  let hasChildren = false;
  let isSelected: boolean = treeViewContext.isNodeSelected(data.id);

  function getPrefixSvgIcon(type: typeof data.type): string {
    switch (type) {
      case "fsexcel": {
        return "tw-fsexcel";
      }
      case "fscsv":
      case "fsjson": {
        return "tw-fscsv";
      }
      case "fssheet": {
        return "tw-fssheet";
      }
      default:
        return "";
    }
  }

  function handleTreeNodeClick() {
    treeViewContext.selectComponent(data.id);
  }

  const nodeComponent: TreeNodeComponent = {
    selectNode: () => {
      isSelected = true;
    },
    deselectNode: () => {
      isSelected = false;
    },
  };

  onMount(() => {
    treeViewContext.registerComponent(data.id, nodeComponent);
    return () => {
      treeViewContext.deregisterComponent(data.id);
    };
  });

  $: if (data) {
    isOpen = data.isOpen;
    hasChildren = data.children && data.children.length > 0;
  }
  $: prefixIcon = getPrefixSvgIcon(data.type);
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<li>
  <div
    class="tree-node-container"
    class:selected={isSelected}
    on:mousedown={handleTreeNodeClick}
  >
    <div class="tree-node-bg absolute left-0 w-full h-6" />
    <div class="relative flex flex-row items-center h-6 py-0.5 space-x-0.5">
      {#if hasChildren}
        <div
          class="flex-grow-0 flex-shrink-0 w-1.5 h-1.5 mr-0.5 cursor-pointer transform"
          class:-rotate-90={!isOpen}
          on:click={() => treeViewContext.toggleCollapse(data.id)}
        >
          <Icon icon={expandArrowIcon} size="6px" />
        </div>
      {/if}

      {#if prefixIcon}
        <div class="flex-grow-0 flex-shrink-0 w-4 h-4">
          <Icon icon={prefixIcon} size="16px" fill="none" />
        </div>
      {/if}

      <div
        class="flex-grow flex-shrink overflow-hidden overflow-ellipsis pr-0.5 text-dark-200 whitespace-nowrap"
      >
        {data.name}
      </div>
    </div>
  </div>

  {#if isOpen && hasChildren}
    <ul>
      {#each data.children as child (child.id)}
        <svelte:self data={child} />
      {/each}
    </ul>
  {/if}
</li>
