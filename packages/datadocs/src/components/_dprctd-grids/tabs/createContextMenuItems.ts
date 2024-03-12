import type {
  MenuItemType,
  MenuElementType,
  MenuListType,
  MenuElementStatus,
} from "../../common/menu";
import {
  MENU_DATA_ITEM_TYPE_ELEMENT,
  MENU_DATA_ITEM_TYPE_LIST,
  MENU_DATA_ITEM_STATE_ENABLED,
  MENU_DATA_ITEM_STATE_DISABLED,
} from "../../common/menu";
import { removeGrid } from "../../../app/store/grid/base";
import DeleteConfirmationModal from "../../top-menu/components/modals/DeleteConfirmationModal.svelte";
import type { ModalConfigType } from "../../common/modal";
import { bind, openModal } from "../../common/modal";
import {
  getUniqueId,
  getUniqueTabName,
  removeTab,
  addTab,
} from "../../common/tabs";
import type {
  GridSheet,
  SheetType,
} from "../../../app/store/_dprctd-store-sheets";
import {
  BLANK_CANVAS,
  getExistingGridTabIds,
  GRAPH,
  SHEET_ICONS,
  SPREADSHEET,
} from "../../../app/store/_dprctd-store-sheets";

export type CreateContextMenuOptions = {
  inputElement: HTMLInputElement;
  tabs: GridSheet[];
  id: string;
  tabContext: {
    updateData: Function;
  };
};

function switchSheetType(tab: GridSheet, type: SheetType) {
  tab.type = type;
  tab.icon = SHEET_ICONS[type];
}

export default function createGridTabContextMenuItems(
  options: CreateContextMenuOptions
): MenuItemType[] {
  const tabs = options.tabs;
  const index = tabs.findIndex((t) => t.id === options.id);
  if (index === -1) return [];
  const data = tabs[index];

  // rename sheet
  const RENAME_SHEET: MenuElementType = {
    type: MENU_DATA_ITEM_TYPE_ELEMENT,
    label: "Rename",
    state: MENU_DATA_ITEM_STATE_ENABLED,
    action: () => {
      const inputElement = options.inputElement;
      if (inputElement) {
        setTimeout(() => {
          inputElement.focus();
          inputElement.setSelectionRange(0, inputElement.value.length);
        });
      }
    },
  };

  // Duplicate sheet
  const DUPLICATE_SHEET: MenuElementType = {
    type: MENU_DATA_ITEM_TYPE_ELEMENT,
    label: "Duplicate",
    state: MENU_DATA_ITEM_STATE_ENABLED,
    action: () => {
      const existingIds = getExistingGridTabIds();
      const id = getUniqueId(existingIds);
      const name = getUniqueTabName(`Copy of ${data.name}`, tabs, "");
      let dupTab: GridSheet = JSON.parse(JSON.stringify(data));
      dupTab = { ...dupTab, id, name };
      addTab(dupTab, tabs, index + 1);
      options.tabContext.updateData(tabs);
    },
  };

  // delete sheet
  function handleDeleteSheet() {
    const isMovable = false;
    const isResizable = false;
    const props = {
      mainMessage: `Are you sure you want to delete “${data.name}” ?`,
      sideMessages: [
        "Please be 100% sure about your decision as you will no longer be",
        "able to recover this sheet after deleting it.",
      ],
      title: `Delete “${data.name}”`,
      executeOnYes: async () => {
        const id = data.id;
        removeTab(tabs, id);
        removeGrid(id);
        options.tabContext.updateData(tabs);
      },
      isMovable: isMovable,
    };

    const modalElement = bind(DeleteConfirmationModal, props);
    const config: ModalConfigType = {
      component: modalElement,
      isMovable: isMovable,
      isResizable: isResizable,
      minWidth: 400,
      minHeight: 300,
      preferredWidth: 500,
    };

    openModal(config);
  }

  const DELETE_SHEET: MenuElementType = {
    type: MENU_DATA_ITEM_TYPE_ELEMENT,
    get label(): string {
      return `<div style="width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">Delete "${data.name}"</div>`;
    },
    status: "warning",
    get state() {
      return tabs.length > 1
        ? MENU_DATA_ITEM_STATE_ENABLED
        : MENU_DATA_ITEM_STATE_DISABLED;
    },
    action: handleDeleteSheet,
  };

  // sheet type
  const SPREADSHEET_TYPE: MenuElementType = {
    type: MENU_DATA_ITEM_TYPE_ELEMENT,
    label: "Spreadsheet",
    prefixIcon: SHEET_ICONS[SPREADSHEET],
    state: MENU_DATA_ITEM_STATE_ENABLED,
    action: () => {
      switchSheetType(data, SPREADSHEET);
      options.tabContext.updateData(tabs);
    },
    get active(): boolean {
      return data.type === SPREADSHEET;
    },
    get status(): MenuElementStatus {
      return data.type === SPREADSHEET ? "success" : "";
    },
  };

  const BLANK_CANVAS_TYPE: MenuElementType = {
    type: MENU_DATA_ITEM_TYPE_ELEMENT,
    label: "Blank Canvas",
    prefixIcon: SHEET_ICONS[BLANK_CANVAS],
    state: MENU_DATA_ITEM_STATE_ENABLED,
    action: () => {
      switchSheetType(data, BLANK_CANVAS);
      options.tabContext.updateData(tabs);
    },
    get active(): boolean {
      return data.type === BLANK_CANVAS;
    },
    get status(): MenuElementStatus {
      return data.type === BLANK_CANVAS ? "success" : "";
    },
  };

  const GRAPH_TYPE: MenuElementType = {
    type: MENU_DATA_ITEM_TYPE_ELEMENT,
    label: "Graph",
    prefixIcon: SHEET_ICONS[GRAPH],
    state: MENU_DATA_ITEM_STATE_ENABLED,
    action: () => {
      switchSheetType(data, GRAPH);
      options.tabContext.updateData(tabs);
    },
    get active(): boolean {
      return data.type === GRAPH;
    },
    get status(): MenuElementStatus {
      return data.type === GRAPH ? "success" : "";
    },
  };

  const SHEET_TYPE: MenuListType = {
    type: MENU_DATA_ITEM_TYPE_LIST,
    label: "Sheet Type",
    state: MENU_DATA_ITEM_STATE_ENABLED,
    children: [SPREADSHEET_TYPE, BLANK_CANVAS_TYPE, GRAPH_TYPE],
  };

  const sheetMenuItems: MenuItemType[] = [
    RENAME_SHEET,
    DUPLICATE_SHEET,
    DELETE_SHEET,
    SHEET_TYPE,
  ];

  return sheetMenuItems;
}
