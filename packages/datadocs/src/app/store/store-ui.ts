/**
 * @packageDocumentation
 * @module app/store-ui
 */

import { initializePanels } from "../../components/panels/panels";
import {
  getWorkspaceConfig,
  handleWorkspaceLayoutChange,
} from "./store-workspaces";
import { workspaceConfig } from "./writables";

// import { initializePanels as initializeSheetPanels } from "../../components/panels-sheet/sheet-panels";
import type { WorkspaceConfig } from "../../layout/_dprctd/types";

export {
  activeContainer,
  activePane,
  activeView,
  showQueryToolbarStore,
  isTestQuery,
  theme,
  enableDevMenu,
  workspaceConfig,
  routeBasePathStore,
} from "./writables";

// const initWorkspaceData = getWorkspaceData();
// let currentWorkspaceData: string;

/** Actions */

/**
 * Load a workspace configuration
 * @type Function
 */
export function loadWorkspace(data: WorkspaceConfig = null) {
  if (!data) data = getWorkspaceConfig();
  data = structuredClone(data);
  workspaceConfig.set(data);
}

/**
 * Updated changes made by user in workspace configuration
 * @type Function
 */
export function updateWorkspace(workspaceData: WorkspaceConfig) {
  workspaceConfig.set(workspaceData);
}

/**
 * Init the workspaceConfig after workspace data is available
 * @type Function
 */
export function initWorkspaceConfig() {
  loadWorkspace();
}

// subcribe for layout change
workspaceConfig.subscribe((value) => {
  if (!value) return;
  handleWorkspaceLayoutChange(structuredClone(value));
});
