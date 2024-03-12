import {
  type DatadocsObjectType,
  type DatadocsPanelListDirSort,
  updateActiveWorkbookOnDeletion,
  setActiveWorkbook,
} from "../../../../../api";
import { FlatFileSystemActions } from "../../../../common/file-system/flat-file-system/flatFileSystemActions";
import { getDatadocsFileSystemManager } from "../store";
import type { DatadocsObjectNode } from "../type";
import type { DatadocsFileSystemManager } from "./datadocsFileSystemManager";
import {
  getSearchState,
  loadNextPageData,
  openWorkbook,
  rebuildSearchResult,
} from "../utils";
import {
  clearDatadocsPanelOutdatedData,
  createDatadocsPanelObject,
  deleteDatadocsPanelObjects,
  getSearchObjectsData,
  hasDatadocsSearchDataNextPage,
  initDatadocsSearchData,
  loadDatadocsSearchDataNextPage,
  moveDatadocsPanelObjects,
  renameDatadocsPanelObject,
} from "../../../../../api/datadocs-panel";
import { bind } from "../../../../common/modal";
import DeleteConfirmationModal from "../../../../top-menu/components/modals/DeleteConfirmationModal.svelte";
import { openPanelModal } from "../../../../common/panel/modal";

const stateManager = getDatadocsFileSystemManager();

export function fakeNetworkRequest(delay = 100) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(true);
    }, delay);
  });
}

export class DatadocsFileSystemAction extends FlatFileSystemActions<DatadocsObjectNode> {
  constructor(readonly stateManager: DatadocsFileSystemManager) {
    super(stateManager);
  }

  openNode = async (nodeId: string) => {
    const root = this.stateManager.getNodeById(nodeId);

    // In datadocs file system, only folder node can be opened and have
    // its children showed
    if (!root || root.dataNode.type === "fd") {
      this.stateManager.deselectAll(false);
      this.stateManager.setSelectedNodeForRebuild([]);
      this.stateManager.setUIRoot(root);
    }
  };

  loadListDirNextPage = async () => {
    await loadNextPageData(this.stateManager);
  };

  renameNode = async (nodeId: string, name: string) => {
    const node = this.stateManager.hasSearch()
      ? this.stateManager.getSearchNodeById(nodeId)?.node
      : this.stateManager.getNodeById(nodeId);

    if (!node || node.name === name) {
      return;
    }

    if (await renameDatadocsPanelObject(nodeId, name)) {
      this.stateManager.renameNode(nodeId, name);
      clearDatadocsPanelOutdatedData("rename", [nodeId]);
      this.stateManager.setSelectedNodeForRebuild([nodeId]);
      await loadNextPageData(this.stateManager);
    }
  };

  deleteNode = async (currentNodeId: string) => {
    const currentNode = this.stateManager.hasSearch()
      ? this.stateManager.getSearchNodeById(currentNodeId)?.node
      : this.stateManager.getNodeById(currentNodeId);

    if (!currentNode) {
      return;
    }
    const parentId = currentNode.parent;
    let selectionDelete = false;

    // It allows to delete multiple nodes at once, so when the delete action
    // happens on a node and it was selected, we will do it for all current
    // selected nodes.
    const deleteNodeIdSet = new Set<string>([currentNodeId]);
    const selectedNodes = this.stateManager.getSelectedNodes() ?? [];

    if (this.stateManager.checkNodeSelected(currentNodeId)) {
      selectionDelete = true;

      // Add more nodes to delete, make sure they have the same parent
      for (const nodeId of selectedNodes) {
        const node = this.stateManager.getNodeById(nodeId);
        if (node.parent == parentId) {
          deleteNodeIdSet.add(nodeId);
        }
      }
    }

    const deleteCb = async () => {
      const deleteNodeIds = Array.from(deleteNodeIdSet);
      const deletedObjectIds = await deleteDatadocsPanelObjects(
        Array.from(deleteNodeIds)
      );

      if (deletedObjectIds) {
        if (selectionDelete) {
          this.stateManager.deselectAll(false);
        } else {
          this.stateManager.setSelectedNodeForRebuild([...selectedNodes]);
        }
        clearDatadocsPanelOutdatedData("delete", deleteNodeIds);
        this.stateManager.dispatchEvent("delete", {
          objectIds: deletedObjectIds,
        });
        // Make sure to update the active workbook when it can possibly
        // removed by accidentally
        await updateActiveWorkbookOnDeletion(deleteNodeIds);
        await loadNextPageData(this.stateManager);
      }
    };

    openObjectsDeleteConfirmationModal(deleteCb, deleteNodeIdSet.size);
  };

