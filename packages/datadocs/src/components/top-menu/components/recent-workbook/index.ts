import type { Workbook } from "../../../../app/store/types";
import { bindComponent } from "../../../../utils/bindComponent";
import RecentWorkbookItem from "./RecentWorkbookItem.svelte";
import ViewAllWorkbook from "./ViewAllWorkbook.svelte";

export function getWorkbookMenuComponent(workbook: Workbook) {
  return bindComponent(RecentWorkbookItem, { workbook });
}

export function getViewAllWorkbookComponent() {
  return ViewAllWorkbook;
}
