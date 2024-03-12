import { get } from "svelte/store";
import type { AxiosRequestConfig } from "axios";
import type {
  APIConfig,
  DatadocsObjectNodeDetails,
  DatadocsObjectType,
  DatadocsPanelListDirSort,
  DatadocsPanelObjectData,
  DatadocsSearchData,
} from "../type";
import { axiosCall } from "../common";
import {
  datadocsObjectDetailsMapStore,
  datadocsPanelFileSystemStore,
  datadocsSearchDataStore,
} from "../../app/store/writables";
import type { DatadocsObjectNode } from "../../components/panels/Datadocs/components/type";
import { DataPagingManager } from "../utils/DataPagingManager";
import type { QueryKey } from "../utils/QueryManager";

export const DATADOCS_PANEL_ROOT_ID = "datadocs-panel-root-id";
export const DEFAULT_LIST_DIR_PAGE_SIZE = 200;
export const DEFAULT_SEARCH_PAGE_SIZE = 50;

async function fetchDatadocsObjectsList(
  options: Partial<{
    objectId: string;
    page: number;
    size: number;
    sort: DatadocsPanelListDirSort;
  }> = {},
  config: APIConfig = {}
) {
  const params: Record<string, any> = { action: "list" };
  if (options.objectId) params.objectId = options.objectId;
  if (options.page) params.page = options.page;
  if (options.size) params.size = options.size;
  if (options.sort && options.sort !== "default") params.sort = options.sort;

  const queryKey: QueryKey = {
    ...params,
    url: "/user-docs/objects/get",
    method: "get",
  };
  const requestConfig: AxiosRequestConfig = {
    url: "/user-docs/objects/get",
    method: "get",
    params,
  };
  return await axiosCall(requestConfig, config, queryKey);
}

async function searchDatadocsObjects(
  options: Partial<{
    searchText: string;
    page: number;
    size: number;
    sort: DatadocsPanelListDirSort;
  }> = {},
  config: APIConfig = {}
) {
  const params = {
    q: options.searchText,
    page: options.page ?? 1,
    size: options.size ?? DEFAULT_SEARCH_PAGE_SIZE,
    sort: options.sort === "default" ? "name:asc" : options.sort,
  };
  const queryKey: QueryKey = {
    ...params,
    url: "/user-docs/search",
    method: "get",
  };
  const requestConfig: AxiosRequestConfig = {
    url: "/user-docs/search",
    method: "get",
    timeout: 20000, // The search may take long time to finish
    params,
  };
  return await axiosCall(requestConfig, config, queryKey);
}

async function fetchDatadocsObjectDetails(
  objectId: string,
  config: APIConfig = {}
) {
  const requestConfig: AxiosRequestConfig = {
    url: "/user-docs/objects/get",
    method: "get",
    params: { action: "detail", objectId },
  };
  const queryKey: QueryKey = {
    ...requestConfig.params,
    url: "/user-docs/objects/get",
    method: "get",
  };
  return await axiosCall(requestConfig, config, queryKey);
}

async function createObject(
  data: { name: string; type: DatadocsObjectType; parentId: string },
  config: APIConfig = {}
) {
  const requestConfig: AxiosRequestConfig = {
    url: "/user-docs/objects/create",
    method: "post",
    data,
  };
  return await axiosCall(requestConfig, config);
}

async function renameObject(
  objectId: string,
  name: string,
  config: APIConfig = {}
) {
  const requestConfig: AxiosRequestConfig = {
    url: `/user-docs/objects/${objectId}/name`,
    method: "put",
    data: { name },
  };
  return await axiosCall(requestConfig, config);
}

async function moveObjects(
  fromObjectIds: string[],
  toObjectId: string,
  config: APIConfig = {}
) {
  const requestConfig: AxiosRequestConfig = {
    url: `/user-docs/objects/move`,
    method: "put",
    data: { fromObjectIds, toObjectId: toObjectId ?? null },
  };
  return await axiosCall(requestConfig, config);
}

async function deleteObjects(
  objectIds: string[],
  recursive = false,
  config: APIConfig = {}
) {
  const requestConfig: AxiosRequestConfig = {
    url: `/user-docs/objects/delete`,
    method: "delete",
    data: { objectIds, recursive },
  };
  return await axiosCall(requestConfig, config);
}

export async function getObjectPermissionToken(
  objectIds: string[],
  config: APIConfig = {}
) {
  const requestConfig: any = {
    url: `/user-docs/objects/token`,
    method: "post",
    data: { objectIds },
  };
  const data = await axiosCall(requestConfig, config);
  return data;
}

/**
 * Get datadocs panel data, init if empty
 * @returns
 */
export function getDatadocsPanelFileSystemData() {
  const sorts: DatadocsPanelListDirSort[] = [
    "default",
    "access:desc",
    "name:asc",
  ];
  let data = get(datadocsPanelFileSystemStore);

  if (!data) {
    data = {};
    datadocsPanelFileSystemStore.set(data);
  }
  for (const sort of sorts) {
    if (!data[sort]) data[sort] = {};
  }
  return data;
}

