import { isNumber, set } from "lodash-es";
import { CONTEXT_TYPE } from "src/layout/constants/context";
import { ContextType } from "src/layout/enums/context";
import type { Type } from "src/layout/types/context";
import { getContext } from "svelte";
import { useLayoutSheet, useLayoutWorkBook } from "src/layout/store/pane";
import type { Pane } from "src/layout/types/pane";
import { PaneGroupType, PaneSingleType, PaneType } from "src/layout/enums/pane";
import { get, set as setObject } from "lodash-es";

export function useTab() {
  const type = getContext<Type>(CONTEXT_TYPE);
  const {
    getById,
    isTabsGroup,
    insert,
    replace,
    getParentById,
    removeById,
    create,
    getPanePlacement,
  } = type === ContextType.SHEET ? useLayoutSheet() : useLayoutWorkBook();

  function addTab({
    targetId,
    pane,
    index,
  }: {
    targetId: Pane["id"];
    pane: Pane;
    index?: number;
  }): Pane {
    index = isNumber(index) ? index : -1;
    pane.props.paneType = PaneSingleType.TABBED;
    const targetConfig = getById(targetId);
    if (isTabsGroup(targetConfig)) {
      insert({
        targetId: targetConfig.id,
        newPane: pane,
        index,
      });
      set(targetConfig, "props.activeId", pane.id);
      return targetConfig;
    } else {
      const tabPane = createTabFromPane({
        targetPane: targetConfig,
        pane,
        index,
      });
      replace({
        targetId,
        newPane: tabPane,
      });
      set(tabPane, "props.activeId", pane.id);
      return tabPane;
    }
  }

  function createTabFromPane({
    targetPane,
    pane,
    index,
  }: {
    targetPane?: Pane;
    pane: Pane;
    index?: number;
  }): Pane {
    if (isTabsGroup(pane)) return pane;
    const children = targetPane
      ? index > 0
        ? [targetPane, pane]
        : [pane, targetPane]
      : [pane];
    children.forEach((child) => {
      child.props.paneType = PaneSingleType.TABBED;
    });
    const previewPane = create({
      type: PaneType.GROUP,
      paneGroupType: PaneGroupType.TABS,
      params: {
        size: targetPane?.size || "auto",
        placement: getPanePlacement(targetPane?.id || pane?.id, false),
        children,
        viewConfig: {
          name: "Tab",
          label: "Tab",
          config: {
            transform: get(targetPane, "content.view.config.transform") || {},
          },
        },
        props: targetPane ? targetPane?.props : pane?.props,
      },
    });
    return previewPane;
  }

  function convertTabToPane(id: Pane["id"]) {
    // only convert tab to pane when there is only one tab
    const tabPane = getById(id);
    if (tabPane.children.length > 1) {
      return;
    }
    // tabPane.props.paneType = PaneSingleType.;
    const pane = tabPane.children[0];
    const parent = getParentById(id);
    const paneIndex = parent.children.indexOf(tabPane);
    setObject(
      pane,
      "content.view.config.transform",
      get(tabPane, "content.view.config.transform") || {}
    );
    pane.size = tabPane.size || "auto";
    removeById(id);
    insert({
      targetId: parent.id,
      newPane: pane,
      index: paneIndex,
    });
  }

  return {
    addTab,
    convertTabToPane,
    createTabFromPane,
  };
}
