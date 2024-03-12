/**
 * @packageDocumentation
 * @module app/store-workbooks
 * Overview: Datadocs workbook is an excel like workbook, which contains
 * multiple worksheets. In side worksheets we can have
 */

import { get } from "svelte/store";
import type { Workbook, WorkbookParamsState } from "./types";
import { userInformationStore } from "../../api/store";

import wsheet00Blank from "./sheets/wsheet-00-blank-fixed";
import wsheet01Single from "../store/sheets/wsheet-01-single";
import wsheet02Tiled from "../store/sheets/wsheet-02-tiled";
import wsheet03Tabs from "../store/sheets/wsheet-03-tabs";
import wsheet04Divide from "../store/sheets/wsheet-04-divide";
import wsheet05Nested from "../store/sheets/wsheet-05-nested";
import { getId } from "../../layout/_dprctd/core/utils";
import {
  activeWorkbookStore,
  workbookListStore,
  workbookParamsStateStore,
  routeBasePathStore,
} from "./writables";
import { setActiveHistoryPanelManager } from "./panels/store-history-panel";
import {
  getWorkbookByVanityName,
  isCreatingWorkbook,
  setActiveWorkbook,
} from "../../api";

export { activeWorkbookStore, workbookListStore, workbookParamsStateStore };

export const SPREADSHEET = "SPREADSHEET";
export const BLANK_CANVAS = "BLANK_CANVAS";
export const GRAPH = "GRAPH";
export const SHEET_ICONS = {
  [SPREADSHEET]: "status-bar-spreadsheet",
  [BLANK_CANVAS]: "status-bar-blank-canvas",
  [GRAPH]: "status-bar-graph",
};

/*
export const workbookList: Workbook[] = [
  {
    id: "workbook_1",
    name: "Workbook 1",
    active: true,
    sheets: [
      {
        id: "1",
        name: "Sheet 1",
        isActive: true,
        icon: SHEET_ICONS[SPREADSHEET],
        data: {
          id: "sheet1",
        },
        config: structuredClone(wsheet01Single),
      },
      // {
      //   id: "2",
      //   name: "Sales By Region",
      //   isActive: false,
      //   icon: SHEET_ICONS[SPREADSHEET],
      //   data: {
      //     id: "salesByRegion",
      //   },
      //   config: structuredClone(wsheet02Tiled),
      // },
      // {
      //   id: "3",
      //   name: "Sales Report - 2021",
      //   isActive: false,
      //   icon: SHEET_ICONS[SPREADSHEET],
      //   data: {
      //     id: "salesReport",
      //   },
      //   config: structuredClone(wsheet03Tabs),
      // },
      // {
      //   id: "4",
      //   name: "Report 2022 Q3",
      //   isActive: false,
      //   icon: SHEET_ICONS[SPREADSHEET],
      //   data: {
      //     id: "report2022Q3",
      //   },
      //   config: structuredClone(wsheet04Divide),
      // },
      // {
      //   id: "5",
      //   name: "Report 2022 Q4",
      //   isActive: false,
      //   icon: SHEET_ICONS[SPREADSHEET],
      //   data: {
      //     id: "report2022",
      //   },
      //   config: structuredClone(wsheet05Nested),
      // },
    ],
  },
  {
    id: "workbook_2",
    name: "Workbook 2",
    active: false,
    sheets: [
      {
        id: "1",
        name: "Sales By Region - v2",
        isActive: true,
        icon: SHEET_ICONS[SPREADSHEET],
        data: {
          id: "salesByRegion",
        },
        config: structuredClone(wsheet03Tabs),
      },
    ],
  },
  {
    id: "workbook_3",
    name: "Workbook 3",
    active: false,
    sheets: [
      {
        id: "1",
        name: "Sales Report - 2021 - v2",
        isActive: true,
        icon: SHEET_ICONS[SPREADSHEET],
        data: {
          id: "salesReport",
        },
        config: structuredClone(wsheet05Nested),
      },
    ],
  },
];

workbookListStore.set(workbookList);
*/