  addNewNode = async (name: string, type: string, parentId: string) => {
    const parentNode = this.stateManager.getNodeById(parentId);
    if ((parentId && !parentNode) || !name) {
      return;
    }

    const object = await createDatadocsPanelObject(
      name,
      type as DatadocsObjectType,
      parentId
    );
    if (object) {
      this.stateManager.setSelectedNodeForRebuild([object.id]);
      clearDatadocsPanelOutdatedData("create", []);
      await loadNextPageData(this.stateManager);
    }
  };

  stopDrag = async () => {
    const stateManager = this.stateManager;
    const dragSource = structuredClone(stateManager.dragSource);
    const dragTarget = structuredClone(stateManager.dragTarget);

    if (
      !dragTarget ||
      dragSource?.length <= 0 ||
      !this.checkNodeDroppable(dragTarget.id, dragSource)
    ) {
      stateManager.stopDrag(true);
      return;
    }

    const targetNode = stateManager.getNodeById(dragTarget.id);
    const targetId = targetNode ? targetNode.id : null;
    const success = await this.moveNodes(targetId, dragSource);

    if (success) {
      // Shouldn't decend to the target folder if dragging items have the
      // same parent.
      const shouldGoToTarget = (() => {
        if (targetNode) {
          for (const nodeId of dragSource) {
            const node = stateManager.getNodeById(nodeId);
            if (node.parent === targetNode.parent) {
              return false;
            }
          }
        }

        return true;
      })();

      // Deselect all node
      stateManager.deselectAll(false);

      if (shouldGoToTarget) {
        stateManager.setUIRoot(targetId, false);
      }
      clearDatadocsPanelOutdatedData("move", dragSource);
      stateManager.setSelectedNodeForRebuild(dragSource);
      await loadNextPageData(stateManager);
    }

    stateManager.stopDrag(true);
  };

  moveNodes = async (targetId: string, sourceIds: string[]) => {
    return await moveDatadocsPanelObjects(sourceIds, targetId);
  };

  checkNodeDroppable = (targetId: string, sourceIds?: string[]) => {
    sourceIds = sourceIds ?? structuredClone(this.stateManager.dragSource);
    const targetNode = this.stateManager.getNodeById(targetId);

    return (
      !sourceIds.includes(targetId) &&
      sourceIds.every((id) => !this.stateManager.isChild(targetId, id), this) &&
      (!targetId || targetNode?.type === "fd")
    );
  };

  /**
   * On Datadocs Panel nodes selection, we should also dispatch `shownodedetails`
   * event for showing `workbook` or `folder` information.
   * @param id
   * @param deselectAll
   */
  selectNode = (id: string, deselectAll = false) => {
    this.stateManager.selectNode(id, deselectAll);
    this.stateManager.setFocusNode(id);
    this.stateManager.setSelectedNodeForRebuild([]);
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
    this.stateManager.setSelectedNodeForRebuild([]);
  };

  selectTo = (toId: string) => {
    this.stateManager.selectTo(toId);
    if (
      this.stateManager.getFocusNode() === undefined &&
      (toId === null || this.stateManager.getNodeById(toId))
    ) {
      this.stateManager.setFocusNode(toId);
    }
    this.stateManager.setSelectedNodeForRebuild([]);
  };

  deselectAll = () => {
    this.stateManager.deselectAll(false);
    this.stateManager.setFocusNode(null);
    this.stateManager.setSelectedNodeForRebuild([]);
    this.stateManager.deselectAllSearchNodes();
  };

