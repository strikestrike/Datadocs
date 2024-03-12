<script lang="ts">
  import { onMount } from "svelte";
  import Checkbox from "../../../common/form/Checkbox.svelte";
  import FieldIcon from "./FieldIcon.svelte";
  import type {
    GridHeader,
    GridPublicAPI,
    TableDescriptor,
  } from "@datadocs/canvas-datagrid-ng";

  export let grid: GridPublicAPI;
  export let table: TableDescriptor;

  let fields: GridHeader[] = [];

  let allVisible = false;
  let hasSomeHidden = false;
  let waitingForAtLeastOne = false;

  let editingInput: HTMLInputElement | undefined;
  let editingField: any;
  let editingInputHasError = false;

  let draggingField: GridHeader;
  let draggingOver:
    | { field: GridHeader; firstHalf: boolean; order: number }
    | undefined;

  $: if (editingInput) {
    editingInput.focus();
    editingInput.select();
  }

  function toggleAllVisibility() {
    if (hasSomeHidden || waitingForAtLeastOne) {
      waitingForAtLeastOne = false;
      table.dataSource.unhideAllColumns();
      selectTableArea();
      loadHeaders();
    } else if (allVisible) {
      waitingForAtLeastOne = true;
    }

    updateState();
  }

  function toggleFieldVisibility(field: GridHeader) {
    const replace = waitingForAtLeastOne;
    const visible = field.hidden || waitingForAtLeastOne;
    waitingForAtLeastOne = false;

    if (!visible && table.dataSource.state.cols <= 1) {
      waitingForAtLeastOne = true;
    } else {
      table.dataSource.setHeaderVisibility(
        field.id,
        replace ? "replace" : visible
      );
      selectTableArea();
    }

    updateState();
  }

  async function selectTableArea() {
    grid.selectArea({
      top: table.startRow,
      left: table.startColumn,
      bottom: table.endRow,
      right: table.endColumn,
    });
    grid.draw();
  }

  function checkForNamingErrors() {
    const name = editingInput.value.trim();
    if (name.length <= 0) return true;

    return (
      fields.findIndex(
        (field) =>
          field != editingField &&
          field.title.toLowerCase() === name.toLowerCase()
      ) !== -1
    );
  }

  function handleRenameInput(
    event: KeyboardEvent & { currentTarget: EventTarget & HTMLInputElement }
  ) {
    if (event.key === "Enter") {
      saveFieldName();
    } else if (event.key === "Escape") {
      stopNamingField();
    } else {
      return;
    }
    event.preventDefault();
  }

  function saveFieldName() {
    if (!editingField || !editingInput || editingInputHasError) {
      stopNamingField();
      return;
    }

    const name = editingInput.value.trim();
    if (name.length > 0) {
      editingField.title = name;
      grid.draw();
    }

    stopNamingField();
  }

  function stopNamingField() {
    editingField = undefined;
    editingInput = undefined;
  }

  function updateState() {
    const hiddenCount = table.dataSource.getHiddenColumnCount();
    allVisible = hiddenCount === 0;
    hasSomeHidden = hiddenCount > 0 && table.dataSource.state.cols > 0;
  }

  function onDragReorderStart(field: any) {
    draggingField = field;
  }

  function onDragReorderStop() {
    if (draggingField && draggingOver) {
      const { order } = draggingOver;
      const afterId = order <= 0 ? null : fields[order - 1].id;

      table.dataSource.reorderField(draggingField.id, afterId);
      grid.draw();

      loadHeaders();
    }

    draggingField = undefined;
    draggingOver = undefined;
  }

  async function loadHeaders() {
    const fieldsResult = table.dataSource.getHeaders();
    fields =
      fieldsResult instanceof Promise ? await fieldsResult : fieldsResult;
  }

  function onDragReorderHover(event: DragEvent, field: any) {
    if (
      !draggingField ||
      field.id == draggingField.id ||
      !(event.target instanceof HTMLElement)
    ) {
      return;
    }

    const rect = event.target.getBoundingClientRect();
    const pos = event.clientY - rect.top;
    const firstHalf = pos < rect.height / 2;
    const order = field.columnIndex + (firstHalf ? 0 : 1);
    draggingOver = { field, firstHalf, order };
  }

  onMount(() => {
    loadHeaders();
    updateState();
  });
