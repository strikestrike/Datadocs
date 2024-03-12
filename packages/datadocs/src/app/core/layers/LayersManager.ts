import type { Writable } from "svelte/store";
import { writable } from "svelte/store";
import type { Pane, WorkspaceConfig } from "../../../layout/_dprctd/types";
import { appManager } from "../global/app-manager";
import { APP_LAYER_MANAGER } from "../global/app-manager-constants";
// import { LAYER_CONTAINER, LAYER_OBJECT, LAYER_TAB, LAYER_TABGROUP, LAYER_VIEW, LAYER_WORKSHEET } from "./layers-constants";
import {
  PANE_GROUP_EMBEDDED,
  PANE_TYPE_GROUP,
  PANE_TYPE_PANE,
} from "../../../layout/_dprctd/core/constants";
import {
  LAYER_CONTAINER,
  LAYER_ITEM,
  LAYER_WORKBOOK,
  LAYER_WORKSHEET,
} from "./layers-constants";
import type { LayerItem } from "./layers-types";
import { getCurrentActiveSheet } from "../../store/store-worksheets";

class LayerManager {
  activeConfig: WorkspaceConfig;
  layers: Writable<Array<LayerItem>>;

  constructor() {
    this.layers = writable([]);
    this.activeConfig = null;
    this.setupAppManager();
  }

