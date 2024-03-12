import ContextMenu from "./ContextMenu.svelte";
import type { ContextMenuOptionsType, ContextMenuPosition } from "./type";

export const CONTEXT_MENU_CONTAINER_ID = "context_menu_container";

export function contextMenuAction(
  triggerElement: HTMLElement,
  options: ContextMenuOptionsType
) {
  let isAttached = false;
  let contextMenuComponent: ContextMenu;
  let disabled = options.disabled;
  const menuClass = options.menuClass ?? "";
  let contextMenuContainer: HTMLElement;
  const preferPosition: ContextMenuPosition = options.preferPosition ?? "";
  const isAtMousePosition: boolean = options.isAtMousePosition;
  const eventName = options.useClickEvent ? "click" : "contextmenu";

  function attachMenu(mouseX: number, mouseY: number) {
    if (isAttached || disabled) {
      return;
    }

    const data =
      typeof options.menuItems === "function"
        ? options.menuItems(mouseX, mouseY)
        : options.menuItems;

    contextMenuContainer = document.getElementById(CONTEXT_MENU_CONTAINER_ID);
    contextMenuComponent = new ContextMenu({
      props: {
        data,
        triggerElement: triggerElement,
        removeContextMenu: removeMenu,
        menuClass: menuClass,
        preferPosition: preferPosition,
        isAtMousePosition: isAtMousePosition,
        mouseX: mouseX,
        mouseY: mouseY,
      },
      target: contextMenuContainer ?? document.body,
    });

    isAttached = true;
    document.addEventListener("keydown", handleKeyDown, true);

    if (typeof options.onOpen === "function") {
      options.onOpen();
    }
  }

  function removeMenu() {
    if (!isAttached) {
      return;
    }

    contextMenuComponent.$destroy();
    contextMenuComponent = null;
    isAttached = false;
    document.removeEventListener("keydown", handleKeyDown, true);

    if (typeof options.onClose === "function") {
      options.onClose();
    }
  }

  function handleContextMenu(event: MouseEvent) {
    if (options.targetMatchCheck && event.target !== triggerElement) {
      return;
    }

    const mouseX = event.x;
    const mouseY = event.y;

    if (isAttached) {
      removeMenu();
    } else {
      attachMenu(mouseX, mouseY);
    }

    event.preventDefault();
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      removeMenu();
    }
  }

  options.closeFromOutside = removeMenu;

  triggerElement.addEventListener(eventName, handleContextMenu, true);

  return {
    update(newOptions: ContextMenuOptionsType) {
      disabled = newOptions.disabled;
      options = newOptions;
      options.closeFromOutside = removeMenu;

      if (disabled) {
        removeMenu();
      }
    },
    destroy() {
      removeMenu();
      triggerElement.removeEventListener(eventName, handleContextMenu, true);
    },
  };
}
