<script lang="ts">
  import { get } from "svelte/store";
  import { getContext } from "svelte";
  import arrowRightIcon from "./arrow_right.svg?raw";
  import { appManager } from "../../../../app/core/global/app-manager";
  import { datadocsConfig } from "../../../panels/Datadocs/Datadocs";
  import { CLOSE_ROOT_MENU_CONTEXT_NAME } from "../../../common/menu";

  const closeRootMenu: () => void = getContext(CLOSE_ROOT_MENU_CONTEXT_NAME);

  function openDatadocsPanels() {
    try {
      let pane = get(appManager.activePanels)[datadocsConfig.name];
      if (!pane) {
        appManager.togglePanel(datadocsConfig.name, true);
        pane = get(appManager.activePanels)[datadocsConfig.name];
      }
      if (pane.parent) {
        const activeTab = pane.parent.children.findIndex(
          (p) => p.id === pane.id,
        );
        appManager.panelsLayout.panesContext.expand(pane.parent, activeTab);
        appManager.panelsLayout.panesContext.activeTabChange(
          pane.parent,
          activeTab,
        );
      }
    } catch (error) {
      console.error(error);
    } finally {
      closeRootMenu();
    }
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
  class="flex flex-row items-center pl-3.5 pr-2 py-1.5 gap-1 text-13px font-medium text-primary-indigo-blue cursor-pointer hover:underline"
  on:click={openDatadocsPanels}
>
  <div>View All</div>
  <div>{@html arrowRightIcon}</div>
</div>
