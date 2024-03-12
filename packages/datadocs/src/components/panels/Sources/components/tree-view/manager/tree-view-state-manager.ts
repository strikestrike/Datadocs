import type { Writable } from "svelte/store";
import { writable, get } from "svelte/store";
import type { TreeNodeComponent, TreeViewNode, TreeViewType } from "../type";
import type TreeGroupManager from "./tree-group-manager";

class TreeViewStateManager {
  // instanceCounter is used to create a unique identifier for tree view
  static instanceCounter = 1;

  readonly treeDataStore: Writable<TreeViewNode>;
  readonly nodeDataMap: Map<string, TreeViewNode>;
  readonly nodeComponentMap: Map<string, TreeNodeComponent>;
  /**
   * unique id of TreeViewStateManager
   */
  readonly id: string;
  /**
   * current selected tree node identifier
   */
  selectedTreeNode: string;
  /**
   * a group of tree that has this tree view, it's possible for a tree not belong to any group
   */
  treeGroupManager: TreeGroupManager = null;
  type: TreeViewType;

  constructor(data: TreeViewNode) {
    this.treeDataStore = writable(data);
    this.nodeDataMap = new Map();
    this.nodeComponentMap = new Map();
    this.createNodeDataMap(this.treeData);

    // generate unique id for tree view instance
    this.id = "tree_view__" + TreeViewStateManager.instanceCounter;
    TreeViewStateManager.instanceCounter++;
  }

  get treeData() {
    return get(this.treeDataStore);
  }

  get isSelected() {
    return !!this.selectedTreeNode;
  }

  createNodeDataMap(node: TreeViewNode, parentId?: string) {
    if (!node) return;
    this.nodeDataMap.set(node.id, node);
    if (parentId) node.parentId = parentId;

    const children = node.children;
    if (children && children.length > 0) {
      for (let i = 0; i < children.length; i++) {
        this.createNodeDataMap(children[i], node.id);
      }
    }
  }

  expandNode(id: string) {
    const node = this.getNodeById(id);
    if (node) node.isOpen = true;
  }

  collapseNode(id: string) {
    const node = this.getNodeById(id);
    if (node) node.isOpen = false;
  }

  toggleColapseNode(id: string) {
    const node = this.getNodeById(id);
    if (node) node.isOpen = !node.isOpen;
  }

  notifyTreeDataChange() {
    this.treeDataStore.update((data) => data);
  }

  registerComponent(id: string, value: TreeNodeComponent) {
    this.nodeComponentMap.set(id, value);
  }

  deregisterComponent(id: string) {
    if (!this.nodeComponentMap.has(id)) return;
    this.nodeComponentMap.delete(id);
    // if (this.selectedTreeNode === id) this.selectedTreeNode = null;
  }

  isNodeSelected(id: string) {
    return this.selectedTreeNode === id;
  }

  /**
   * @param id get tree node data by its id
   * @returns tree node data if it does exist, ortherwise null
   */
  getNodeById(id: string) {
    if (!this.nodeDataMap.has(id)) return null;
    return this.nodeDataMap.get(id);
  }

  /**
   * @param id id of a tree node
   * @returns an array of id, from the tree root to the tree node.
   */
  getPath(id: string): string[] {
    const path: string[] = [];
    let node: TreeViewNode;
    do {
      node = this.getNodeById(id);
      if (node) path.unshift(id);
      else break;
      id = node.parentId;
    } while (id);
    return path;
  }

  /**
   * Use to select a tree node in tree view, call selectNode callback to update style
   * @param id Tree node identifier
   */
  selectComponent(id: string) {
    this.deselectComponent(true);
    this.selectedTreeNode = id;
    if (id && this.nodeComponentMap.has(id)) {
      this.nodeComponentMap.get(id).selectNode();
    }
  }

  /**
   * Use to deselect a tree node in tree view, call deselectNode callback of tree node component to update style
   * @param deselectGroup Define if it should deselect all other tree view in tree group
   * @returns
   */
  deselectComponent(deselectGroup = false) {
    if (this.selectedTreeNode) {
      this.nodeComponentMap.get(this.selectedTreeNode).deselectNode();
      this.selectedTreeNode = "";
    }

    if (deselectGroup && this.treeGroupManager) {
      this.treeGroupManager.deselectAllComponents();
    }
  }

  setTreeGroupManager(manager: TreeGroupManager) {
    this.treeGroupManager = manager;
  }
}

export default TreeViewStateManager;