/**
 * Get data for a specific page index or next page
 *
 * NOTE: We have three sort type for now and the `default` sort is in
 * `a-z` order. It's similar to `name:asc` sort so we do the same fectching
 * for both.
 * @param pageIndex `-1` is default for getting next page data
 * @returns `true` if new data has been fetch and added to list dir data,
 * `false` otherwise
 */
export async function loadListDirPageData(
  objectId = DATADOCS_PANEL_ROOT_ID,
  pageIndex = -1,
  sort: DatadocsPanelListDirSort = "default"
) {
  const isDefaultSort = sort === "default";

  // Datadocs Panel `default` sort is actually `name:asc` (a-z order) so
  // the actual data we need to get here is `name:asc`.
  if (isDefaultSort) {
    sort = "name:asc";
  }

  const listDirData = getDatadocsPanelFileSystemData();
  const cachedData = listDirData[sort];
  if (!cachedData[objectId]) {
    cachedData[objectId] = {
      path: null,
      pages: new DataPagingManager<DatadocsObjectNode>(
        DEFAULT_LIST_DIR_PAGE_SIZE
      ),
    };
  }

  const objectListDir = cachedData[objectId];
  let fetchPageIndex: number;
  if (pageIndex >= 0) {
    const pageData = objectListDir.pages.getPage(pageIndex);
    if (pageData) {
      return false;
    } else {
      fetchPageIndex = pageIndex;
    }
  } else {
    if (!objectListDir.pages.hasNextPage()) {
      return false;
    }
    fetchPageIndex = objectListDir.pages.nextPageIndex();
  }

  const data = await fetchDatadocsObjectsList({
    objectId: objectId === DATADOCS_PANEL_ROOT_ID ? null : objectId,
    page: fetchPageIndex + 1, // page parameter start from 1
    size: DEFAULT_LIST_DIR_PAGE_SIZE,
    sort,
  });

  if (!data) {
    return false;
  }

  if (isDefaultSort) {
    // Make sure the cache data of default sort point to the same object
    // as the `name:asc sort`.
    listDirData["default"] = listDirData[sort];
  }

  if (data && data.children && data.path) {
    const pageData = listObjectDataToDatadocsObjectNodes(data.children);
    objectListDir.path = listObjectDataToDatadocsObjectNodes(data.path);
    objectListDir.pages.addPage(pageData, fetchPageIndex);
    if (fetchPageIndex === 0) {
      objectListDir.timestamp = data.timestamp;
    }
    if (
      !objectListDir.lastUpdated ||
      objectListDir.lastUpdated < data.timestamp
    ) {
      objectListDir.lastUpdated = data.timestamp;
    }
    if (!data.hasNext) {
      // If there is no next page, just set the next page to empty
      objectListDir.pages.addPage([], fetchPageIndex + 1);
    }
    return true;
  } else {
    // Fail to load page data
    return false;
  }
}

export async function loadDatadocsObjectDetails(objectId: string) {
  const nodeDetailsMap = get(datadocsObjectDetailsMapStore);
  let nodeDetail: DatadocsObjectNodeDetails;

  if (!nodeDetailsMap.has(objectId)) {
    nodeDetail = { fetching: false };
    nodeDetailsMap.set(objectId, nodeDetail);
  } else {
    nodeDetail = nodeDetailsMap.get(objectId);
  }

  // The object detail is currently fetching
  if (nodeDetail.fetching) return;

  nodeDetail.fetching = true;
  const data = await fetchDatadocsObjectDetails(objectId);
  nodeDetail.fetching = false;

  if (data && data.object && data.path) {
    const path = listObjectDataToDatadocsObjectNodes(data.path);
    const object = objectDataToDatadocsObjectNode(data.object);
    if (object.id !== objectId) {
      return false;
    }

    nodeDetailsMap.set(object.id, { ...data, path, object });
    datadocsObjectDetailsMapStore.set(nodeDetailsMap);
  }
}

export function getDatadocsObjectDetails(objectId: string) {
  const nodeDetailsMap = get(datadocsObjectDetailsMapStore);
  if (nodeDetailsMap.has(objectId)) {
    return nodeDetailsMap.get(objectId);
  }
  return null;
}

/**
 * Rename a datadocs panel object. Return `true` if the rename process is
 * success, otherwise `false`
 */
export async function renameDatadocsPanelObject(
  objectId: string,
  name: string
) {
  const response = await renameObject(objectId, name);
  const object = response?.object;
  if (object) {
    updateObjectDetails([objectDataToDatadocsObjectNode(object)]);
    return true;
  }
  return false;
}

export async function moveDatadocsPanelObjects(
  fromObjectIds: string[],
  toObjectId: string
) {
  const response = await moveObjects(fromObjectIds, toObjectId);
  return !!response;
}

