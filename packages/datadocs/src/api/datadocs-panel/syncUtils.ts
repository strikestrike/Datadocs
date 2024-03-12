import { get } from "svelte/store";
import type {
  DatadocsPanelListDirSort,
  DatadocsPanelSyncObjectData,
} from "./type";
import {
  DATADOCS_PANEL_ROOT_ID,
  DEFAULT_LIST_DIR_PAGE_SIZE,
  clearDatadocsPanelOutdatedData,
  getDatadocsPanelFileSystemData,
  listObjectDataToDatadocsObjectNodes,
  objectDataToDatadocsObjectNode,
  updateObjectDetails,
} from "./datadocsPanel";
import {
  activeWorkbookStore,
  datadocsFileSystemManagerStore,
  datadocsPanelFileSystemStore,
} from "../../app/store/writables";
import { DataPagingManager } from "../utils/DataPagingManager";
import type { DatadocsObjectNode } from "../../components/panels/Datadocs/components/type";
import {
  updateActiveWorkbookOnDeletion,
  updateWorkbookList,
} from "../workbook";

export function syncDatadocsObjectData(
  objectId: string,
  data: DatadocsPanelSyncObjectData,
  isFolder: boolean
) {
  // console.log("debug here ====== sync data ===== ", data);
  if (data.delete) {
    syncDeleteObject(objectId, data, isFolder);
  } else if (isFolder) {
    if (data.sync) {
      syncFolderObjectData(objectId, data);
    }
  } else {
    syncWorkbookObjectData(objectId, data);
  }
}

/**
 * Sync data when an object has been deleted. If the current folder is deleted,
 * load root folder.
 * @param objectId
 * @param data
 * @param isFolder
 * @returns
 */
function syncDeleteObject(
  objectId: string,
  data: DatadocsPanelSyncObjectData,
  isFolder: boolean
) {
  if (isFolder) {
    const stateManager = get(datadocsFileSystemManagerStore);
    if (stateManager.getUIRootId() === objectId) {
      stateManager.setUIRoot(null);
      clearDatadocsPanelOutdatedData("delete", []);
    }
    clearObjectData(objectId);
  } else {
    updateActiveWorkbookOnDeletion([objectId]);
  }

  updateWorkbookList();
  return true;
}

function syncFolderObjectData(
  objectId: string,
  data: DatadocsPanelSyncObjectData
) {
  objectId = objectId ?? DATADOCS_PANEL_ROOT_ID;
  const panelData = getDatadocsPanelFileSystemData();
  const defaultData = panelData["default"];
  const nameData = panelData["name:asc"];
  const accessData = panelData["access:desc"];
  const firestoreDataTimestamp = data.timestamp;
  let hasChanged = false;

  if (
    nameData[objectId]?.path &&
    nameData[objectId].timestamp < firestoreDataTimestamp &&
    data.name_asc
  ) {
    const objectPath = nameData[objectId].path;
    defaultData[objectId] = nameData[objectId] = {
      path: objectPath,
      pages: new DataPagingManager<DatadocsObjectNode>(
        DEFAULT_LIST_DIR_PAGE_SIZE
      ),
      timestamp: firestoreDataTimestamp,
      lastUpdated: firestoreDataTimestamp,
    };
    nameData[objectId].pages.addPage(
      listObjectDataToDatadocsObjectNodes(data.name_asc),
      0
    );
    nameData[objectId].pages.addPage([], 1);
    hasChanged = true;
  }

  if (
    accessData[objectId]?.path &&
    accessData[objectId].timestamp < firestoreDataTimestamp &&
    data.access_desc
  ) {
    const objectPath = accessData[objectId].path;
    accessData[objectId] = {
      path: objectPath,
      pages: new DataPagingManager<DatadocsObjectNode>(
        DEFAULT_LIST_DIR_PAGE_SIZE
      ),
      timestamp: firestoreDataTimestamp,
      lastUpdated: firestoreDataTimestamp,
    };
    accessData[objectId].pages.addPage(
      listObjectDataToDatadocsObjectNodes(data.access_desc),
      0
    );
    accessData[objectId].pages.addPage([], 1);
    hasChanged = true;
  }

  if (hasChanged) {
    datadocsPanelFileSystemStore.set(panelData);
  }

  if (
    (nameData[objectId]?.timestamp <= firestoreDataTimestamp &&
      data.name_asc) ||
    (accessData[objectId]?.timestamp <= firestoreDataTimestamp &&
      data.access_desc)
  ) {
    const objects = listObjectDataToDatadocsObjectNodes(data.name_asc);
    if (data.object) {
      objects.push(objectDataToDatadocsObjectNode(data.object));
    }
    updateObjectDetails(objects);
  }
}

/**
 * Sync data for current active workbook if possible
 * @param objectId
 * @param data
 */
function syncWorkbookObjectData(
  objectId: string,
  data: DatadocsPanelSyncObjectData
) {
  const activeWorkbook = get(activeWorkbookStore);
  const isFirestoreDataOutdated =
    data.timestamp <=
    Math.max(activeWorkbook.updatedAt ?? 0, activeWorkbook.lastOpened ?? 0);

  if (
    activeWorkbook.id === objectId &&
    data.object &&
    !isFirestoreDataOutdated
  ) {
    activeWorkbook.name = data.object.name;
    activeWorkbook.vanitySlug = data.object.vanitySlug;
    activeWorkbook.lastOpened = data.object.lastOpened;
    activeWorkbook.updatedAt = data.object.updatedAt;
    activeWorkbookStore.set(activeWorkbook);
    updateObjectDetails([objectDataToDatadocsObjectNode(data.object)]);
  }
}

/**
 * Clear all list_dir data of an folder
 */
function clearObjectData(objectId: string) {
  objectId = objectId ?? DATADOCS_PANEL_ROOT_ID;
  const panelData = getDatadocsPanelFileSystemData();
  const sorts: DatadocsPanelListDirSort[] = [
    "default",
    "name:asc",
    "access:desc",
  ];
  for (const sort of sorts) {
    if (panelData[sort][objectId]) {
      panelData[sort][objectId] = null;
    }
  }
}
