/**
 * @packageDocumentation
 * @module app/store-app-ver
 */

import { latestAppVersion, localAppVersion } from "./writables";

export { localAppVersion, latestAppVersion };

let registeredOnMessage = false;
function onServiceWorkerMessage(event: MessageEvent) {
  const eventType = event.data?.type;
  if (!eventType) return;

  let isLocalVersion = false;
  let isLatestVersion = false;
  if (eventType === "LOCAL_APP_VERSION") isLocalVersion = true;
  if (eventType === "LATEST_APP_VERSION") isLatestVersion = true;

  if (isLocalVersion || isLatestVersion) {
    const { major, build } = event.data;
    if (typeof major === "string" && typeof build === "string") {
      (isLocalVersion ? localAppVersion : latestAppVersion).set({
        major,
        build,
      });
    }
    return;
  }
}

let asked = false;
export function didWeAskServiceWorkerVersion() {
  return asked;
}
export function askServiceWorkerVersion(forLatestVersion = false) {
  if (!registeredOnMessage) {
    registeredOnMessage = true;
    navigator.serviceWorker.addEventListener("message", onServiceWorkerMessage);
  }

  const eventType = "GET_APP_VERSION";
  console.log(`postMessage ${eventType} ...`);

  const swController = navigator.serviceWorker.controller;
  if (!swController) return;
  swController.postMessage({
    type: eventType,
    includeTheLatest: forLatestVersion,
  });
  asked = true;
}
