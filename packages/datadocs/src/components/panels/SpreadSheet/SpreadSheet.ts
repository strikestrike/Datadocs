import type { PanelComponentConfig } from "../types";

export const spreadsheetConfig: PanelComponentConfig = {
  name: "spreadsheet",
  icon: "object-spreadsheet",
  label: "Spreadsheet",
  defaultPlacement: "container:right",
};

export function createPanelHandler(panelElement: HTMLElement, methods) {
  return function (payload) {
    switch (payload.message) {
      // case WS_DELETE_OBJECT: {
      //   break;
      // }
      default: {
        break;
      }
    }
  };
}
