import { get } from "svelte/store";
import type { AxiosRequestConfig } from "axios";
import type { APIConfig, WorkspaceData } from "./type";
import { axiosCall } from "./common";
import { loginStatusStore } from "./store";
import type { WorkspaceItem } from "../app/store/types";
import { initWorkspaceConfig } from "../app/store/store-ui";
import { initWorkspaceList } from "../app/store/store-workspaces";

/**
 * Get workspace list
 * @param config
 * @returns
 */
export async function getWorkspaceList(config: APIConfig = {}) {
  const requestConfig: AxiosRequestConfig = {
    url: "/workspaces",
    method: "get",
  };
  const data = await axiosCall(requestConfig, config);
  return data;
}

/**
 * Create new workspace
 * @param name
 * @param wsConfig
 * @param config
 * @returns
 */
export async function createNewWorkspace(
  name: string,
  wsConfig: object,
  config: APIConfig = {}
) {
  const requestConfig: AxiosRequestConfig = {
    url: "/workspaces",
    method: "post",
    data: { name, config: wsConfig },
  };
  const data = await axiosCall(requestConfig, config);
  return data;
}

/**
 * Delete a workspace
 * @param workspaceId
 * @param config
 * @returns
 */
export async function deleteWorkspace(
  workspaceId: string,
  config: APIConfig = {}
) {
  const requestConfig: AxiosRequestConfig = {
    url: `/workspaces/${workspaceId}`,
    method: "delete",
  };
  const data = await axiosCall(requestConfig, config);
  return data;
}

/**
 * Change workspace name
 * @param workspaceId
 * @param name
 * @param config
 * @returns
 */
export async function changeWorkspaceName(
  workspaceId: string,
  name: string,
  config: APIConfig = {}
) {
  const requestConfig: AxiosRequestConfig = {
    url: `/workspaces/${workspaceId}/name`,
    method: "put",
    data: { name },
  };
  const data = await axiosCall(requestConfig, config);
  return data;
}

/**
 * Update workspace configuration
 * @param workspaceId
 * @param wsConfig
 * @param config
 * @returns
 */
export async function updateWorkspaceConfig(
  workspaceId: string,
  wsConfig: object,
  config: APIConfig = {}
) {
  const requestConfig: AxiosRequestConfig = {
    url: `/workspaces/${workspaceId}`,
    method: "put",
    data: { config: wsConfig },
  };
  const data = await axiosCall(requestConfig, config);
  return data;
}

/**
 * Generate a WorkspaceItem from server data
 * @param workspaceData
 * @returns
 */
export function workspaceDataToWorkspaceItem(
  workspaceData: WorkspaceData
): WorkspaceItem {
  return {
    id: workspaceData.workspaceId,
    name: workspaceData.name,
    initData: workspaceData.config,
    type: "custom",
    isActive: false,
  };
}

export async function initWorkspace() {
  // Do nothing if user hasn't logged in
  if (!get(loginStatusStore)) return;
  let customWorkspaces: WorkspaceItem[];
  await getWorkspaceList({
    onSuccess: async (data) => {
      const workspaces: WorkspaceData[] = data.workspaces;
      customWorkspaces = workspaces.map((ws) =>
        workspaceDataToWorkspaceItem(ws)
      );
    },
    onError: async (error) => {
      customWorkspaces = [];
    },
  });

  initWorkspaceList(customWorkspaces);
  initWorkspaceConfig();
}
