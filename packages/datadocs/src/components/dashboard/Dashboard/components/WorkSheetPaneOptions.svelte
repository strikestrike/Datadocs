<script lang="ts">
  import clsx from "clsx";
  import { appManager } from "../../../../app/core/global/app-manager";
  import type {
    Pane,
    PaneContent,
    View,
  } from "../../../../layout/main/panels-layout/types";
  import Icon from "../../../common/icons/Icon.svelte";
  // import { blankCanvasConfig } from "../../../panels-sheet/BlankCanvas/BlankCanvas";
  // import { graphConfig } from "../../../panels-sheet/Graph/Graph";
  // import { spreadsheetConfig } from "../../../panels-sheet/Spreadsheet/Spreadsheet";

  export let pane: Pane = null;
  export let togglePanelSettings: Function = () => {};

  const children: PaneContent = pane?.content;
  const content: PaneContent = pane?.content;

  const activeTab: View = children?.[pane.props.activeChild || 0];

  function changeType(type) {
    const target = null;
    if (activeTab) {
      // if (type === spreadsheetConfig.name) {
      //   target = spreadsheetConfig;
      //   activeTab.config = {};
      // } else if (type === graphConfig.name) {
      //   target = graphConfig;
      // } else if (type === blankCanvasConfig.name) {
      //   target = blankCanvasConfig;
      // }
      if (target) {
        activeTab.name = target.name;
        activeTab.label = target.label;
        activeTab.label = target.label;
        activeTab.config = {};
        // if (pane?.settingx) {
        //   pane.settingx = {
        //     ...pane.settingx,
        //   };
        //   if (pane?.settingx?.tabs) {
        //     if (pane?.settingx?.tabs[pane?.settingx?.active || 0]) {
        //       pane.settingx.tabs[pane?.settingx?.active || 0] = {
        //         ...activeTab,
        //       };
        //     }
        //   }
        // }
      }
    }
  }

  $: content;
  $: activeTab;
</script>

<div
  class={clsx(
    "panel-settings absolute w-[576px] h-[217px] z-999999",
    content?.view ? "top-[45px] right-[15px]" : "top-[35px] right-[5px]"
  )}
  style="--modal-header-height: 46px;"
>
  <div
    class="bg-white w-full h-full default-dropdown-box-shadow rounded overflow-hidden"
  >
    <div class="panel-settings-header">
      <div class="flex flex-row flex-nowrap justify-between items-center">
        <div
          class="modal-title h-5 font-semibold uppercase text-13px text-white"
        >
          <div
            class="whitespace-nowrap overflow-hidden overflow-ellipsis text-13px font-semibold"
          >
            OBJECT SETTINGS
          </div>
        </div>
        <button
          class="focusable close-button ml-2 h-5 w-5 overflow-hidden cursor-pointer outline-none border-none"
          on:click={() => {
            togglePanelSettings(false);
          }}
        >
          <div
            class="relative h-5 w-5 flex flex-row items-center justify-items-center"
          >
            <div class="close-icon h-5 w-5">
              <Icon icon="workspace-modal-close" size="20px" />
            </div>
          </div>
        </button>
      </div>
    </div>
    <div class="panel-settings-body flex flex-col space-y-2 p-6">
      <div class="uppercase text-10px font-semibold">Object type</div>
      <div class="flex flex-row space-x-4">
        <!-- <button
          class={clsx(
            "focusable bg-transparent border-solid  w-auto text-[#454450] px-4 py-3 rounded text-13px font-medium flex flex-row justify-start items-center space-x-2",
            activeTab?.name === spreadsheetConfig.name
              ? "active-type"
              : "inactive-type"
          )}
          on:click={() => {
            changeType(spreadsheetConfig.name);
          }}
          ><Icon
            icon="status-bar-spreadsheet"
            size="15px"
            class="inline"
            fill={!true ? "none" : "#A7B0B5"}
          /><span>Spreadsheet</span></button
        >
        <button
          class={clsx(
            "focusable bg-transparent border-solid  w-auto text-[#454450] px-4 py-3 rounded text-13px font-medium flex flex-row justify-start items-center space-x-2",
            activeTab?.name === blankCanvasConfig.name
              ? "active-type"
              : "inactive-type"
          )}
          on:click={() => {
            changeType(blankCanvasConfig.name);
          }}
          ><Icon
            icon="status-bar-blank-canvas"
            size="15px"
            class="inline"
            fill={!true ? "none" : "#A7B0B5"}
          /><span>Blank Canvas</span></button
        >
        <button
          class={clsx(
            "focusable bg-transparent border-solid  w-auto text-[#454450] px-4 py-3 rounded text-13px font-medium flex flex-row justify-start items-center space-x-2",
            activeTab?.name === graphConfig.name
              ? "active-type"
              : "inactive-type"
          )}
          on:click={() => {
            changeType(graphConfig.name);
          }}
          ><Icon
            icon="status-bar-graph"
            size="15px"
            class="inline"
            fill={!true ? "none" : "#A7B0B5"}
          /><span>Chart</span></button
        > -->
      </div>
    </div>
    <div class="w-full flex flex-row justify-end space-x-2.5 px-6">
      <button
        class="focusable w-[84px] h-[36px] bg-[#F7F9FA] text-[#A7B0B5] rounded text-13px font-medium border-0"
        color="secondary"
        type="button"
        on:click={() => {
          togglePanelSettings(false);
        }}>Cancel</button
      >
      <button
        class="focusable w-[84px] h-[36px] bg-[#3BC7FF] text-[#FFFFFF] rounded text-13px font-medium border-0"
        color="primary"
        on:click={() => {
          appManager.worksheetLayout.panesContext.updatePane(pane);
          togglePanelSettings(false);
        }}>Save</button
      >
    </div>
  </div>
</div>

<style lang="postcss">
  .panel-settings {
    @apply pointer-events-auto;
  }

  .panel-settings-header {
    @apply px-4 py-3;
    width: inherit;
    height: var(--modal-header-height);
    /* Gradient */

    background: linear-gradient(
      90.82deg,
      #041986 1.42%,
      #3e08bc 25.04%,
      #7013cd 66.63%,
      #320caf 100%
    );
  }

  .panel-settings-body {
    width: inherit;
    height: auto;
  }

  .close-button {
    border: none;
  }

  .inactive-type {
    border: 1px solid;
    border-color: #e9edf0;
    color: #a7b0b5;
  }

  .active-type {
    filter: drop-shadow(1px 2px 8px rgba(95, 137, 255, 0.4));
    border: 2px solid;
    /* border-image-source: linear-gradient(94.39deg, #3BC7FF 0%, #5F89FF 100%); */
    border-color: #5f89ff;
    color: #454450;
  }
</style>
