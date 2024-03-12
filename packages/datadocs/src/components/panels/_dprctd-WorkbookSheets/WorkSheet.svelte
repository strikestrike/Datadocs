<script lang="ts">
  import type { WorkbookSheet } from "../../../app/store/store-worksheets";
  // import SheetLayout from "../../../layout/main/panels-layout/layouts/sheet/SheetLayout.svelte";
  import Icon from "../../common/icons/Icon.svelte";

  import { appManager } from "../../../app/core/global/app-manager";
  import {
    APP_EVENT_LAYOUT_RESIZE_END,
    APP_EVENT_LAYOUT_RESIZE_START,
    APP_EVENT_SHEET_LAYOUT,
  } from "../../../app/core/global/app-manager-events";

  import type {
    GlobalContext as SheetsLayoutContext,
    Pane,
    View,
    ViewConfig,
  } from "../../../layout/main/panels-layout/types";
  // import {
  //   sheetPanelComponents,
  //   sheetPanelConfigs,
  // } from "../../panels-sheet/sheet-panels-config";
  // import SheetPanel from "../../panels-sheet/SheetPanel.svelte";

  import { APP_SHEET_CONTENT } from "../../../app/core/global/app-manager-constants";
  import {
    LAYER_OBJECT,
    LAYER_TAB,
    LAYER_TABGROUP,
    LAYER_VIEW,
  } from "../../../app/core/layers/layers-constants";
  import type { LayerEntry } from "../../../app/core/layers/layers-types";
  import type { ViewObject } from "../../../app/core/objects/objects-types";
  import {
    insertToArray,
    removeFromArrayIndex,
  } from "../../../layout/main/panels-layout/core/utils";
  import { createPanelHandler } from "./WorkSheet";
  import WorkSheetPanelSettings from "./comps/WorkSheetPanelSettings.svelte";

  export let data: WorkbookSheet;

  export let pane: any = {};

  let worksheetElement: HTMLElement;

  let isReady = false;

  let config = null;

  let sheetsLayoutContext: SheetsLayoutContext;

  let showPanelSettings = false;
  let showPanelSettingsPane: Pane = null;
  let showPanelSettingsToggle: Function = null;

  function onReady() {
    // if (!isReady) {
    appManager.trigger(APP_EVENT_SHEET_LAYOUT, {
      data: {
        layout: config,
      },
    });
    appManager.layerManager.updateLayers(config);
    setupAppManager();
    appManager.api.saveSheetContent(data.id, config);
    isReady = true;
    // }
  }

  function setupAppManager() {
    appManager.register(
      APP_SHEET_CONTENT,
      createPanelHandler(worksheetElement, {
        addObject,
        deleteObject,
        layerReorder,
      })
    );
  }

  function onLayout(event) {
    appManager.trigger(APP_EVENT_SHEET_LAYOUT, {
      data: event.detail,
    });
    appManager.layerManager.updateLayers(event.detail.layout);
    appManager.api.saveSheetContent(data.id, event.detail.layout);
  }

  function onContext(globalContext) {
    sheetsLayoutContext = globalContext;
    appManager.sheetsLayout = globalContext;
  }

  function onResizeStart(event) {
    appManager.trigger(APP_EVENT_LAYOUT_RESIZE_START, {
      data: event.detail,
    });
  }

  function onResizeEnd(event) {
    appManager.trigger(APP_EVENT_LAYOUT_RESIZE_END, event.detail);
  }

  function getViewDetails(id) {
    const targetView: View | null =
      appManager.sheetsLayout.panesContext.getView(id);
    const targetViewPane: Pane | null =
      appManager.sheetsLayout.panesContext.getPaneByViewId(id);
    const targetViewIndex: number | null =
      appManager.sheetsLayout.panesContext.getViewIndex(id);
    return {
      targetView,
      targetViewPane,
      targetViewIndex,
    };
  }

  function addObject(newObject) {
    const { targetView, targetViewPane, targetViewIndex } = getViewDetails(
      newObject.id || appManager.activeView?.id
    );

    if (targetView !== null && targetViewPane !== null) {
      let objectsCount;
      let lastObject;

      targetView.config.objects = targetView.config.objects || [];
      objectsCount = targetView.config.objects.length;
      lastObject = targetView.config.objects[objectsCount - 1];
      if (newObject.objectData.transform) {
        targetView.config.objectNewAt = {
          ...newObject.objectData.transform,
        };
      } else {
        if (objectsCount === 0) {
          targetView.config.objectNewAt = {
            x: 80,
            y: 80,
          };
        } else {
          targetView.config.objectNewAt.x += 50;
          targetView.config.objectNewAt.y += 50;
        }
      }
      targetView.config.objects.push(
        appManager.objectsManager.createNewObject(
          newObject.objectData.type,
          targetView.config.objectNewAt
        )
      );
      appManager.sheetsLayout.panesContext.updatePane(targetViewPane);
    } else {
      // alert(" No Pane or No View");
    }
  }

  function deleteObject({ id, index }) {
    const { targetView, targetViewPane, targetViewIndex } = getViewDetails(id);
    if (targetView !== null && targetViewPane !== null) {
      const viewConfig: ViewConfig = targetView.config;

      if (viewConfig !== undefined) {
        console.groupCollapsed("LayerItem");
        console.log("layerDelete");
        console.log("viewConfig.objects " + viewConfig.objects);
        console.log("itemIndex " + index);
        if (viewConfig.objects && viewConfig.objects.length > 0) {
          removeFromArrayIndex(viewConfig.objects, index);
          if (viewConfig.objects.length > 0) {
            const lastObject =
              viewConfig.objects[viewConfig.objects.length - 1];
            if (lastObject) {
              viewConfig.objectNewAt.x = lastObject.transform.x;
              viewConfig.objectNewAt.y = lastObject.transform.y;
            }
          } else {
            viewConfig.objectNewAt = {
              x: 80,
              y: 80,
            };
          }
          appManager.sheetsLayout.panesContext.updatePane(targetViewPane);
        }
        console.log("layerDelete after");
        console.log("viewConfig.objects " + viewConfig.objects);
        console.groupEnd();
      }
    }
  }

  function layerReorder({ id, drag }) {
    const { targetView, targetViewPane, targetViewIndex } = getViewDetails(id);

    const source: LayerEntry = drag.source as LayerEntry;
    const sourceIndex: number = drag.sourceIndex;
    const target: LayerEntry = drag.target as LayerEntry;
    const targetIndex: number = drag.targetIndex;

    console.groupCollapsed("SheetContent");
    console.log("layerReorder", drag);
    console.log("layerReorder", targetView, targetViewPane, targetViewIndex);
    console.groupEnd();

    if (
      targetView !== null &&
      targetViewPane !== null &&
      source !== undefined &&
      target !== undefined &&
      sourceIndex !== undefined &&
      targetIndex !== undefined
    ) {
      const sourceType = source.type;
      const targetType = target.type;
      if (source.parent.id === target.parent.id && sourceType === targetType) {
        const itemType = sourceType;
        if (itemType === LAYER_OBJECT) {
          if (targetView) {
            const viewConfig: ViewConfig = targetView.config;
            if (viewConfig) {
              const objects: Array<ViewObject> = viewConfig.objects;
              if (objects && objects.length > 0) {
                console.log("layerReorder change", objects);
                console.log("layerReorder change", sourceIndex, targetIndex);
                const atSourceIndex = objects[sourceIndex];
                const atTargetIndex = objects[targetIndex];
                removeFromArrayIndex(objects, sourceIndex);
                insertToArray(
                  objects,
                  targetIndex - (sourceIndex < targetIndex ? 1 : 0),
                  atSourceIndex
                );
                appManager.sheetsLayout.panesContext.updatePane(targetViewPane);
                console.log("layerReorder change after", objects);
              }
            }
          }
        } else if (itemType === LAYER_VIEW) {
          // if (source.props.type === target.props.type) {
          // if (source.props.type === spreadsheetConfig.name) {
          appManager.sheetsLayout.panesContext.movePane(
            targetViewPane,
            targetIndex
          );
          // }
          // }
        } else if (itemType === LAYER_TAB) {
          appManager.sheetsLayout.panesContext.reorderTabsByIndex(
            targetViewPane,
            sourceIndex,
            targetIndex
          );
        }
      }
    } else if (
      source !== undefined &&
      target !== undefined &&
      sourceIndex !== undefined &&
      targetIndex !== undefined
    ) {
      const sourceType = source.type;
      if (sourceType === LAYER_TABGROUP) {
        const sourcePane: Pane = appManager.sheetsLayout.panesContext.getPane(
          source.props.id
        );
        const targetViewPane: Pane = appManager.sheetsLayout.panesContext.getPane(
          target.props.id
        );
        appManager.sheetsLayout.panesContext.reorderPanes(
          sourcePane,
          targetViewPane,
          source.props.listIndex,
          targetIndex
        );
      }
    }
  }

  function formatOnSave(item: any) {
    // Hook to format data

    console.groupCollapsed("SheetContent");
    console.log("formatOnSave");
    console.log(item);

    // if (item?.settingx?.view?.config?.objects !== undefined) {
    //   console.log("has objects !!! ");
    //   console.log(item?.settingx?.view?.config?.objects);
    // }

    console.groupEnd();

    return item;
  }

  function panelSettingsAction(
    element,
    [pane, getPanelSettings, togglePanelSettings]
  ) {
    function onMouseClick() {
      let show = getPanelSettings();
      show = togglePanelSettings(!show);
      showPanelSettings = show;
      showPanelSettingsPane = pane;
      showPanelSettingsToggle = (show) => {
        togglePanelSettings(show);
        showPanelSettings = show;
      };
    }

    element.addEventListener("click", onMouseClick);

    return {
      destroy: () => {},
    };
  }

  // onMount(async () => {

  // });

  $: {
    appManager.api.getSheetContent(data.id).then((configuration) => {
      config = configuration;
      onReady();
    });
  }
