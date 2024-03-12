import type { ComponentType } from "svelte";
import { estimateElementSize } from "../../../../utils/estimateElementSize";
import {
  getCloneProxyElement,
  getProxyIconWithBadge,
} from "../drag-move/dragProxy";
import type { MousePosition } from "../drag-move/type";
import {
  type DataNodeBase,
  type Node,
  FileSystemStateManager,
} from "../fileSystemStateManager";
import type { SearchNodeData } from "../fileSystemStateManager";

export type NewNodePlaceHolder = {
  parent: string;
  name: string;
  type: string;
};

export type FileSystemCustomNode = {
  type: "custom";
  name: string;
};

export class FlatFileSystemManager<
  DataNode extends DataNodeBase
> extends FileSystemStateManager<DataNode> {
  /**
   * It is used to track the folder where the UI of Datadocs Panel file system
   * start from
   */
  private rootId: string = null;
  /**
   * The UI data of the temporary folder when adding a folder
   */
  private newFolderPlaceholder: NewNodePlaceHolder = null;
  /**
   * The selected node that has user focus. It is used for multiple entries
   * selection.
   */
  private _focusNodeId: string = null;
  /**
   * List of node is currently be dragging
   */
  private _dragSource: string[];
  /**
   * Drag target. Its value should be an object to know if the drag target is
   * root node or doesn't exist.
   */
  private _dragTarget: { id: string };
  /**
   * If false, the file system is not draggable (drag to move nodes)
   */
  private _draggable: boolean;

  constructor(data: Array<DataNode>, draggable = true) {
    super(data);
    this._draggable = draggable;
  }

  get dragSource() {
    return this._dragSource;
  }

  get dragTarget() {
    return this._dragTarget;
  }

  setUIRoot = (
    newRoot: ReturnType<typeof this.getUIRoot> | string,
    dispatch = true
  ) => {
    if (typeof newRoot === "string") {
      newRoot = this.getNodeById(newRoot);
    }
    this.rootId = newRoot ? newRoot.id : null;

    if (dispatch) {
      // Notify UI root node has been changed
      this.dispatchEvent("datachange", { type: "opennode" });
      this.dispatchEvent("rootchange", {});
    }
  };

  getUIRoot = (): Node<DataNode> => {
    return this.getNodeById(this.rootId) ?? null;
  };

  getUIRootId = () => {
    const node = this.getUIRoot();
    return node ? node.id : null;
  };

  addNewNodePlaceholder = (data: NewNodePlaceHolder, dispatch = true) => {
    this.newFolderPlaceholder = data;

    if (dispatch) {
      this.dispatchEvent("datachange", { type: "newnodeplaceholder" });
    }
  };

  removeNewNodePlaceholder = (dispatch = true) => {
    this.newFolderPlaceholder = null;

    if (dispatch) {
      this.dispatchEvent("datachange", { type: "removenewfolder" });
    }
  };

  getNewFolderPlaceholder = () => {
    return this.newFolderPlaceholder;
  };

  setFocusNode = (id: string) => {
    this._focusNodeId = id;
  };

  getFocusNode = () => this._focusNodeId;

  /**
   * Get visible file system nodes, which is currently show on the UI.
   */
  getVisibleNodeIds = () => {
    if (!this.hasSearch()) {
      // Get all node ids at the current UI root
      const nodeIds = this.getChildNodesById(this.rootId).map(
        (node) => node.id
      );
      if (this.rootId) {
        nodeIds.unshift(this.getNodeById(this.rootId).parent);
      }
      return nodeIds;
    } else {
      return this.getSearchNodeIds();
    }
  };

  /**
   * Select all nodes in between {@link focusNodeId} and {@link toId} nodes. It is
   * used in multiple entries selection with `SHIFT` key.
   * @param toId
   * @param dispatch
   */
  selectTo = (toId: string, dispatch = true) => {
    let selectedNodes: string[] = null;
    const nodeIds = this.getVisibleNodeIds();
    const fromIndex = nodeIds.indexOf(this._focusNodeId);
    const toIndex = nodeIds.indexOf(toId);
    if (fromIndex === -1) {
      if (toIndex !== -1) {
        selectedNodes = [toId];
      }
    } else {
      if (toIndex !== -1) {
        const min = Math.min(fromIndex, toIndex);
        const max = Math.max(fromIndex, toIndex);
        selectedNodes = nodeIds.slice(min, max + 1);
      }
    }

    if (fromIndex >= 0 && toIndex >= 0) {
      this.clearSelectionInRange(
        Math.min(fromIndex, toIndex),
        Math.max(fromIndex, toIndex),
        nodeIds
      );
    }

    for (const id of selectedNodes) {
      this.selectNode(id, false, false);
    }

    if (dispatch) {
      this.dispatchEvent("datachange", { type: "selection" });
    }
  };

  /**
   * Clear all range selection that inside or intersect with the provided
   * range [{@link start}, {@link end}].
   * @param start
   * @param end
   * @param childNodeIds
   */
  clearSelectionInRange = (
    start: number,
    end: number,
    childNodeIds: string[]
  ) => {
    // Remove above selections if they are connected to `start` node
    if (this.checkNodeSelected(childNodeIds[start])) {
      for (let i = start; i >= 0; i--) {
        const nodeId = childNodeIds[i];
        if (this.checkNodeSelected(nodeId)) {
          this.deselectNode(nodeId, false);
        } else {
          break;
        }
      }
    }

    // Remove bellow selections if they are connected to `end` node
    if (this.checkNodeSelected(childNodeIds[end])) {
      for (let i = end; i < childNodeIds.length; i++) {
        const nodeId = childNodeIds[i];
        if (this.checkNodeSelected(nodeId)) {
          this.deselectNode(nodeId, false);
        } else {
          break;
        }
      }
    }

    // Remove selection between `from` and `to` node
    for (let i = start; i < end; i++) {
      const nodeId = childNodeIds[i];
      if (this.checkNodeSelected(nodeId)) {
        this.deselectNode(nodeId, false);
      }
    }
  };

  isMultipleSelection = () => {
    return this.getSelectionCount() > 1;
  };

  getSelectionCount = () => {
    return this.selectedNodes?.length ?? 0;
  };

  /**
   * Start dragging. Return `true` if it is allowed to drag.
   * @param id
   */
  startDrag = (id: string): boolean => {
    if (!this._draggable || this.isDragging()) {
      return false;
    }

    if (this.checkNodeSelected(id)) {
      this._dragSource = [...(this.selectedNodes ?? [])];
    } else {
      this._dragSource = [id];
    }

    return true;
  };

  stopDrag = (dispatch = true) => {
    this._dragSource = null;
    this.removeDragTarget();
    if (dispatch) {
      this.dispatchEvent("datachange", { type: "dragend" });
    }
  };

  isDragging = () => {
    return this._dragSource?.length > 0;
  };

  isNodeDragging = (nodeId: string) => {
    return this._dragSource.includes(nodeId);
  };

  setDragTarget = (id: string) => {
    if (!this.isDragging() && this._dragSource?.includes(id)) {
      this.removeDragTarget();
    } else {
      this._dragTarget = { id };
    }
  };

  removeDragTarget = () => {
    this._dragTarget = null;
  };

  /**
   * Get drag proxy, which will move according to the mouse position.
   * @param nodeId
   * @param element
   * @param mousePosition
   * @returns
   */
  getDragProxyElement = (
    nodeId: string,
    element: HTMLElement,
    mousePosition: MousePosition
  ): { proxy: HTMLElement; deltaX: number; deltaY: number } => {
    const selectionCount = this.getSelectionCount();
    if (this.checkNodeSelected(nodeId) && selectionCount > 1) {
      // Create multiple selections proxy element
      const proxy = getProxyIconWithBadge(selectionCount);
      const { width, height } = estimateElementSize(proxy);
      return { proxy, deltaX: width / 2, deltaY: height / 2 };
    } else {
      // Create single workbook/folder selection
      const boundingRect = element.getBoundingClientRect();
      return {
        proxy: getCloneProxyElement(element),
        deltaX: mousePosition.x - boundingRect.x,
        deltaY: mousePosition.y - boundingRect.y,
      };
    }
  };

  /**
   * Add a search config to file system and notify there will be a new
   * search applied to the file system.
   * @param value
   * @param rootId
   * @returns
   */
  search = (value: string, sort: string, rootId = null) => {
    if (this.isSameSearch(value, sort, rootId) && this.isSearchInProgress()) {
      return;
    }

    // When apply new search, the file system selection state
    // should also be cleared
    this.deselectAll(false);

    this.searchConfig = {
      searchText: value,
      sort: sort,
      rootId: rootId,
      status: "loading",
    };

    if (!value) {
      this.searchNodes = [];
    }
    this.dispatchEvent("datachange", { type: "search" });
  };

  setSearchResult = (nodes: SearchNodeData<Node<DataNode>>[]) => {
    this.searchNodes = nodes;
    // Mark the search as finished
    this.searchConfig.status = "done";
    this.dispatchEvent("datachange", { type: "searchdata" });
  };

  getSearchNodeIds = () => {
    return this.searchNodes ? this.searchNodes.map((s) => s.node.id) : [];
  };

  getSearchNodes = () => {
    return this.searchNodes;
  };

  getSearchConfig = () => {
    return this.searchConfig;
  };

  /**
   * Determine which component to be used for rendering node.
   *
   * NOTE: Override this method to provide Svelte component for each
   * specific node or the file system UI not showing.
   * @param node
   * @returns
   */
  getNodeComponent = (
    node: Node<DataNode> | FileSystemCustomNode
  ): ComponentType => {
    return null;
  };
}
