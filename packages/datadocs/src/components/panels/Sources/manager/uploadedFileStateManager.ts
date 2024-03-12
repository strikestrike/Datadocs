import type {
  FileSystemNodeItem,
  SourceNodeItem,
} from "../../../../app/store/panels/sources/type";
import type {
  Node,
  DataNodeBase,
  SearchNodeData,
} from "../../../common/file-system/fileSystemStateManager";
import { SourceStateManager } from "./sourceStateManager";
import FileSystemFolder from "../../../common/file-system/flat-file-system/FileSystemFolder.svelte";
import SourceFile from "../components/file/node/SourceFile.svelte";
import ViewAllFile from "../components/file/node/ViewAllFile.svelte";
import type {
  NodeDetailButton,
  NodeDetailColumn,
  NodeDetailItem,
} from "../components/node-detail/type";
import {
  FILE_SYSTEM_VIEW_ALL_FILES_ID,
  FILE_SYSTEM_VIEW_ALL_FILES_ITEM,
} from "../constant";
import {
  addUploadedFilesManager,
  uploadedFileStoreInstance,
} from "../../../../app/store/panels/store-sources-panel";
import { getUploadedFilesItems } from "../../../../app/store/db-manager/uploaded-files";
import { escape } from "@datadocs/duckdb-utils";

export const initUploadedFilesData: Array<FileSystemNodeItem> = [
  {
    id: "1",
    parent: null,
    type: "folder",
    name: "New Folders 1",
  },
  {
    id: "1_1",
    parent: "1",
    type: "folder",
    name: "customers",
  },
  {
    id: "1_2",
    parent: "1",
    type: "csv",
    name: "sales_by_category",
  },
  {
    id: "1_3",
    parent: "1",
    type: "csv",
    name: "sales_2021",
  },
  {
    id: "2",
    parent: null,
    type: "excel",
    name: "Analysis",
  },
  {
    id: "3",
    parent: null,
    type: "csv",
    name: "sales_raw",
  },
  {
    id: "4",
    parent: null,
    type: "csv",
    name: "sales_product_a",
  },
  {
    id: "5",
    parent: null,
    type: "csv",
    name: "sales_product_b",
  },
  {
    id: "6",
    parent: null,
    type: "csv",
    name: "sales_raw 1",
  },
  {
    id: "7",
    parent: null,
    type: "csv",
    name: "sales_product_a 2",
  },
  {
    id: "8",
    parent: null,
    type: "csv",
    name: "sales_product_b 3",
  },
  {
    id: "9",
    parent: null,
    type: "csv",
    name: "sales_raw 2",
  },
  {
    id: "10",
    parent: null,
    type: "csv",
    name: "sales_product_a 4",
  },
  {
    id: "11",
    parent: null,
    type: "csv",
    name: "sales_product_b 4",
  },
  {
    id: "12",
    parent: null,
    type: "csv",
    name: "sales_raw 3",
  },
  {
    id: "13",
    parent: null,
    type: "csv",
    name: "sales_product_a 5",
  },
  {
    id: "14",
    parent: null,
    type: "csv",
    name: "sales_product_b 5",
  },
];

export function isFileSystemFileNode(node: Node<SourceNodeItem>): boolean {
  return (
    node &&
    (node.type === "csv" ||
      node.type === "excel" ||
      node.type === "sheet" ||
      node.type === "json")
  );
}

export class UploadedFilesStateManager<
  DataNode extends DataNodeBase
