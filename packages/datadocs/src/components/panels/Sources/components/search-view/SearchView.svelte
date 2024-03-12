<script lang="ts">
  import { onMount, setContext } from "svelte";
  import type { SourceNodeItem } from "../../../../../app/store/panels/sources/type";
  import type {
    Node,
    SearchNodeData,
  } from "../../../../common/file-system/fileSystemStateManager";
  import type { SourcePanelAction } from "../../manager/action";
  import type { SourceStateManager } from "../../manager/sourceStateManager";
  import SearchNode from "./node/SearchNode.svelte";
  import {
    FILE_SYSTEM_ACTION_CONTEXT,
    FILE_SYSTEM_STATE_MANAGER_CONTEXT,
  } from "../../../../common/file-system/flat-file-system/constant";

  export let manager: SourceStateManager<SourceNodeItem>;

  export let actions: SourcePanelAction;

  export let onDoubleClick: () => void = null;

  setContext(FILE_SYSTEM_STATE_MANAGER_CONTEXT, manager);
  setContext(FILE_SYSTEM_ACTION_CONTEXT, actions);

  let searchNodes: SearchNodeData<Node<SourceNodeItem>>[] = [];

  function handleDataChange() {
    searchNodes = manager.getSearchNodes();
  }

  onMount(() => {
    handleDataChange();
    manager.addListener("datachange", handleDataChange);

    return () => {
      manager.removeListener("datachange", handleDataChange);
    };
  });
</script>

{#if searchNodes && searchNodes.length > 0}
  {#each searchNodes as searchNode}
    <SearchNode path={searchNode.path} node={searchNode.node} {onDoubleClick} />
  {/each}
{/if}