export function createWorkbook() {
  /*
  workbookListStore.update((wbList) => {
    const newWorkbook: Workbook = {
      id: `workbook${getId()}`,
      name: "New Workbook " + wbList.length + 1,
      active: true,
      sheets: [
        {
          id: "1",
          name: "Sheet 1",
          isActive: true,
          icon: SHEET_ICONS[SPREADSHEET],
          data: {
            id: `sheet${getId()}`,
          },
          config: structuredClone(wsheet00Blank),
        },
      ],
    };

    for (let i = 0; i < wbList.length; i++) {
      const workbook = wbList[i];
      workbook.active = false;
    }

    wbList.push(newWorkbook);
    return wbList;
  });
  */
}

let initWorkbookWithParam = false;
export async function initWorkbookParamsState(params: Record<string, string>) {
  let state: WorkbookParamsState = null;
  if (params.guid) {
    state = { type: "GUID", guid: params.guid };
  } else if (params.owner && params.vanitySlug) {
    state = {
      type: "VANITY_NAME",
      owner: params.owner,
      vanitySlug: params.vanitySlug,
    };
  } else {
    state = { type: "GUID", guid: "" };
  }
  workbookParamsStateStore.set(state);

  if (!isCreatingWorkbook()) {
    // Get active workbook depend according to params
    let workbook: Workbook;
    if (state.type === "VANITY_NAME") {
      workbook = await getWorkbookByVanityName(state.owner, state.vanitySlug);
      if (workbook) await setActiveWorkbook(workbook.id);
    } else if (state.guid) {
      await setActiveWorkbook(state.guid);
    }

    if (!get(activeWorkbookStore) && get(workbookListStore)?.length > 0) {
      const wb = get(workbookListStore)[0];
      await setActiveWorkbook(wb.id);
    }
  }

  initWorkbookWithParam = true;
}

function canUseVanityNameUrl() {
  return !!get(userInformationStore).vanityName;
}

export function updateWorkbookParamsState() {
  const activeWorkbook = get(activeWorkbookStore);
  if (activeWorkbook) {
    workbookParamsStateStore.update((param) => {
      const user = get(userInformationStore);
      let newParam: WorkbookParamsState;
      if (param?.type === "VANITY_NAME" && canUseVanityNameUrl()) {
        newParam = {
          type: "VANITY_NAME",
          owner: user.vanityName,
          vanitySlug: activeWorkbook.vanitySlug,
        };
      } else {
        newParam = { type: "GUID", guid: activeWorkbook.id };
      }
      return newParam;
    });
  }
}

export function switchWorkbookUrlMode(mode: "GUID" | "VANITY_NAME") {
  const activeWorkbook = get(activeWorkbookStore);
  let newParam: WorkbookParamsState;
  if (mode === "VANITY_NAME" && canUseVanityNameUrl()) {
    const user = get(userInformationStore);
    newParam = {
      type: "VANITY_NAME",
      owner: user.vanityName,
      vanitySlug: activeWorkbook.vanitySlug,
    };
  } else {
    newParam = { type: "GUID", guid: activeWorkbook.id };
  }

  workbookParamsStateStore.set(newParam);
  activeWorkbookStore.set(activeWorkbook);
}

export async function switchWorkbook(id: string) {
  await setActiveWorkbook(id);
}

workbookListStore.subscribe((wbList) => {
  // Try to init active workbook with the first one in the list if there is no
  // workbook found with the URL params provided.
  if (initWorkbookWithParam && !get(activeWorkbookStore) && wbList.length > 0) {
    setActiveWorkbook(wbList[0].id);
  }
});

activeWorkbookStore.subscribe((activeWorkbook) => {
  if (!activeWorkbook) return;
  const url = new URL(window.location.toString());
  if (url.pathname.startsWith("/debug/")) return;
  let routeBasePath = get(routeBasePathStore);
  if (routeBasePath) routeBasePath = routeBasePath.replace(/\/*$/, "");
  const param = get(workbookParamsStateStore);
  if (param.type === "GUID") {
    url.pathname = `${routeBasePath}/${activeWorkbook.id}`;
  } else {
    const user = get(userInformationStore);
    url.pathname = `${routeBasePath}/${user.vanityName}/${activeWorkbook.vanitySlug}`;
  }
  history.replaceState(null, "", url.toString());
  setActiveHistoryPanelManager();
});
