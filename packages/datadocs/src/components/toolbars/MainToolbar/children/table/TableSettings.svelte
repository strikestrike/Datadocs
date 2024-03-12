<script lang="ts">
  import type {
    GridPublicAPI,
    SelectionDescriptor,
    TableDescriptor,
    TableEvent,
  } from "@datadocs/canvas-datagrid-ng";
  import { selectedTable } from "../../../../../app/store/writables";
  import tooltipAction from "../../../../common/tooltip";
  import { ensureAsync } from "@datadocs/canvas-datagrid-ng/lib/data/data-source/await";
  import { disposableReadable } from "../../../../../app/store/readable-disposable";
  import { uniqueReadable } from "../../../../../app/store/readable-unique";
  import { getAnchorCellStringFromTable } from "@datadocs/canvas-datagrid-ng/lib/data/table/util";
  import { setTableAnchorCell } from "../../../../panels/TableView/Fields/TableLayout";
  import { getGridStore } from "../../../../../app/store/grid/base";
  import Icon from "../../../../common/icons/Icon.svelte";
  import { getSelectionAsRangeString } from "@datadocs/canvas-datagrid-ng/lib/named-ranges/util";
  import { onDestroy } from "svelte";

  const tableStore = disposableReadable(uniqueReadable(selectedTable), {
    noNullable: true,
    onUpdate(table) {
      table.addEventListener(onTableEvent);
    },
    onDispose(table) {
      table.removeEventListener(onTableEvent);
    },
  });
  const gridStore = getGridStore();

  $: table = $tableStore;
  $: table, updateGrid();
  $: if (table) updateInputs(table);

  let grid: GridPublicAPI | undefined;

  let tableNameInput = "";
  let invalidTableName = false;

  let tableAnchorInput = "";
  let invalidAnchorCell = false;

  let finishSelectionRequest: () => void | undefined;
  let editing = false;

  let pickCellButton: HTMLButtonElement;

  function updateInputs(table: TableDescriptor) {
    if (editing) return;

    tableNameInput = table.name;
    invalidTableName = false;

    tableAnchorInput = getAnchorCellStringFromTable(table);
    invalidAnchorCell = false;
  }

  function reloadSettings(e: Event) {
    editing = false;
    resetInputs();
    e.preventDefault();
  }

  function resetInputs() {
    updateInputs(table);
  }

  async function saveTableName(e: Event) {
    if (table.name === tableNameInput) return;
    try {
      invalidTableName = !(await ensureAsync(table.rename(tableNameInput)));
    } catch {
      invalidTableName = true;
    }
  }

  function handleAnchorCellInput(e: Event) {
    e.preventDefault();
    saveAnchorInput();
  }

  async function saveAnchorInput(noScroll = false) {
    invalidAnchorCell = !(await setTableAnchorCell(
      grid,
      table,
      tableAnchorInput,
      noScroll
    ));
  }

  function requestCellSelection() {
    if (invalidateSelectionRequest()) {
      pickCellButton.blur();
      return;
    }
    resetInputs();
    finishSelectionRequest = grid.requestSelection({
      type: "cell",
      covers: {
        rows: table.endRow - table.startRow + 1,
        columns: table.endColumn - table.startColumn + 1,
      },
      onSelect: onSelection,
    });
  }

  function invalidateSelectionRequest() {
    if (!finishSelectionRequest) return false;
    finishSelectionRequest();
    finishSelectionRequest = undefined;
    return true;
  }

  function onSelection(selection: SelectionDescriptor) {
    selection.endRow = selection.startRow;
    selection.endColumn = selection.startColumn;
    tableAnchorInput = getSelectionAsRangeString(selection, true);
    finishSelectionRequest = undefined;
    saveAnchorInput(true);
  }

  function onTableEvent(event: TableEvent) {
    switch (event.type) {
      case "rename":
      case "move":
        resetInputs();
    }
  }

  function startEditing() {
    editing = true;
  }

  function updateGrid() {
    grid = $gridStore;
  }

  onDestroy(() => {
    invalidateSelectionRequest();
  });
</script>

{#if tableStore}
  <div
    class="toolbar-table-input-container w-128px mr-1"
    class:invalid={invalidTableName}
  >
    <input
      bind:value={tableNameInput}
      class="toolbar-table-input"
      type="text"
      placeholder="Table name"
      on:input={saveTableName}
      on:focus={startEditing}
      on:blur={reloadSettings}
      use:tooltipAction={{
        content: "Table name",
        disabled: false,
      }}
    />
  </div>

  <div
    class="toolbar-table-input-container w-72px with-icon"
    class:invalid={invalidAnchorCell}
    class:pick-cell={finishSelectionRequest}
  >
    <input
      bind:value={tableAnchorInput}
      class="toolbar-table-input"
      type="text"
      placeholder="Cell"
      on:input={handleAnchorCellInput}
      on:focus={startEditing}
      on:blur={reloadSettings}
      use:tooltipAction={{
        content: "Cell",
        disabled: false,
      }}
    />

    <button
      bind:this={pickCellButton}
      class="pick-cell-button"
      on:click={requestCellSelection}
      use:tooltipAction={{
        content: finishSelectionRequest ? "Cancel picking cell" : "Pick cell",
      }}
    >
      <Icon icon="pick-cell" width="16px" height="16px" />
    </button>
  </div>
{/if}

<style lang="postcss">
  .toolbar-table-input-container {
    @apply flex flex-row rounded bg-light-50 h-25px px-2 items-center;

    .toolbar-table-input {
      @apply flex-1 text-11px font-medium outline-none text-dark-200 bg-transparent min-w-0;
    }

    .pick-cell-button {
      @apply rounded outline-none text-[#A7B0B5];
    }

    &.with-icon {
      @apply pr-1.5;
    }

    &.invalid {
      @apply bg-tertiary-error bg-opacity-[0.1];

      .toolbar-table-input {
        @apply text-tertiary-error;
      }
    }

    &:not(.invalid):not(.pick-cell):focus-within {
      background-color: rgba(59, 199, 255, 0.1) !important;

      .toolbar-table-input {
        @apply text-toolbar-button-active-color;
      }
    }

    &.pick-cell:not(.invalid) {
      @apply bg-tertiary-orange bg-opacity-[0.1];

      .pick-cell-button,
      .toolbar-table-input {
        @apply text-tertiary-orange;
      }
    }
  }
</style>
