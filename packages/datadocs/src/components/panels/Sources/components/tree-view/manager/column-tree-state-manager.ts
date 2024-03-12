import type { ColumnTreeNode } from "../type";
import type { Writable } from "svelte/store";
import TreeViewStateManager from "./tree-view-state-manager";

class ColumnTypeTreeStateManager extends TreeViewStateManager {
  readonly treeDataStore: Writable<ColumnTreeNode>;
  readonly nodeDataMap: Map<string, ColumnTreeNode>;

  constructor(data: ColumnTreeNode) {
    super(data);
    this.type = "COLUMN_TYPE";
  }
}

export default ColumnTypeTreeStateManager;
