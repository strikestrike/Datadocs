import type {
  MenuItemType,
  MenuElementType,
  MenuListType,
} from "../../common/menu";
import {
  MENU_DATA_ITEM_TYPE_ELEMENT,
  MENU_DATA_ITEM_STATE_ENABLED,
  MENU_DATA_ITEM_STATE_DISABLED,
  MENU_DATA_ITEM_TYPE_LIST,
} from "../../common/menu";

// eslint-disable-next-line @typescript-eslint/no-empty-function
const emptyAction = () => {};

const MENU_INSERT_CELLS: MenuListType = {
  type: MENU_DATA_ITEM_TYPE_LIST,
  state: MENU_DATA_ITEM_STATE_DISABLED,
  label: "Cells",
  prefixIcon: "menu-insert-cells",
  children: [],
};

const MENU_INSERT_ROWS: MenuListType = {
  type: MENU_DATA_ITEM_TYPE_LIST,
  state: MENU_DATA_ITEM_STATE_DISABLED,
  label: "Rows",
  prefixIcon: "menu-insert-rows",
  children: [],
};

const MENU_INSERT_COLUMNS: MenuListType = {
  type: MENU_DATA_ITEM_TYPE_LIST,
  state: MENU_DATA_ITEM_STATE_DISABLED,
  label: "Columns",
  prefixIcon: "menu-insert-columns",
  children: [],
};

const MENU_INSERT_SPREADSHEET: MenuElementType = {
  type: MENU_DATA_ITEM_TYPE_ELEMENT,
  state: MENU_DATA_ITEM_STATE_DISABLED,
  label: "Spreadsheet",
  prefixIcon: "menu-insert-sheet",
  action: emptyAction,
};

const MENU_INSERT_HYPERLINK: MenuListType = {
  type: MENU_DATA_ITEM_TYPE_LIST,
  state: MENU_DATA_ITEM_STATE_DISABLED,
  label: "Hyperlink",
  prefixIcon: "menu-insert-hyperlink",
  children: [],
};

const insertItems: MenuItemType[] = [
  MENU_INSERT_CELLS,
  MENU_INSERT_ROWS,
  MENU_INSERT_COLUMNS,
  MENU_INSERT_SPREADSHEET,
  MENU_INSERT_HYPERLINK,
];

export default insertItems;
