<script lang="ts">
  import { getContext, onMount } from "svelte";
  import Icon from "../../../../../common/icons/Icon.svelte";
  import type { ColumnTreeNode, TreeViewContext, TreeNodeComponent } from "../type";
  import { TREE_VIEW_CONTEXT_NAME } from "../type";

  export let data: ColumnTreeNode;

  const treeViewContext: TreeViewContext = getContext(TREE_VIEW_CONTEXT_NAME);
  const expandArrowIcon = "tw-expand-arrow";
  let isOpen = false;
  let hasChildren = false;
  let isSelected: boolean = treeViewContext.isNodeSelected(data.id);
  let prefixIconWidth = "";
  let prefixIconHeight = "";

  function getPrefixSvgIcon(type: typeof data.type): string {
    switch (type) {
      case "Binary": {
        prefixIconWidth = "16px";
        prefixIconHeight = "15px";
        return "tw-column-binary";
      }
      case "Boolean": {
        prefixIconWidth = "15px";
        prefixIconHeight = "17px";
        return "tw-column-boolean";
      }
      case "Date": {
        prefixIconWidth = "13px";
        prefixIconHeight = "13px";
        return "tw-column-date";
      }
      case "DatetimeArr": {
        prefixIconWidth = "21px";
        prefixIconHeight = "13px";
        return "tw-column-datetime-arr";
      }
      case "Decimal": {
        prefixIconWidth = "17px";
        prefixIconHeight = "15px";
        return "tw-column-decimal";
      }
      case "Json": {
        prefixIconWidth = "13px";
        prefixIconHeight = "13px";
        return "tw-column-json";
      }
      case "Geography": {
        prefixIconWidth = "13px";
        prefixIconHeight = "13px";
        return "tw-column-location";
      }
      case "IntegerArr": {
        prefixIconWidth = "17px";
        prefixIconHeight = "15px";
        return "tw-column-number-arr";
      }
      case "Integer": {
        prefixIconWidth = "15px";
        prefixIconHeight = "15px";
        return "tw-column-number";
      }
      case "StringArr": {
        prefixIconWidth = "21px";
        prefixIconHeight = "15px";
        return "tw-column-string-arr";
      }
      case "String": {
        prefixIconWidth = "19px";
        prefixIconHeight = "15px";
        return "tw-column-string";
      }
      case "Time": {
        prefixIconWidth = "13px";
        prefixIconHeight = "13px";
        return "tw-column-time";
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
        <div class="flex-grow-0 flex-shrink-0 w-[21px] mr-1">
          <Icon icon={prefixIcon} width={prefixIconWidth} height={prefixIconHeight} fill="none" />
        </div>
      {/if}
      <div class="flex-grow flex-shrink overflow-hidden overflow-ellipsis pr-0.5 text-dark-200 whitespace-nowrap">
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
