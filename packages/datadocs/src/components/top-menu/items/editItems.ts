import type { MenuItemType, MenuElementType } from "../../common/menu";
import {
  MENU_DATA_ITEM_TYPE_ELEMENT,
  MENU_DATA_ITEM_STATE_ENABLED,
  MENU_DATA_ITEM_STATE_DISABLED,
} from "../../common/menu";
import { getCustomMenuItem } from "../components/custom-menu-item";
import { handleUndo, handleRedo } from "../../../app/store/store-toolbar";

// eslint-disable-next-line @typescript-eslint/no-empty-function
const emptyAction = () => {};

const MENU_EDIT_UNDO: MenuElementType = {
  type: MENU_DATA_ITEM_TYPE_ELEMENT,
  label: getCustomMenuItem("undo"),
  state: MENU_DATA_ITEM_STATE_ENABLED,
  action: async () => {
    await handleUndo();
  },
};

const MENU_EDIT_REDO: MenuElementType = {
  type: MENU_DATA_ITEM_TYPE_ELEMENT,
  label: getCustomMenuItem("redo"),
  state: MENU_DATA_ITEM_STATE_ENABLED,
  action: async () => {
    await handleRedo();
  },
};

const MENU_EDIT_CUT: MenuElementType = {
  type: MENU_DATA_ITEM_TYPE_ELEMENT,
  label: getCustomMenuItem("cut"),
  state: MENU_DATA_ITEM_STATE_DISABLED,
  action: emptyAction,
};

const MENU_EDIT_COPY: MenuElementType = {
  type: MENU_DATA_ITEM_TYPE_ELEMENT,
  label: getCustomMenuItem("copy"),
  state: MENU_DATA_ITEM_STATE_DISABLED,
  action: emptyAction,
};

const MENU_EDIT_PASTE: MenuElementType = {
  type: MENU_DATA_ITEM_TYPE_ELEMENT,
  label: getCustomMenuItem("paste"),
  state: MENU_DATA_ITEM_STATE_DISABLED,
  action: emptyAction,
};

const MENU_EDIT_CLEAR: MenuElementType = {
  type: MENU_DATA_ITEM_TYPE_ELEMENT,
  label: getCustomMenuItem("clear"),
  state: MENU_DATA_ITEM_STATE_DISABLED,
  action: emptyAction,
};

const MENU_EDIT_DELETE: MenuElementType = {
  type: MENU_DATA_ITEM_TYPE_ELEMENT,
  label: getCustomMenuItem("delete"),
  state: MENU_DATA_ITEM_STATE_DISABLED,
  action: emptyAction,
};

const editItems: MenuItemType[] = [
  MENU_EDIT_UNDO,
  MENU_EDIT_REDO,
  MENU_EDIT_CUT,
  MENU_EDIT_COPY,
  MENU_EDIT_PASTE,
  MENU_EDIT_CLEAR,
  MENU_EDIT_DELETE,
];

export default editItems;
