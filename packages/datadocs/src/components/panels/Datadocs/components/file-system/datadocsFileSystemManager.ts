import type {
  Node,
  SearchNodeData,
} from "../../../../common/file-system/fileSystemStateManager";
import {
  FlatFileSystemManager,
  type FileSystemCustomNode,
} from "../../../../common/file-system/flat-file-system/flatFileSystemManager";
import type { DatadocsObjectNode } from "../type";
import DatadocsWorkbook from "./DatadocsWorkbook.svelte";
import FileSystemFolder from "../../../../common/file-system/flat-file-system/FileSystemFolder.svelte";
import type { DatadocsPanelListDirSort } from "../../../../../api";
import LoadMoreNodes from "./LoadMoreNodes.svelte";

export class DatadocsFileSystemManager extends FlatFileSystemManager<DatadocsObjectNode> {
  /**
   * The sort which is currently applied to the datadocs panel file system
   */
  sortType: DatadocsPanelListDirSort = "default";

  /**
   * Those node will be added as selected node after rebuilding Datadocs Panel
   * file system from server data, so that we don't lose current selection state.
   */
  selectedNodeForRebuild: string[] = [];

  constructor(data: Array<DatadocsObjectNode>) {
    super(data, true);
  }

  rebuildFileSystem = (data: Array<DatadocsObjectNode>) => {
    this.init(data);

    // rebuild selection state
    this.deselectAll(false);
    this.selectedNodeForRebuild?.forEach((nodeId) => {
      this.selectNode(nodeId, false, false);
    }, this);

    if (this.selectedNodes.length > 0) {
      this.setFocusNode(this.selectedNodes[this.selectedNodes.length - 1]);
    }

    this.dispatchEvent("datachange", {});
  };

  getNodeComponent = (
    node: Node<DatadocsObjectNode> | FileSystemCustomNode
  ) => {
    if (node.type === "custom") {
      if (node.name === "loadnextpage") {
        return LoadMoreNodes;
      }
    } else {
      const dataNode = (node as Node<DatadocsObjectNode>).dataNode;
      if (dataNode.type === "wb") {
        return DatadocsWorkbook;
      } else if (dataNode.type === "fd") {
        return FileSystemFolder;
      }
    }

    return null;
  };

  getNodePath = (nodeId: string): string[] => {
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
  };

  countFiles = (nodeId: string): number => {
    const node = this.getNodeById(nodeId);
    if (!nodeId || !node) {
      return 0;
    }

    if (node.dataNode.type === "wb") {
      return 1;
    }

    let fileCount = 0;
    for (const childId of node.children) {
      fileCount += this.countFiles(childId);
    }
    return fileCount;
  };

  /**
   * Find all the file have search value inside its path. It is a temporary
   * search implementation for testing UI only. The search should be fetched
   * from server.
   * @param searchValue
   */
  searchWorkbooks = (searchValue: string) => {
    const workbooks: SearchNodeData<Node<DatadocsObjectNode>>[] = [];
    searchValue = searchValue.toLowerCase();

    for (const [id, node] of this.nodeMap) {
      if (node.dataNode.type === "wb") {
        const path = this.getNodePath(id);
        const pathUrl = "/" + this.getNodePath(id).join("/");
        const isRoot = path.length === 1;

        if (pathUrl.toLowerCase().includes(searchValue)) {
          workbooks.push({ node, path: isRoot ? "" : pathUrl });
        }
      }
    }

    return workbooks.sort((a, b) => {
      if (a.path == b.path) {
        return a.node.name > b.node.name ? 1 : -1;
      } else {
        return a.path > b.path ? 1 : -1;
      }
    });
  };

  addSort = (sortType: DatadocsPanelListDirSort, dispatch = true) => {
    if (this.sortType === sortType) {
      return;
    }
    this.sortType = sortType;

    if (dispatch) {
      this.dispatchEvent("datachange", { type: "sort" });
      this.dispatchEvent("sortchange", {});
    }
  };

  setSelectedNodeForRebuild = (selectedNodes?: string[]) => {
    this.selectedNodeForRebuild = selectedNodes ?? [];
  };

  sort = (
    childNodes: Node<DatadocsObjectNode>[]
  ): Node<DatadocsObjectNode>[] => {
    // On Datadocs Panel, the sort is done on the server side
    return childNodes;
  };
}
