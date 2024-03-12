import folder from "./folder.svg?raw";

const PROXY_CONTAINER_ID = "file_system_proxy_container_id";

function getProxyContainer() {
  let container: HTMLElement = document.body.querySelector(
    "#" + PROXY_CONTAINER_ID
  );
  if (container) return container;

  // Create a new one if not exist
  container = document.createElement("div");
  container.id = PROXY_CONTAINER_ID;
  Object.assign(container.style, {
    position: "fix",
    left: "0px",
    right: "0px",
    top: "0px",
    bottom: "0px",
    pointerEvents: "none",
  });
  document.body.appendChild(container);

  return container;
}

export function getCloneProxyElement(element: HTMLElement): HTMLElement {
  if (!element) {
    return null;
  }

  const boundingRect = element.getBoundingClientRect();
  const cloned = element.cloneNode(true);
  const proxyElement = document.createElement("div");

  Object.assign(proxyElement.style, {
    position: "absolute",
    width: boundingRect.width + "px",
    height: boundingRect.height + "px",
    zIndex: "999999",
  });
  proxyElement.appendChild(cloned);

  return proxyElement;
}

export function getProxyIconWithBadge(badgeCount: number, icon: string = null) {
  const proxy: HTMLElement = document.createElement("div");
  Object.assign(proxy.style, {
    position: "absolute",
    width: "36px",
    height: "32px",
    backgroundColor: "white",
    boxShadow: "1px 2px 6px 0px rgba(55, 84, 170, 0.16)",
    padding: "6px 8px",
    zIndex: "999999",
  });
  proxy.innerHTML = icon ?? folder;

  // Create node count indication
  const badge = document.createElement("div");
  Object.assign(badge.style, {
    position: "absolute",
    left: "-5px",
    top: "-5px",
    width: "18px",
    height: "18px",
    lineHeight: "18px",
    boxShadow: "1px 2px 6px rgba(234, 72, 33, 0.25)",
  });
  badge.className =
    "flex flex-row item-centers justify-center text-white text-11px rounded-full bg-tertiary-error";
  badge.innerText = badgeCount + "";

  proxy.appendChild(badge);
  return proxy;
}

export function removeProxyElement(element: HTMLElement) {
  element.remove();
}

export function addProxyElement(element: HTMLElement) {
  if (element instanceof HTMLElement) {
    getProxyContainer().appendChild(element);
  }
}
