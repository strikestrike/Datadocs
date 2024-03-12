/**
 * @packageDocumentation
 * @module app/store-work-sheets
 */

import { get } from "svelte/store";
import type { WorkbookSheet } from "./types";
import { activeWorkbookStore } from "./store-workbooks";
import wsheet00Blank from "./sheets/wsheet-00-blank";

import type { BLANK_CANVAS, GRAPH, SPREADSHEET } from "./store-workbooks";
import { SHEET_ICONS } from "./store-workbooks";
import type { WorkbookSheetType } from "./types";
import { isDraggingToReorderSheet, sheetsDataStore } from "./writables";
import type { Pane } from "../../layout/_dprctd/types";

export { sheetsDataStore, isDraggingToReorderSheet };

export type SheetType = typeof SPREADSHEET | typeof BLANK_CANVAS | typeof GRAPH;

const workbookTemplate: WorkbookSheet = {
  id: "template",
  name: "template",
  isActive: true,
  type: "SPREADSHEET",
  data: {
    id: "newSheet",
  },
  workbookId: "",
  position: 0,
  config: structuredClone(wsheet00Blank),
};

/**
 * Retrieve worksheet icon, which will be shown in tabs
 * @param type Type of worksheet
 * @returns
 */
export function getWorkbookSheetIcon(type: WorkbookSheetType) {
  return SHEET_ICONS[type] || "";
}

export function getSheetsData(): WorkbookSheet[] {
  return get(sheetsDataStore);
}

export function changeSheetsData(data: WorkbookSheet[]) {
  sheetsDataStore.set(data);
}

export function getCurrentActiveSheet(): WorkbookSheet {
  const data: WorkbookSheet[] = getSheetsData();

  return data.find((d) => d.isActive === true);
}

let currentSheetNameCount = 1;

export function getNextSheetNameCount(): number {
  currentSheetNameCount += 1;
  return currentSheetNameCount;
}

export function getWorkbookTemplate(): WorkbookSheet {
  return JSON.parse(JSON.stringify(workbookTemplate));
}

// Listen to active workbook change and update sheets data store
activeWorkbookStore.subscribe((activeWorkbook) => {
  if (!activeWorkbook) return;
  // sheetsDataStore.set(activeWorkbook.sheets);
});

export function getPaneByIdInWorksheet(id: string): Pane {
  const data: WorkbookSheet[] = getSheetsData();

  const getPaneById = (id: string, pane: Pane) => {
    if (pane.id === id) {
      return pane;
    } else if (pane.children) {
      for (const child of pane.children) {
        const childPane = getPaneById(id, child);
        if (childPane) {
          return childPane;
        }
      }
    }
    return null;
  };

  for (const sheet of data) {
    const pane = getPaneById(id, sheet.config.root);
    if (pane) {
      return pane;
    }
  }
  return null;
}

export function getPaneByViewNameInWorksheet(
  sheetname: string,
  name: string
): Pane {
  const data: WorkbookSheet[] = getSheetsData();

  const getPaneByViewName = (vname: string, pane: Pane) => {
    if (pane.content?.view?.label === vname) {
      return pane;
    } else if (pane.children) {
      for (const child of pane.children) {
        const childPane = getPaneByViewName(vname, child);
        if (childPane) {
          return childPane;
        }
      }
    }
    return null;
  };

  for (const sheet of data) {
    if (sheet.name === sheetname) {
      const pane = getPaneByViewName(name, sheet.config.root);
      if (pane) {
        return pane;
      }
    }
  }
  return null;
}

export function getFirstViewIdInWorksheet(sheetId: string): string {
  const data: WorkbookSheet[] = getSheetsData();

  const getFirstViewId = (pane: Pane) => {
    if (pane.content?.view?.id) {
      return pane.content?.view?.id;
    } else if (pane.children) {
      for (const child of pane.children) {
        const id = getFirstViewId(child);
        if (id) {
          return id;
        }
      }
    }
    return null;
  };

  for (const sheet of data) {
    if (sheet.id === sheetId) {
      const id = getFirstViewId(sheet.config.root);
      if (id) {
        return id;
      }
    }
  }
  return null;
}

export function getFirstPaneIdOfViewInWorksheet(sheetId: string): string {
  const data: WorkbookSheet[] = getSheetsData();

  const getFirstViewId = (pane: Pane) => {
    if (pane.content?.view?.id) {
      return pane.id;
    } else if (pane.children) {
      for (const child of pane.children) {
        const id = getFirstViewId(child);
        if (id) {
          return id;
        }
      }
    }
    return null;
  };

  for (const sheet of data) {
    if (sheet.id === sheetId) {
      const id = getFirstViewId(sheet.config.root);
      if (id) {
        return id;
      }
    }
  }
  return null;
}
