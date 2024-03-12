import type {
  DataNodeBase,
  SearchNodeData,
} from "../../../common/file-system/fileSystemStateManager";
import { FlatFileSystemManager } from "../../../common/file-system/flat-file-system/flatFileSystemManager";
import type { Node } from "../../../common/file-system/fileSystemStateManager";
import type {
  NodeDetailButton,
  NodeDetailColumn,
  NodeDetailItem,
} from "../components/node-detail/type";
import {
  FILE_SYSTEM_VIEW_ALL_FILES_ITEM,
  UPLOADED_FILES_MAX_ROOT_ITEMS,
} from "../constant";

export class SourceStateManager<
  DataNode extends DataNodeBase
> extends FlatFileSystemManager<DataNode> {
  constructor(nodes: Array<DataNode>) {
    super(nodes);
  }

  toggleCollapseNode = (id: string, dispatch = true) => {
    // Do nothing
  };

  canOpenNode = (node: Node<DataNode>): boolean => {
    return !node || node.dataNode.type === "folder";
  };

  getNodeIcon = (id: string): string => {
    return "";
  };

  getNodeDetail = (id: string): NodeDetailItem[] => {
    return [];
  };

  getNodeDetailButton = (id: string): NodeDetailButton => {
    return null;
  };

  getNodeDetailColumns = async (id: string): Promise<NodeDetailColumn[]> => {
    return [];
  };

  getRootChildNodesWithViewAll = () => {
    const childNodes = this.getChildNodesById(null);
    if (childNodes.length > UPLOADED_FILES_MAX_ROOT_ITEMS) {
      const newChildNodes = childNodes.slice(0, UPLOADED_FILES_MAX_ROOT_ITEMS);
      newChildNodes.push(FILE_SYSTEM_VIEW_ALL_FILES_ITEM as Node<DataNode>);
      return newChildNodes;
    }
    return childNodes;
  };

  getOpenableChildNodesById = (id: string) => {
    return [];
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

  searchSourceNodes = (
    searchValue: string,
    rootId: string
  ): SearchNodeData<Node<DataNode>>[] => {
    return [];
  };

  getSearchSourceNodesFromIds = (
    ids: string[]
  ): SearchNodeData<Node<DataNode>>[] => {
    return [];
  };

  hasChild = (id: string): boolean => {
    const children = this.getChildNodesById(id);
    return children && children.length > 0;
  };

  refreshNodes(nodeId: string, nodes: DataNode[]) {
    this.deleteChildNodes(nodeId);
    for (const node of nodes) {
      this.addNode(node, node.parent, false);
    }
    this.dispatchEvent("datachange", { type: "refreshnode" });
  }

  getNodeByName = (name: string, parentId: string): Node<DataNode> => {
    let resNode: Node<DataNode> = null;
    for (const [_, node] of this.nodeMap) {
      if (node.parent === parentId && node.name === name) {
        return node;
      }
    }

    return resNode;
  };

  buildQueryString = (id: string): string => {
    return null;
  };
}
