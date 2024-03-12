import { getCurrentActiveSheet } from "../store-worksheets";
import type { GridPublicAPI } from "@datadocs/canvas-datagrid-ng";
import type { PaneConfig } from "../../../layout/_dprctd/types";
import { getGridInstance } from "./base";

export function getActiveGrids(): GridPublicAPI[] {
  const result: GridPublicAPI[] = [];
  const sheet = getCurrentActiveSheet();

  const searchingQueue: PaneConfig[] = [sheet.config?.root];
  while (searchingQueue.length > 0) {
    const pane = searchingQueue.pop();
    if (!pane) continue;
    if (pane.content?.view?.name === "spreadsheet") {
      const grid = getGridInstance(pane.content.view.id, false);
      if (grid) result.push(grid);
    }
    if (Array.isArray(pane.children)) {
      pane.children.forEach((child) => searchingQueue.push(child));
    }
  }
  return result;
}
