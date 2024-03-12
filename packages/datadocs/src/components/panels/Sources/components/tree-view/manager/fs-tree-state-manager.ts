import type { FileSystemNode } from "../type";
import type { Writable } from "svelte/store";
import TreeViewStateManager from "./tree-view-state-manager";

class FileSystemTreeStateManager extends TreeViewStateManager {
  readonly treeDataStore: Writable<FileSystemNode>;
  readonly nodeDataMap: Map<string, FileSystemNode>;

  constructor(data: FileSystemNode) {
    super(data);
    this.type = "FILE_SYSTEM";
  }
}

export default FileSystemTreeStateManager;
