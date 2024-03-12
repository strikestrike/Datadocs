import type {
  MenuItemType,
  MenuElementType,
  MenuListType,
  MenuSeparatorType,
  MenuDropdownType,
} from "../../common/menu";
import {
  MENU_DATA_ITEM_TYPE_ELEMENT,
  MENU_DATA_ITEM_TYPE_LIST,
  MENU_DATA_ITEM_TYPE_DROPDOWN,
  MENU_DATA_ITEM_TYPE_SEPARATOR,
  MENU_DATA_ITEM_STATE_DISABLED,
  MENU_DATA_ITEM_STATE_ENABLED,
} from "../../common/menu";
import ViewWorkspaceDropdown from "../components/dropdowns/ViewWorkspace/ViewWorkspaceDropdown.svelte";
import * as itemStates from "./itemStates";
import { ZOOM_DROPDOWN_VALUES } from "../../toolbars/MainToolbar/dropdowns/default";
import { get } from "svelte/store";
import { enableDevMenu, isTestQuery } from "../../../app/store/store-ui";
import { changeZoomValue } from "../../../app/store/store-toolbar";
import { zoomValue } from "../../../app/store/writables";
import { getMenuItemWithPostTickSign } from "../components/custom-menu-item";
import { panelsList, panelConfigs } from "../../panels/panels-config";
import { appManager } from "../../../app/core/global/app-manager";

function defaultEmptyAction() {}

const MENU_HORIZONTAL_SEPARATOR: MenuSeparatorType = {
  type: MENU_DATA_ITEM_TYPE_SEPARATOR,
};

// view show
const MENU_VIEW_SHOW_FORMULA_BAR: MenuElementType = {
  type: MENU_DATA_ITEM_TYPE_ELEMENT,
  state: MENU_DATA_ITEM_STATE_DISABLED,
  get label() {
    return getMenuItemWithPostTickSign(
      "Formula Bar",
      null,
      itemStates.getShowFormulaBar()
    );
  },
  action: itemStates.toggleShowFormulaBar,
};

const MENU_VIEW_SHOW_QUERY_EDITOR: MenuElementType = {
  type: MENU_DATA_ITEM_TYPE_ELEMENT,
  state: MENU_DATA_ITEM_STATE_ENABLED,
  get label() {
    return getMenuItemWithPostTickSign("Query Editor", null, get(isTestQuery));
  },
  action: () => {
    isTestQuery.update((value) => !value);
  },
};

const MENU_VIEW_SHOW_GRIDLINES: MenuElementType = {
  type: MENU_DATA_ITEM_TYPE_ELEMENT,
  state: MENU_DATA_ITEM_STATE_DISABLED,
  get label() {
    return getMenuItemWithPostTickSign(
      "Gridlines",
      null,
      itemStates.getShowGridlines()
    );
  },
  action: itemStates.toggleShowGridlines,
};

const MENU_VIEW_SHOW_HEADING: MenuElementType = {
  type: MENU_DATA_ITEM_TYPE_ELEMENT,
  state: MENU_DATA_ITEM_STATE_DISABLED,
  get label() {
    return getMenuItemWithPostTickSign(
      "Headings",
      null,
      itemStates.getShowHeadings()
    );
  },
  action: itemStates.toggleShowHeadings,
};

const MENU_VIEW_SHOW_PROTECTED_RANGES: MenuElementType = {
  type: MENU_DATA_ITEM_TYPE_ELEMENT,
  label: "Protected ranges",
  // get active(): boolean {
  //   return itemStates.getShowProtectedRanges();
  // },
  get prefixIcon(): string {
    return itemStates.getShowProtectedRanges()
      ? "top-menu-item-tick"
      : "empty-rect";
  },
  state: MENU_DATA_ITEM_STATE_ENABLED,
  action: itemStates.toggleShowProtectedRanges,
};

const MENU_VIEW_SHOW_DEV_MENU: MenuElementType = {
  type: MENU_DATA_ITEM_TYPE_ELEMENT,
  label: "Developer Menu",
  get prefixIcon(): string {
    return get(enableDevMenu) ? "top-menu-item-tick" : "empty-rect";
  },
  state: MENU_DATA_ITEM_STATE_ENABLED,
  action: () => enableDevMenu.update((v) => !v),
};

