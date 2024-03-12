import { get } from "svelte/store";
import type { AxiosError, AxiosRequestConfig } from "axios";
import type {
  APIConfig,
  DatadocsPanelObjectData,
  WorkbookData,
  WorksheetData,
} from "./type";
import { axiosCall, handleError } from "./common";
import type { Workbook, WorkbookSheet } from "../app/store/types";
import {
  workbookListStore,
  activeWorkbookStore,
  sheetsDataStore,
  datadocsObjectDetailsMapStore,
  routeBasePathStore,
} from "../app/store/writables";
import getDefaultWorksheet from "../app/store/sheets/default-wsheet";
import { loginStatusStore } from "./store";
import { getDatadocsPanelSyncManager } from "./datadocs-panel";

const DEFAULT_WORKBOOK_NAME = "Untitled";
const CREATE_WORKBOOK_ACTION = "create_workbook";
const datadocsObjectType = { WORKBOOK: "wb", FOLDER: "fd" };

/**
 * Get current user workbook list
 * @param config
 * @returns
 */
export async function getWorkbookList(config: APIConfig = {}) {
  const requestConfig: AxiosRequestConfig = {
    url: "/user-docs/workbooks",
    method: "get",
  };
  const data = await axiosCall(requestConfig, config);
  return data;
}

/**
 * Create new workbook
 */
export async function createNewWorkbook(
  name = DEFAULT_WORKBOOK_NAME,
  parentId: string = null,
  config: APIConfig = {}
) {
  const requestConfig: AxiosRequestConfig = {
    url: "/user-docs/objects/create",
    method: "post",
    data: { name, parentId, type: datadocsObjectType.WORKBOOK },
  };
  const data = await axiosCall(requestConfig, config);
  return data;
}

/**
 * Change the name of the active workbook
 * @param name New workbook name
 * @param config
 * @returns
 */
export async function changeWorkbookName(name: string, config: APIConfig = {}) {
  const activeWorkbook = get(activeWorkbookStore);
  if (activeWorkbook) {
    const requestConfig: AxiosRequestConfig = {
      url: `/user-docs/objects/${activeWorkbook.id}/name`,
      method: "put",
      data: { name },
    };
    const data = await axiosCall(requestConfig, config);
    return data;
  }
}

/**
 * Delete a workbook
 * @param id
 * @param config
 * @returns
 */
export async function deleteWorkbook(id: string, config: APIConfig = {}) {
  const requestConfig: AxiosRequestConfig = {
    url: "/user-docs/objects/delete",
    method: "delete",
    data: { objectIds: [id] },
  };
  const data = await axiosCall(requestConfig, config);
  return data;
}

export async function getWorkbookById(id: string, config: APIConfig = {}) {
  const requestConfig: AxiosRequestConfig = {
    url: `/user-docs/workbooks/${id}`,
    method: "get",
  };
  const data = await axiosCall(requestConfig, config);
  return data?.workbook ? datadocsObjectToWorkbook(data.workbook) : null;
}

export async function getWorkbookByVanityName(
  vanityName: string,
  vanitySlug: string,
  config: APIConfig = {}
) {
  const requestConfig: AxiosRequestConfig = {
    url: `/user-docs/workbooks/${vanityName}/${vanitySlug}`,
    method: "get",
  };
  const data = await axiosCall(requestConfig, config);
  return data?.workbook ? datadocsObjectToWorkbook(data.workbook) : null;
}

/*
workbookParamsStateStore.subscribe(async param => {
  if (!param) return;
  if (param.type === "VANITY_NAME") {
    const user = get(userInformationStore);
    getWorkbookByVanityName(user.vanityName, param.vanitySlug, {
      onSuccess: async (data) => {
        console.log("debug here ==== getWorkbookByVanityName === ", data);
      },
      onError: async (error) => {
        console.log("debug here ==== error  getWorkbookByVanityName === ", error);
      }
    });
  } else {
    getWorkbookById(param.guid, {
      onSuccess: async (data) => {
        console.log("debug here ==== getWorkbookById === ", data);
      },
      onError: async (error) => {
        console.log("debug here ==== error  getWorkbookById === ", error);
      }
    });
  }
})
*/

/**
 * It is used for getting the worksheet list of active workbook
 * Note: It also sets the last open time of the workbook
 * @param config
 * @returns
 */
export async function getWorksheetList(
  objectId: string,
  config: APIConfig = {}
) {
  const requestConfig: AxiosRequestConfig = {
    url: "/user-docs/worksheets",
    method: "get",
    params: { objectId },
  };
  const data = await axiosCall(requestConfig, config);

  if (data) {
    // Update new worksheet list
    return {
      workbook: data.workbook ? datadocsObjectToWorkbook(data.workbook) : null,
      worksheets: generateNewWorksheetList(data.worksheets ?? []),
    };
  }

  // don't have sheets data, so worksheets data will be empty
  return { workbook: null, worksheets: null };
}

