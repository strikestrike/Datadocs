import type { DataNodeBase } from "../fileSystemStateManager";
import type {
  FlatFileSystemManager,
  NewNodePlaceHolder,
} from "./flatFileSystemManager";

export abstract class FlatFileSystemActions<DataNode extends DataNodeBase> {
  constructor(readonly stateManager: FlatFileSystemManager<DataNode>) {}

  /** Rename file system node at {@link nodeId} */
  abstract renameNode(nodeId: string, name: string): Promise<void>;

  /** Delete file system node at {@link nodeId} */
  abstract deleteNode(nodeId: string): Promise<void>;

  /**
   * Add new node with {@link name} and {@link type} to parent node
   * at {@link parentId}
   */
  abstract addNewNode(
    name: string,
    type: string,
    parentId: string
  ): Promise<void>;

  /** Move nodes to new parent at {@link targetId} */
  abstract moveNodes(targetId: string, sourceIds: string[]): Promise<boolean>;

  /**
   * Open a node at {@link nodeId}.
   */
  abstract openNode(nodeId: string): Promise<void>;

  addNewNodePlaceholder = (data: NewNodePlaceHolder) => {
    this.stateManager.addNewNodePlaceholder(data);
  };

  removeNewNodePlaceholder = () => {
    this.stateManager.removeNewNodePlaceholder();
  };

  selectNode = (id: string, deselectAll = false) => {
    this.stateManager.selectNode(id, deselectAll);
    this.stateManager.setFocusNode(id);
  };

  toggleSelectNode = (id: string) => {
    if (this.stateManager.checkNodeSelected(id)) {
      this.stateManager.deselectNode(id);
      if (id === this.stateManager.getFocusNode()) {
        this.stateManager.setFocusNode(undefined);
      }
    } else {
      this.selectNode(id, false);
    }
  };

  selectTo = (toId: string) => {
    this.stateManager.selectTo(toId);
    if (
      this.stateManager.getFocusNode() === undefined &&
      (toId === null || this.stateManager.getNodeById(toId))
    ) {
      this.stateManager.setFocusNode(toId);
    }
  };

  deselectAll = () => {
    this.stateManager.deselectAll(false);
    this.stateManager.setFocusNode(null);
  };

  showNodeDetails = (id: string) => {
    this.stateManager.dispatchEvent("shownodedetails", { nodeId: id });
  };

  /**
   * Start dragging
   * @param sourceId
   * @returns True if it is allowed to drag
   */
  startDrag = (sourceId: string) => {
    return this.stateManager.startDrag(sourceId);
  };

  /**
   * Stop dragging, it will manipulate the drag source and target and apply
   * moving nodes if necessary.
   * @returns
   */
  stopDrag = async () => {
    const dragSource = structuredClone(this.stateManager.dragSource);
    const dragTarget = structuredClone(this.stateManager.dragTarget);

    if (
      !dragTarget ||
      dragSource?.length <= 0 ||
      !this.checkNodeDroppable(dragTarget.id, dragSource)
    ) {
      this.stateManager.stopDrag(true);
      return;
    }

    const target = this.stateManager.getNodeById(dragTarget.id);
    const targetId = target ? target.id : null;
    const success = await this.moveNodes(targetId, dragSource);

    if (success) {
      // Deselect all node
      this.stateManager.deselectAll(false);
      this.stateManager.moveFileSystemNodes(targetId, dragSource, false);
      for (const sourceId of dragSource) {
        this.stateManager.selectNode(sourceId, false);
      }
      this.stateManager.setUIRoot(targetId, false);
    }

    this.stateManager.stopDrag(true);
  };

  /**
   * Check if the target node at {@link targetId} is droppable while dragging.
   */
  checkNodeDroppable = (targetId: string, sourceIds?: string[]): boolean => {
    return false;
  };

  setDragTarget = (targetId: string) => {
    if (this.checkNodeDroppable(targetId)) {
      this.stateManager.setDragTarget(targetId);
    } else {
      this.stateManager.removeDragTarget();
    }
  };

  removeDragTarget = () => {
    this.stateManager.removeDragTarget();
  };

  /**
   * It will fire when a node is clicked with detail which part is selected,
   * we can add custom logic here, such as opening a folder without double
   * click.
   * @param nodeId
   * @returns
   */
  handleNodeClick = async (nodeId: string, target: "label" | "node") => {
    return true;
  };

  handleNodeDoubleClick = async (nodeId: string, target: "label" | "node") => {
    this.deselectAll();
    await this.openNode(nodeId);
    return true;
  };
}
