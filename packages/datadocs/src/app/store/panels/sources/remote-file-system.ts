import type { Writable } from "svelte/store";
import SourceBaseStore from "./base";
import type { RemoteFileSystemItem, SourceNodeItem } from "./type";

class RemoteFileSystemStore extends SourceBaseStore {
  readonly treeStore: Writable<RemoteFileSystemItem[]>;

  constructor(data: RemoteFileSystemItem[]) {
    super(data);
  }

  async handleRenameNode(nodeId: string, name: string): Promise<boolean> {
    return this.renameNode(nodeId, name);
  }

  async handleDeleteNode(nodeId: string): Promise<boolean> {
    return this.deleteNode(nodeId);
  }

  async handleAddNode(
    parentId: string,
    name: string,
    storageFileName: string,
    type: string
  ): Promise<SourceNodeItem> {
    const nodeData: SourceNodeItem = {
      id: this.getNewNodeId(),
      name,
      type,
      parent: parentId ?? null,
    };
    if (await this.addNode(parentId, nodeData)) {
      return nodeData;
    }
    return null;
  }

  handleMoveNode(targetId: string, sourceIds: string[]): Promise<boolean> {
    throw new Error("Method not implemented.");
  }

  async handleSearchNodes(
    searchValue: string,
    rootId: string
  ): Promise<string[]> {
    return [];
  }

  async handleRefreshNode(nodeId: string): Promise<SourceNodeItem[]> {
    return [];
  }
}

export default RemoteFileSystemStore;
