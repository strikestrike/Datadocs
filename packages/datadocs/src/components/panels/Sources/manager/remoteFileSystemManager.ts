import type {
  RemoteFileStorageItem,
  RemoteFileSystemItem,
} from "../../../../app/store/panels/sources/type";
import {
  addRemoteFileSystemManager,
  remoteFileStorageInstance,
} from "../../../../app/store/panels/store-sources-panel";
import type {
  DataNodeBase,
  Node,
} from "../../../common/file-system/fileSystemStateManager";
import FileSystemFolder from "../../../common/file-system/flat-file-system/FileSystemFolder.svelte";
import SourceFile from "../components/file/node/SourceFile.svelte";
import { UploadedFilesStateManager } from "./uploadedFileStateManager";

export const initRemoteFileSystemData: Array<RemoteFileSystemItem> = [
  {
    id: "1",
    name: "s3_raw_files",
    type: "remote-storage",
    parent: null,
    isActive: true,
  },
  {
    id: "2",
    name: "gcp_customers_raw",
    type: "remote-storage",
    parent: null,
    isActive: false,
  },
  {
    id: "1_1",
    name: "customers",
    type: "folder",
    parent: "1",
  },
  {
    id: "1_2",
    name: "sales",
    type: "folder",
    parent: "1",
  },
  {
    id: "1_3",
    name: "expenses",
    type: "folder",
    parent: "1",
  },
  {
    id: "1_4",
    name: "main",
    type: "csv",
    parent: "1",
  },
  {
    id: "1_1_1",
    name: "orders",
    type: "folder",
    parent: "1_1",
  },
  {
    id: "1_1_2",
    name: "customers_product_a",
    type: "excel",
    parent: "1_1",
  },
  {
    id: "1_1_3",
    name: "customers_product_b",
    type: "excel",
    parent: "1_1",
  },
  {
    id: "1_1_4",
    name: "customers_product_c",
    type: "excel",
    parent: "1_1",
  },
  {
    id: "1_1_5",
    name: "customer_usa",
    type: "csv",
    parent: "1_1",
  },
  {
    id: "1_1_6",
    name: "customer_canada",
    type: "csv",
    parent: "1_1",
  },
  {
    id: "1_1_7",
    name: "customer_india",
    type: "csv",
    parent: "1_1",
  },
  {
    id: "1_1_8",
    name: "customer_argentina",
    type: "csv",
    parent: "1_1",
  },
  {
    id: "1_1_9",
    name: "customer_brazil",
    type: "csv",
    parent: "1_1",
  },
  {
    id: "1_1_10",
    name: "customer_china",
    type: "csv",
    parent: "1_1",
  },
  {
    id: "1_1_11",
    name: "customer_nepal",
    type: "csv",
    parent: "1_1",
  },
  {
    id: "1_1_12",
    name: "customer_united_kingdom",
    type: "csv",
    parent: "1_1",
  },
];

export class RemoteFileSystemStateManager<
  DataNode extends DataNodeBase
> extends UploadedFilesStateManager<DataNode> {
  canOpenNode = (node: Node<DataNode>): boolean => {
    return (
      !node ||
      node.dataNode.type === "folder" ||
      node.dataNode.type === "remote-storage"
    );
  };

  getNodeIcon = (id: string): string => {
    const node = this.getNodeById(id);
    if (node) {
      if (node.type === "remote-storage") {
        if (
          (node as unknown as Node<RemoteFileStorageItem>).dataNode.isActive
        ) {
          return "tw-source-remote-fs-manager-active";
        } else {
          return "tw-source-remote-fs-manager-inactive";
        }
      } else if (node.type === "csv") {
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

  getNodeComponent = (node: Node<DataNode>) => {
    if (node.dataNode.type === "folder") {
      return FileSystemFolder;
    } else {
      return SourceFile;
    }
  };

  getOpenableChildNodesById = (id: string) => {
    const childNodes = this.getChildNodesById(id);
    return childNodes.filter((v) => v.type === "remote-storage");
  };
}

/**
 * Remote files system state manager for UI
 */
const remoteFileSystemStateManager = new RemoteFileSystemStateManager([]);

export function getRemoteFileSystemStateManager(): RemoteFileSystemStateManager<RemoteFileSystemItem> {
  return remoteFileSystemStateManager;
}

/**
 * function to hardcode to generate Remote Files System
 */
export async function generateRemoteFileSystems() {
  remoteFileStorageInstance.insertNodeItemToArray(initRemoteFileSystemData);
}

/**
 * Transfer current Uploaded file to UI
 */
export async function importRemoteFileSystemStoreToSourceManager() {
  const remoteFileSystemItems = remoteFileStorageInstance.cloneTreeArray();
  addRemoteFileSystemManager(remoteFileSystemItems);
}

export default remoteFileSystemStateManager;
