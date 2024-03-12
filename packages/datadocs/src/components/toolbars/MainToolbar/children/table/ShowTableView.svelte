<script lang="ts">
  import type { TableEvent } from "@datadocs/canvas-datagrid-ng";
  import { appManager } from "../../../../../app/core/global/app-manager";
  import { isTableViewOpen } from "../../../../../app/store/panels/writables";
  import { disposableReadable } from "../../../../../app/store/readable-disposable";
  import { uniqueReadable } from "../../../../../app/store/readable-unique";
  import { selectedTable } from "../../../../../app/store/writables";
  import TableSettingsModal from "../../../../panels/TableView/TableSettingsModal.svelte";
  import { tableViewConfig } from "../../../../panels/TableView/TableView";
  import ToolbarButton from "../../buttons/ToolbarButton.svelte";
  import ToolbarWideButton from "../../buttons/ToolbarWideButton.svelte";

  const tableStore = disposableReadable(uniqueReadable(selectedTable), {
    noNullable: true,
  });

  $: table = $tableStore;

  function openTableView(e: Event) {
    // TODO: Implement the ability to correctly toggle panels
    appManager.togglePanel(tableViewConfig.name, true);
  }
</script>

<div class="show-table-view-options">
  {#if table}
    <ToolbarWideButton
      icon="filter-settings"
      tooltip="Table Settings"
      dropdownComponent={TableSettingsModal}
      dropdownProps={{ table }}
      freeFormHeight
      freeFormWidth
      distanceToDropdown={6}
    />
  {/if}

  <ToolbarButton
    icon="read-more"
    iconSize="18px"
    class="w-26px"
    disabled={$isTableViewOpen}
    tooltip="Reveal Table View"
    on:click={openTableView}
  />
</div>

<style lang="postcss">
  .show-table-view-options {
    @apply flex flex-row;
    column-gap: 4px;
  }
</style>
