import { getGrid, getGridDataSource } from "../../../app/store/grid/base";
import type {
  MenuItemType,
  MenuElementType,
  MenuListType,
  MenuSeparatorType,
} from "../../common/menu";
import {
  MENU_DATA_ITEM_TYPE_ELEMENT,
  MENU_DATA_ITEM_TYPE_LIST,
  MENU_DATA_ITEM_TYPE_DROPDOWN,
  MENU_DATA_ITEM_TYPE_SEPARATOR,
  MENU_DATA_ITEM_STATE_DISABLED,
  MENU_DATA_ITEM_STATE_ENABLED,
} from "../../common/menu";

function defaultEmptyAction() {}

const MENU_HORIZONTAL_SEPARATOR: MenuSeparatorType = {
  type: MENU_DATA_ITEM_TYPE_SEPARATOR,
};

// 1
const EXAMPLE_ITEM_1_1: MenuElementType = {
  type: MENU_DATA_ITEM_TYPE_ELEMENT,
  label: "Example Item 1",
  prefixIcon: "top-menu-view-workspace",
  state: MENU_DATA_ITEM_STATE_ENABLED,
  action: defaultEmptyAction,
};

const EXAMPLE_ITEM_1_2: MenuElementType = {
  type: MENU_DATA_ITEM_TYPE_ELEMENT,
  label: "Example Item 2",
  prefixIcon: "top-menu-view-workspace",
  state: MENU_DATA_ITEM_STATE_ENABLED,
  action: () => {
    getGridDataSource().editCells([{ row: 0, column: 0, value: "A1" }]);
    // TODO remove the following line
    getGrid()?.resize();
  },
};

const EXAMPLE_ITEM_1: MenuListType = {
  type: MENU_DATA_ITEM_TYPE_LIST,
  label: "Example Item 1",
  prefixIcon: "top-menu-view-workspace",
  state: MENU_DATA_ITEM_STATE_ENABLED,
  children: [EXAMPLE_ITEM_1_1, EXAMPLE_ITEM_1_2],
};

// 2
const EXAMPLE_ITEM_2_1: MenuElementType = {
  type: MENU_DATA_ITEM_TYPE_ELEMENT,
  label: "Example Item 1",
  prefixIcon: "top-menu-view-workspace",
  state: MENU_DATA_ITEM_STATE_ENABLED,
  action: defaultEmptyAction,
};

const EXAMPLE_ITEM_2_2: MenuElementType = {
  type: MENU_DATA_ITEM_TYPE_ELEMENT,
  label: "Example Item 2",
  prefixIcon: "top-menu-view-workspace",
  state: MENU_DATA_ITEM_STATE_ENABLED,
  action: defaultEmptyAction,
};

const EXAMPLE_ITEM_2_3: MenuElementType = {
  type: MENU_DATA_ITEM_TYPE_ELEMENT,
  label: "Example Item 3",
  prefixIcon: "top-menu-view-workspace",
  state: MENU_DATA_ITEM_STATE_ENABLED,
  action: defaultEmptyAction,
};

const EXAMPLE_ITEM_2: MenuListType = {
  type: MENU_DATA_ITEM_TYPE_LIST,
  label: "Example Item 2",
  prefixIcon: "top-menu-view-workspace",
  state: MENU_DATA_ITEM_STATE_ENABLED,
  children: [EXAMPLE_ITEM_2_1, EXAMPLE_ITEM_2_2, EXAMPLE_ITEM_2_3],
};

// 3
const EXAMPLE_ITEM_3_1: MenuElementType = {
  type: MENU_DATA_ITEM_TYPE_ELEMENT,
  label: "Example Item 1",
  prefixIcon: "top-menu-view-workspace",
  state: MENU_DATA_ITEM_STATE_ENABLED,
  action: defaultEmptyAction,
};

const EXAMPLE_ITEM_3_2: MenuElementType = {
  type: MENU_DATA_ITEM_TYPE_ELEMENT,
  label: "Example Item 2",
  prefixIcon: "top-menu-view-workspace",
  state: MENU_DATA_ITEM_STATE_ENABLED,
  action: defaultEmptyAction,
};

const EXAMPLE_ITEM_3: MenuListType = {
  type: MENU_DATA_ITEM_TYPE_LIST,
  label: "Example Item 3",
  prefixIcon: "top-menu-view-workspace",
  state: MENU_DATA_ITEM_STATE_ENABLED,
  children: [EXAMPLE_ITEM_3_1, EXAMPLE_ITEM_3_2],
};

// 4
const EXAMPLE_ITEM_4: MenuElementType = {
  type: MENU_DATA_ITEM_TYPE_ELEMENT,
  label: "Example Item 4",
  prefixIcon: "top-menu-view-workspace",
  state: MENU_DATA_ITEM_STATE_DISABLED,
  action: defaultEmptyAction,
};

// 5
const EXAMPLE_ITEM_5: MenuElementType = {
  type: MENU_DATA_ITEM_TYPE_ELEMENT,
  label: "Example Item 5",
  prefixIcon: "top-menu-view-workspace",
  state: MENU_DATA_ITEM_STATE_ENABLED,
  action: defaultEmptyAction,
};

const exampleItems: MenuItemType[] = [
  EXAMPLE_ITEM_1,
  EXAMPLE_ITEM_2,

  MENU_HORIZONTAL_SEPARATOR,

  EXAMPLE_ITEM_3,
  EXAMPLE_ITEM_4,

  MENU_HORIZONTAL_SEPARATOR,

  EXAMPLE_ITEM_5,
];

export default exampleItems;
