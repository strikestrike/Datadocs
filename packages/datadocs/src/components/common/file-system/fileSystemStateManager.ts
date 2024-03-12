import { FileSystemEventHandler } from "./eventsHandler";

export type DataNodeBase = {
  id: string;
  type: string;
  parent: string;
  name: string;
};

export type Node<T extends DataNodeBase> = {
  id: string;
  type: string;
  name: string;
  parent: string;
  children: string[];
  dataNode: T;
  selected?: boolean;
  expanded?: boolean;
};

export type SearchNodeData<T> = {
  path: string;
  node: T;
};

export type FileSystemSearchStatus = "done" | "loading";

export class FileSystemStateManager<
  DataNode extends DataNodeBase
> extends FileSystemEventHandler {
  protected nodeMap: Map<string, Node<DataNode>>;
  protected dataNodeMap: Map<string, DataNode>;
  protected selectedNodes: string[] = [];
  /**
   * Contain search result data, include the UI node and its path.
   */
  protected searchNodes: SearchNodeData<Node<DataNode>>[];
  /**
   * Id of current selected search node
   */
  protected selectedSearchNodeIds: string[] = [];
  /**
   * Search config data, which is used to operate the search
   */
  protected searchConfig: {
    /**
     * The current value to search
     */
    searchText: string;
    sort: string;
    /**
     * Id of folder where the search is triggered
     */
    rootId: string;
    /**
     * The status of the search operation
     */
    status: FileSystemSearchStatus;
  };

  constructor(nodes: Array<DataNode>) {
    super();
    this.init(nodes);
  }

  setDataNodeMap = (dataNodeMap: Map<string, DataNode>) => {
    this.dataNodeMap = dataNodeMap;
  };

  setNodeMap = (nodeMap: Map<string, Node<DataNode>>) => {
    this.nodeMap = nodeMap;
    this.dispatchEvent("datachange", { type: "newdata" });
  };

  init = (nodes: Array<DataNode>) => {
    const dataNodeMap: typeof this.dataNodeMap = new Map();
    const nodeMap: typeof this.nodeMap = new Map();
    // Add nodes data into map
    for (const node of nodes) {
      const nodeId = this.generateNodeId(node);
      if (dataNodeMap.has(nodeId)) {
        console.error("Two file  nodes cannot have the same ID");
      }
      dataNodeMap.set(nodeId, node);
    }

    // Generate file  node from a node data and add to map
    const addNode = (dataNode: DataNode) => {
      const nodeId = this.generateNodeId(dataNode);
      if (!nodeMap.has(nodeId)) {
        nodeMap.set(nodeId, this.createUINode(dataNode));
      }

      // Add it to the parrent children list
      if (dataNode.parent && dataNodeMap.has(dataNode.parent)) {
        const parentNode = dataNodeMap.get(dataNode.parent);
        const parentId = this.generateNodeId(parentNode);

        if (!nodeMap.has(parentId)) {
          nodeMap.set(parentId, this.createUINode(parentNode));
        }

        nodeMap.get(nodeId).parent = parentId;
        nodeMap.get(parentId).children.push(nodeId);
      }
    };
    for (const node of nodes) {
      addNode(node);
    }

    this.setDataNodeMap(dataNodeMap);
    this.setNodeMap(nodeMap);
  };

  createUINode = (node: DataNode): Node<DataNode> => {
    return {
      id: this.generateNodeId(node),
      type: node.type,
      name: node.name,
      parent: null,
      children: [],
      dataNode: node,
      selected: false,
    };
  };

  /**
   * Get the unique Id from a node data and will only be used in the UI stuffs.
   * Sometimes, the Id inside {@link DataNode} may not be unique. Overriding
   * this function to generate a unique one.
   * @param node
   * @returns
   */
  generateNodeId = (node: DataNode) => {
    return node.id;
  };

  getNodeById = (id: string) => {
    return id && this.nodeMap.has(id) ? this.nodeMap.get(id) : null;
  };

  /**
   * Select a node in the file system. If {@link deselectAll} is true, all other
   * selected nodes should be deselected.
   * @param id
   * @param deselectAll
   * @param dispatch
   * @returns
   */
  selectNode = (id: string, deselectAll: boolean, dispatch = true) => {
    const node = this.getNodeById(id);
    if (id === null || node) {
      // Deselect all other nodes
      if (deselectAll) {
        this.deselectAll(false);
      }

      if (node) node.selected = true;
      if (this.selectedNodes.indexOf(id) === -1) {
        this.selectedNodes.push(id);
      }
    }

    if (dispatch) {
      this.dispatchEvent("datachange", { type: "selection" });
    }
  };

  /**
   * Deselect a node
   * @param id
   * @param dispatch
   */
  deselectNode = (id: string, dispatch = true) => {
    const node = this.getNodeById(id);
    if (node) {
      node.selected = false;
      const idx = this.selectedNodes.indexOf(node.id);
      if (idx !== -1) {
        this.selectedNodes.splice(idx, 1);
      }
    }

    if (dispatch) {
      this.dispatchEvent("datachange", { type: "selection" });
    }
  };

  /**
   * Deselect all nodes inside the file system
   * @param dispatch whether dispatch datachange event or not
   */
  deselectAll = (dispatch = true) => {
    for (const node of this.nodeMap.values()) {
      if (node.selected) {
        node.selected = false;
      }
    }
    this.selectedNodes = [];

    if (dispatch) {
      this.dispatchEvent("datachange", { type: "selection" });
    }
  };

  /**
   * Check if a node is selected or not
   * @param id
   * @returns
   */
  checkNodeSelected = (id: string) => {
    return this.selectedNodes.includes(id);
  };

  protected updateSelectedNodes = () => {
    const ids: string[] = [];
    for (const [nodeId, node] of this.nodeMap) {
      if (node.selected) {
        ids.push(nodeId);
      }
    }

    this.selectedNodes = ids;
  };

  getSelectedNodes = () => {
    return this.selectedNodes ? [...this.selectedNodes] : [];
  };

  getChildNodes = (node: Node<DataNode>) => {
    if (node.children?.length > 0) {
      const childNodes: Array<Node<DataNode>> = [];

      for (const nodeId of node.children) {
        if (this.nodeMap.has(nodeId)) {
          childNodes.push(this.nodeMap.get(nodeId));
        }
      }

      return this.sort(childNodes);
    }

    return null;
  };

  /**
   * Get children of a node by using Id. If there is no Id provided, get
   * root node children.
   * @param parentId
   * @returns
   */
  getChildNodesById = (parentId: string = null) => {
    const parent = this.getNodeById(parentId);
    if (parent) {
      return this.getChildNodes(parent);
    }

    // Top-level/root nodes doesn't have parent node
    const childNodes: Array<Node<DataNode>> = [];
    for (const node of this.nodeMap.values()) {
      if (node.parent == parentId) {
        childNodes.push(node);
      }
    }

    return this.sort(childNodes);
  };

  /**
   * By default, the sort will be on [type, name]. Override this function to
   * have child nodes in expected order.
   * @param childNodes
   */
  sort = (childNodes: Array<Node<DataNode>>) => {
    return childNodes.sort((a, b) => {
      if (a.type > b.type) {
        return 1;
      } else if (a.type < b.type) {
        return -1;
      } else {
        return a.name > b.name ? 1 : -1;
      }
    });
  };

  getRootChildNodes = () => {
    return this.getChildNodesById(null);
  };

  renameNode = (nodeId: string, name: string, dispatch = true) => {
    const node = this.getNodeById(nodeId);
    if (!node) return;

    node.name = name;
    node.dataNode.name = name;

    if (dispatch) {
      // Notify that file system data has change
      this.dispatchEvent("datachange", { type: "renamenode", value: name });
    }
  };

  deleteChildNodes = (nodeId: string) => {
    const node = this.getNodeById(nodeId);
    if (node.children?.length > 0) {
      const childNodeIds = [];
      node.children.forEach((childId) => {
        this.deleteChildNodes(childId);
        this.nodeMap.delete(childId);
        this.dataNodeMap.delete(childId);
        childNodeIds.push(childId);
      }, this);
      node.children = node.children.filter((id) => !childNodeIds.includes(id));
    }
  };

  deleteNode = (nodeId: string, dispatch = true) => {
    const node = this.getNodeById(nodeId);
    if (!node) return;

    // Remove from parent node
    const parentNode = this.getNodeById(node.parent);
    if (parentNode) {
      parentNode.children = parentNode.children.filter((id) => id !== nodeId);
    }

    // remove child nodes
    this.deleteChildNodes(nodeId);

    // remove itself
    this.nodeMap.delete(nodeId);
    this.dataNodeMap.delete(nodeId);

    if (dispatch) {
      // Notify that file system data has change
      this.dispatchEvent("datachange", { type: "deletenode" });
    }
  };

  /**
   * Add new node. In case parent node is not found, it means the new node is
   * at the root.
   * @param data
   * @param parentId
   * @returns
   */
  addNode = (data: DataNode, parentId: string, dispatch = true) => {
    const dataNode = { ...data };
    const nodeId = this.generateNodeId(dataNode);
    if (this.nodeMap.has(nodeId)) {
      console.error("File system nodeId has existed.");
      return;
    } else {
      this.dataNodeMap.set(nodeId, dataNode);
      this.nodeMap.set(nodeId, this.createUINode(dataNode));
    }

    // Create parent/child relationship for new node
    const parentNode = this.getNodeById(parentId);
    if (parentNode) {
      parentNode.children.push(nodeId);
      this.nodeMap.get(nodeId).parent = parentId;
    }

    if (dispatch) {
      this.dispatchEvent("datachange", { type: "addnode" });
    }
  };

  /**
   * Check if a node with {@link childId} is child of node with {@link parentId}
   * @param childId
   * @param parentId
   * @returns
   */
  isChild = (childId: string, parentId: string) => {
    // Parent is root node
    if (parentId === null) {
      return !!this.getNodeById(childId);
    }

    let currentId = childId;
    while (currentId) {
      currentId = this.getNodeById(currentId)?.parent;
      if (currentId === parentId) {
        return true;
      }
    }

    return false;
  };

  /**
   * Move node with {@link sourceId} to its new parent {@link targetId}
   * @param targetId
   * @param sourceId
   * @param dispatch
   * @returns
   */
  private move = (targetId: string, sourceId: string, dispatch = true) => {
    const parent = this.getNodeById(targetId);
    const sourceNode = this.getNodeById(sourceId);

    // Do nothing if there is no source node
    if (!sourceNode) {
      return;
    }

    // Remove node out of its old parent
    const oldParent = this.getNodeById(sourceNode.parent);
    if (oldParent) {
      const idx = oldParent.children.indexOf(sourceNode.id);
      if (idx !== -1) {
        oldParent.children.splice(idx, 1);
      }
    }

    sourceNode.parent = parent ? parent.id : null;
    parent?.children?.push(sourceNode.id);

    if (dispatch) {
      this.dispatchEvent("datachange", { type: "move" });
    }
  };

  /**
   * Move list of file system nodes to new parent folder
   * @param targetId
   * @param sourceIds
   * @param dispatch
   */
  moveFileSystemNodes = (
    targetId: string,
    sourceIds: string[],
    dispatch = true
  ) => {
    if (!sourceIds.every((id) => !this.isChild(targetId, id), this)) {
      return;
    }

    for (const sourceId of sourceIds) {
      this.move(targetId, sourceId, false);
    }

    if (dispatch) {
      this.dispatchEvent("datachange", { type: "move" });
    }
  };

  /**
   * Select a search node, support only one selected node for now
   * @param id
   * @param dispatch
   */
  selectSearchNode = (id: string, dispatch = true) => {
    if (this.searchNodes.every((sn) => sn.node.id !== id)) {
      // There is no node with id exist
      return;
    }

    this.selectedSearchNodeIds = [id];
    if (dispatch) {
      this.dispatchEvent("datachange", { type: "selection" });
    }
  };

  deselectAllSearchNodes = (dispatch = true) => {
    this.selectedSearchNodeIds = [];
    if (dispatch) {
      this.dispatchEvent("datachange", { type: "selection" });
    }
  };

  /**
   * Check if two search have the same config.
   * @param value
   * @param sort
   * @param rootId
   * @returns
   */
  isSameSearch = (value: string, sort: string, rootId: string) => {
    return (
      (!this.hasSearch() && !value) ||
      (this.searchConfig?.searchText === value &&
        this.searchConfig?.sort === sort &&
        this.searchConfig?.rootId === rootId)
    );
  };

  hasSearch = () => {
    return !!this.searchConfig?.searchText;
  };

  isSearchInProgress = () => {
    return this.hasSearch() && this.searchConfig?.status === "loading";
  };

  checkSearchNodeSelected = (id: string) => {
    return this.selectedSearchNodeIds.includes(id);
  };

  getSearchNodeById = (id: string) => {
    return this.searchNodes.find((n) => n.node.id === id) ?? null;
  };
}
