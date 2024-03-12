import type { MenuItemType } from "../menu/constant";

export type ContextMenuPosition = "top" | "bottom" | "";

export type ContextMenuOptionsType = {
  menuItems:
    | MenuItemType[]
    | ((clientX: number, clientY: number) => MenuItemType[]);
  closeFromOutside?: () => void;
  disabled: boolean;
  menuClass?: string;
  preferPosition?: ContextMenuPosition;
  isAtMousePosition?: boolean;
  targetMatchCheck?: boolean;
  /**
   * If true, the context menu will be opened by click event
   */
  useClickEvent?: boolean;
  /**
   * A callback that will be called when menu is attached
   */
  onOpen?: () => void;
  /**
   * A callback that will be called when menu is closed
   */
  onClose?: () => void;
};
