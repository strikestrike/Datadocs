import { ObjectEnum } from "src/layout/enums/object";
import { useLayoutSheet } from "src/layout/store/pane";
import type { ObjectType } from "src/layout/types/object";
import type { Pane, View } from "src/layout/types/pane";
import { getId } from "src/layout/utils/data";
import { spreadsheetConfig } from "src/components/panels/SpreadSheet/SpreadSheet";
import { graphConfig } from "src/components/panels/Graph/Graph";
import { imageConfig } from "src/components/panels/Image/Image";
import { shapeConfig } from "src/components/panels/Shape/Shape";
import { PaneGroupType, PaneType } from "src/layout/enums/pane";

export function useObject() {
  const { create, getPanePlacement } = useLayoutSheet();

  type ObjectParams = {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    index?: number;
  };

  function createObjectView(object: ObjectType, params: ObjectParams): View {
    let view: View = {
      id: getId(),
      name: "",
      label: "",
      icon: object.icon,
      config: {},
    };

    const transform = createTransform(params);

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

  function createPanefromObject({
    object,
    params,
    targetId,
  }: {
    object: ObjectType;
    targetId: Pane["id"];
    params: ObjectParams;
  }): Pane {
    const viewConfig = createObjectView(object, {
      ...params,
    });
    const paneParams: any = {
      size: "auto",
      placement: getPanePlacement(targetId, true),
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

  function createTransform(params: ObjectParams): {
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

  return {
    createObjectView,
    createPanefromObject,
    createTransform,
  };
}
