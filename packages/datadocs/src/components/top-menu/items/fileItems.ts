import type {
  MenuItemType,
  MenuElementType,
  MenuListType,
  MenuSeparatorType,
} from "../../common/menu";
import {
  MENU_DATA_ITEM_TYPE_ELEMENT,
  MENU_DATA_ITEM_TYPE_LIST,
  MENU_DATA_ITEM_TYPE_SEPARATOR,
  MENU_DATA_ITEM_STATE_DISABLED,
  MENU_DATA_ITEM_STATE_ENABLED,
} from "../../common/menu";
import { get } from "svelte/store";
import {
  workbookListStore,
  switchWorkbook,
  switchWorkbookUrlMode,
  workbookParamsStateStore,
} from "../../../app/store/store-workbooks";
import { getCreateNewWorkbookUrl } from "../../../api/index";
import { bind, openModal } from "../../common/modal";
import NewFirestoreSource from "../../../components/firestore/modal/NewFirestoreSource.svelte";
import {
  getViewAllWorkbookComponent,
  getWorkbookMenuComponent,
} from "../components/recent-workbook";
// import { restoreLocalDB } from "../../ingest/restore-local-db";
// import OpenLoclDBModal from "../../../components/database-persistence/OpenLocalDBModal.svelte";

function defaultEmptyAction() {}
const MENU_HORIZONTAL_SEPARATOR: MenuSeparatorType = {
  type: MENU_DATA_ITEM_TYPE_SEPARATOR,
};

const MENU_FILE_NEW_WORKBOOK: MenuElementType = {
  type: MENU_DATA_ITEM_TYPE_ELEMENT,
  label: "New",
  state: MENU_DATA_ITEM_STATE_ENABLED,
  prefixIcon: "new-datadocs",
  action: async () => {
    const url = getCreateNewWorkbookUrl();
    open(url, "_blank");
  },
};

const MENU_FILE_OPEN: MenuListType = {
  type: MENU_DATA_ITEM_TYPE_LIST,
  label: "Open Recent",
  prefixIcon: "open-datadocs",
  state: MENU_DATA_ITEM_STATE_ENABLED,
  get children() {
    const workbookList = get(workbookListStore) ?? [];
    const items = workbookList.map((workbook) => {
      return {
        type: MENU_DATA_ITEM_TYPE_ELEMENT,
        label: getWorkbookMenuComponent(workbook),
        state: MENU_DATA_ITEM_STATE_ENABLED,
        action: async () => {
          await switchWorkbook(workbook.id);
        },
      } as MenuElementType;
    });

    items.push({
      type: MENU_DATA_ITEM_TYPE_ELEMENT,
      label: getViewAllWorkbookComponent(),
      state: MENU_DATA_ITEM_STATE_DISABLED,
      action: defaultEmptyAction,
    });

    return items;
  },
};

const MENU_FILE_IMPORT: MenuElementType = {
  type: MENU_DATA_ITEM_TYPE_ELEMENT,
  label: "Import",
  prefixIcon: "import",
  state: MENU_DATA_ITEM_STATE_DISABLED,
  action: defaultEmptyAction,
};

const MENU_FILE_SHARE: MenuElementType = {
  type: MENU_DATA_ITEM_TYPE_ELEMENT,
  label: "Share",
  prefixIcon: "share",
  state: MENU_DATA_ITEM_STATE_DISABLED,
  action: defaultEmptyAction,
};

const MENU_FILE_OPEN_LOCAL: MenuElementType = {
  type: MENU_DATA_ITEM_TYPE_ELEMENT,
  label: "Open Local Database",
  state: MENU_DATA_ITEM_STATE_ENABLED,
  action: () => {
    // restoreLocalDB();
    // const component = bind(OpenLoclDBModal, {});
    // openModal({
    //   component,
    //   isMovable: false,
    //   isResizable: false,
    //   minWidth: 600,
    //   minHeight: 300,
    //   preferredWidth: 600,
    // });
  },
};

const MENU_FILE_SAVE_LOCAL: MenuElementType = {
  type: MENU_DATA_ITEM_TYPE_ELEMENT,
  label: "Save Local Database",
  state: MENU_DATA_ITEM_STATE_ENABLED,
  action: () => {},
};

const MENU_FILE_URL_MODE: MenuListType = {
  type: MENU_DATA_ITEM_TYPE_LIST,
  label: "Url Mode",
  state: MENU_DATA_ITEM_STATE_ENABLED,
  children: [
    {
      type: MENU_DATA_ITEM_TYPE_ELEMENT,
      label: "GUID",
      state: MENU_DATA_ITEM_STATE_ENABLED,
      get prefixIcon() {
        const param = get(workbookParamsStateStore);
        return param.type === "GUID" ? "top-menu-item-tick" : "empty-rect";
      },
      action: () => switchWorkbookUrlMode("GUID"),
    },
    {
      type: MENU_DATA_ITEM_TYPE_ELEMENT,
      label: "Vanity Name",
      state: MENU_DATA_ITEM_STATE_ENABLED,
      get prefixIcon() {
        const param = get(workbookParamsStateStore);
        return param.type === "VANITY_NAME"
          ? "top-menu-item-tick"
          : "empty-rect";
      },
      action: () => switchWorkbookUrlMode("VANITY_NAME"),
    },
  ],
};

const MENU_FILE_OPEN_REMOTE: MenuListType = {
  type: MENU_DATA_ITEM_TYPE_LIST,
  label: "Open Remote ...",
  state: MENU_DATA_ITEM_STATE_ENABLED,
  children: [
    {
      type: MENU_DATA_ITEM_TYPE_ELEMENT,
      label: "Firestore",
      state: MENU_DATA_ITEM_STATE_ENABLED,
      action: () => {
        const component = bind(NewFirestoreSource, {});
        openModal({
          component,
          isMovable: true,
          isResizable: false,
          minWidth: 600,
          minHeight: 300,
          preferredWidth: 600,
        });
      },
    },
  ],
};

const MENU_FILE_SYNC: MenuListType = {
  type: MENU_DATA_ITEM_TYPE_LIST,
  label: "Sync",
  state: MENU_DATA_ITEM_STATE_DISABLED,
  children: [],
};

const fileItems: MenuItemType[] = [
  MENU_FILE_NEW_WORKBOOK,
  MENU_FILE_OPEN,
  MENU_FILE_IMPORT,
  MENU_FILE_SHARE,

  /*
   * NOTE: the following items are not in the design, feel free to open if necessary.
   */
  // MENU_HORIZONTAL_SEPARATOR,
  // MENU_FILE_URL_MODE,
  // MENU_FILE_OPEN_REMOTE,
  // MENU_FILE_OPEN_LOCAL,
  // MENU_HORIZONTAL_SEPARATOR,
  // MENU_FILE_SAVE_LOCAL,
  // MENU_HORIZONTAL_SEPARATOR,
  // MENU_FILE_SYNC,
];

export default fileItems;
