import type { DatabaseNode } from "../type";
import type { Writable } from "svelte/store";
import TreeViewStateManager from "./tree-view-state-manager";

class DatabaseTreeStateManager extends TreeViewStateManager {
  readonly treeDataStore: Writable<DatabaseNode>;
  readonly nodeDataMap: Map<string, DatabaseNode>;

  constructor(data: DatabaseNode) {
    super(data);
    this.type = "DATABASE";
  }
}

export default DatabaseTreeStateManager;
