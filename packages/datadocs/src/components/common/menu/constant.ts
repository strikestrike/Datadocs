import type {
  ComponentType,
  SvelteComponent,
  SvelteComponentTyped,
} from "svelte";

export const CLOSE_ROOT_MENU_CONTEXT_NAME = "ContextMenu:close";
export const MOUSE_ON_ROOT_MENU_CONTEXT_NAME = "ContextMenu:mouseOnMenu";
export const MOUSE_OVER_TARGET_CONTEXT_NAME = "ContextMenu:mouseOverTarget";

export const IS_IN_LEAF_MENU_CONTEXT_NAME = "ContextMenu:isInLeafMenu";
export const IS_IN_PARENT_OF_LEAF_MENU_CONTEXT_NAME =
  "ContextMenu:isInParentOfLeafMenu";
export const SUBMENU_CHANGE_CONTEXT_NAME = "ContextMenu:submenuChange";
export const CONTROL_MENU_BY_KEY_CONTEXT_NAME = "ContextMenu:controlMenuByKey";

export const MENU_CLASSNAME = "contextmenu-menu-element";
export const MENU_LIST_CLASSNAME = "contextmenu-list-element";

export const MENU_DATA_ITEM_TYPE_ELEMENT = "element";
export const MENU_DATA_ITEM_TYPE_LIST = "list";
export const MENU_DATA_ITEM_TYPE_DROPDOWN = "dropdown";
export const MENU_DATA_ITEM_TYPE_SEPARATOR = "separator";
export const MENU_DATA_ITEM_TYPE_COMPONENT = "component";
export const MENU_DATA_ITEM_TYPE_TITLE = "title";

export const MENU_DATA_ITEM_STATE_DISABLED = "disabled";
export const MENU_DATA_ITEM_STATE_ENABLED = "enabled";

type MenuState =
  | typeof MENU_DATA_ITEM_STATE_DISABLED
  | typeof MENU_DATA_ITEM_STATE_ENABLED;
type MenuAction = Function;
export type MenuElementStatus = "success" | "warning" | "";

export type MenuElementType = {
  type: typeof MENU_DATA_ITEM_TYPE_ELEMENT;
  label: string | typeof SvelteComponent;
  labelProps?: Record<string, any>;
  active?: boolean;
  hint?: string;
  prefixIcon?: string;
  prefixIconClass?: string;
  status?: MenuElementStatus; // use for adding warning style
  style?: string;
  state: MenuState;
  action: MenuAction;
  enterAction?: MenuAction;
  leaveAction?: MenuAction;
};

export type MenuSeparatorType = {
  type: typeof MENU_DATA_ITEM_TYPE_SEPARATOR;
};

export type MenuListType = {
  type: typeof MENU_DATA_ITEM_TYPE_LIST;
  label: string | typeof SvelteComponent;
  prefixIcon?: string;
  prefixIconClass?: string;
  style?: string;
  state: MenuState;
  children: MenuItemType[];
};

export type MenuDropdownType = {
  type: typeof MENU_DATA_ITEM_TYPE_DROPDOWN;
  label: string;
  prefixIcon?: string;
  style?: string;
  state: MenuState;
  dropdown: typeof SvelteComponent;
};

export type MenuComponentType<ComponentProps extends Record<string, any>> = {
  type: typeof MENU_DATA_ITEM_TYPE_COMPONENT;
  component: ComponentType<SvelteComponentTyped<ComponentProps>>;
  props?: ComponentProps;
};

export type MenuTitleType = {
  type: typeof MENU_DATA_ITEM_TYPE_TITLE;
  title: string;
};

export type MenuItemType =
  | MenuElementType
  | MenuListType
  | MenuSeparatorType
  | MenuDropdownType
  | MenuComponentType<any>
  | MenuTitleType;

export function defaultEmptyAction() {}

export const MENU_HORIZONTAL_SEPARATOR: MenuSeparatorType = {
  type: MENU_DATA_ITEM_TYPE_SEPARATOR,
};
