export function setCursor(cursor = "") {
  switch (cursor) {
    case "w-resize":
    case "n-resize":
    case "col-resize":
    case "row-resize": {
      document.body.classList.add("cursor-" + cursor);
      break;
    }
    default: {
      document.body.className = document.body.className.replace(
        /cursor-.*/g,
        ""
      );
      break;
    }
  }
}

export function setPointerEvents(pointerEvents = "", important = false) {
  document.body.style.pointerEvents =
    pointerEvents + (important ? " !important" : "");
}
