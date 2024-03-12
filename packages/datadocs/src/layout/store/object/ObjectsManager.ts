import { graphConfig } from "../../../components/panels/Graph/Graph";
import { imageConfig } from "../../../components/panels/Image/Image";
import { shapeConfig } from "../../../components/panels/Shape/Shape";
import { spreadsheetConfig } from "../../../components/panels/SpreadSheet/SpreadSheet";
import {
  PaneType,
  PaneSingleType,
  PaneGroupType,
  Placement,
} from "src/layout/enums/pane";
import { Split } from "src/layout/enums/split";
import { getId, indexByObject } from "../../_dprctd/core/utils";
import type { Pane, View } from "src/layout/types/pane";
import { appManager } from "../../../app/core/global/app-manager";
import { APP_OBJECTS_MANAGER } from "../../../app/core/global/app-manager-constants";
import { ObjectEnum } from "src/layout/enums/object";
import type { ObjectType } from "src/layout/types/object";
import type { EAST_EDGE } from "../../_dprctd/core/constants";
import { isNumber, set } from "lodash-es";
import { useLayoutSheet } from "src/layout/store/pane";

type ObjectParams = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  index?: number;
};

const {
  activePaneId,
  insert,
  create,
  getById,
  getParentById,
  replace,
  isTabsGroup,
  isFixedGroup,
  isEmbeddedGroup,
  isTiledGroup,
} = useLayoutSheet();

class ObjectsManager {
  constructor() {}

  setupAppManager() {
    appManager.register(APP_OBJECTS_MANAGER, (payload) => {
      this.handleMessages(payload);
    });
  }

  handleMessages(payload) {
    switch (payload.message) {
      default: {
        break;
      }
    }
  }

  createObjectView(object: ObjectType, params: ObjectParams): View {
    let view: View = {
      id: getId(),
      name: "",
      label: "",
      icon: object.icon,
      config: {},
    };

    const transform = this.createTransform(params);

    if (object.type === ObjectEnum.CONTAINER) {
      view.label = "Blank " + Math.round(Math.random() * 999);
      transform.width = 900;
      transform.height = 600;
      view.config = { transform };
    } else if (object.type === ObjectEnum.CONTAINER_TILED) {
      view.label = "Tiled " + Math.round(Math.random() * 999);
      transform.width = 900;
      transform.height = 600;
      view.config = { transform };
    } else if (object.type === ObjectEnum.SPREADSHEET) {
      view = {
        ...view,
        id: getId(),
        name: spreadsheetConfig.name,
        label: "Grid " + Math.round(Math.random() * 999),
        // icon: spreadsheetConfig.icon,
        config: {
          transform,
        },
      };
    } else if (object.type === ObjectEnum.IMAGE) {
      view = {
        ...view,
        id: getId(),
        name: imageConfig.name,
        label: "Image " + Math.round(Math.random() * 999),
        // icon: imageConfig.icon,
        config: {
          transform,
        },
      };
    } else if (object.type === ObjectEnum.CHART) {
      view = {
        ...view,
        id: getId(),
        name: graphConfig.name,
        label: "Graph " + Math.round(Math.random() * 999),
        // icon: graphConfig.icon,
        config: {
          transform,
        },
      };
    } else if (object.type === ObjectEnum.SHAPE) {
      view = {
        ...view,
        id: getId(),
        name: shapeConfig.name,
        label: "Shape " + Math.round(Math.random() * 999),
        // icon: shapeConfig.icon,
        config: {
          transform,
        },
      };
    }

    return view;
  }

