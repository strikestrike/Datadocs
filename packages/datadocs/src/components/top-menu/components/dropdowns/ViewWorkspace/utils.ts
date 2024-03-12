import type { WorkspaceItem } from "../../../../../app/store/types";
import type { WorkspaceConfig } from "../../../../../layout/types/pane";
import {
  getCurrentActiveWorkspace,
  getListDefaultWorkspaces,
  getListCustomWorkspaces,
  sortCustomWorkspaceList,
} from "../../../../../app/store/store-workspaces";
import { loadWorkspace } from "../../../../../app/store/store-ui";
import {
  createNewWorkspace,
  workspaceDataToWorkspaceItem,
  deleteWorkspace,
} from "../../../../../api";

export function isWorkspaceRemovable(workspace: WorkspaceItem): boolean {
  return workspace.type === "custom" && !workspace.isActive;
}

export function resetWorkspace() {
  const activeWorkspace = getCurrentActiveWorkspace();

  if (activeWorkspace) {
    activeWorkspace.data = null;
    loadWorkspace(activeWorkspace.initData);
  }
}

export function switchWorkspace(id: string) {
  const workspace =
    getListDefaultWorkspaces().find((ws) => ws.id === id) ||
    getListCustomWorkspaces().find((ws) => ws.id === id);

  if (workspace) {
    resetWorkspacesActive();
    workspace.isActive = true;
    loadWorkspace();
  }
}

export async function addWorkspace(name: string, config: WorkspaceConfig) {
  let errorMessage = "";
  await createNewWorkspace(name, config, {
    onSuccess: async (data) => {
      const newWs = workspaceDataToWorkspaceItem(data.workspace);
      newWs.isActive = true;
      resetWorkspacesActive();
      getListCustomWorkspaces().push(newWs);
      sortCustomWorkspaceList();
      loadWorkspace();
    },
    onError: async (error) => {
      if (error.response.status === 400) {
        errorMessage = "Workspace name already exist.";
      } else {
        errorMessage = "There is something wrong. Please try again.";
      }
    },
  });

  return errorMessage;
}

export async function removeWorkspace(workspace: WorkspaceItem) {
  await deleteWorkspace(workspace.id, {
    onSuccess: async (data) => {
      const wsList = getListCustomWorkspaces();
      const index = wsList.findIndex((ws) => ws.id === workspace.id);
      if (index !== -1) {
        wsList.splice(index, 1);
        sortCustomWorkspaceList();
        loadWorkspace();
      }
    },
  });
}

function resetWorkspacesActive() {
  getListDefaultWorkspaces().forEach((ws) => (ws.isActive = false));
  getListCustomWorkspaces().forEach((ws) => (ws.isActive = false));
}
