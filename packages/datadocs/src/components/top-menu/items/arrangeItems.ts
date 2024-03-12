import { useLayoutWorkBook } from "src/layout/store/pane";
import type {
  MenuItemType,
  MenuElementType,
  MenuDropdownType,
} from "../../common/menu";
import {
  MENU_DATA_ITEM_TYPE_ELEMENT,
  MENU_DATA_ITEM_STATE_ENABLED,
  MENU_DATA_ITEM_STATE_DISABLED,
  MENU_HORIZONTAL_SEPARATOR,
  MENU_DATA_ITEM_TYPE_DROPDOWN,
} from "../../common/menu";
import { getMenuItemWithPostTickSign } from "../components/custom-menu-item";
import ViewWorkspaceDropdown from "../components/dropdowns/ViewWorkspace/ViewWorkspaceDropdown.svelte";
import { PanelName } from "src/layout/enums/panel";
import { get } from "lodash-es";

// eslint-disable-next-line @typescript-eslint/no-empty-function
const emptyAction = () => {};

const arrangeDatadocs = false;
const arrangeSources = false;
const arrangeTableView = false;
const { toggleArrangeItemByName, findBy } = useLayoutWorkBook();

const MENU_ARRANGE_WORSPACE: MenuDropdownType = {
  type: MENU_DATA_ITEM_TYPE_DROPDOWN,
  state: MENU_DATA_ITEM_STATE_ENABLED,
  label: "Workspace",
  prefixIcon: "menu-arrange-workspace",
  dropdown: ViewWorkspaceDropdown,
};

const MENU_ARRANGE_DATADOCS: MenuElementType = {
  type: MENU_DATA_ITEM_TYPE_ELEMENT,
  state: MENU_DATA_ITEM_STATE_DISABLED,
  get label() {
    return getMenuItemWithPostTickSign(
      "Datadocs",
      "menu-arrange-datadocs",
      !!findBy((pane) => get(pane, "content.view.name") === PanelName.DATADOCS)
    );
  },
  action: () => {
    toggleArrangeItemByName(PanelName.DATADOCS);
  },
};

const MENU_ARRANGE_SOURCES: MenuElementType = {
  type: MENU_DATA_ITEM_TYPE_ELEMENT,
  state: MENU_DATA_ITEM_STATE_DISABLED,
  get label() {
    return getMenuItemWithPostTickSign(
      "Sources",
      "menu-arrange-sources",
      !!findBy((pane) => get(pane, "content.view.name") === PanelName.SOURCES)
    );
  },
  action: () => {
    toggleArrangeItemByName(PanelName.SOURCES);
  },
};

const MENU_ARRANGE_TABLE_VIEW: MenuElementType = {
  type: MENU_DATA_ITEM_TYPE_ELEMENT,
  state: MENU_DATA_ITEM_STATE_DISABLED,
  get label() {
    return getMenuItemWithPostTickSign(
      "Table View",
      "menu-arrange-table",
      !!findBy(
        (pane) => get(pane, "content.view.name") === PanelName.TABLE_VIEW
      )
    );
  },
  action: () => {
    toggleArrangeItemByName(PanelName.TABLE_VIEW);
  },
};

const MENU_ARRANGE_INSERT_OBJECTS: MenuElementType = {
  type: MENU_DATA_ITEM_TYPE_ELEMENT,
  state: MENU_DATA_ITEM_STATE_ENABLED,
  get label() {
    return getMenuItemWithPostTickSign(
      "* Insert Objects",
      "object-container",
      !!findBy(
        (pane) => get(pane, "content.view.name") === PanelName.INSERT_OBJECTS
      )
    );
  },
  action: () => {
    toggleArrangeItemByName(PanelName.INSERT_OBJECTS);
  },
};

const arrangeItems: MenuItemType[] = [
  MENU_ARRANGE_WORSPACE,
  MENU_HORIZONTAL_SEPARATOR,
  MENU_ARRANGE_DATADOCS,
  MENU_ARRANGE_SOURCES,
  MENU_ARRANGE_TABLE_VIEW,
  MENU_ARRANGE_INSERT_OBJECTS,
];

export default arrangeItems;
