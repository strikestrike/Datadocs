import type { DatadocsFileSystemManager } from "./file-system/datadocsFileSystemManager";
import {
  DATADOCS_PANEL_ROOT_ID,
  getDatadocsPanelFileSystemData,
  getDatadocsSearchData,
  loadListDirPageData,
} from "../../../../api/datadocs-panel";
import type { DatadocsObjectNode } from "./type";
import type { Node } from "../../../common/file-system/fileSystemStateManager";
import type { SearchNodeData } from "../../../common/file-system/fileSystemStateManager";
import { getWorkbookUrl, setActiveWorkbook } from "../../../../api";

export function getListDirFolderState(manager: DatadocsFileSystemManager) {
  return {
    sort: manager.sortType,
    objectId: manager.getUIRootId() ?? DATADOCS_PANEL_ROOT_ID,
  };
}

export function getFolderData(manager: DatadocsFileSystemManager) {
  const { sort, objectId } = getListDirFolderState(manager);
  const cachedData = getDatadocsPanelFileSystemData();
  const data = cachedData?.[sort]?.[objectId];
  return data ? { path: data.path, children: data.pages.getAll() } : null;
}

/**
 * Check if there is a next page of list_dir data
 */
export function checkListDirNextPage(manager: DatadocsFileSystemManager) {
  const { sort, objectId } = getListDirFolderState(manager);
  const cachedData = getDatadocsPanelFileSystemData();
  const data = cachedData?.[sort]?.[objectId];
  return data?.pages?.hasNextPage();
}

/**
 * Check if the first page data of list_dir has been loaded or not
 */
export function checkListDirFirstPageLoaded(
  manager: DatadocsFileSystemManager
) {
  const { sort, objectId } = getListDirFolderState(manager);
  const cachedData = getDatadocsPanelFileSystemData();
  const data = cachedData?.[sort]?.[objectId];
  return data?.pages?.hasPage(0);
}

export async function loadNextPageData(
  manager: DatadocsFileSystemManager,
  pageIndex = -1
) {
  const { sort, objectId } = getListDirFolderState(manager);
  const success = await loadListDirPageData(objectId, pageIndex, sort);
  if (success) {
    triggerRebuildFileSystem(manager);
    return true;
  } else {
    return false;
  }
}

/**
 * Force rebuild file system with new data and show it
 * @param manager
 */
export function triggerRebuildFileSystem(manager: DatadocsFileSystemManager) {
  const data = getFolderData(manager);
  if (data) {
    manager.rebuildFileSystem([...(data.path ?? []), ...data.children]);
  }
}

export function getSearchState(manager: DatadocsFileSystemManager) {
  const config = manager.getSearchConfig();
  return {
    sort: config.sort,
    searchText: config?.searchText,
  };
}

export function rebuildSearchResult(
  manager: DatadocsFileSystemManager
): SearchNodeData<Node<DatadocsObjectNode>>[] {
  const objects = getDatadocsSearchData();
  const existingIds: Set<string> = new Set();
  const data: SearchNodeData<Node<DatadocsObjectNode>>[] = [];
  for (const obj of objects) {
    if (!existingIds.has(obj.id)) {
      data.push({
        node: manager.createUINode(obj),
        path: obj.path ?? null,
      });
      existingIds.add(obj.id);
    }
  }
  return data;
}

export async function openWorkbook(objectId: string, newTab = true) {
  const url = getWorkbookUrl(objectId);
  if (!url) return;

  if (newTab) {
    open(url, "_blank");
  } else {
    await setActiveWorkbook(objectId);
  }
}
