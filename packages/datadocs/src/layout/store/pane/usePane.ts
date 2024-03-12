import type { Writable } from "svelte/store";
import { get } from "svelte/store";
import type {
  Pane,
  PaneProps,
  View,
  WorkspaceConfig,
} from "src/layout/types/pane";
import {
  DIVIDER_SIZE,
  PANE_CLOSED_SIZE,
  PANE_MIN_WIDTH,
} from "src/layout/constants/size";
import type { PaneSingleType } from "src/layout/enums/pane";
import { PaneName, Placement } from "src/layout/enums/pane";
import { PaneGroupType, PaneType } from "src/layout/enums/pane";
import { getId, insertToArray } from "src/layout/utils/data";
import { Split } from "src/layout/enums/split";
import { Orientation } from "src/layout/enums/divider";
import { set, get as getObject } from "lodash-es";
import { tick } from "svelte";

interface MapPane {
  origin: Pane;
  parent: MapPane;
  prev: MapPane;
  next: MapPane;
  children: MapPane[];
}

export function usePane(paneConfig: Writable<WorkspaceConfig>) {
  let map: Record<string, MapPane> = {};

  function isHGroup(paneConfig: Pane) {
    return paneConfig?.props?.groupType === PaneGroupType.HORIZONTAL;
  }
  function isVGroup(paneConfig: Pane) {
    return paneConfig?.props?.groupType === PaneGroupType.VERTICAL;
  }
  function isTabsGroup(paneConfig: Pane) {
    return paneConfig?.props?.groupType === PaneGroupType.TABS;
  }
  function isFixedGroup(paneConfig: Pane) {
    return paneConfig?.props?.groupType === PaneGroupType.FIXED;
  }
  function isEmbeddedGroup(paneConfig: Pane) {
    return paneConfig?.props?.groupType === PaneGroupType.EMBEDDED;
  }
  function isSpreadSheetGroup(paneConfig: Pane) {
    return paneConfig?.props?.groupType === PaneGroupType.SPREADSHEET;
  }
  function isTiledGroup(paneConfig: Pane) {
    return paneConfig?.props?.groupType === PaneGroupType.TILED;
  }

  function isDashboard(paneConfig: Pane) {
    return paneConfig?.content?.view?.name === PaneName.DASHBOARD;
  }

  function isRoot(paneConfig: Pane) {
    return paneConfig?.placement === Placement.ROOT;
  }

  function isCollapse(paneConfig: Pane) {
    return !!paneConfig?.props?.collapse;
  }

  function isTabGroupDeep(paneConfig: Pane) {
    return (
      paneConfig?.props?.groupType === PaneGroupType.TABS ||
      findFirstChildDeepById(
        paneConfig?.id,
        (pane) => pane.props.groupType === PaneGroupType.TABS
      )
    );
  }

  function isCollaspeGroup(config: Pane) {
    return (
      (isVGroup(config) || isHGroup(config) || isTabsGroup(config)) &&
      !isRoot(config) &&
      !isRoot(getParentById(config.id)) &&
      !findFirstChildDeepById(config.id, (config) => isDashboard(config))
    );
  }

  function isPane(config: Pane) {
    return config.type === PaneType.PANE;
  }

  function getById(id: string): Pane | undefined {
    return map[id]?.origin;
  }

  function getParentById(id: string): Pane | undefined {
    return map[id]?.parent?.origin;
  }

  function getNextById(id: string): Pane | undefined {
    return map[id]?.next?.origin;
  }

  function getPrevById(id: string): Pane | undefined {
    return map[id]?.prev?.origin;
  }

  function getPanePlacement(targetId: Pane["id"], isSplit: boolean): Placement {
    let placement = "";
    let target = getById(targetId);
    if (!target) {
      return (Placement.CONTAINER_CENTER_MAIN + Placement.INNER) as Placement;
    }
    if (
      target.placement === Placement.CONTAINER ||
      target.placement === Placement.CONTAINER_CENTER
    ) {
      return Placement.CONTAINER_CENTER_MAIN;
    } else {
      placement = Placement.CONTAINER_CENTER_MAIN;
      if (isSplit) {
        target = getParentById(targetId);
      } else {
        placement = Placement.CONTAINER_CENTER_MAIN + Placement.INNER;
      }

      // need redesign
      if (!target) {
        return (Placement.CONTAINER_CENTER_MAIN + Placement.INNER) as Placement;
      }

      let placementContainer = "";
      if (isFixedGroup(target)) {
        placementContainer = "fixed";
      } else if (isEmbeddedGroup(target)) {
        placementContainer = "embedded";
      } else if (isTiledGroup(target)) {
        placementContainer = "tile";
      } else if (isTabsGroup(target)) {
        placementContainer = "tab";
      }
      return (
        placementContainer ? `${placement}:${placementContainer}` : placement
      ) as Placement;
    }
  }

  function getRootId() {
    return get(paneConfig).root.id;
  }

  function setById(id: Pane["id"], key: string, value: any) {
    const pane = getById(id);
    if (pane) {
      set(pane, key, value);
      update();
    }
  }

  function setCollapseById(id: Pane["id"], collapse: boolean) {
    const pane = getById(id);
    const parent = getParentById(id);
    set(pane, "props.collapse", collapse);
    setAllChildDeepById(id, (child) => set(child, "props.collapse", collapse));
    update();
    resizeChildrenById(parent.id);
  }

  /**
   * Pane related
   */
  function insert({
    targetId,
    newPane,
    index = -1,
  }: {
    targetId: Pane["id"];
    newPane: Pane;
    index?: number;
  }) {
    const target = getById(targetId);
    if (target) {
      target.children = target.children || [];

      if (index === -1) {
        index = target.children.length;
      }

      insertToArray(target.children, index, newPane);
      target.children = [...target.children];
      update();
      resizeChildrenById(targetId);
    }
  }

  function create({
    type,
    paneType,
    paneGroupType,
    params,
  }: {
    type: Pane["type"];
    paneType?: PaneSingleType;
    paneGroupType?: PaneGroupType;
    params: {
      placement?: Pane["placement"];
      props?: PaneProps;
      children?: Pane[];
      viewConfig?: Omit<View, "id">;
      size?: string;
    };
  }): Pane {
    const id = getId();
    switch (type) {
      case PaneType.PANE: {
        return {
          id,
          type: PaneType.PANE,
          placement: params.placement,
          size: params?.size || "auto",
          props: {
            paneType,
          },
          content: params.viewConfig
            ? {
                view: {
                  id,
                  ...params.viewConfig,
                },
              }
            : null,
        };
      }
      case PaneType.GROUP: {
        return {
          id,
          type: PaneType.GROUP,
          placement: params.placement,
          props: {
            ...(params.props || {}),
            groupType: paneGroupType,
          },
          children: params.children || [],
          size: params?.size || "auto",
          content: params.viewConfig
            ? {
                view: {
                  id,
                  ...params.viewConfig,
                },
              }
            : null,
        };
      }
    }
  }

  function moveTo({
    sourceId,
    targetId,
  }: {
    sourceId: Pane["id"];
    targetId: Pane["id"];
  }) {
    const sourceParent = getParentById(sourceId);
    const targetParent = getParentById(targetId);
    if (sourceParent && targetParent) {
      const sourceIndex = sourceParent.children.findIndex(
        (child) => child.id === sourceId
      );
      const targetIndex = targetParent.children.findIndex(
        (child) => child.id === targetId
      );
      const temp = sourceParent.children.splice(sourceIndex, 1);
      targetParent.children.splice(targetIndex, 0, ...temp);
      update();
    }
  }

  function sortByIds(ids: Pane["id"][]) {
    const parent = getParentById(ids[0]);
    if (parent) {
      parent.children = parent.children.sort((a, b) => {
        return ids.indexOf(a.id) - ids.indexOf(b.id);
      });
      update();
    }
  }

  function removeById(id: Pane["id"]) {
    const parent = getParentById(id);
    if (parent) {
      if (isRoot(parent)) {
        return;
      }

      const index = parent.children.findIndex((child) => child.id === id);
      parent.children.splice(index, 1);
      if (parent.children.length === 0) {
        removeById(parent.id);
      }

      update();
      resizeChildrenById(parent.id);
    }
  }

  function replace({
    targetId,
    newPane,
  }: {
    targetId: Pane["id"];
    newPane: Pane;
  }) {
    const parent = getParentById(targetId);
    if (parent) {
      const index = parent.children.findIndex((child) => child.id === targetId);
      parent.children.splice(index, 1, newPane);
    }
    update();
  }

  function split({
    source,
    targetId,
    edge,
  }: {
    source: Pane;
    targetId: Pane["id"];
    edge: Split;
  }) {
    const target = getById(targetId);
    const groupType =
      edge === Split.NORTH_EDGE || edge === Split.SOUTH_EDGE
        ? PaneGroupType.VERTICAL
        : PaneGroupType.HORIZONTAL;
    const isPrev = edge === Split.NORTH_EDGE || edge === Split.WEST_EDGE;
    source.size = source.size || "auto";
    // If split a pane with a group that have same groupType, then insert into the group.
    if (
      target.type === PaneType.GROUP &&
      target.props.groupType === groupType
    ) {
      insert({
        targetId,
        newPane: source,
        index: isPrev ? 0 : target.children.length,
      });
      return;
    } else {
      const targetParent = getParentById(targetId);
      // If target's parent have same groupType, then insert into the parent.
      if (targetParent?.props?.groupType === groupType) {
        const paneIndex = targetParent.children.indexOf(target);
        insert({
          targetId: targetParent.id,
          newPane: source,
          index: isPrev ? paneIndex : paneIndex + 1,
        });
      } else {
        // Create a new group and replace the target.
        const group = create({
          type: PaneType.GROUP,
          paneGroupType: groupType,
          params: {
            size: target.size || "auto",
            placement: getPanePlacement(targetId, true),
            children: isPrev ? [source, target] : [target, source],
            viewConfig: {
              name: "none",
              label: "group",
              config: {},
            },
            props: target?.props || source?.props || {},
          },
        });
        target.size = "auto";
        replace({
          targetId,
          newPane: group,
        });
      }
    }
    update();
  }

  /**
   * Size related
   */
  function parseSize(config: Pane, parentSize = 0) {
    if (isCollapse(config)) {
      return PANE_CLOSED_SIZE;
    }
    // Use parseFloat to make more accurate.
    if (config.size.endsWith("%")) {
      return (parseFloat(config.size.replace("%", "")) / 100) * parentSize;
    }
    if (config.size.endsWith("px")) {
      return parseFloat(config.size.replace("px", ""));
    }
    return 0;
  }

  function getSizeById(id: string): string {
    const pane = getById(id);
    // If pane is collapse, then set it to the closed size.
    const topCollapseParent = findLastParentDeepById(id, (config) =>
      isCollapse(config)
    );
    if (isCollapse(pane)) {
      if (!topCollapseParent) {
        return `${PANE_CLOSED_SIZE}px`;
      }
    }
    // Compatible the old version
    if (typeof pane?.size === "number") {
      return `${pane.size}px`;
    } else if (pane?.size !== "auto") {
      if (!pane?.size?.includes("%") && !pane?.size?.includes("px")) {
        return "100%";
      }
      return pane?.size || "100%";
    }
    // return "100%";
    // If pane is auto, then calculate the size.
    const dividerSize = DIVIDER_SIZE;
    const parent = getParentById(id);
    if (isVGroup(parent) || isHGroup(parent)) {
      const element = document.getElementById(parent.id);
      if (element) {
        const bound = element.getBoundingClientRect();
        const parentRealSize = isHGroup(parent) ? bound.width : bound.height;
        const autoSizeChildren = parent.children.filter(
          (child) => child.size === "auto" && !isCollapse(child)
        );
        const fixedSizeChildren = parent.children.filter(
          (child) => child.size !== "auto"
        );
        const restSize =
          fixedSizeChildren.reduce(
            (acc, child) => acc - parseSize(child, parentRealSize),
            parentRealSize
          ) -
          (parent.children.length - 1) * dividerSize;
        return `${
          Math.round(
            ((restSize / parentRealSize) * 10000) / autoSizeChildren.length
          ) / 100
        }%`;
        // return `${restSize / autoSizeChildren.length}px`;
      }
    }
    return "100%";
  }

  function getRealSizeById(id: string, orientation: Orientation) {
    const element = document.getElementById(id);
    if (element) {
      const bound = element.getBoundingClientRect();
      return orientation === Orientation.VERTICAL ? bound.width : bound.height;
    }
    return 0;
  }

  function getMinSizeById(id: string, orientation: Orientation) {
    const pane = getById(id);
    // if (isCollapse(pane)) {
    //   return PANE_CLOSED_SIZE;
    // }
    const minSize = PANE_MIN_WIDTH;
    if (isHGroup(pane) || isVGroup(pane)) {
      const is = orientation === Orientation.VERTICAL ? isHGroup : isVGroup;
      const num = findAllChildNumDeepById(id, (child) => {
        return is(getParentById(child.id));
      });
      return num > 0 ? (num - 1) * DIVIDER_SIZE + num * minSize : minSize;
    } else {
      return minSize;
    }
  }

  function changeSizeByTwoId({
    leftId,
    rightId,
    change,
    orientation,
  }: {
    leftId: string;
    rightId: string;
    change: number;
    orientation: Orientation;
  }) {
    const parent = getParentById(leftId);

    function getMaxSize(id: string) {
      let movedChild = [];
      let restChild = [];
      if (change > 0) {
        const index = parent.children.findIndex((child) => child.id === leftId);
        movedChild = parent.children.slice(index);
        restChild = parent.children.slice(0, index);
      } else {
        const index = parent.children.findIndex(
          (child) => child.id === rightId
        );
        movedChild = parent.children.slice(0, index + 1);
        restChild = parent.children.slice(index + 1);
      }
      const movedSize = restChild.reduce((acc, child) => {
        return acc - getRealSizeById(child.id, orientation);
      }, getRealSizeById(parent.id, orientation) - DIVIDER_SIZE * restChild.length);
      return movedChild
        .filter((item) => item.id !== id)
        .reduce((acc, child) => {
          return (
            acc -
            (isCollapse(child)
              ? PANE_CLOSED_SIZE
              : getMinSizeById(child.id, orientation))
          );
        }, movedSize - (movedChild.length - 1) * DIVIDER_SIZE);
    }

    function getResizeConfig(id: string, direction: "left" | "right") {
      let config = getById(id);
      if (
        (change > 0 && direction === "right") ||
        (change < 0 && direction === "left")
      ) {
        const otherConfig =
          direction === "left" ? getPrevById(id) : getNextById(id);
        if (
          (getRealSizeById(id, orientation) ===
            getMinSizeById(id, orientation) ||
            isCollapse(config)) &&
          otherConfig
        ) {
          config = getResizeConfig(otherConfig.id, direction);
        }
      }

      return config;
    }

    function setSize(config: Pane, size: number) {
      if (Math.abs(size - getMinSizeById(config.id, orientation)) <= 0) {
        config.size = `${getMinSizeById(config.id, orientation)}px`;
      } else {
        config.size = `${Math.round((size / parentSize) * 10000) / 100}%`;
      }
    }

    const left = getResizeConfig(leftId, "left");
    const right = getResizeConfig(rightId, "right");
    const parentSize = getRealSizeById(parent.id, orientation);
    const realLeftSize = getRealSizeById(left.id, orientation);
    const realRightSize = getRealSizeById(right.id, orientation);
    const minSizeLeft = getMinSizeById(left.id, orientation);
    const minSizeRight = getMinSizeById(right.id, orientation);

    if (
      (change > 0 && realRightSize === minSizeRight) ||
      (change < 0 && realLeftSize === minSizeLeft)
    ) {
      return;
    }

    // Make sure new size is not under minSize
    let newLeftSize = Math.max(realLeftSize + change, minSizeLeft);
    let newRightSize = Math.max(realRightSize - change, minSizeRight);
    newLeftSize = Math.min(newLeftSize, getMaxSize(left.id));
    newRightSize = Math.min(newRightSize, getMaxSize(right.id));
    if (parentSize === getMinSizeById(parent.id, orientation)) {
      left.size = "auto";
      right.size = "auto";
    } else {
      !isCollapse(left) && setSize(left, newLeftSize);
      if (!isCollapse(right)) {
        setSize(right, newRightSize);
      }
    }
    update(false);
  }

  function resizeChildrenById(id: string) {
    tick().then(() => {
      const config = getById(id);
      const children = config?.children || [];
      if (children.length) {
        // If no one is auto, find the most large size pane, set it to the auto.
        let maxSize = 0;
        let maxPaneId = "";
        for (let i = 0; i < children.length; i++) {
          // if (children[i].size === "auto") {
          //   maxPaneId = children[i].id;
          //   break;
          //   // autoChild.push(children[i].id);
          // } else {
          const size = getRealSizeById(
            children[i].id,
            config.props.groupType === PaneGroupType.HORIZONTAL
              ? Orientation.VERTICAL
              : Orientation.HORIZONTAL
          );
          if (size > maxSize) {
            maxSize = size;
            maxPaneId = children[i].id;
          }
          // }
        }
        const maxPane = getById(maxPaneId);
        if (maxPane) {
          maxPane.size = "auto";
        }
        update();
      }
    });
  }

  /**
   * Tree Data related
   */
  function findBy(cb: (config: Pane) => boolean): Pane | null {
    for (const id in map) {
      if (cb(map[id].origin)) {
        return map[id].origin;
      }
    }
    return null;
  }

  function findFirstParentDeepById(
    id: Pane["id"],
    cb: (config: Pane) => boolean
  ): Pane | null {
    const parent = getParentById(id);
    if (parent) {
      if (cb(parent)) {
        return parent;
      } else {
        const deep = findFirstParentDeepById(parent.id, cb);
        if (deep) {
          return deep;
        }
      }
    }
    return null;
  }

  function findLastParentDeepById(
    id: Pane["id"],
    cb: (config: Pane) => boolean
  ): Pane | null {
    const parent = getParentById(id);
    if (parent) {
      const deep = findLastParentDeepById(parent.id, cb);
      if (deep) {
        return deep;
      } else {
        if (cb(parent)) {
          return parent;
        }
      }
    }
    return null;
  }

  function findFirstChildDeepById(
    id: Pane["id"],
    cb: (config: Pane) => boolean
  ): Pane | null {
    const children = getById(id)?.children || [];
    for (const child of children) {
      if (cb(child)) {
        return child;
      } else {
        const deep = findFirstChildDeepById(child.id, cb);
        if (deep) {
          return deep;
        }
      }
    }
    return null;
  }

  function setAllChildDeepById(id: Pane["id"], cb: (config: Pane) => boolean) {
    const children = getById(id)?.children || [];
    for (const child of children) {
      cb(child);
      setAllChildDeepById(child.id, cb);
    }
    return null;
  }

  function findAllChildNumDeepById(
    id: Pane["id"],
    cb: (config: Pane) => boolean
  ): number {
    let num = 0;
    const children = getById(id)?.children || [];
    for (const child of children) {
      if (cb(child)) {
        num++;
      }
      num += findAllChildNumDeepById(child.id, cb);
    }
    return num;
  }

  /**
   * Build and Update
   */
  function buildDeep(groupData: Pane): MapPane {
    const pane: MapPane = {
      origin: groupData,
      prev: null,
      next: null,
      parent: null,
      children: [],
    };

    if (groupData?.children?.length) {
      const children = groupData.children;
      pane.children = [];
      children.forEach((childData, i) => {
        const child = buildDeep(childData);
        pane.children.push(child);
        child.parent = pane;
        if (i > 0) {
          child.prev = pane.children[i - 1];
          pane.children[i - 1].next = child;
        }
      });
    }

    map[groupData.id] = pane;
    return pane;
  }

  function buildMap() {
    map = {};
    const root = buildDeep(get(paneConfig).root);
    console.log(map, root);
    return {
      root,
    };
  }

  function updateDeep(config: Pane) {
    if (config?.children?.length) {
      // Remove group pane when only one child and move child to parent.
      if (
        config.children.length === 1 &&
        (config.props.groupType === PaneGroupType.HORIZONTAL ||
          config.props.groupType === PaneGroupType.VERTICAL) &&
        !isRoot(config)
      ) {
        const child = updateDeep(config.children[0]);
        if (child) {
          child.size = config?.size || "auto";
          config = child;
        } else {
          config.children = [];
        }
      } else {
        config.children = config.children.map((child) => updateDeep(child));
      }
    }
    return config;
  }

  function update(build = true) {
    // trigger paneConfig update
    const root = get(paneConfig).root;
    root.children = root.children.map((child) => updateDeep(child));

    paneConfig.set({ root });
    if (build) {
      buildMap();
    }
  }

  return {
    // build pane tree from config and update it and create a map stored every pane.
    buildMap,
    // Create a new pane by params.
    create,
    // Insert a new pane to exist pane by id.
    insert,
    // Remove a pane by id.
    removeById,
    // Get pane by id.
    getById,
    // Get parent pane by id.
    getParentById,
    // Move pane to target pane position.
    moveTo,
    // Sort pane by ids.
    sortByIds,
    // Replace new pane to target id.
    replace,
    // Update pane tree.
    update,
    // Get next pane by id.
    getNextById,
    // Get prev pane by id.
    getPrevById,
    isPane,
    isHGroup,
    isVGroup,
    isTabsGroup,
    isFixedGroup,
    isEmbeddedGroup,
    isSpreadSheetGroup,
    isTiledGroup,
    isDashboard,
    isRoot,
    isTabGroupDeep,
    isCollapse,
    isCollaspeGroup,
    // Get pane size by id.
    getSizeById,
    // Change pane size by two pane id. Used for Divider Component.
    changeSizeByTwoId,
    // Split pane by edge.
    split,
    getPanePlacement,
    getRootId,
    // Get real size by id.
    getRealSizeById,
    // Set pane property by id.
    setById,
    // Recompute all children size by id.
    resizeChildrenById,
    // Set whether pane is collapse by id.
    setCollapseById,
    // Find pane by key and value.This key can be nested.Such as 'content.view.name'
    findBy,
    findFirstParentDeepById,
    findFirstChildDeepById,
    findLastParentDeepById,
    findAllChildNumDeepById,
    getMinSizeById,
  };
}