  createPanefromObject({
    object,
    params,
    targetId,
  }: {
    object: ObjectType;
    targetId: Pane["id"];
    params: ObjectParams;
  }): Pane {
    const viewConfig = this.createObjectView(object, {
      ...params,
    });
    const paneParams: any = {
      size: "auto",
      placement: this.getPanePlacement(targetId, true),
      props: {},
    };
    let pantType = PaneType.PANE;
    let paneGroupType: PaneGroupType = PaneGroupType.VERTICAL;
    if (object.type === ObjectEnum.CONTAINER) {
      paneGroupType = PaneGroupType.FIXED;
      pantType = PaneType.GROUP;
      // paneParams.props.isFixedGroup = true;
    }
    if (object.type === ObjectEnum.CONTAINER_TILED) {
      paneGroupType = PaneGroupType.TILED;
      pantType = PaneType.GROUP;
      // paneParams.props.isCustomGroup = true;
    }
    if (object.type === ObjectEnum.SPREADSHEET) {
      paneGroupType = PaneGroupType.SPREADSHEET;
      pantType = PaneType.GROUP;
      // paneParams.props.isSpreadSheetGroup = true;
    }
    return create({
      type: pantType,
      paneGroupType: paneGroupType,
      params: {
        ...paneParams,
        viewConfig,
      },
    });
  }

  split({
    source,
    targetId,
    edge,
  }: {
    source: Pane;
    targetId: Pane["id"];
    edge: string;
  }) {
    const target = getById(targetId);
    const targetParent = getParentById(targetId);
    source.size = "auto";
    const isPrev = edge === Split.NORTH_EDGE || edge === Split.WEST_EDGE;
    const groupType =
      edge === Split.NORTH_EDGE || edge === Split.SOUTH_EDGE
        ? PaneGroupType.VERTICAL
        : PaneGroupType.HORIZONTAL;
    const paneIndex = targetParent.children.indexOf(target);
    if (
      groupType !== targetParent?.props?.groupType ||
      !targetParent.placement.includes("main")
    ) {
      const group = create({
        type: PaneType.GROUP,
        paneGroupType: groupType,
        params: {
          size: target.size || "auto",
          placement: this.getPanePlacement(targetId, true),
          children: isPrev ? [source, target] : [target, source],
          viewConfig: {
            name: "none",
            label: "group",
            config: {},
          },
        },
      });
      target.size = "auto";
      replace({
        targetId,
        newPane: group,
      });
    } else {
      insert({
        targetId: targetParent.id,
        newPane: source,
        index: isPrev ? paneIndex : paneIndex + 1,
      });
    }
    activePaneId.set(source.id);
    // appManager.setActivePane(source, null);
  }

  createTabFromPane({
    targetPane,
    pane,
    index,
  }: {
    targetPane: Pane;
    pane: Pane;
    index?: number;
  }): Pane {
    const previewPane = create({
      type: PaneType.GROUP,
      paneGroupType: PaneGroupType.TABS,
      params: {
        size: targetPane.size || "auto",
        placement: this.getPanePlacement(targetPane.id, false),
        children: index > 0 ? [targetPane, pane] : [pane, targetPane],
        viewConfig: {
          name: "Tab",
          label: "Tab",
          config: {
            transform: targetPane.content.view.config.transform,
          },
        },
      },
    });
    // previewPane.children.push(targetPane);
    // previewPane.children.push(pane);
    return previewPane;
  }

  addEmbedded({
    targetId,
    pane,
    event,
  }: {
    targetId: Pane["id"];
    pane: Pane;
    event?: MouseEvent;
  }) {
    if (event) {
      pane.content.view.config.dropEvent = event;
    }
    insert({
      targetId: targetId,
      newPane: pane,
    });
  }

  addTiled({ targetId, pane }: { targetId: Pane["id"]; pane: Pane }) {
    this.addEmbedded({ targetId, pane });
  }

  createTransform(params: ObjectParams): {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  } {
    const transform: {
      x?: number;
      y?: number;
      width?: number;
      height?: number;
    } = {
      x: 0,
      y: 0,
      width: 400,
      height: 300,
    };

    if (params.x !== undefined) {
      transform.x = params.x;
    }
    if (params.x !== undefined) {
      transform.y = params.y;
    }
    if (params.width !== undefined) {
      transform.width = params.width;
    }
    if (params.height !== undefined) {
      transform.height = params.height;
    }

    return transform;
  }

  getPanePlacement(targetId: Pane["id"], isSplit: boolean): Placement {
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
}

export default ObjectsManager;
