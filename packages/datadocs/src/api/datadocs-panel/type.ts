import type { DatadocsObjectNode } from "../../components/panels/Datadocs/components/type";
import type { DataPagingManager } from "../utils/DataPagingManager";

export type DatadocsObjectType = "fd" | "wb";

export type DatadocsPanelObjectData = {
  ownerId: string;
  creatorId: string;
  objectId: string;
  parentId?: string;
  name: string;
  type: DatadocsObjectType;
  vanitySlug?: string;
  createdAt: number;
  updatedAt: number;
  lastOpened: number;
  /** Path string to the object */
  path?: string;
};

export type DatadocsPanelListDirSort = "default" | "name:asc" | "access:desc";

export type DatadocsPanelFolderData = {
  /**
   * List of objects from root to the Folder itself
   */
  path: DatadocsObjectNode[];
  /**
   * The Folder can be big and its' child nodes should be separated
   * in pages. The default start page index is 1.
   */
  pages: DataPagingManager<DatadocsObjectNode>;
  /**
   * The timestamp when the first page is fetched
   */
  timestamp?: number;
  /**
   * The timestamp of latest update on the folder data
   */
  lastUpdated?: number;
};

export type DatadocsPanelFileSystemData = {
  [folderObjectId: string]: DatadocsPanelFolderData;
};

/**
 * Contain information of a workbook/folder
 */
export type DatadocsObjectNodeDetails = {
  /**
   * The object detail information
   */
  object?: DatadocsObjectNode;
  /**
   * List of objects from root to the Folder itself
   */
  path?: DatadocsObjectNode[];
  /**
   * Number of workbooks inside a folder object
   */
  numberOfWorkbooks?: number;
  /**
   * Number of worksheets inside a workbook object
   */
  numberOfWorksheets?: number;
  /**
   * Indicate if the object detail is currently being fetched
   */
  fetching?: boolean;
};

export type DatadocsSearchData = {
  searchText: string;
  sort: DatadocsPanelListDirSort;
  pages: DataPagingManager<DatadocsObjectNode>;
};

export type DatadocsPanelSyncObjectData = {
  /**
   * When the change has been made
   */
  timestamp: number;
  /**
   * Indicate if the list_dir data is syncable. NOTE: We only allow syncing
   * when number of objects is not over a page size.
   */
  sync: boolean;
  /**
   * Indicate that the object has been deleted
   */
  delete?: boolean;
  /**
   * List dir data sorts by ascending name
   */
  name_asc?: DatadocsPanelObjectData[];
  /**
   * List dir data sorts by descending access
   */
  access_desc?: DatadocsPanelObjectData[];
  /**
   * The object data to sync
   */
  object?: DatadocsPanelObjectData;
};
