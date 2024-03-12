import { workspaceConfig } from "../../../app/store/writables";
import { get, writable } from "svelte/store";
import type { Pane, WorkspaceConfig } from "src/layout/types/pane";
import { usePane } from "./usePane";
import { cloneDeep, get as getObj } from "lodash-es";
import defaultPanels from "src/app/store/workspaces/defaut-workspace";
import { PanelName } from "src/layout/enums/panel";
import { Split } from "src/layout/enums/split";
import { PaneName } from "src/layout/enums/pane";
import { getId } from "src/layout/utils/data";

const workbookConfigCache = writable<WorkspaceConfig>(null);
const paneObject = usePane(workbookConfigCache);
const {
  removeById,
  insert,
  update,
  findBy,
  getParentById,
  split,
  findFirstParentDeepById,
  findFirstChildDeepById,
  isHGroup,
} = paneObject;

let panelGroupPosition: Partial<Record<Split, string>> = {};
const panelPositionBefore: Partial<Record<PanelName, Split>> = {};

const defaultPanes = usePane(writable(defaultPanels));
defaultPanes.update();

workspaceConfig.subscribe((config) => {
  if (config) {
    workbookConfigCache.set(cloneDeep(config));
    update();
    setPositionByDashboard();
  }
});

workbookConfigCache.subscribe((config) => {
  // console.log(cloneDeep(config));
});

function setPositionByDashboard() {
  const panelName = Object.values(PanelName);
  panelGroupPosition = {};
  panelName.forEach((name) => {
    const rs = findBy((config) => {
      return getObj(config, "content.view.name") === name;
    });
    if (rs) {
      const group = getParentById(rs.id);
      let position = Split.EAST;
      // Find the best position nearby dashboard, if not found, use default position, when recover the panel, restore to this position
      const theMostCloseParentWithDashboard = findFirstParentDeepById(
        group.id,
        (config) => {
          return !!findFirstChildDeepById(config.id, (child) => {
            return getObj(child, "content.view.name") === PaneName.DASHBOARD;
          });
        }
      );
      if (theMostCloseParentWithDashboard) {
        // const mostParent = getParentById(theMostCloseParentWithDashboard.id);
        const mostPosition = theMostCloseParentWithDashboard.children.findIndex(
          (child) => {
            return (
              getObj(child, "content.view.name") === name ||
              !!findFirstChildDeepById(
                child.id,
                (c) => getObj(c, "content.view.name") === name
              )
            );
          }
        );
        const dashboardPosition =
          theMostCloseParentWithDashboard.children.findIndex((child) => {
            return (
              getObj(child, "content.view.name") === PaneName.DASHBOARD ||
              !!findFirstChildDeepById(
                child.id,
                (c) => getObj(c, "content.view.name") === PaneName.DASHBOARD
              )
            );
          });
        if (isHGroup(theMostCloseParentWithDashboard)) {
          position =
            mostPosition > dashboardPosition
              ? Split.EAST_EDGE
              : Split.WEST_EDGE;
        } else {
          position =
            mostPosition > dashboardPosition
              ? Split.SOUTH_EDGE
              : Split.NORTH_EDGE;
        }
        panelPositionBefore[name] = position;
        if (!panelGroupPosition[position]) {
          panelGroupPosition[position] = group.id;
        }
      }
    }
  });
  console.log(panelGroupPosition, panelPositionBefore);
}

export function useLayoutWorkBook() {
  function sync() {
    console.log("workbook sync", get(workbookConfigCache));
    workspaceConfig.set(cloneDeep(get(workbookConfigCache)));
  }

  function reset() {
    workbookConfigCache.set(cloneDeep(get(workspaceConfig)));
    update();
  }

  function toggleArrangeItemByName(name: PanelName) {
    const rs = findBy((config) => {
      return getObj(config, "content.view.name") === name;
    });
    if (rs) {
      removeById(rs.id);
    } else {
      const defaultPane = defaultPanes.findBy((config) => {
        return getObj(config, "content.view.name") === name;
      });
      const dashborad = findBy((config) => {
        return getObj(config, "content.view.name") === PaneName.DASHBOARD;
      });
      if (defaultPane) {
        const positionBefore = panelPositionBefore[name];
        if (panelGroupPosition[positionBefore]) {
          insert({
            targetId: panelGroupPosition[positionBefore],
            newPane: defaultPane,
          });
        } else {
          const parentDefault = defaultPanes.getParentById(defaultPane.id);
          const parent = cloneDeep(parentDefault);
          parent.children = [];
          parent.id = getId();
          split({
            targetId: dashborad.id,
            source: parent,
            edge: positionBefore,
          });
          insert({ targetId: parent.id, newPane: defaultPane });
        }
      }
    }
    sync();
  }

  function findPositionById(id: Pane["id"]): Split | "" {
    const positions = Object.keys(panelGroupPosition) as Split[];
    return (
      positions.find((key) => {
        return (
          panelGroupPosition[key] === id ||
          findFirstChildDeepById(id, (child) => {
            return panelGroupPosition[key] === child.id;
          })
        );
      }) || ""
    );
  }

  return {
    layout: workbookConfigCache,
    layoutStore: workspaceConfig,
    sync,
    reset,
    ...paneObject,
    toggleArrangeItemByName,
    findPositionById,
  };
}