const MENU_VIEW_SHOW_LIST: MenuListType = {
  type: MENU_DATA_ITEM_TYPE_LIST,
  label: "Show",
  prefixIcon: "top-menu-view-show",
  state: MENU_DATA_ITEM_STATE_ENABLED,
  children: [
    MENU_VIEW_SHOW_FORMULA_BAR,
    MENU_VIEW_SHOW_QUERY_EDITOR,
    MENU_VIEW_SHOW_GRIDLINES,
    MENU_VIEW_SHOW_HEADING,

    /**
     * According to design, we don't have the items bellow. we may need to
     * put it in another place if necessary
     */
    // MENU_VIEW_SHOW_PROTECTED_RANGES,
    // MENU_VIEW_SHOW_DEV_MENU,
  ],
};

// view freeze
const MENU_VIEW_FREEZE_NO_ROWS: MenuElementType = {
  type: MENU_DATA_ITEM_TYPE_ELEMENT,
  label: "No rows",
  state: MENU_DATA_ITEM_STATE_ENABLED,
  action: defaultEmptyAction,
};

const MENU_VIEW_FREEZE_1_ROW: MenuElementType = {
  type: MENU_DATA_ITEM_TYPE_ELEMENT,
  label: "1 row",
  state: MENU_DATA_ITEM_STATE_ENABLED,
  action: defaultEmptyAction,
};

const MENU_VIEW_FREEZE_2_ROWS: MenuElementType = {
  type: MENU_DATA_ITEM_TYPE_ELEMENT,
  label: "2 rows",
  state: MENU_DATA_ITEM_STATE_ENABLED,
  action: defaultEmptyAction,
};

const MENU_VIEW_FREEZE_N_ROWS: MenuElementType = {
  type: MENU_DATA_ITEM_TYPE_ELEMENT,
  label: "Up to row 1",
  state: MENU_DATA_ITEM_STATE_ENABLED,
  action: defaultEmptyAction,
};

const MENU_VIEW_FREEZE_NO_COLS: MenuElementType = {
  type: MENU_DATA_ITEM_TYPE_ELEMENT,
  label: "No columns",
  state: MENU_DATA_ITEM_STATE_ENABLED,
  action: defaultEmptyAction,
};

const MENU_VIEW_FREEZE_1_COL: MenuElementType = {
  type: MENU_DATA_ITEM_TYPE_ELEMENT,
  label: "1 column",
  state: MENU_DATA_ITEM_STATE_ENABLED,
  action: defaultEmptyAction,
};

const MENU_VIEW_FREEZE_2_COLS: MenuElementType = {
  type: MENU_DATA_ITEM_TYPE_ELEMENT,
  label: "2 columns",
  state: MENU_DATA_ITEM_STATE_ENABLED,
  action: defaultEmptyAction,
};

const MENU_VIEW_FREEZE_N_COLS: MenuElementType = {
  type: MENU_DATA_ITEM_TYPE_ELEMENT,
  label: "Up to column 1",
  state: MENU_DATA_ITEM_STATE_ENABLED,
  action: defaultEmptyAction,
};

const MENU_VIEW_FREEZE_LIST: MenuListType = {
  type: MENU_DATA_ITEM_TYPE_LIST,
  label: "Freeze",
  prefixIcon: "top-menu-view-freeze",
  state: MENU_DATA_ITEM_STATE_DISABLED,
  children: [
    MENU_VIEW_FREEZE_NO_ROWS,
    MENU_VIEW_FREEZE_1_ROW,
    MENU_VIEW_FREEZE_2_ROWS,
    MENU_VIEW_FREEZE_N_ROWS,

    MENU_HORIZONTAL_SEPARATOR,

    MENU_VIEW_FREEZE_NO_COLS,
    MENU_VIEW_FREEZE_1_COL,
    MENU_VIEW_FREEZE_2_COLS,
    MENU_VIEW_FREEZE_N_COLS,
  ],
};

// view group
const MENU_VIEW_GROUP_GROUP: MenuElementType = {
  type: MENU_DATA_ITEM_TYPE_ELEMENT,
  label: "Group",
  hint: "Options+Shift+→",
  state: MENU_DATA_ITEM_STATE_ENABLED,
  action: defaultEmptyAction,
};

const MENU_VIEW_GROUP_UNGROUP: MenuElementType = {
  type: MENU_DATA_ITEM_TYPE_ELEMENT,
  label: "Ungroup",
  hint: "Options+Shift+←",
  state: MENU_DATA_ITEM_STATE_DISABLED,
  action: defaultEmptyAction,
};

