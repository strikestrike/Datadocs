import { get, writable, type Writable } from "svelte/store";
import type { SourceNodeItem } from "./type";

abstract class SourceBaseStore {
  readonly treeStore: Writable<SourceNodeItem[]>;

  constructor(data: SourceNodeItem[]) {
    this.treeStore = writable(data);
  }

  getNewNodeId() {
    return `newNode__${crypto.randomUUID()}`;
  }

  /**
   * Insert new list to store
   * @param items
   */
  insertNodeItemToArray(items: SourceNodeItem[]) {
    this.treeStore.update((data) => [...data, ...items]);
  }

  /**
   * Get tree array of store
   */
  get treeArray() {
    return get(this.treeStore);
  }

  set treeArray(items: SourceNodeItem[]) {
    this.treeStore.set(items);
  }

  /**
   * Clone tree array
   * @returns
   */
  cloneTreeArray() {
    return [...this.treeArray];
  }

  /**
   * Get node item id by parent id and name
   * @param name
   * @param parentId
   * @returns
   */
  getNodeIdByParentIdAndName(name: string, parentId: string): string {
    for (const item of this.treeArray) {
      if (item.name === name && item.parent === parentId) {
        return item.id;
      }
    }
    return undefined;
  }

  /**
   * Get Node Item by node Id
   * @param id
   * @returns
   */
  getNodeById(id: string): SourceNodeItem {
    for (const item of this.treeArray) {
      if (item.id === id) {
        return item;
      }
    }
    return undefined;
  }

  /**
   * Get Path from root to node by id
   * @param id
   * @returns
   */
  getNodePath(nodeId: string): string[] {
    const path: string[] = [];
    if (!nodeId || !this.getNodeById(nodeId)) {
      return path;
    }

    let currentId = nodeId;
    while (currentId) {
      const node = this.getNodeById(currentId);
      path.unshift(node.name);
      currentId = node.parent;
    }
    return path;
  }

  /**
   * Get all child Node Item by node Id
   * @param id
   * @param nested
   * @returns
   */
  getChildNodesById(id: string, nested: boolean = false): SourceNodeItem[] {
    const items = [];
    for (const item of this.treeArray) {
      if (item.parent === id) {
        items.push(item);
        if (nested) {
          const childItems = this.getChildNodesById(item.id);
          items.push(...childItems);
        }
      }
    }
    return items;
  }

  /**
   * Get Node Id by paths of node names
   * @param paths
   * @returns
   */
  getNodeIdByPaths(paths: string[]) {
    let id: string = undefined;
    for (const name of paths) {
      id = this.getNodeIdByParentIdAndName(name, id);
    }
    return id;
  }

  /**
   * Get Source Node array from parent
   * @param parentId
   * @param nested
   * @returns
   */
  getSourceNodeTree(parentId: string, nested: boolean) {
    let nodes = [];
    let parentIds: string[] = [];
    for (const item of this.treeArray) {
      if (item.parent === parentId) {
        nodes.push(item);
        parentIds.push(item.id);
      }
    }

    if (nested) {
      for (const pId of parentIds) {
        const children = this.getSourceNodeTree(pId, nested);
        nodes = [...nodes, ...children];
      }
    }

    return nodes;
  }

  /**
   * Update Node name by Id and name
   * @param nodeId
   * @param name
   */
  async renameNode(nodeId: string, name: string): Promise<boolean> {
    const node = this.getNodeById(nodeId);
    if (node && node.name !== name) {
      node.name = name;
    }
    return true;
  }

  /**
   * Abstract function to handle action Rename node
   * @param nodeId
   * @param name
   */
  abstract handleRenameNode(nodeId: string, name: string): Promise<boolean>;

  /**
   * Abstract funtion to handle action delete node
   * @param nodeId
   */
  abstract handleDeleteNode(nodeId: string): Promise<boolean>;

  abstract handleRefreshNode(nodeId: string): Promise<SourceNodeItem[]>;

  /**
   * Add new node to Source Store
   * @param parentId
   * @param nodeData
   * @returns
   */
  async addNode(parentId: string, nodeData: SourceNodeItem): Promise<boolean> {
    if (parentId) {
      const parent = this.getNodeById(parentId);
      if (!parent) {
        // throw error because parent node isn't exist
        return false;
      }
      nodeData.parent = parent.id;
    }

    this.insertNodeItemToArray([nodeData]);
    return true;
  }

  abstract handleAddNode(
    parentId: string,
    name: string,
    storageFileName: string,
    type: string
  ): Promise<SourceNodeItem>;

  abstract handleMoveNode(
    targetId: string,
    sourceIds: string[]
  ): Promise<boolean>;

  abstract handleSearchNodes(
    searchValue: string,
    rootId: string
  ): Promise<string[]>;

  async deleteChildNodes(id: string) {
    let parents = [];
    this.treeArray.forEach((child) => {
      if (child.parent === id) {
        parents.push(child);
      }
    });
    for (const parent of parents) {
      this.deleteChildNodes(parent.id);
      const idx = this.treeArray.indexOf(parent);
      if (idx !== -1) {
        delete this.treeArray[idx];
      }
    }
    this.treeArray = this.treeArray.filter((n) => n !== null);
  }

  async deleteNode(id: string): Promise<boolean> {
    const node = this.getNodeById(id);
    if (!node) return false;

    // remove child nodes
    this.deleteChildNodes(id);

    const idx = this.treeArray.indexOf(node);
    if (idx !== -1) {
      delete this.treeArray[idx];
    }
    this.treeArray = this.treeArray.filter((n) => n !== null);
    return true;
  }
}

export default SourceBaseStore;
