<script lang="ts">
  import Switch from "../../common/form/Switch.svelte";
  import { ensureAsync } from "@datadocs/canvas-datagrid-ng/lib/data/data-source/await";
  import type {
    GridPublicAPI,
    TableDescriptor,
    TableEvent,
  } from "@datadocs/canvas-datagrid-ng";
  import { getAnchorCellStringFromTable } from "@datadocs/canvas-datagrid-ng/lib/data/table/util";
  import { setTableAnchorCell } from "./Fields/TableLayout";
  import { tracker } from "../../../app/store/readable-disposable";

  export let grid: GridPublicAPI;
  export let table: TableDescriptor;

  const tableTracker = tracker(table, {
    onUpdate(table) {
      if (table) table.addEventListener(onTableEvent);
    },
    onDispose(table) {
      if (table) table.removeEventListener(onTableEvent);
    },
  });

  $: $tableTracker = table;
  $: table, updateInputs();

  let anchoredCell: string = getAnchorCellStringFromTable(table);
  let tableName: string = table.name;

  let moveAnchorError = false;
  let renameError = false;

  let editing = false;

  $: setAnchorWithTextInput(anchoredCell);
  $: renameWithTextInput(tableName);

  async function renameWithTextInput(inputValue: string) {
    renameError = !ensureAsync(table.rename(inputValue));
  }

  async function setAnchorWithTextInput(inputValue: string) {
    moveAnchorError = !(await setTableAnchorCell(grid, table, inputValue));
  }

  function startEditing() {
    editing = true;
  }

  function updateInputs() {
    onBlurNameEditor();
    onBlurAnchorEditor();
  }

  function onTableEvent(event: TableEvent) {
    switch (event.type) {
      case "rename":
      case "move":
        if (!editing) {
          onBlurNameEditor();
          onBlurAnchorEditor();
        }
    }
  }

  function onHeaderVisibilityChanged() {
    table.setStyle({ showHeaderRow: !table.style.showHeaderRow });
  }

  function onFilterButtonVisibilityChanged() {
    table.setStyle({ showFilterButton: !table.style.showFilterButton });
  }

  function onReadOnlinessChanged() {
    table.setReadOnly(!table.isReadOnly);
  }

  function onBandedRowsStateChanged() {
    table.setStyle({ bandedRows: !table.style.bandedRows });
  }

  function onBandedColumnsStateChanged() {
    table.setStyle({ bandedColumns: !table.style.bandedColumns });
  }

  function onTotalRowVisibilityChanged() {
    table.setStyle({ showTotalRow: !table.style.showTotalRow });
  }

  function onBlurNameEditor() {
    tableName = table.name;
    editing = false;
  }

  function onBlurAnchorEditor() {
    anchoredCell = getAnchorCellStringFromTable(table);
    moveAnchorError = false;
    editing = false;
  }
</script>

<div class="settings-container">
  <div class="name-editor">
    <p class="setting-label">Name</p>
    <input
      type="text"
      placeholder="Table name"
      id="tableNameInput"
      class="text-input"
      bind:value={tableName}
      on:focus={startEditing}
      on:blur={onBlurNameEditor}
      class:text-input-error={renameError}
    />
  </div>
  <div class="anchor-editor">
    <p class="setting-label">Anchored to</p>
    <input
      type="text"
      placeholder="Cell"
      class="text-input"
      bind:value={anchoredCell}
      on:focus={startEditing}
      on:blur={onBlurAnchorEditor}
      class:text-input-error={moveAnchorError}
    />
  </div>

  <div
    class="border-solid border-light-100"
    style="border-bottom-width: 1px;"
  />

  <div class="setting-section">
    <label for="showTableHeaders" class="checkbox-label">Header row</label>
    <Switch
      on:checked={onHeaderVisibilityChanged}
      id="showTableHeaders"
      on={table.style.showHeaderRow}
    />
  </div>
  <div class="setting-section">
    <label for="filterButton" class="checkbox-label">Filter button</label>
    <Switch
      on:checked={onFilterButtonVisibilityChanged}
      id="filterButton"
      on={table.style.showFilterButton}
    />
  </div>
  <div class="setting-section">
    <label for="bandedRows" class="checkbox-label">Banded rows</label>
    <Switch
      on:checked={onBandedRowsStateChanged}
      id="bandedRows"
      on={table.style.bandedRows}
    />
  </div>
  <div class="setting-section">
    <label for="bandedColumns" class="checkbox-label">Banded columns</label>
    <Switch
      on:checked={onBandedColumnsStateChanged}
      id="bandedColumns"
      on={table.style.bandedColumns}
    />
  </div>
  <div class="setting-section">
    <label for="showTotalRow" class="checkbox-label">Total row</label>
    <Switch
      on:checked={onTotalRowVisibilityChanged}
      id="showTotalRow"
      on={table.style.showTotalRow}
    />
  </div>
  <div class="setting-section">
    <label for="readOnlyData" class="checkbox-label">Read only</label>
    <Switch
      on:checked={onReadOnlinessChanged}
      id="readOnlyData"
      on={table.isReadOnly}
    />
  </div>
</div>

<style lang="postcss">
  .text-input {
    @apply text-dark-200;
    font-weight: 500;
    font-size: 13px;
    padding: 0 0.25em;
    line-height: 1.3;
    height: 20px;
    box-sizing: border-box;
  }

  .text-input-error {
    @apply text-tertiary-error;
  }

  .settings-container {
    @apply rounded border border-solid border-light-100;
    padding: 10px 16px;
    margin: 10px 16px;
  }

  .setting-section {
    display: flex;
    justify-content: space-between;
  }

  .settings-container > *:not(:last-child) {
    margin-bottom: 10px;
  }

  .setting-label,
  .checkbox-label {
    font-size: 13px;
    font-weight: 500;
  }

  .checkbox-label {
    cursor: pointer;
  }

  .anchor-editor,
  .name-editor {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .anchor-editor > *,
  .name-editor > * {
    flex: 1;
    min-width: 0;
    margin: auto 0;
  }
</style>