export async function openWorkbook(objectId: string, config: APIConfig = {}) {
  const requestConfig: AxiosRequestConfig = {
    url: `/user-docs/workbooks/open`,
    method: "put",
  };
  const data = await axiosCall(requestConfig, config);

  if (data) {
    // Update new worksheet list
    return {
      workbook: data.workbook ? datadocsObjectToWorkbook(data.workbook) : null,
      worksheets: generateNewWorksheetList(data.worksheets ?? []),
    };
  }

  // workbook not found
  return null;
}

/**
 * Create a new worksheet inside a workbook
 * @param activeWorksheetId The new workbook will be after the worksheet with previousWorksheetId
 * @param config
 */
export async function createNewWorksheet(
  workbookId: string,
  activeWorksheetId: string,
  config: APIConfig = {}
) {
  const requestConfig: AxiosRequestConfig = {
    url: "/user-docs/worksheets/create",
    method: "post",
    data: { objectId: workbookId, previousWorksheetId: activeWorksheetId },
  };

  const data = await axiosCall(requestConfig, config);
  return data;
}

/**
 * Delete a worksheet
 * @param workbookId
 * @param worksheetId
 * @param config
 * @returns
 */
export async function deleteWorksheet(
  workbookId: string,
  worksheetId: string,
  config: APIConfig = {}
) {
  const requestConfig: AxiosRequestConfig = {
    url: "/user-docs/worksheets/delete",
    method: "delete",
    data: { objectId: workbookId, worksheetId },
  };
  const data = await axiosCall(requestConfig, config);
  return data;
}

/**
 * Reorder worksheet
 * @param workbookId
 * @param worksheetId
 * @param previousWorksheetId
 * @param config
 * @returns
 */
export async function reorderWorksheet(
  workbookId: string,
  worksheetId: string,
  previousWorksheetId: string,
  config: APIConfig = {}
) {
  const requestConfig: AxiosRequestConfig = {
    url: "/user-docs/worksheets/reorder",
    method: "put",
    data: { objectId: workbookId, worksheetId, previousWorksheetId },
  };
  const data = await axiosCall(requestConfig, config);
  return data;
}

export async function changeWorksheetName(
  worksheet: WorkbookSheet,
  config: APIConfig = {}
) {
  const { workbookId, id, name } = worksheet;
  const requestConfig: AxiosRequestConfig = {
    url: "/user-docs/worksheets/name",
    method: "put",
    data: { objectId: workbookId, worksheetId: id, name },
  };
  const data = await axiosCall(requestConfig, config);
  return data;
}

export async function duplicateWorksheet(
  worksheet: WorkbookSheet,
  config: APIConfig = {}
) {
  const requestConfig: AxiosRequestConfig = {
    url: "/user-docs/worksheets/duplicate",
    method: "post",
    data: { objectId: worksheet.workbookId, worksheetId: worksheet.id },
  };

  const data = await axiosCall(requestConfig, config);
  return data;
}

export async function recoverWorksheet(
  workbookId: string,
  worksheetId: string,
  position: number,
  config: APIConfig = {}
) {
  const requestConfig: AxiosRequestConfig = {
    url: "/user-docs/worksheets/recover",
    method: "put",
    data: { objectId: workbookId, worksheetId, position },
  };
  const data = await axiosCall(requestConfig, config);
  return data;
}

/**
 * Generate a url that is used for creating a new workbook
 *
 * If inside url, we have search params action=CREATE_WORKBOOK_ACTION,
 * we will need to create new workbook on init workbook data
 * @returns
 */
export function getCreateNewWorkbookUrl() {
  const newWorkbookUrl = new URL(window.location.href);
  newWorkbookUrl.searchParams.append("action", CREATE_WORKBOOK_ACTION);
  return newWorkbookUrl.toString();
}

export function isCreatingWorkbook() {
  const url = new URL(location.toString());
  return url.searchParams.get("action") === CREATE_WORKBOOK_ACTION;
}

/**
 * Generate a workbook URL from string, is used to open the workbook
 * on new tab or so.
 * @param workbookId
 * @returns
 */