export async function deleteDatadocsPanelObjects(objectIds: string[]) {
  const response = await deleteObjects(objectIds, true);
  const deletedIds = response?.deletedObjectIds;
  if (deletedIds) {
    handleDeletedObjects(deletedIds);
  }
  return deletedIds;
}

export async function createDatadocsPanelObject(
  name: string,
  type: DatadocsObjectType,
  parentId: string
) {
  const response = await createObject({
    name,
    type,
    parentId: parentId ?? null,
  });

  return response?.object
    ? objectDataToDatadocsObjectNode(response.object)
    : null;
}

/**
 * Clear outdated data when datadocs panel mutation happen. Safely clear all
 * data for now.
 */
export function clearDatadocsPanelOutdatedData(
  type: "create" | "rename" | "move" | "delete" | "reload",
  objectIds: string[]
) {
  setDatadocsPanelData(null);
}

export function getDatadocsPanelDataSnapshot() {
  return {
    datadocsPanelFileSystem: { ...getDatadocsPanelFileSystemData() },
    datadocsObjectDetailsMap: get(datadocsObjectDetailsMapStore),
  };
}

export function setDatadocsPanelData(
  data?: ReturnType<typeof getDatadocsPanelDataSnapshot>
) {
  datadocsPanelFileSystemStore.set(data?.datadocsPanelFileSystem ?? {});
}

export function objectDataToDatadocsObjectNode(
  object: DatadocsPanelObjectData
): DatadocsObjectNode {
  return {
    id: object.objectId,
    parent: object.parentId,
    name: object.name,
    type: object.type,
    ownerId: object.ownerId,
    creatorId: object.creatorId,
    createdAt: object.createdAt,
    updatedAt: object.updatedAt,
    lastOpened: object.lastOpened,
    path: object.path,
  };
}

export function listObjectDataToDatadocsObjectNodes(
  objectList: DatadocsPanelObjectData[]
): DatadocsObjectNode[] {
  return objectList.map((object) => objectDataToDatadocsObjectNode(object));
}

export async function getSearchObjectsData(
  searchText: string,
  pageIndex = -1,
  sort = "name:asc"
) {
  const fetchPageIndex = pageIndex === -1 ? 0 : pageIndex;
  const data = await searchDatadocsObjects({
    searchText,
    page: fetchPageIndex + 1, // page parameter start from 1
    sort: sort === "access:desc" ? "access:desc" : "name:asc",
  });
  return data?.objects
    ? listObjectDataToDatadocsObjectNodes(data.objects)
    : null;
}

export async function loadDatadocsSearchDataNextPage() {
  const searchData = get(datadocsSearchDataStore);
  if (!searchData || !searchData.pages.hasNextPage()) return;
  const pageIndex = searchData.pages.nextPageIndex();
  const data = await getSearchObjectsData(
    searchData.searchText,
    pageIndex,
    searchData.sort
  );
  if (data) {
    searchData.pages.addPage(data, pageIndex);
    datadocsSearchDataStore.set(searchData);
  }
}

export function initDatadocsSearchData(
  searchText: string,
  sort: DatadocsPanelListDirSort,
  firstPageData: DatadocsObjectNode[]
) {
  const searchData: DatadocsSearchData = {
    searchText,
    sort: sort,
    pages: new DataPagingManager<DatadocsObjectNode>(DEFAULT_SEARCH_PAGE_SIZE),
  };
  if (firstPageData) {
    searchData.pages.addPage(firstPageData, 0);
  }
  datadocsSearchDataStore.set(searchData);
}

export function getDatadocsSearchData() {
  const searchData = get(datadocsSearchDataStore);
  return searchData?.pages.getAll() ?? null;
}

export function clearDatadocsSearchData() {
  const searchData = get(datadocsSearchDataStore);
  searchData?.pages.clearAll();
}

export function hasDatadocsSearchDataNextPage() {
  const searchData = get(datadocsSearchDataStore);
  return searchData?.pages.hasNextPage();
}

export function updateObjectDetails(objects: DatadocsObjectNode[]) {
  const objectDetailsMap = get(datadocsObjectDetailsMapStore);
  for (const object of objects) {
    if (objectDetailsMap.has(object.id)) {
      const objectDetail = objectDetailsMap.get(object.id);
      objectDetail.object.name = object.name;
      objectDetail.object.lastOpened = object.lastOpened;
      objectDetail.object.updatedAt = object.updatedAt;
    }
  }
  datadocsObjectDetailsMapStore.set(objectDetailsMap);
}

export function handleDeletedObjects(objectIds: string[]) {
  const objectDetailsMap = get(datadocsObjectDetailsMapStore);
  for (const id of objectIds) {
    if (objectDetailsMap.has(id)) {
      objectDetailsMap.delete(id);
    }
  }
  datadocsObjectDetailsMapStore.set(objectDetailsMap);
}
