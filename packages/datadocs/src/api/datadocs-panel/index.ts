import DatadocsPanelSyncManager from "./datadocsPanelSync";

export * from "./datadocsPanel";

let syncManager = new DatadocsPanelSyncManager();

export function getDatadocsPanelSyncManager() {
  return syncManager;
}

export async function removeDatadocspanelSyncManager() {
  await syncManager.destroy();
  syncManager = new DatadocsPanelSyncManager();
}
