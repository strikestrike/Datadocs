import { get } from "svelte/store";
import { getActiveGrids } from "../../../app/store/grid/get-instance";
import {
  localAppVersion,
  latestAppVersion,
} from "../../../app/store/store-app-ver";
import type { MenuElementType, MenuItemType } from "../../common/menu";
import {
  MENU_DATA_ITEM_STATE_DISABLED,
  MENU_HORIZONTAL_SEPARATOR,
} from "../../common/menu";
import {
  MENU_DATA_ITEM_TYPE_LIST,
  MENU_DATA_ITEM_TYPE_SEPARATOR,
  MENU_DATA_ITEM_STATE_ENABLED,
  MENU_DATA_ITEM_TYPE_ELEMENT,
} from "../../common/menu";

const MENU_SHOW_LOADING: MenuElementType = {
  type: MENU_DATA_ITEM_TYPE_ELEMENT,
  label: "Show loading",
  state: MENU_DATA_ITEM_STATE_ENABLED,
  action: () => {
    const [grid] = getActiveGrids();
    if (!grid) return;
    const ds = grid.dataSource;
    ds.state.loading = !ds.state.loading;
    ds.dispatchEvent({ name: "loading" });
  },
};
const MENU_SHOW_MODAL: MenuElementType = {
  type: MENU_DATA_ITEM_TYPE_ELEMENT,
  label: "Show Modal(Merge Upstream Strategy)",
  state: MENU_DATA_ITEM_STATE_ENABLED,
  action: async () => {
    const [grid] = getActiveGrids();
    if (!grid) return;
    const result = await grid.openConfirmDialog({
      name: "MERGE_UPSTREAM_STRATEGY",
      title: "",
      backdrop: false,
    });
    console.log("confirm result:", result);
    grid.dataSource.editCells([
      { row: 20, column: 0, value: JSON.stringify(result.extra) },
    ]);
  },
};
const MENU_APP_VERSION: MenuElementType = {
  type: MENU_DATA_ITEM_TYPE_ELEMENT,
  state: MENU_DATA_ITEM_STATE_DISABLED,
  get label() {
    const localVer = get(localAppVersion);
    const latestVer = get(latestAppVersion);
    const info: string[] = [];
    if (localVer.build) info.push(localVer.build);
    if (latestVer.build && localVer.build !== latestVer.build)
      info.push(`(Latest: ${latestVer.build})`);
    if (info.length === 0) info.push("--");
    return "Version: " + info.join(" ");
  },
  action: () => {},
};

const devItems: MenuItemType[] = [
  MENU_APP_VERSION,
  MENU_HORIZONTAL_SEPARATOR,
  MENU_SHOW_LOADING,
  MENU_SHOW_MODAL,
];

export default devItems;
