import { ContextType } from "src/layout/enums/context";
import { Split } from "src/layout/enums/split";
import type { Pane } from "src/layout/types/pane";
import type { SplitData } from "src/layout/types/split";
import type { Writable } from "svelte/store";
import { useLayoutSheet, useLayoutWorkBook } from "../pane";
import { tick } from "svelte";

export function useStore(splitData: Writable<SplitData>, type: ContextType) {
  const {
    getById,
    getParentById,
    isHGroup,
    isVGroup,
    isDashboard,
    getPrevById,
    getNextById,
  } = type === ContextType.SHEET ? useLayoutSheet() : useLayoutWorkBook();
  let map: Record<string, SplitData> = {};
  const step = 4;
  const zIndexInit = 1050;

  function init(config: Pane) {
    function initDeep(pane: Pane, parent?: SplitData) {
      map[pane.id] = {
        id: pane.id,
        zIndex: parent?.zIndex ? parent.zIndex - step : zIndexInit,
        level: {
          [Split.NORTH_EDGE]: getLevelByParent(
            pane.id,
            parent,
            Split.NORTH_EDGE
          ),
          [Split.SOUTH_EDGE]: getLevelByParent(
            pane.id,
            parent,
            Split.SOUTH_EDGE
          ),
          [Split.WEST_EDGE]: getLevelByParent(pane.id, parent, Split.WEST_EDGE),
          [Split.EAST_EDGE]: getLevelByParent(pane.id, parent, Split.EAST_EDGE),
        },
      };
      if (pane.children) {
        pane.children.forEach((child) => {
          initDeep(child, map[pane.id]);
        });
      }
    }

    function getLevelByParent(
      id: Pane["id"],
      parent?: SplitData,
      direction?: Split
    ) {
      return validDirectionByPaneId(id, direction)
        ? (parent?.level?.[direction] || 0) + step
        : parent?.level?.[direction] || 0;
    }

    map = {};
    tick().then(() => {
      initDeep(config);
      // console.log(map);
    });
  }

  function validSplitByPaneId(id: Pane["id"]) {
    const pane = getById(id);
    const parent = getParentById(id);
    return (
      isHGroup(parent) || isVGroup(parent) || isHGroup(pane) || isVGroup(pane)
    );
  }

  function validDirectionByPaneId(id: Pane["id"], direction: Split) {
    const pane = getById(id);
    const parent = getParentById(id);
    const prev = getPrevById(id);
    const next = getNextById(id);
    const hasDashboard = !!pane?.children?.some((child) => isDashboard(child));
    if (!parent) {
      return true;
    }
    switch (direction) {
      case Split.NORTH_EDGE:
        return isHGroup(parent) || isVGroup(pane);
      case Split.SOUTH_EDGE:
        return isHGroup(parent) || isVGroup(pane);
      case Split.EAST_EDGE:
        return isVGroup(parent) || isHGroup(pane);
      case Split.WEST_EDGE:
        return isVGroup(parent) || isHGroup(pane);
    }
    return true;
  }

  function getZIndexByPaneId(id: Pane["id"]) {
    return map[id]?.zIndex || zIndexInit;
  }

  function getLevelByPaneIdAndDirection(id: Pane["id"], direction: Split) {
    return map[id]?.level?.[direction] || 0;
  }

  return {
    init,
    getZIndexByPaneId,
    getLevelByPaneIdAndDirection,
    validSplitByPaneId,
    validDirectionByPaneId,
  };
}
