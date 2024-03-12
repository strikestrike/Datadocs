import {
  WS_ADD_OBJECT,
  WS_DELETE_OBJECT,
  WS_LAYER_REORDER,
} from "./worksheet-actions";

export function createPanelHandler(panelElement: HTMLElement, methods) {
  return function (payload) {
    switch (payload.message) {
      case WS_ADD_OBJECT: {
        methods.addObject(payload.data);
        break;
      }
      case WS_DELETE_OBJECT: {
        methods.deleteObject(payload.data);
        break;
      }
      case WS_LAYER_REORDER: {
        methods.layerReorder(payload.data);
        break;
      }

      default: {
        break;
      }
    }
  };
}
