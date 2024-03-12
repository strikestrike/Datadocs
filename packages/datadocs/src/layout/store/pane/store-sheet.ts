import { sheetConfig } from "src/app/store/writables";
import { get, writable } from "svelte/store";
import type { Pane, WorkspaceConfig } from "src/layout/types/pane";
import { usePane } from "./usePane";
import { cloneDeep } from "lodash-es";
import type { Split } from "src/layout/enums/split";
import {
  changeSheetsData,
  getCurrentActiveSheet,
} from "src/app/store/store-worksheets";

const sheetConfigCache = writable<WorkspaceConfig>(null);
const paneObject = usePane(sheetConfigCache);
const { update } = paneObject;
const activePaneId = writable<string>(null);

activePaneId.subscribe((id) => {
  console.log("activePaneId", id);
});

sheetConfig.subscribe((config) => {
  if (config) {
    sheetConfigCache.set(cloneDeep(config));
    update();
    const sheetData = getCurrentActiveSheet();
    if (sheetData) {
      sheetData.config = cloneDeep(config);
    }
  }
});

export function useLayoutSheet() {
  function sync() {
    console.trace("sheet sync", cloneDeep(get(sheetConfigCache)));
    sheetConfig.set(cloneDeep(get(sheetConfigCache)));
  }

  function reset() {
    console.log("sheet reset", get(sheetConfig));
    sheetConfigCache.set(cloneDeep(get(sheetConfig)));
    update();
  }

  function split(params: { source: Pane; targetId: Pane["id"]; edge: Split }) {
    paneObject.split(params);
    activePaneId.set(params.source.id);
  }

  return {
    layout: sheetConfigCache,
    layoutStore: sheetConfig,
    activePaneId,
    sync,
    reset,
    ...paneObject,
    split,
  };
}