</script>

<div class="field-container-top">
  <div class="field">
    <Checkbox
      id="availableFieldsCheckbox"
      checked={allVisible}
      indeterminate={hasSomeHidden && !waitingForAtLeastOne}
      on:checked={toggleAllVisibility}
    />
    <label class="field-name" for="availableFieldsCheckbox"
      >Available Fields</label
    >
  </div>
</div>

{#if waitingForAtLeastOne}
  <div class="warning-container">At least one field should be visible.</div>
{/if}

<div
  class="field-container"
  class:dragging={draggingField !== undefined}
  on:dragover={(event) => {
    if (draggingField) event.preventDefault();
  }}
>
  {#each fields as field (field.id)}
    <div
      class="field draggable"
      class:dragging={field == draggingField}
      draggable={true}
      style:order={field == draggingField && draggingOver
        ? (draggingOver.order + 1) * 10 - 1
        : (field.columnIndex + 1) * 10}
      on:dragstart={() => onDragReorderStart(field)}
      on:dragend={onDragReorderStop}
      on:dragover={(event) => onDragReorderHover(event, field)}
    >
      <Checkbox
        checked={!field.hidden && !waitingForAtLeastOne}
        id={field.id + "VisibilityCheckbox"}
        on:checked={() => {
          toggleFieldVisibility(field);
        }}
      />
      <div class="flex-shrink-0 mx-1.5">
        <FieldIcon columnType={field.type} />
      </div>
      {#if field === editingField}
        <input
          class="field-name-input pr-2"
          type="text"
          value={field.title}
          class:has-error={editingInputHasError}
          bind:this={editingInput}
          on:keydown={handleRenameInput}
          on:focusout={saveFieldName}
          on:input={() => (editingInputHasError = checkForNamingErrors())}
        />
      {:else}
        <span
          class="field-name editable pr-2"
          on:click={() => (editingField = field)}
        >
          {field.title}
        </span>
      {/if}
    </div>
  {/each}
</div>

<style lang="postcss">
  .field-name,
  .field-name-input {
    @apply text-dark-200;
    display: inline-block;
    font-weight: 500;
    font-size: 13px;
  }

  .field-name {
    cursor: pointer;
  }

  .field-name.editable {
    cursor: text;
    white-space: nowrap;
  }

  .field-name-input {
    padding: 0 0.25em;
    line-height: 1.3;
    min-width: 10em;
    height: 20px;
    box-sizing: border-box;
  }

  .has-error {
    @apply text-tertiary-error;
  }

  .warning-container {
    @apply text-tertiary-orange;
    margin: 0 32px 0 62px;
    font-weight: 500;
    font-size: 13px;
    line-height: 1.7;
  }

  .field-container-top {
    margin: 15px 24px 0 24px;
  }

  .field-container {
    @apply flex flex-col rounded border border-solid border-light-100 min-h-250px;
    padding: 5px 8px;
    margin: 5px 16px 10px 16px;
    overflow-x: auto;
  }

  .field-container-top,
  .field {
    display: flex;
    column-gap: 10px;
    align-items: center;
  }

  .field {
    @apply rounded border border-transparent;
    padding: 4px 7px;
    margin: 1px;
  }

  .field-container:not(.dragging) .field.draggable {
    cursor: grab;
  }

  .field-container:not(.dragging) .field.draggable:hover,
  .field.dragging {
    @apply border-light-50 bg-light-50;
  }

  .field.dragging {
    opacity: 0.5;
  }
</style>