  selectSearchNode = (id: string) => {
    const stateManager = this.stateManager;
    if (stateManager.hasSearch()) {
      stateManager.selectSearchNode(id, true);
    }
  };

  search = async (
    searchValue: string,
    sort: DatadocsPanelListDirSort = "name:asc",
    rootId = null
  ) => {
    const stateManager = this.stateManager;
    // search result should only be ordered by name
    sort = "name:asc";

    // Deselect all selction state
    this.deselectAll();

    // If the same search is in progress, just wait for it
    if (
      stateManager.isSameSearch(searchValue, sort, rootId) &&
      stateManager.isSearchInProgress()
    ) {
      return;
    }

    stateManager.search(searchValue, sort, rootId);
    if (searchValue) {
      const state = getSearchState(stateManager);
      const objects = await getSearchObjectsData(state.searchText, -1, sort);
      // Update the search result
      if (stateManager.isSameSearch(searchValue, sort, rootId)) {
        initDatadocsSearchData(state.searchText, sort, objects);
        stateManager.setSearchResult(rebuildSearchResult(stateManager));
      }
    }
  };

  loadSearchDataNextPage = async () => {
    await loadDatadocsSearchDataNextPage();
    this.stateManager.setSearchResult(rebuildSearchResult(this.stateManager));
  };

  hasSearchNextPage = () => {
    return hasDatadocsSearchDataNextPage();
  };

  refreshSearchData = async () => {
    const config = this.stateManager.getSearchConfig();
    if (config.searchText) {
      await this.search(config.searchText, config.sort as any, null);
    }
  };

  sort = async (sortType: DatadocsPanelListDirSort) => {
    this.stateManager.addSort(sortType);
  };

  handleNodeClick = async (nodeId: string, target: "label" | "node") => {
    const node = this.stateManager.getNodeById(nodeId);
    if (target === "label") {
      if (node?.dataNode?.type === "wb") {
        await openWorkbook(node.dataNode.id, true);
      } else {
        await this.openNode(nodeId);
      }
    } else if (node) {
      this.showNodeDetails(node.id);
    } else {
      return false;
    }
    return true;
  };

  handleNodeDoubleClick = async (nodeId: string, target: "label" | "node") => {
    if (target !== "label") {
      const node = this.stateManager.getNodeById(nodeId);
      if (node?.dataNode?.type === "wb") {
        await openWorkbook(node.dataNode.id, true);
      } else {
        await this.openNode(nodeId);
      }
    }
    return true;
  };

  refreshData = async () => {
    if (!this.stateManager.hasSearch()) {
      const selectedNodes = this.stateManager.getSelectedNodes() ?? [];
      clearDatadocsPanelOutdatedData("reload", []);
      this.stateManager.setSelectedNodeForRebuild(selectedNodes);
      await loadNextPageData(this.stateManager);
    } else {
      if (this.stateManager.getSearchConfig()?.status === "done") {
        await this.refreshSearchData();
      }
    }
  };
}

/**
 * Open a confirmation modal for objects deletion
 * @param deleteCb
 */
function openObjectsDeleteConfirmationModal(
  deleteCb: () => Promise<any>,
  numberOfItems: number
) {
  const isMovable = false;
  const isResizable = false;
  const multiple = numberOfItems > 1;
  const props = {
    mainMessage: multiple
      ? `Are you sure you want to delete these ${numberOfItems} items?`
      : `Are you sure you want to delete ${numberOfItems} item?`,
    title: `Delete Datadocs Items`,
    executeOnYes: async () => {
      return await deleteCb();
    },
    isMovable: isMovable,
  };

  const modalElement = bind(DeleteConfirmationModal, props);

  openPanelModal({
    component: modalElement,
    isMovable: isMovable,
    isResizable: isResizable,
    minWidth: 400,
    minHeight: 300,
    preferredWidth: 500,
  });
}

export const datadocsPanelActions = new DatadocsFileSystemAction(stateManager);