</script>

{#if config !== null}
  <div>
    Worksheet Here
  </div>
  <!-- <SheetLayout
    config={JSON.parse(JSON.stringify(config))}
    class={""}
    {Icon}
    parentPaneId={pane.id}
    PanelComponent={SheetPanel}
    panelComponents={sheetPanelComponents}
    panelConfigs={sheetPanelConfigs}
    on:ready={onReady}
    on:layout={onLayout}
    {onContext}
    on:resizeStart={onResizeStart}
    on:resizeEnd={onResizeEnd}
    bind:node={worksheetElement}
    {panelSettingsAction}
    extMethods={{
      formatOnSave,
    }}
  /> -->
{/if}

<div class="work-sheet-overlays">
  {#if showPanelSettings}
    <WorkSheetPanelSettings
      pane={showPanelSettingsPane}
      togglePanelSettings={showPanelSettingsToggle}
    />
  {/if}
</div>

<!-- Previous version -->
<!-- <script lang="ts">
  import MainGridPanel from "../../grids/MainGridPanel.svelte";
  import type { WorkbookSheet } from "../../../app/store/store-sheets";

  export let data: WorkbookSheet;
</script> -->

<!-- {#if data.gridSheets}
  <MainGridPanel data={data.gridSheets}/>
{/if} -->
<style lang="postcss">
  .work-sheet-overlays {
    @apply absolute top-0 left-0 w-full h-full z-999999 pointer-events-none;
  }
</style>
