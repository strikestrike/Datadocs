/**
 * @packageDocumentation
 * @module app/store-workspace
 */

import type { WorkspaceConfig } from "../../layout/_dprctd/types";
import type { WorkspaceItem } from "./types";
import {
  defaultWorkspaceSamples as defaultWorkspaces,
  mobileWorkspace,
} from "./workspaces/workspace-presets";

const DEFAULT_WORKSPACE_STORAGE_KEY = "default_ws";
const CUSTOM_WORKSPACE_STORAGE_KEY = "custom_ws";
let defaultWorkspaceList: WorkspaceItem[] = [];
let customWorkspaceList: WorkspaceItem[] = [];

export function setWorkspaceStorage(key: string, value: WorkspaceItem[]) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getWorkspaceStorage(key: string): WorkspaceItem[] {
  const value = localStorage.getItem(key);
  if (!value) {
    return [];
  } else {
    try {
      const data = JSON.parse(value);
      // A dumb check if the data is actually workspace item
      if (!Array.isArray(data) || !data[0] || !data[0].id) return [];
      return data;
    } catch (error) {
      return [];
    }
  }
}

export function clearWorkspaceStorage() {
  localStorage.removeItem(DEFAULT_WORKSPACE_STORAGE_KEY);
  localStorage.removeItem(CUSTOM_WORKSPACE_STORAGE_KEY);
}

export function mergingStorageWorkspaceData(
  workspace: WorkspaceItem,
  storageWorkspaceList: WorkspaceItem[]
): WorkspaceItem {
  const storageWorkspace = storageWorkspaceList.find(
    (ws) => ws.id === workspace.id
  );
  if (storageWorkspace) {
    workspace.data = storageWorkspace.data;
    workspace.isActive = storageWorkspace.isActive;
  }
  return workspace;
}

export function getListDefaultWorkspaces(): WorkspaceItem[] {
  return defaultWorkspaceList;
}

export function getListCustomWorkspaces(): WorkspaceItem[] {
  return customWorkspaceList;
}

export function setListCustomWorkspaces(workspaceList: WorkspaceItem[]) {
  customWorkspaceList = workspaceList;
}

/**
 * Get current active workspace
 * @returns
 */
export function getCurrentActiveWorkspace(): WorkspaceItem {
  let activeWorkspace: WorkspaceItem =
    defaultWorkspaceList.find((ws) => ws.isActive === true) ||
    customWorkspaceList.find((ws) => ws.isActive === true) ||
    null;

  // if there is no active workspace, set the first workspace in default list
  // to be the active one
  if (!activeWorkspace && defaultWorkspaceList[0]) {
    activeWorkspace = defaultWorkspaceList[0];
    activeWorkspace.isActive = true;
    storeWorkspaceChanges();
  }

  return activeWorkspace;
}

export function getWorkspaceConfig() {
  const activeWorkspace = getCurrentActiveWorkspace();
  return activeWorkspace.data || activeWorkspace.initData;
}

export function handleWorkspaceLayoutChange(layout: WorkspaceConfig) {
  const activeWorkspace = getCurrentActiveWorkspace();
  if (activeWorkspace) {
    activeWorkspace.data = layout;
    storeWorkspaceChanges();
  }
}

function storeWorkspaceChanges() {
  // Store new workspace list into storage
  setWorkspaceStorage(DEFAULT_WORKSPACE_STORAGE_KEY, defaultWorkspaceList);
  setWorkspaceStorage(CUSTOM_WORKSPACE_STORAGE_KEY, customWorkspaceList);
}

export function sortCustomWorkspaceList() {
  function compare(a: WorkspaceItem, b: WorkspaceItem) {
    return a.name.localeCompare(b.name, "en", { sensitivity: "base" });
  }
  customWorkspaceList.sort(compare);
}

export function getMobileWorkspace(): WorkspaceItem {
  return mobileWorkspace;
}

export function initWorkspaceList(customWorkspaces: WorkspaceItem[]) {
  // merging default workspaces
  const defaultStorageWorkspaceList = getWorkspaceStorage(
    DEFAULT_WORKSPACE_STORAGE_KEY
  );
  defaultWorkspaceList = defaultWorkspaces.map((workspace) => {
    return mergingStorageWorkspaceData(workspace, defaultStorageWorkspaceList);
  });

  // merging custom workspaces
  const customStorageWorkspaceList = getWorkspaceStorage(
    CUSTOM_WORKSPACE_STORAGE_KEY
  );
  customWorkspaceList = customWorkspaces.map((workspace) => {
    return mergingStorageWorkspaceData(workspace, customStorageWorkspaceList);
  });

  sortCustomWorkspaceList();
  storeWorkspaceChanges();
}