const MENU_VIEW_GROUP_LIST: MenuListType = {
  type: MENU_DATA_ITEM_TYPE_LIST,
  label: "Group",
  prefixIcon: "top-menu-view-group",
  state: MENU_DATA_ITEM_STATE_DISABLED,
  children: [MENU_VIEW_GROUP_GROUP, MENU_VIEW_GROUP_UNGROUP],
};

// view hidden sheets
const MENU_VIEW_HIDDEN_SHEETS: MenuListType = {
  type: MENU_DATA_ITEM_TYPE_LIST,
  label: "Hidden Sheets",
  prefixIcon: "top-menu-view-hidden-sheets",
  state: MENU_DATA_ITEM_STATE_DISABLED,
  children: [],
};

// view panels
const MENU_VIEW_PANELS: MenuListType = {
  type: MENU_DATA_ITEM_TYPE_LIST,
  label: "Panels",
  prefixIcon: "top-menu-view-panels",
  state: MENU_DATA_ITEM_STATE_ENABLED,
  get children() {
    const panelNames = panelsList.map((panelConfig) => panelConfig.name);
    const activePanels = get(appManager.activePanels);
    return panelNames.map((name) => {
      const config = panelConfigs[name];
      const added = !!activePanels[name];
      return {
        type: MENU_DATA_ITEM_TYPE_ELEMENT,
        state: MENU_DATA_ITEM_STATE_ENABLED,
        get label() {
          return getMenuItemWithPostTickSign(config.name, config.icon, added);
        },
        action: () => {
          appManager.togglePanel(config.name, !added);
        },
      } as MenuElementType;
    });
  },
};

// view workspace
const MENU_VIEW_WORKSPACE: MenuDropdownType = {
  type: MENU_DATA_ITEM_TYPE_DROPDOWN,
  label: "Workspace",
  prefixIcon: "top-menu-view-workspace",
  state: MENU_DATA_ITEM_STATE_ENABLED,
  dropdown: ViewWorkspaceDropdown,
};

// view zoom
function getZoomItems(): MenuElementType[] {
  return ZOOM_DROPDOWN_VALUES.map((value) => {
    const isActive: boolean = get(zoomValue).value === value;
    const item: MenuElementType = {
      type: MENU_DATA_ITEM_TYPE_ELEMENT,
      label: isActive
        ? `<div style="color: #3BC7FF;">${value}%</div>`
        : `${value}%`,
      state: MENU_DATA_ITEM_STATE_ENABLED,
      action: () => {
        changeZoomValue(value);
      },
    };
    return item;
  });
}
const MENU_VIEW_ZOOM: MenuListType = {
  type: MENU_DATA_ITEM_TYPE_LIST,
  label: "Zoom",
  prefixIcon: "top-menu-view-zoom",
  state: MENU_DATA_ITEM_STATE_ENABLED,
  get children() {
    return getZoomItems();
  },
};

// view full screen
const MENU_VIEW_FULL_SCREEN: MenuElementType = {
  type: MENU_DATA_ITEM_TYPE_ELEMENT,
  label: "Full Screen",
  prefixIcon: "top-menu-view-full-screen",
  state: MENU_DATA_ITEM_STATE_ENABLED,
  action: defaultEmptyAction,
};

// toggle test query
function toggleTestQueryGrid() {
  isTestQuery.update((value) => !value);
}
const MENU_VIEW_TEST_QUERY: MenuElementType = {
  type: MENU_DATA_ITEM_TYPE_ELEMENT,
  label: "Test Query",
  prefixIcon: "top-menu-view-test-query",
  state: MENU_DATA_ITEM_STATE_ENABLED,
  action: toggleTestQueryGrid,
};

const viewItems: MenuItemType[] = [
  MENU_VIEW_SHOW_LIST,
  MENU_VIEW_FREEZE_LIST,
  MENU_VIEW_GROUP_LIST,
  MENU_VIEW_ZOOM,
  MENU_VIEW_HIDDEN_SHEETS,

  // MENU_HORIZONTAL_SEPARATOR,
  // MENU_VIEW_PANELS,
  // MENU_VIEW_WORKSPACE,
  // MENU_VIEW_FULL_SCREEN,
];

export default viewItems;
