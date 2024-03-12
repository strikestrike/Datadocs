import type {
  FileSystemFolderItem,
  SourceNodeItem,
} from "../../../../app/store/panels/sources/type";
import {
  databaseStoreInstance,
  remoteFileStorageInstance,
  uploadedFileStoreInstance,
} from "../../../../app/store/panels/store-sources-panel";
import type { Node } from "../../../common/file-system/fileSystemStateManager";
import { FlatFileSystemActions } from "../../../common/file-system/flat-file-system/flatFileSystemActions";
import {
  FILE_SYSTEM_VIEW_ALL_FILES_ID,
  FILE_SYSTEM_VIEW_ALL_FILES_ITEM,
} from "../constant";
import { getDatabaseStateManager } from "./databaseStateManager";
// import remoteFileSystemStateManager from "./remoteFileSystemManager";
import type { SourceStateManager } from "./sourceStateManager";
import { getUploadedFilesStateManager } from "./uploadedFileStateManager";

const databaseStateManager = getDatabaseStateManager();
const uploadedFileStateManager = getUploadedFilesStateManager();

type SourcePanelType = "database" | "uploaded-files";

async function renameSourcePanelNode(
  type: SourcePanelType,
  id: string,
  name: string
): Promise<boolean> {
  if (type === "database") {
    return databaseStoreInstance.handleRenameNode(id, name);
  } else if (type === "uploaded-files") {
    return uploadedFileStoreInstance.handleRenameNode(id, name);
  }
}

async function addNewFolderSourcePanelNode(
  stype: SourcePanelType,
  parentId: string,
  name: string,
  type: string
): Promise<FileSystemFolderItem> {
  if (stype === "database") {
    // Couldn't add folder to database
    return null;
  } else if (stype === "uploaded-files") {
    return uploadedFileStoreInstance.handleAddNode(
      parentId,
      name,
      null,
      type
    ) as unknown as FileSystemFolderItem;
  }
  return null;
}

async function deleteSourcePanelNode(
  type: SourcePanelType,
  id: string
): Promise<boolean> {
  if (type === "database") {
    return databaseStoreInstance.handleDeleteNode(id);
  } else if (type === "uploaded-files") {
    return uploadedFileStoreInstance.handleDeleteNode(id);
  }
  return false;
}

async function moveSourcePanelNodes(
  type: SourcePanelType,
  targetId: string,
  sourceIds: string[]
): Promise<boolean> {
  if (type === "uploaded-files") {
    return uploadedFileStoreInstance.handleMoveNode(targetId, sourceIds);
  } else {
    return false;
  }
}

async function searchSourcePanelNodes(
  type: SourcePanelType,
  searchValue: string,
  rootId: string
): Promise<string[]> {
  if (type === "database") {
    return null;
  } else if (type === "uploaded-files") {
    return uploadedFileStoreInstance.handleSearchNodes(searchValue, rootId);
  }
  return null;
}

async function refreshSourceNode(
  type: SourcePanelType,
  nodeId: string
): Promise<SourceNodeItem[]> {
  if (type === "database") {
    return databaseStoreInstance.handleRefreshNode(nodeId);
  } else if (type === "uploaded-files") {
  }
  return null;
}

export class SourcePanelAction extends FlatFileSystemActions<SourceNodeItem> {
  panelType: SourcePanelType = null;

  constructor(
    readonly stateManager: SourceStateManager<SourceNodeItem>,
    type: SourcePanelType
  ) {
    super(stateManager);
    this.panelType = type;
  }

  openNode = async (nodeId: string) => {
    if (nodeId && nodeId === FILE_SYSTEM_VIEW_ALL_FILES_ID) {
      const root = FILE_SYSTEM_VIEW_ALL_FILES_ITEM;
      this.stateManager.setUIRoot(root);
    } else {
      const root = this.stateManager.getNodeById(nodeId);
      const currentNode = this.stateManager.getUIRoot();
      if (root != currentNode && this.stateManager.canOpenNode(root)) {
        this.stateManager.setUIRoot(root);
      }
    }
  };

  resetUINode = async (dispatch = true) => {
    this.stateManager.setUIRoot(null, dispatch);
  };