  setupAppManager() {
    appManager.register(APP_LAYER_MANAGER, (payload) => {
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

  updateLayers(config?: WorkspaceConfig) {
    config = config || this.activeConfig;
    if (config) {
      this.layers.set(this.layoutToLayers(config));
      this.activeConfig = config;
    }
  }

  layoutToLayers(config: WorkspaceConfig) {
    let workBook: LayerItem = null;
    let workSheet: LayerItem = null;
    const lastTabGroup = null;
    const lastGridItem = null;
    const tabGroupCount = 0;
    const gridCount = 0;

    const layers: Array<LayerItem> = [];
    const workSheetContent = [];

    let main: LayerItem = null;

    console.groupCollapsed("LayersManager");

    function createItem(
      pane: Pane,
      parent: Pane,
      parentLayer: LayerItem,
      type,
      label,
      {
        isInTab = false,
        index = -1,
        noHide = false,
        noDelete = false,
        noLock = false,
        isHidden = false,
        isLocked = false,
      } = {}
    ) {
      let item: LayerItem = null;
      switch (type) {
        case LAYER_WORKBOOK: {
          item = {
            id: pane?.id || LAYER_WORKBOOK,
            pane,
            parent: parentLayer,
            type: LAYER_CONTAINER,
            label,
            isGroup: true,
            isInTab: false,
            index: index,
            children: [],
            settings: {
              noHide,
              noDelete,
              noLock,
              isHidden,
              isLocked,
            },
          };
          break;
        }
        case LAYER_WORKSHEET: {
          item = {
            id: pane?.id || LAYER_WORKSHEET,
            pane,
            parent: parentLayer,
            type: LAYER_CONTAINER,
            label,
            isGroup: true,
            isInTab: false,
            index: index,
            children: [],
            settings: {
              noHide,
              noDelete,
              noLock,
              isHidden,
              isLocked,
            },
          };
          break;
        }
        case PANE_TYPE_GROUP: {
          if (pane.props.groupType === PANE_GROUP_EMBEDDED) {
            item = {
              id: pane?.id || LAYER_ITEM,
              pane,
              parent: parentLayer,
              type: LAYER_ITEM,
              label: pane?.content?.view?.label || label,
              isGroup: true,
              isInTab: false,
              index: index,
              children: [],
              settings: {
                noHide,
                noDelete,
                noLock,
                isHidden,
                isLocked,
              },
            };
          } else {
            item = {
              id: pane?.id || LAYER_CONTAINER,
              pane,
              parent: parentLayer,
              type: LAYER_CONTAINER,
              label,
              isGroup: true,
              isInTab: false,
              index: index,
              children: [],
              settings: {
                noHide,
                noDelete,
                noLock,
                isHidden,
                isLocked,
              },
            };
          }
          break;
        }
        case PANE_TYPE_PANE: {
          item = {
            id: pane.id,
            pane,
            parent: parentLayer,
            type: LAYER_ITEM,
            label,
            isGroup: false,
            isInTab: isInTab,
            index: index,
            settings: {
              noHide,
              noDelete,
              noLock,
              isHidden,
              isLocked,
            },
          };
          break;
        }
      }
      // if (item !== null) {
      // }
      return item;
    }

    function nextNode(
      pane: Pane,
      parent: Pane,
      parentLayer: LayerItem,
      index: number
    ) {
      // console.log(pane);

      if (pane.type === PANE_TYPE_GROUP) {
        const containerLayer = createItem(
          pane,
          parent,
          parentLayer,
          pane.type,
          "Container",
          // pane.props.groupType,
          {
            index,
            isInTab: parent?.props?.isTabsGroup || false,
            noHide: false,
            noDelete: false,
            noLock: false,
            isHidden: false,
            isLocked: false,
          }
        );
        if (pane.children && pane.children.length > 0) {
          for (let i = 0; i < pane.children.length; i++) {
            const childPane = pane.children[i];
            nextNode(childPane, pane, containerLayer, i);
          }
        }
        parentLayer.children.push(containerLayer);
      } else {
        const paneLayer = createItem(
          pane,
          parent,
          parentLayer,
          pane.type,
          pane.content?.view?.label,
          {
            index,
            isInTab: parent?.props?.isTabsGroup || false,
            noHide: false,
            noDelete: false,
            noLock: false,
            isHidden: false,
            isLocked: false,
          }
        );
        parentLayer.children.push(paneLayer);
      }
    }

    workBook = createItem(null, null, null, LAYER_WORKBOOK, "Workbook");

    workSheet = createItem(
      null,
      null,
      null,
      LAYER_WORKSHEET,
      getCurrentActiveSheet().name
    );

    workBook.children = [workSheet];
    workSheet.children = workSheetContent;

    if (config.root) {
      nextNode(config.root, null, workSheet, -1);
    }

    layers.push(workBook);

    main = layers[0] || main;

    if (main?.children?.length == 1) {
      main = main.children[0];
      if (main?.children?.length == 1) {
        main = main.children[0];
      }
    }

    console.log(main);

    console.groupEnd();

    if (main !== null) {
      if (
        main.type === LAYER_CONTAINER &&
        main.pane.props.groupType !== PANE_GROUP_EMBEDDED
      ) {
        return main.children;
      } else if (main.pane.content !== null) {
        return [main];
      }
    }

    return [];
  }
}

export default LayerManager;

// function createItem(
//   parent: ParentView = { type: "", id: "" },
//   target: any,
//   node: Pane,
//   type,
//   {
//     paneId = "",
//     isInTab = false,
//     tabIndex = -1,
//     listIndex = -1,
//     noHide = false,
//     noDelete = false,
//     noLock = false,
//   } = {}
// ) {
//   let item: LayerItem = null;
//   switch (type) {
//     case LAYER_WORKSHEET: {
//       item = {
//         parent,
//         label: getCurrentActiveSheet().name,
//         type: LAYER_WORKSHEET,
//         noHide: true,
//         noDelete: true,
//         noLock: true,
//         children: null,
//         props: {
//           id: "",
//           paneId,
//           nodeId: "",
//           type: "",
//           listIndex,
//         },
//       };
//       break;
//     }
//     case LAYER_CONTAINER: {
//       item = {
//         parent,
//         label: "Container",
//         type,
//         noHide: true,
//         noDelete: true,
//         noLock: true,
//         children: null,
//         props: {
//           id: "",
//           paneId,
//           nodeId: "",
//           type: LAYER_CONTAINER,
//           listIndex,
//         },
//       };
//       break;
//     }
//     case LAYER_OBJECT: {
//       item = {
//         parent,
//         label: target.label,
//         type,
//         noHide: true,
//         noDelete: true,
//         noLock: true,
//         children: null,
//         props: {
//           id: "",
//           paneId,
//           nodeId: "",
//           type: target.name === spreadsheetConfig.name ? LAYER_VIEW_GRID : LAYER_VIEW_GRAPH,
//           listIndex,
//         },
//       };
//       break;
//     }
//     // case LAYER_TABGROUP: {
//     //   item = {
//     //     parent,
//     //     label: "Container",
//     //     type: LAYER_TABGROUP,
//     //     noHide,
//     //     noDelete,
//     //     noLock,
//     //     children: [],
//     //     props: {
//     //       id: paneId,
//     //       paneId,
//     //       nodeId: paneId,
//     //       type: "",
//     //       listIndex,
//     //     },
//     //   };
//     //   break;
//     // }
//     // case LAYER_VIEW: {
//     //   const view = target.settingx.view;
//     //   item = {
//     //     parent,
//     //     label: view?.label,
//     //     type: LAYER_VIEW,
//     //     isInTab,
//     //     noHide,
//     //     noDelete,
//     //     noLock,
//     //     isHidden: node.props.isHidden,
//     //     isLocked: node.props.isLocked,
//     //     children: null,
//     //     props: {
//     //       id: view?.id,
//     //       paneId,
//     //       nodeId: node.id,
//     //       type: view?.name,
//     //       listIndex,
//     //     },
//     //   };
//     //   break;
//     // }
//     // case LAYER_TAB: {
//     //   item = {
//     //     parent,
//     //     label: target.label,
//     //     type: LAYER_TAB,
//     //     isInTab,
//     //     noHide,
//     //     noDelete,
//     //     noLock,
//     //     children: null,
//     //     props: {
//     //       id: target.id,
//     //       paneId,
//     //       nodeId: node.id,
//     //       type: target.name,
//     //       tabIndex,
//     //       listIndex,
//     //     },
//     //   };
//     //   break;
//     // }
//     // case LAYER_OBJECT: {
//     //   item = {
//     //     parent,
//     //     label: target.label,
//     //     type: LAYER_OBJECT,
//     //     isInTab,
//     //     noHide,
//     //     noDelete,
//     //     noLock,
//     //     children: null,
//     //     props: {
//     //       id: `${LAYER_OBJECT}_${listIndex}`,
//     //       paneId,
//     //       nodeId: node.id,
//     //       type: (target as ViewObject).type,
//     //       listIndex,
//     //     },
//     //   };
//     //   break;
//     // }
//   }
//   if (item !== null) {
//     // if (item.props.type === spreadsheetConfig.name) {
//     //   if (gridCount === 0) {
//     //     lastGridItem = item;
//     //     lastGridItem.noHide =
//     //       lastGridItem.noLock =
//     //       lastGridItem.noDelete =
//     //         true;
//     //   } else {
//     //     lastGridItem.noHide =
//     //       lastGridItem.noLock =
//     //       lastGridItem.noDelete =
//     //         false;
//     //   }
//     //   gridCount++;
//     // } else
//     // if (item.props.type === LAYER_TABGROUP) {
//     //   if (tabGroupCount === 0) {
//     //     lastTabGroup = item;
//     //     lastTabGroup.noHide =
//     //       lastTabGroup.noLock =
//     //       lastTabGroup.noDelete =
//     //       true;
//     //   } else {
//     //     lastTabGroup.noHide =
//     //       lastTabGroup.noLock =
//     //       lastTabGroup.noDelete =
//     //       false;
//     //   }
//     //   tabGroupCount++;
//     // }
//   }
//   return item;
// }

// function createObjectLayers(
//   parent: ParentView = { type: "", id: "" },
//   node,
//   objects,
//   { isInTab, paneId } = { isInTab: false, paneId: "" }
// ) {
//   const objectLayers: Array<LayerItem> = [];
//   for (let i = objects.length - 1; i >= 0; i--) {
//     const object: Array<ViewObject> = objects[i];
//     objectLayers.push(
//       createItem(parent, object, node, LAYER_OBJECT, {
//         paneId,
//         isInTab,
//         listIndex: i,
//       })
//     );
//   }
//   return objectLayers.length === 0 ? null : objectLayers;
// }

// function createTabGroupLayers(
//   parent: ParentView = { type: "", id: "" },
//   node,
//   paneId,
//   tabs
// ) {
//   const tabLayers: Array<LayerItem> = [];
//   for (let i = 0; i < tabs.length; i++) {
//     const tab = tabs[i];
//     let tabLayer: any;
//     if (tab.type === "absolute") {
//       tabLayer = {
//         label: "Container",
//         type: LAYER_CONTAINER,
//         children: createTabGroupLayers(
//           { id: tab.id, type: LAYER_CONTAINER },
//           tab,
//           tab.id,
//           tab.children
//         )
//       };
//     } else {
//       tabLayer = createItem(parent, tab, node, LAYER_OBJECT, {
//         paneId,
//         isInTab: true,
//         tabIndex: i,
//         listIndex: i,
//       });
//     }
//     // if (tab?.config?.objects !== undefined) {
//     //   const objectLayers: Array<LayerItem> = createObjectLayers(
//     //     { type: LAYER_OBJECT || tabLayer.type, id: tab.id },
//     //     node,
//     //     tab?.config?.objects,
//     //     {
//     //       paneId,
//     //       isInTab: true,
//     //     }
//     //   );
//     //   tabLayer.children = objectLayers;
//     // }
//     tabLayers.push(tabLayer);
//   }
//   return tabLayers;
// }

// function nextNode(configNode, parent: ParentView = { type: "", id: "" }) {
//   console.groupCollapsed("LayersManager");
//   console.log("layoutToLayers ", configNode);

//   let children = configNode.children;
//   for (let i = 0; i < children.length; i++) {
//     const childNode: PaneConfig = children[i];
//     if (
//       childNode.type === "group"
//     ) {
//       nextNode(childNode, {
//         type: childNode.type,
//         id: childNode.id,
//       });
//     } else if (
//       childNode.type === "tiledGroup" ||
//       childNode.type === "absolute") {
//       const tabLayers = createTabGroupLayers(
//         { id: childNode.id, type: LAYER_CONTAINER },
//         childNode,
//         childNode.id,
//         childNode.children
//       );
//       // tabGroupLayer.children = tabLayers;
//       sheetContent.push({
//         label: "Container",
//         props: {
//           type: "layer-item-container",
//         },
//         children: tabLayers
//       });
//     } else {
//       const layerItem = createItem(
//         parent,
//         childNode,
//         childNode,
//         childNode.type === "view" || childNode.type === undefined
//           ? LAYER_OBJECT
//           : LAYER_CONTAINER,
//         {
//           paneId: childNode.id,
//           listIndex: i,
//         }
//       );
//       // if (childNode?.settingx?.view?.config?.objects !== undefined) {
//       //   const objectLayers = createObjectLayers(
//       //     {
//       //       id: layerItem.props.id,
//       //       type: layerItem.props.type || layerItem.type,
//       //     },
//       //     childNode,
//       //     childNode?.settingx?.view?.config?.objects,
//       //     { paneId: childNode.id, isInTab: false }
//       //   );
//       //   layerItem.children = objectLayers;
//       // }
//       sheetContent.push(layerItem);
//     }
//   }

//   console.groupEnd();
// }
