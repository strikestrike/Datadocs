const DOM_CONTAINER_ID = "dom-compute-element-size-container_id";

function getDomContainer() {
  let container: HTMLElement = document.body.querySelector(
    "#" + DOM_CONTAINER_ID
  );
  if (container) return container;

  // Create a new one if not exist
  container = document.createElement("div");
  container.id = DOM_CONTAINER_ID;
  Object.assign(container.style, {
    position: "fix",
    width: "100%",
    height: "100%",
    right: "100",
    opacity: "0",
    pointerEvents: "none",
  });
  document.body.appendChild(container);
  return container;
}

/**
 * Calculate a DOM element width/height in pixels.
 * @param element
 * @returns
 */
export function estimateElementSize(element: HTMLElement) {
  const container = getDomContainer();
  container.appendChild(element);
  const { width, height } = element.getBoundingClientRect();
  container.removeChild(element);

  return {
    width: Math.ceil(width),
    height: Math.ceil(height),
  };
}
