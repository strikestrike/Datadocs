<script lang="ts">
  import { onMount } from "svelte";
  import { get } from "svelte/store";
  import {
    loadWorkspace,
    updateWorkspace,
    workspaceConfig,
  } from "../app/store/store-ui";
  import clsx from "clsx";
  import checkMobileDevice from "../components/common/is-mobile";
  import { modalConfigStore, ModalWrapper } from "../components/common/modal";
  import DatadocsHeader from "../components/header/DatadocsHeader.svelte";
  import CellHelper from "../components/grids/cell-helper/CellHelper.svelte";
  import { getMobileWorkspace } from "../app/store/store-workspaces";

  import { appManager } from "../app/core/global/app-manager";
  // import { getLayoutActions } from "../layout/helpers/layout-actions";

  import {
    APP_EVENT_LAYOUT_RESIZE_END,
    APP_EVENT_LAYOUT_RESIZE_START,
    APP_EVENT_WORKSPACE_LAYOUT,
  } from "../app/core/global/app-manager-events";
  import { loadDuckDB } from "../app/store/store-db";
  import Icon from "../components/common/icons/Icon.svelte";
  import Panel from "../components/panels/Panel.svelte";
  import {
    panelComponents,
    panelConfigs,
  } from "../components/panels/panels-config";
  import PanelsLayout from "../layout/pages/workbook/index.svelte";
  // import MobileLayout from "../layout/pages/mobile/MobileLayout.svelte";
  import { initializePanels } from "../components/panels/panels";
  import { initWorkbookParamsState } from "../app/store/store-workbooks";
  import { useParams } from "svelte-navigator";
  import GridTypeIcons from "../components/grids/GridTypeIcons.svelte";
  import GridColumnTypeTooltip from "../components/grids/GridColumnTypeTooltip.svelte";
  import CellDataLayoverMenu from "../components/grids/layover-menus/LayoverMenu.svelte";
  import EditorHyperlinkMenu from "../components/grids/hyperlink/EditorHyperlinkMenu.svelte";
  import AddHyperlinkMenu from "../components/grids/hyperlink/AddHyperlinkMenu.svelte";
  import PanelLayoverContainer from "../components/common/panel/panel-layover/PanelLayoverContainer.svelte";
  import { userInformationStore } from "../api/store";

  const PANEL_LAYOUT_CLASSES = "bg-panels-bg";

  const isMobile: boolean = checkMobileDevice();

  let panelsLayout;

  // let panelsLayoutContext: PanelsLayoutContext;

  let isLayoutResizing = false;

  const mobileWorkspace = getMobileWorkspace().data;

  // let panelsDrag: Writable<ActiveDrag>;
  // let panelsResize: Writable<ActiveResize>;
  // let sheetsDrag: Writable<ActiveDrag>;
  // let sheetsResize: Writable<ActiveResize>;

  // let isMouseDown: boolean = false;
  // let isResizing: boolean = false;

  // const layoutActions = getLayoutActions(() => panelsLayoutContext);

  // const {
  //   paneAction,
  //   paneDividerAction,
  //   dropAreaAction,
  //   tabsAction,
  //   tabAction,
  // } = layoutActions;

  onMount(async () => {
    initializePanels();
    appManager.initialize();
    setupAppManager();
    addListeners();
    setTimeout(() => {
      // loadWorkspace();
      loadDuckDB();
    });
  });

  function addListeners() {
    // if (panelsLayout) {
    //   panelsLayout.addEventListener(RESIZE_START,onResize);
    // }
  }

  function onResizeStart(event) {
    appManager.trigger(APP_EVENT_LAYOUT_RESIZE_START, {
      data: event.detail,
    });
  }

  function onResizeEnd(event) {
    appManager.trigger(APP_EVENT_LAYOUT_RESIZE_END, event.detail);
  }

  function onReady() {
    appManager.trigger(APP_EVENT_WORKSPACE_LAYOUT, {
      data: {
        layout: get(workspaceConfig),
      },
    });
  }

  function onLayout(event) {
    updateWorkspace(event.detail.layout);
    appManager.trigger(APP_EVENT_WORKSPACE_LAYOUT, {
      data: event.detail,
    });
  }

  function onContext(globalContext) {
    // panelsLayoutContext = globalContext;
    appManager.panelsLayout = globalContext;
  }

  function setupAppManager() {
    appManager.listen(APP_EVENT_LAYOUT_RESIZE_START, (eventData) => {
      isLayoutResizing = true;
    });
    appManager.listen(APP_EVENT_LAYOUT_RESIZE_END, (eventData) => {
      isLayoutResizing = false;
    });
  }

  const params = get(useParams());
  $: if ($userInformationStore) {
    initWorkbookParamsState(params);
  }

  // localStorage.setItem("default_ws", "");
</script>

<div class={clsx(
      "datadocs", 
      { "pointer-events-none": isLayoutResizing } 
    )}
    class:mobile={isMobile}
>
  <div class="header z-20">
    <DatadocsHeader />
  </div>
  {#if $workspaceConfig !== null}
    <div class="panels-container">
      {#if !isMobile}
        <PanelsLayout
          bind:this={panelsLayout}
          on:resizeStart={onResizeStart}
          on:resizeEnd={onResizeEnd}
        />
      {:else}
        <!-- <MobileLayout PanelComponent={Panel} {Icon} /> -->
      {/if}
    </div>
  {/if}
</div>

<ModalWrapper {modalConfigStore} />
<CellHelper />
<GridTypeIcons />
<GridColumnTypeTooltip />
<CellDataLayoverMenu />
<EditorHyperlinkMenu />
<AddHyperlinkMenu />
<PanelLayoverContainer />

<div id="tooltip_container" class="absolute" />
<div id="context_menu_container" class="absolute" />

<style lang="postcss">
  .datadocs {
    @apply off-bg w-screen h-screen overflow-hidden relative;
    --datadocs-header-height: 92px;
  }

  .datadocs.mobile {
    --datadocs-header-height: 40px;
  }

  .datadocs.mobile {
    height: 100%;
  }

  .header {
    @apply w-full z-20 box-border;
    padding: 4px 3px 3px 3px;
    height: var(--datadocs-header-height);
    /* background: linear-gradient(103.11deg, #19013a 0%, #312d6e 100%); */
    background: linear-gradient(
      90.82deg,
      #041986 1.42%,
      #3e08bc 25.04%,
      #7013cd 66.63%,
      #320caf 100%
    );
  }

  .datadocs.mobile .header {
    padding: 0px;
  }

  .panels-container {
    @apply w-full;
    height: calc(100% - var(--datadocs-header-height));
  }
</style>
