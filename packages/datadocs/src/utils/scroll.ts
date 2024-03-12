export function scrollVertical(
  elem: HTMLElement,
  delta: number,
  direction: "top" | "bottom"
) {
  if (!elem || delta <= 0) {
    return;
  }

  if (direction === "top") {
    elem.scrollBy({ top: -delta });
  } else {
    elem.scrollBy({ top: delta });
  }
}

export function scrollHorizontal(
  elem: HTMLElement,
  delta: number,
  direction: "left" | "right"
) {
  if (!elem || delta <= 0) {
    return;
  }

  if (direction === "left") {
    elem.scrollBy({ left: -delta });
  } else {
    elem.scrollBy({ left: delta });
  }
}
