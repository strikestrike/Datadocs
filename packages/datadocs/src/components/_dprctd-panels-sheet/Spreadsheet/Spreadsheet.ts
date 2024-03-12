import type { PanelComponentConfig } from "../../../layout/_dprctd/types";
import { WS_DELETE_OBJECT } from "../../panels/WorkbookSheets/worksheet-actions";

export const spreadsheetConfig: PanelComponentConfig = {
  name: "spreadsheet",
  icon: "status-bar-spreadsheet",
  label: "Spreadsheet",
  defaultPlacement: "container:right",
};

export function createPanelHandler(panelElement: HTMLElement, methods) {
  return function (payload) {
    switch (payload.message) {
      case WS_DELETE_OBJECT: {
        break;
      }
      default: {
        break;
      }
    }
  };
}
