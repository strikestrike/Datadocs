import type { ContextMenuOptionsType } from "../../components/common/context-menu";
import { contextMenuAction } from "../../components/common/context-menu";
import {
  getPaneContextMenuItems,
  getTabContextMenuItems,
} from "./menus/panels/contextMenu";
import type { MenuItemType } from "../../components/common/menu/constant";

import type {
  TooltipPostionType,
  TooltipOptions,
} from "../../components/common/tooltip/index";
import tooltipAction from "../../components/common/tooltip/index";
import { NORTH, SOUTH } from "./core/constants";

export function getLayoutActions(getPanelsLayout) {
  function paneAction(element, [pane]) {
    // context menu
    const menuItems =
      pane.type === "pane"
        ? getPaneContextMenuItems(() => pane, getPanelsLayout().panesContext)
        : [];
    const contextMenuOptions: ContextMenuOptionsType = {
      menuItems: menuItems,
      disabled: pane.type !== "pane",
      isAtMousePosition: true,
      targetMatchCheck: true,
    };

    const contextMenuReturn = contextMenuAction(element, contextMenuOptions);

    return {
      update: ([pane]) => {
        const contextMenuOptions: ContextMenuOptionsType = {
          menuItems: menuItems,
          disabled: pane.type !== "pane",
          isAtMousePosition: true,
          targetMatchCheck: true,
        };
        contextMenuReturn.update(contextMenuOptions);
      },
      destroy: () => {
        contextMenuReturn.destroy();
      },
    };
  }

  function paneDividerAction(element, [pane, dropNotAllowed, orientation]) {
    const tooltipContent = `No more sections can be added here.`;
    const tooltipPosition: TooltipPostionType =
      orientation === "horizontal" ? "vertical" : "horizontal";
    const disabledTooltip = !dropNotAllowed;
    const tooltipOptions: TooltipOptions = {
      content: tooltipContent,
      disabled: disabledTooltip,
      position: tooltipPosition,
      backgroundStyle: "background-color: #ea4821",
      textStyle: "color: #ffffff",
      arrowColor: "#ea4821",
    };

    // console.log("paneDividerAction", tooltipOptions);

    const tooltipReturn = tooltipAction(element, tooltipOptions);

    return {
      update: ([pane, dropNotAllowed, orientation]) => {
        const tooltipContent = `No more sections can be added here.`;
        const tooltipPosition: TooltipPostionType =
          orientation === "horizontal" ? "vertical" : "horizontal";
        const disabledTooltip = !dropNotAllowed;
        const tooltipOptions: TooltipOptions = {
          content: tooltipContent,
          disabled: disabledTooltip,
          position: tooltipPosition,
          backgroundStyle: "background-color: #ea4821",
          textStyle: "color: #ffffff",
          arrowColor: "#ea4821",
        };
        tooltipReturn.update(tooltipOptions);
      },
      destroy: () => {
        tooltipReturn.destroy();
      },
    };
  }

  function dropAreaAction(
    element,
    [pane, disabledTooltip, dropArea, isContainerCenter]
  ) {
    const tooltipOptions: TooltipOptions = {
      auto: true,
      content: `No more sections can be added here.`,
      disabled: disabledTooltip,
      backgroundStyle: "background-color: #ea4821",
      textStyle: "color: #ffffff",
      arrowColor: "#ea4821",
    };

    if (pane.type === "pane") {
      tooltipOptions.position =
        dropArea === NORTH || dropArea === SOUTH ? "vertical" : "horizontal";
    } else {
      tooltipOptions.position = isContainerCenter ? "vertical" : "horizontal";
    }

    const tooltipReturn = tooltipAction(element, tooltipOptions);

    return {
      update: ([pane, disabledTooltip, dropArea, isContainerCenter]) => {
        const tooltipOptions: TooltipOptions = {
          auto: true,
          content: `No more sections can be added here.`,
          disabled: disabledTooltip,
          backgroundStyle: "background-color: #ea4821",
          textStyle: "color: #ffffff",
          arrowColor: "#ea4821",
        };

        if (pane.type === "pane") {
          tooltipOptions.position =
            dropArea === NORTH || dropArea === SOUTH
              ? "vertical"
              : "horizontal";
        } else {
          tooltipOptions.position = isContainerCenter
            ? "vertical"
            : "horizontal";
        }
        tooltipReturn.update(tooltipOptions);
      },
      destroy: () => {
        tooltipReturn.destroy();
      },
    };
  }

  function tabsAction(element, [pane, isMouseDown]) {
    const menuItems: MenuItemType[] = getPaneContextMenuItems(
      () => pane,
      getPanelsLayout().panesContext
    );
    const contextMenuOptions: ContextMenuOptionsType = {
      menuItems: menuItems,
      disabled: isMouseDown,
      isAtMousePosition: true,
      targetMatchCheck: true,
    };

    const contextMenuReturn = contextMenuAction(element, contextMenuOptions);

    return {
      update: ([pane]) => {
        const contextMenuOptions: ContextMenuOptionsType = {
          menuItems: menuItems,
          disabled: pane.type !== "pane",
          isAtMousePosition: true,
          targetMatchCheck: true,
        };
        contextMenuReturn.update(contextMenuOptions);
      },
      destroy: () => {
        contextMenuReturn.destroy();
      },
    };
  }

  function tabAction(
    element,
    [pane, tab, tabIndex, paneOrientation, label, isMouseDown, showIcon]
  ) {
    const tooltipContent: string = label;
    const tooltipPosition: TooltipPostionType =
      paneOrientation === "horizontal" ? "vertical" : "horizontal";
    const tooltipOptions: TooltipOptions = {
      content: tooltipContent,
      disabled: isMouseDown || !showIcon,
      position: tooltipPosition,
    };

    const menuItems: MenuItemType[] = getTabContextMenuItems(
      tab,
      tabIndex,
      () => pane,
      getPanelsLayout().panesContext
    );
    const contextMenuOptions: ContextMenuOptionsType = {
      menuItems: menuItems,
      disabled: isMouseDown,
      targetMatchCheck: true,
    };

    const tooltipReturn = tooltipAction(element, tooltipOptions);
    const menuReturn = contextMenuAction(element, contextMenuOptions);

    return {
      update: ([
        pane,
        tab,
        tabIndex,
        paneOrientation,
        label,
        isMouseDown,
        showIcon,
      ]) => {
        const tooltipContent: string = label;
        const tooltipPosition: TooltipPostionType =
          paneOrientation === "horizontal" ? "vertical" : "horizontal";
        const tooltipOptions: TooltipOptions = {
          content: tooltipContent,
          disabled: isMouseDown || !showIcon,
          position: tooltipPosition,
        };

        const menuItems: MenuItemType[] = getTabContextMenuItems(
          tab,
          tabIndex,
          () => pane,
          getPanelsLayout().panesContext
        );
        const contextMenuOptions: ContextMenuOptionsType = {
          menuItems: menuItems,
          disabled: isMouseDown,
          targetMatchCheck: true,
        };
        tooltipReturn.update(tooltipOptions);
        menuReturn.update(contextMenuOptions);
      },
      destroy: () => {
        tooltipReturn.destroy();
        menuReturn.destroy();
      },
    };
  }

  return {
    paneAction,
    paneDividerAction,
    dropAreaAction,
    tabsAction,
    tabAction,
  };
}