  /**
   * function for rename node from store and state
   * @param nodeId
   * @param name
   * @returns
   */
  renameNode = async (nodeId: string, name: string) => {
    const node = this.stateManager.getNodeById(nodeId);
    if (!node || node.name === name) {
      return;
    }
    const res = await renameSourcePanelNode(
      this.panelType,
      node.dataNode.id,
      name
    );

    if (res) {
      this.stateManager.renameNode(nodeId, name);
    }
  };

  /**
   * Function for delete node
   * @param nodeId
   * @returns
   */
  deleteNode = async (nodeId: string) => {
    const node = this.stateManager.getNodeById(nodeId);
    if (!node) {
      return;
    }

    let res = await deleteSourcePanelNode(this.panelType, node.dataNode.id);
    if (res) {
      this.stateManager.deleteNode(nodeId);
      if (
        this.panelType === "database" &&
        (node.type === "dbtable" ||
          node.type === "dbview" ||
          node.type === "mftable" ||
          node.type === "mfview")
      ) {
        const parent = this.stateManager.getNodeById(node.parent);
        if (parent) {
          const childNodes = this.stateManager.getChildNodesById(parent.id);
          if (!childNodes || childNodes.length === 0) {
            this.stateManager.deleteNode(parent.id);
          }
        }
      }
    }
  };

  toggleCollapseNode = async (node: Node<SourceNodeItem>) => {
    this.stateManager.toggleCollapseNode(node.id, true);
  };

  selectNode = (id: string, deselectAll = true) => {
    this.stateManager.selectNode(id, deselectAll);
    this.stateManager.setFocusNode(id);

    // if (deselectAll) {
    //   this.stateManager.dispatchEvent("shownodedetails", { nodeId: id });
    // }
  };

  showDetail = (id: string) => {
    this.stateManager.dispatchEvent("shownodedetails", { nodeId: id });
  };

  deselectAll = () => {
    this.stateManager.deselectAll(false);
  };

  addNewNode = async (name: string, type: string, parentId: string) => {
    parentId =
      parentId === FILE_SYSTEM_VIEW_ALL_FILES_ID ? null : parentId ?? null;
    const node = this.stateManager.getNodeById(parentId);

    const result = await addNewFolderSourcePanelNode(
      this.panelType,
      node && node.id !== FILE_SYSTEM_VIEW_ALL_FILES_ID && node.dataNode.id,
      name,
      "folder"
    );

    if (result) {
      this.stateManager.addNode(result, parentId);
    }
  };

  moveNodes = async (targetId: string, sourceIds: string[]) => {
    return moveSourcePanelNodes(this.panelType, targetId, sourceIds);
  };

  checkNodeDroppable = (targetId: string, sourceIds?: string[]) => {
    sourceIds = sourceIds ?? structuredClone(this.stateManager.dragSource);
    const targetNode = this.stateManager.getNodeById(targetId);

    return (
      !sourceIds.includes(targetId) &&
      sourceIds.every((id) => !this.stateManager.isChild(targetId, id), this) &&
      (!targetId || targetNode?.type === "folder")
    );
  };

  search = async (searchValue: string, sort: string, rootId = null) => {
    this.stateManager.search(searchValue, sort, rootId);

    // Make sure the search is not outdated
    if (this.stateManager.isSameSearch(searchValue, sort, rootId)) {
      const res = await searchSourcePanelNodes(
        this.panelType,
        searchValue,
        rootId
      );

      if (res) {
        this.stateManager.setSearchResult(
          this.stateManager.getSearchSourceNodesFromIds(res)
        );
      } else {
        this.stateManager.setSearchResult(
          this.stateManager.searchSourceNodes(searchValue, rootId)
        );
      }
    }
  };

  refreshNode = async (nodeId: string) => {
    const node = this.stateManager.getNodeById(nodeId);
    if (!node) {
      return;
    }
    const nodes = await refreshSourceNode(this.panelType, nodeId);
    if (nodes) {
      this.stateManager.refreshNodes(nodeId, nodes);
    }
  };
}

export const databasePanelActions = new SourcePanelAction(
  databaseStateManager,
  "database"
);
export const uploadedFileActions = new SourcePanelAction(
  uploadedFileStateManager,
  "uploaded-files"
);
// export const remoteFileSystemActions = new SourcePanelAction(
//   remoteFileSystemStateManager,
//   "remote-files"
// );
