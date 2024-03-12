/**
 * @packageDocumentation
 * @module layout/contextMenu
 */

import { get } from "svelte/store";
import type {
  MenuItemType,
  MenuElementType,
  MenuListType,
  MenuElementStatus,
} from "../../../../components/common/menu/constant";
import {
  MENU_DATA_ITEM_TYPE_ELEMENT,
  MENU_DATA_ITEM_TYPE_LIST,
  MENU_DATA_ITEM_STATE_ENABLED,
  MENU_DATA_ITEM_STATE_DISABLED,
} from "../../../../components/common/menu/constant";

import type { ModalConfigType } from "../../../../components/common/modal/index";

import { openModal } from "../../../../components/common/modal/store-modal";

import { bind } from "../../../../components/common/modal/modalBind";

import PaneModal from "src/layout/_dprctd/modals/panels/PaneModal.svelte";
import { appManager } from "../../../../app/core/global/app-manager";
import type { Pane } from "../../types";

function isPaneClosed(pane) {
  // when moving pane from open pane to close pane group, the props isClosed for pane is not updated
  // do additional check on parent
  return (
    pane.props.isClosed ||
    (/inner/.test(pane.placement) && pane.parent.props.isClosed)
  );
}

function openMaximizePanelModal(
  pane: any,
  panesContext: any,
  activeTabIndex?: number
) {
  const isMovable = false;
  const isResizable = false;
  const modalProps = {
    pane: pane,
    panesContext: panesContext,
    activeTabIndex: activeTabIndex ?? 0,
  };
  const preferredWidth = window.innerWidth - 400;
  const preferredHeight = window.innerHeight - 150;
  const modalElement = bind(PaneModal, modalProps);
  const modalConfig: ModalConfigType = {
    component: modalElement,
    isMovable,
    isResizable,
    minWidth: 400,
    minHeight: 300,
    preferredWidth,
    preferredHeight,
  };

  openModal(modalConfig);
}

export function getTabContextMenuItems(
  tab,
  tabIndex,
  getPaneData,
  panesContext
): MenuItemType[] {
  const CLOSE_TAB: MenuElementType = {
    type: MENU_DATA_ITEM_TYPE_ELEMENT,
    label: "Close Tab",
    state: MENU_DATA_ITEM_STATE_ENABLED,
    action: () => {
      const panels = get(appManager.activePanels);
      const panelName = tab.name;
      const isAdded = !!panels[panelName];

      if (isAdded) {
        appManager.togglePanel(panelName, false);
      }
    },
    status: "warning",
  };

  const CLOSE_GROUP: MenuElementType = {
    type: MENU_DATA_ITEM_TYPE_ELEMENT,
    label: "Close Group",
    state: MENU_DATA_ITEM_STATE_ENABLED,
    action: () => {
      panesContext.removePane(getPaneData());
    },
    status: "warning",
  };

  const EXPAND_COLLAPE_PANE: MenuElementType = {
    type: MENU_DATA_ITEM_TYPE_ELEMENT,
    get label() {
      return isPaneClosed(getPaneData()) ? "Expand" : "Collapse";
    },
    state: MENU_DATA_ITEM_STATE_ENABLED,
    action: () => {
      if (isPaneClosed(getPaneData())) {
        panesContext.expand(getPaneData(), tabIndex);
      } else {
        panesContext.collapse(getPaneData(), tabIndex);
      }
    },
  };

  const MAXIMIZE_PANE: MenuElementType = {
    type: MENU_DATA_ITEM_TYPE_ELEMENT,
    label: "View in Full Screen",
    state: MENU_DATA_ITEM_STATE_ENABLED,
    action: () => {
      openMaximizePanelModal(getPaneData(), panesContext, tabIndex);
    },
  };

  const tabMenuItems: MenuItemType[] = [
    EXPAND_COLLAPE_PANE,
    CLOSE_TAB,
    CLOSE_GROUP,
    MAXIMIZE_PANE,
  ];

  return tabMenuItems;
}

export function getPaneContextMenuItems(
  getPaneData,
  panesContext
): MenuItemType[] {
  const CLOSE_TAB: MenuElementType = {
    type: MENU_DATA_ITEM_TYPE_ELEMENT,
    label: "Close Tab",
    get state() {
      return isPaneClosed(getPaneData())
        ? MENU_DATA_ITEM_STATE_DISABLED
        : MENU_DATA_ITEM_STATE_ENABLED;
    },
    action: () => {
      if (isPaneClosed(getPaneData())) {
        return;
      }

      const pane: Pane = getPaneData();
      const hasTabs = pane.props.isTabsGroup && pane.children?.length > 0;
      const activeTabIndex = pane.props.activeChild ?? -1;

      if (hasTabs && activeTabIndex !== -1) {
        const tabPane = pane.children[activeTabIndex];
        const panels = get(appManager.activePanels);
        const panelName = tabPane.content?.view.name;
        const isAdded = !!panels[panelName];

        if (isAdded) {
          appManager.togglePanel(panelName, false);
        }
      }
    },
    status: "warning",
  };

  const CLOSE_GROUP: MenuElementType = {
    type: MENU_DATA_ITEM_TYPE_ELEMENT,
    label: "Close Group",
    state: MENU_DATA_ITEM_STATE_ENABLED,
    action: () => {
      panesContext.removePane(getPaneData());
    },
    status: "warning",
  };

  const EXPAND_COLLAPE_PANE: MenuElementType = {
    type: MENU_DATA_ITEM_TYPE_ELEMENT,
    get label() {
      return isPaneClosed(getPaneData()) ? "Expand" : "Collapse";
    },
    state: MENU_DATA_ITEM_STATE_ENABLED,
    action: () => {
      const pane: Pane = getPaneData();

      if (isPaneClosed(pane)) {
        if (pane.props && pane.children.length > 0) {
          panesContext.expand(pane, 0);
        }
      } else {
        panesContext.collapse(pane);
      }
    },
  };

  const MAXIMIZE_PANE: MenuElementType = {
    type: MENU_DATA_ITEM_TYPE_ELEMENT,
    label: "View in Full Screen",
    state: MENU_DATA_ITEM_STATE_ENABLED,
    action: () => {
      openMaximizePanelModal(getPaneData(), panesContext);
    },
  };

  const paneMenuItems: MenuItemType[] = [
    EXPAND_COLLAPE_PANE,
    CLOSE_TAB,
    CLOSE_GROUP,
    MAXIMIZE_PANE,
  ];

  return paneMenuItems;
}
