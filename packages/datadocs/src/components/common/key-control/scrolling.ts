import { scrollVertical } from "../../../utils/scroll";

export function scrollVerticalToVisible(
  container: HTMLElement,
  element: HTMLElement
) {
  if (!container || !element || !container.contains(element)) {
    return;
  }

  const containerBound = container.getBoundingClientRect();
  const elementBound = element.getBoundingClientRect();
  const isElementVisible: boolean =
    elementBound.top >= containerBound.top &&
    elementBound.bottom <= containerBound.bottom;

  if (isElementVisible) {
    return;
  }

  let delta: number;

  if (elementBound.height >= containerBound.height) {
    delta = containerBound.top - elementBound.top;
    const direction = delta >= 0 ? "top" : "bottom";
    delta = Math.abs(delta);
    scrollVertical(container, delta, direction);
  } else if (elementBound.top < containerBound.top) {
    // scroll to top
    delta = containerBound.top - elementBound.top;
    scrollVertical(container, delta, "top");
  } else if (elementBound.bottom > containerBound.bottom) {
    // scroll to bottom
    delta = elementBound.bottom - containerBound.bottom;
    scrollVertical(container, delta, "bottom");
  }
}
