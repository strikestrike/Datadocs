export interface FocusTrapOptions {
  selector: string;
}

export default function modalFocusTrapAction(
  modalElement: HTMLElement,
  options: FocusTrapOptions
) {
  let focusableElements: NodeListOf<HTMLElement>;
  const selector: string = options.selector;
  let firstFocusableElement: HTMLElement;
  let lastFocusableElement: HTMLElement;

  focusableElements = modalElement.querySelectorAll(selector);
  firstFocusableElement = focusableElements[0];
  lastFocusableElement = focusableElements[focusableElements.length - 1];

  function isInsideFocusableElements(): boolean {
    const activeElement = document.activeElement;
    let isInside = false;

    for (let index = 0; index < focusableElements.length; index++) {
      if (focusableElements[index] === activeElement) {
        isInside = true;
        break;
      }
    }

    return isInside;
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key !== "Tab") {
      return;
    }
    const activeElement = document.activeElement;

    if (event.shiftKey) {
      if (
        activeElement === firstFocusableElement ||
        !isInsideFocusableElements()
      ) {
        lastFocusableElement.focus();
        event.preventDefault();
      }
    } else {
      if (
        document.activeElement === lastFocusableElement ||
        !isInsideFocusableElements()
      ) {
        firstFocusableElement.focus();
        event.preventDefault();
      }
    }
  }

  window.addEventListener("keydown", handleKeyDown);
  return {
    destroy() {
      window.removeEventListener("keydown", handleKeyDown);
    },
  };
}
