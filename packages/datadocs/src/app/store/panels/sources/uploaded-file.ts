import type { Writable } from "svelte/store";
import SourceBaseStore from "./base";
import type {
  FileSystemFolderItem,
  FileSystemNodeItem,
  SourceNodeItem,
} from "./type";
import { dropFile } from "../../store-db";
import {
  addUploadedFilesItem,
  deleteUploadedFileItem,
  deleteUploadedFileItems,
  editUploadedFileName,
  getUploadedFilesItemById,
  moveUploadedFileItems,
  searchUploadedFileItems,
  uploadedFileExist,
} from "../../db-manager/uploaded-files";

class UploadedFileStore extends SourceBaseStore {
  readonly treeStore: Writable<FileSystemNodeItem[]>;

  constructor(data: FileSystemNodeItem[]) {
    super(data);
  }

  async handleRenameNode(nodeId: string, name: string): Promise<boolean> {
    const node = this.getNodeById(nodeId);
    if (node) {
      if (await uploadedFileExist(name, node.parent)) {
        return false;
      }
      if (await editUploadedFileName(nodeId, name)) {
        return this.renameNode(nodeId, name);
      }
    }
    return false;
  }

  async handleDeleteNode(nodeId: string): Promise<boolean> {
    const node = this.getNodeById(nodeId) as FileSystemNodeItem;
    if (node) {
      if (node.type === "folder") {
        const getChildIds = function (ids: string[]): string[] {
          const childIds = [];
          for (const id of ids) {
            const childNodes = this.getChildNodesById(
              id,
              false
            ) as FileSystemNodeItem[];
            childIds.push(...childNodes.map((n) => n.id));
          }
          return childIds;
        }.bind(this);
        let childIds = [nodeId];
        const childIdsArr: string[][] = [childIds];
        while (childIds.length > 0) {
          childIds = getChildIds(childIds);
          if (childIds.length > 0) {
            childIdsArr.unshift(childIds);
          }
        }
        const nestedChildNodes = this.getChildNodesById(
          node.id,
          true
        ) as FileSystemNodeItem[];
        for (let i = 0; i < childIdsArr.length; i++) {
          await deleteUploadedFileItems(childIdsArr[i]);
        }
        const dropFiles = nestedChildNodes.filter((n) => n.type !== "folder");
        for (const f of dropFiles) {
          dropFile(f.storedName);
        }
        // handle delete folder and child nodes
        return this.deleteNode(nodeId);
      } else {
        const dbitem = await getUploadedFilesItemById(node.id);
        if (dbitem) {
          if (await deleteUploadedFileItem(node.id)) {
            const res = await dropFile(node.storedName);
            if (res) {
              return this.deleteNode(nodeId);
            }
          }
        }
      }
    }
    return false;
  }

  async handleAddNode(
    parentId: string,
    name: string,
    storageFileName: string,
    type: string
  ): Promise<SourceNodeItem> {
    if (await uploadedFileExist(name, parentId)) {
      return null;
    }
    const nodeData: SourceNodeItem = await addUploadedFilesItem(
      name,
      storageFileName,
      type,
      parentId
    );
    if (nodeData && (await this.addNode(parentId, nodeData))) {
      return nodeData;
    }
    return null;
  }

  async handleMoveNode(
    targetId: string,
    sourceIds: string[]
  ): Promise<boolean> {
    if (targetId) {
      const node = this.getNodeById(targetId) as FileSystemNodeItem;
      if (!node || node.type !== "folder") {
        return false;
      }
    }
    const childNodes = this.getChildNodesById(targetId);
    for (const id of sourceIds) {
      const source = this.getNodeById(id);
      if (!source) {
        return false;
      }
      const found = childNodes.some((n) => n.name === source.name);
      if (found) {
        return false;
      }
    }
    if (await moveUploadedFileItems(targetId, sourceIds)) {
      for (const id of sourceIds) {
        const source = this.getNodeById(id);
        source.parent = targetId;
      }
      return true;
    }
    return false;
  }

  async handleSearchNodes(
    searchValue: string,
    rootId: string
  ): Promise<string[]> {
    let ids: string[] = null;
    if (rootId) {
      ids = [
        rootId,
        ...this.getChildNodesById(rootId, true)
          .filter((n) => n.type === "folder")
          .map((n) => n.id),
      ];
    }

    return searchUploadedFileItems(searchValue, ids);
  }

  async handleRefreshNode(nodeId: string): Promise<SourceNodeItem[]> {
    return [];
  }
}

export default UploadedFileStore;