export function getWorkbookUrl(workbookId: string) {
  const url = new URL(window.location.toString());
  let routeBasePath = get(routeBasePathStore);

  if (url.pathname.startsWith("/debug/")) return;
  if (routeBasePath) {
    routeBasePath = routeBasePath.replace(/\/*$/, "");
  }
  url.pathname = `${routeBasePath}/${workbookId}`;
  return url;
}

/**
 * Init workbook data, it is called shortly after a user has
 * logged in. It will generate a workbookList and saving into
 * workbookListStore.
 * @returns
 */
export async function initWorkbookData() {
  // Do nothing if user hasn't logged in
  if (!get(loginStatusStore)) return;

  // if there is action=CREATE_WORKBOOK_ACTION inside search params
  // need to create new workbook and open it
  const url = new URL(location.toString());
  if (isCreatingWorkbook()) {
    await createNewWorkbook(DEFAULT_WORKBOOK_NAME, null, {
      onSuccess: async (workbookData) => {
        // remove action search params from url
        url.searchParams.delete("action");
        history.replaceState(null, "", url.toString());

        // Update workbook list data
        await updateWorkbookList();

        // set newly created workbook as active workbook
        const newWorkbook: WorkbookData = workbookData.object;
        await setActiveWorkbook(newWorkbook.objectId);
      },
      onError: async (error) => {
        handleError(error, {
          onRequestError: (error: AxiosError) => {
            if (error.response.status === 403) {
              alert(error.response.data["message"]);
            }
          },
        });
        // remove action search params from url
        url.searchParams.delete("action");
        history.replaceState(null, "", url.toString());
        location.reload();
      },
    });
  } else {
    const data = await getWorkbookList();
    let newWorkbookList = [];
    if (data.workbooks.length > 0) {
      newWorkbookList = generateNewWorkbookList(data.workbooks);
    } else {
      // There is no workbook yet, create a new one
      const workbookData = await createNewWorkbook();
      if (!workbookData) return;
      const newWorkbook: WorkbookData = workbookData.object;
      newWorkbookList = generateNewWorkbookList([newWorkbook]);
    }

    // Update workbook list data
    workbookListStore.set(newWorkbookList);
  }
}

/**
 * Generate workbook list in combination of server data and current workbook list
 * @param workbooks
 * @returns
 */
function generateNewWorkbookList(workbooks: WorkbookData[]) {
  const newWorkbookList: Workbook[] = [];
  workbooks.forEach((wb) => {
    const newWb = datadocsObjectToWorkbook(wb);
    newWorkbookList.push(newWb);
  });

  // sort workbook list in last open order
  newWorkbookList.sort((a, b) => {
    return b.lastOpened - a.lastOpened;
  });
  return newWorkbookList;
}

/**
 * Generate new Worksheet from server data
 * @param wsData
 * @returns
 */
export function worksheetDataToWorksheet(wsData: WorksheetData): WorkbookSheet {
  const sheet = get(sheetsDataStore).find(
    (sheet) => sheet.id === wsData.worksheetId
  );
  return {
    id: wsData.worksheetId,
    workbookId: wsData.objectId,
    name: wsData.name,
    type: "SPREADSHEET",
    isActive: false,
    data: { id: "" },
    config: sheet?.config || getDefaultWorksheet(),
    position: wsData.position,
  };
}

export function generateNewWorksheetList(worksheets: WorksheetData[]) {
  const newWorksheetList: WorkbookSheet[] = [];
  worksheets.forEach((wsData) => {
    newWorksheetList.push(worksheetDataToWorksheet(wsData));
  });
  newWorksheetList.sort((a, b) => a.position - b.position);
  if (newWorksheetList[0]) newWorksheetList[0].isActive = true;
  return newWorksheetList;
}

/**
 * After a new worksheet was added, need to update the worksheet store
 * with the new data, add the Worksheed to the right of active worksheet
 * @param worksheetData
 * @param activeWorksheetId
 */
export function updateWorksheetOnCreation(
  worksheetData: WorksheetData,
  activeWorksheetId: string
) {
  const sheets = get(sheetsDataStore);
  const index = sheets.findIndex((s) => s.id === activeWorksheetId);
  const newSheet = worksheetDataToWorksheet(worksheetData);
  sheets.splice(index + 1, 0, newSheet);
  sheets.forEach((s) => {
    s.isActive = s.id === newSheet.id;
  });
  sheetsDataStore.set(sheets);
}

function datadocsObjectToWorkbook(object: DatadocsPanelObjectData): Workbook {
  return {
    id: object.objectId,
    name: object.name,
    lastOpened: object.lastOpened,
    createdAt: object.createdAt,
    updatedAt: object.updatedAt,
    vanitySlug: object.vanitySlug,
    ownerId: object.ownerId,
    creatorId: object.creatorId,
  };
}

function updateActiveWorkbookDetails(wb: Workbook) {
  if (!wb) return;

  datadocsObjectDetailsMapStore.update((map) => {
    if (map.has(wb.id)) {
      map.get(wb.id).object.lastOpened = wb.lastOpened;
    }
    return map;
  });
}

export async function updateWorkbookList() {
  // Update workbook list data
  const data = await getWorkbookList();
  if (data.workbooks) {
    workbookListStore.set(generateNewWorkbookList(data.workbooks));
  }
}

export async function updateActiveWorkbookOnDeletion(
  deletedObjectIds: string[]
) {
  // console.log("debug here ===== updateActiveWorkbookOnDeletion === ");
  const activeWorkbook = get(activeWorkbookStore);
  if (deletedObjectIds.includes(activeWorkbook.id)) {
    activeWorkbookStore.set(null);
    await initWorkbookData();
  } else {
    await updateWorkbookList();
  }
}

export async function setActiveWorkbook(objectId: string) {
  if (objectId === get(activeWorkbookStore)?.id) {
    // Not set the same object
    return;
  }

  const data = await openWorkbook(objectId);
  if (!data) return;
  activeWorkbookStore.set(data.workbook);
  getDatadocsPanelSyncManager().syncActiveWorkbook(data.workbook.id);
  sheetsDataStore.set(data.worksheets ?? []);
  updateWorkbookList();
  updateActiveWorkbookDetails(data.workbook);
}