> extends SourceStateManager<DataNode> {
  constructor(nodes: Array<DataNode>) {
    super(nodes);
  }

  canOpenNode = (node: Node<DataNode>): boolean => {
    return !node || node.dataNode.type === "folder";
  };

  getNodeComponent = (node: Node<DataNode>) => {
    if (node.type === FILE_SYSTEM_VIEW_ALL_FILES_ID) {
      return ViewAllFile;
    } else if (node.dataNode.type === "folder") {
      return FileSystemFolder;
    } else {
      return SourceFile;
    }
  };

  getNodeIcon = (id: string): string => {
    const node = this.getNodeById(id);
    if (node) {
      if (node.type === "csv") {
        return "tw-source-csv";
      } else if (node.type === "excel") {
        return "tw-source-excel";
      } else if (node.type === "folder") {
        return "panel-folder";
      }
      return "tw-source-csv";
    }
    return "";
  };

  getNodeDetail = (id: string): NodeDetailItem[] => {
    const node = this.getNodeById(id);
    if (node) {
      if (node.type === "csv") {
        return [
          {
            name: "Spreadsheet Tables",
            type: "reference",
            children: [
              {
                name: "Tb",
                type: "uitable",
              },
              {
                name: "Tb2",
                type: "uitable",
              },
              {
                name: "products",
                type: "uitable",
              },
            ],
          },
          {
            name: "Database Tables",
            type: "reference",
            children: [
              {
                name: "from_sale_csv",
                type: "dbtable",
              },
            ],
          },
        ];
      }
    }
    return [];
  };

  getNodeDetailButton = (id: string): NodeDetailButton => {
    return null;
  };

  getNodeDetailColumns = async (id: string): Promise<NodeDetailColumn[]> => {
    return [];
  };

  getNodeById = (id: string) => {
    if (id === FILE_SYSTEM_VIEW_ALL_FILES_ID) {
      return FILE_SYSTEM_VIEW_ALL_FILES_ITEM as Node<DataNode>;
    }
    return id && this.nodeMap.has(id) ? this.nodeMap.get(id) : null;
  };

  getChildNodes = (node: Node<DataNode>) => {
    if (node.type === FILE_SYSTEM_VIEW_ALL_FILES_ID) {
      return this.getRootChildNodes();
    } else {
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
    }
  };

  buildQueryString = (id: string): string => {
    const node = this.getNodeById(id);
    if (node) {
      if (
        (node.type === "csv" || node.type === "json") &&
        (node.dataNode as FileSystemNodeItem).storedName
      ) {
        return `SELECT * FROM ${escape(
          (node.dataNode as FileSystemNodeItem).storedName
        )}`;
      }
    }
    return null;
  };

  searchSourceNodes = (
    searchValue: string,
    rootId: string
  ): SearchNodeData<Node<DataNode>>[] => {
    const searchNodes: SearchNodeData<Node<DataNode>>[] = [];
    searchValue = searchValue.toLowerCase();
    const rootNode = this.getNodeById(rootId);
    const rootPath =
      "/" +
      (rootNode && rootNode.id !== FILE_SYSTEM_VIEW_ALL_FILES_ID
        ? this.getNodePath(rootId).join("/") + "/"
        : ""
      ).toLowerCase();

    for (const [id, node] of this.nodeMap) {
      const path = this.getNodePath(id);
      const pathUrl = "/" + this.getNodePath(id).join("/");
      const isRoot = path.length === 1;

      if (
        node.name.toLocaleLowerCase().includes(searchValue) &&
        pathUrl.toLocaleLowerCase().startsWith(rootPath)
      ) {
        searchNodes.push({ node, path: isRoot ? "" : pathUrl });
      }
    }

    return searchNodes.sort((a, b) => {
      if (a.path == b.path) {
        return a.node.name > b.node.name ? 1 : -1;
      } else {
        return a.path > b.path ? 1 : -1;
      }
    });
  };

  getSearchSourceNodesFromIds = (
    ids: string[]
  ): SearchNodeData<Node<DataNode>>[] => {
    let searchNodes = [];
    for (const id of ids) {
      const node = this.getNodeById(id);
      const path = this.getNodePath(id);
      const pathUrl = "/" + this.getNodePath(id).join("/");
      const isRoot = path.length === 1;

      searchNodes.push({ node, path: isRoot ? "" : pathUrl });
    }

    return searchNodes.sort((a, b) => {
      if (a.path == b.path) {
        return a.node.name > b.node.name ? 1 : -1;
      } else {
        return a.path > b.path ? 1 : -1;
      }
    });
  };
}

/**
 * uploaded files state manager for UI
 */
const uploadedFileStateManager = new UploadedFilesStateManager([]);

export function getUploadedFilesStateManager(): UploadedFilesStateManager<FileSystemNodeItem> {
  return uploadedFileStateManager;
}

/**
 * function to hardcode to generate Uploaded files
 */
export async function generateUploadedFiles() {
  const uploadedFilesItems = await getUploadedFilesItems();
  uploadedFileStoreInstance.insertNodeItemToArray(uploadedFilesItems);
}

/**
 * Transfer current Uploaded file to UI
 */
export async function importUploadedFileStoreToSourceManager() {
  const uploadedFileItems = uploadedFileStoreInstance.cloneTreeArray();
  addUploadedFilesManager(uploadedFileItems);
}

export async function insertFileToUploadedFiles(
  fileName: string,
  storageFileName: string,
  type: string,
  parentId: string
): Promise<boolean> {
  if (parentId) {
    const parent = uploadedFileStoreInstance.getNodeById(parentId);
    if (!parent) {
      return false;
    }
  }
  const item: FileSystemNodeItem =
    (await uploadedFileStoreInstance.handleAddNode(
      parentId,
      fileName,
      storageFileName,
      type
    )) as unknown as FileSystemNodeItem;
  if (item) {
    // const uiItem: Node<FileSystemNodeItem> = {
    //   id: item.id,
    //   type: item.type,
    //   name: item.name,
    //   dataNode: item,
    //   parent: null,
    //   children: [],
    // };
    uploadedFileStateManager.addNode(item, parentId);
    return true;
  }

  return false;
}

export default uploadedFileStateManager;
