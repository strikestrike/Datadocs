/**
 * @packageDocumentation
 * @module app/store-sheets
 */

import type { Writable } from "svelte/store";
import { get, writable } from "svelte/store";
import { makeRandomId } from "../../components/common/tabs";

export const SPREADSHEET = "SPREADSHEET";
export const BLANK_CANVAS = "BLANK_CANVAS";
export const GRAPH = "GRAPH";
export const SHEET_ICONS = {
  [SPREADSHEET]: "status-bar-spreadsheet",
  [BLANK_CANVAS]: "status-bar-blank-canvas",
  [GRAPH]: "status-bar-graph",
};

export type SheetType = typeof SPREADSHEET | typeof BLANK_CANVAS | typeof GRAPH;

export type GridSheet = {
  id: string;
  type: SheetType;
  name: string;
  isActive: boolean;
  icon?: string;
};

export type WorkbookSheet = {
  id: string;
  name: string;
  isActive: boolean;
  icon?: string;
  /** temporily use for doing the ui of multiple grid sheets in workbook sheet */
  gridSheets?: GridSheet[];
};

const gridSheets: GridSheet[] = [
  {
    id: "1",
    type: SPREADSHEET,
    name: "Sheet 1",
    isActive: true,
    icon: SHEET_ICONS[SPREADSHEET],
  },
  {
    id: "2",
    type: SPREADSHEET,
    name: "Sheet 2",
    isActive: false,
    icon: SHEET_ICONS[SPREADSHEET],
  },
  {
    id: "3",
    type: SPREADSHEET,
    name: "Sheet 3",
    isActive: false,
    icon: SHEET_ICONS[SPREADSHEET],
  },
  /*{
    id: "4",
    type: SPREADSHEET,
    name: "Sheet 4",
    isActive: false,
    icon: SHEET_ICONS[SPREADSHEET],
  },
  {
    id: "5",
    type: SPREADSHEET,
    name: "Sheet 5",
    isActive: false,
    icon: SHEET_ICONS[SPREADSHEET],
  },
  {
    id: "6",
    type: SPREADSHEET,
    name: "Sheet 6",
    isActive: false,
    icon: SHEET_ICONS[SPREADSHEET],
  },
  {
    id: "7",
    type: SPREADSHEET,
    name: "Sheet 7",
    isActive: false,
    icon: SHEET_ICONS[SPREADSHEET],
  },
  {
    id: "8",
    type: SPREADSHEET,
    name: "Sheet 8",
    isActive: false,
    icon: SHEET_ICONS[SPREADSHEET],
  },
  {
    id: "9",
    type: SPREADSHEET,
    name: "Sheet 9",
    isActive: false,
    icon: SHEET_ICONS[SPREADSHEET],
  },*/
];

function getDefaultGridSheets(parentId: string): GridSheet[] {
  const tabs: GridSheet[] = JSON.parse(JSON.stringify(gridSheets));
  tabs.forEach((t) => (t.id += parentId + makeRandomId(8)));
  return tabs;
}

const workbookTemplate: WorkbookSheet = {
  id: "template",
  name: "template",
  isActive: true,
  icon: SHEET_ICONS[SPREADSHEET],
  gridSheets: [
    {
      id: "1",
      type: SPREADSHEET,
      name: "Sheet 1",
      isActive: true,
      icon: SHEET_ICONS[SPREADSHEET],
    },
  ],
};

const tabs: WorkbookSheet[] = [
  {
    id: "1",
    name: "Sales",
    isActive: true,
    icon: SHEET_ICONS[SPREADSHEET],
    gridSheets: getDefaultGridSheets("1"),
  },
  {
    id: "2",
    name: "Sales By Region",
    isActive: false,
    icon: SHEET_ICONS[SPREADSHEET],
    gridSheets: getDefaultGridSheets("2"),
  },
  {
    id: "3",
    name: "Sales Report - 2021",
    isActive: false,
    icon: SHEET_ICONS[SPREADSHEET],
    gridSheets: getDefaultGridSheets("3"),
  },
  /*{
    id: "4",
    label: "Sheet4",
    isActive: false,
    icon: SHEET_ICONS[SPREADSHEET],
  },
  {
    id: "5",
    label: "Sheet5",
    isActive: false,
    icon: SHEET_ICONS[BLANK_CANVAS],
  },
  {
    id: "6",
    label: "Sheet6",
    isActive: false,
    icon: SHEET_ICONS[GRAPH],
  },
  {
    id: "7",
    label: "Sheet7",
    isActive: false,
    icon: SHEET_ICONS[SPREADSHEET],
  },
  {
    id: "8",
    label: "Sheet8",
    isActive: false,
    icon: SHEET_ICONS[BLANK_CANVAS],
  },
  {
    id: "9",
    label: "Sheet9",
    isActive: false,
    icon: SHEET_ICONS[GRAPH],
  },
  {
    id: "10",
    label: "Sheet10",
    isActive: false,
    icon: SHEET_ICONS[GRAPH],
  },*/
];

export const sheetsDataStore: Writable<WorkbookSheet[]> = writable([...tabs]);

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

export function getExistingGridTabIds(): string[] {
  const result: string[] = [];
  getSheetsData().forEach((s) => {
    const ids = (s.gridSheets ?? []).map((t) => t.id);
    result.push(...ids);
  });
  return result;
}

export const isDraggingToReorderSheet: Writable<boolean> = writable(false);
