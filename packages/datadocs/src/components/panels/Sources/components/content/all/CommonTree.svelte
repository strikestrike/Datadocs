<script lang="ts">
  import { setContext, createEventDispatcher } from "svelte";
  import type {
    TreeNodeComponent,
    TreeViewStateManager,
    TreeViewContext} from "../../tree-view";
import {
  TreeView,
  TREE_VIEW_CONTEXT_NAME
} from "../../tree-view";

  export let treeStateManager: TreeViewStateManager;

  const dispatch = createEventDispatcher();
  const treeDataStore = treeStateManager.treeDataStore;
  const treeViewContext: TreeViewContext = {
    toggleCollapse: (id: string) => {
      treeStateManager.toggleColapseNode(id);
      treeStateManager.notifyTreeDataChange();
    },
    selectComponent: (id: string) => {
      treeStateManager.selectComponent(id);
      dispatch("treeNodeSelected");
    },
    registerComponent: (id: string, value: TreeNodeComponent) => {
      treeStateManager.registerComponent(id, value);
    },
    deregisterComponent: (id: string) => {
      treeStateManager.deregisterComponent(id);
    },
    isNodeSelected: (id: string): boolean => {
      return treeStateManager.isNodeSelected(id);
    },
  };

  $: treeData = $treeDataStore;

  setContext(TREE_VIEW_CONTEXT_NAME, treeViewContext);
</script>

<TreeView data={treeData} />