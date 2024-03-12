import type { PanelComponentConfig } from "../types";

export const layersConfig: PanelComponentConfig = {
  name: "layers",
  icon: "layers",
  label: "Layers",
  defaultPlacement: "container:right",
};

export function createPanelHandler(panelElement: HTMLElement) {
  // appManager.listen(APP_EVENT_SHEET_LAYOUT, (eventData: EventPayload) => {});

  return function (payload) {
    switch (payload.message) {
      default: {
        break;
      }
    }
  };
}
