<script lang="ts">
  import type {
    GridFilterCondition,
    GridFilterGroup,
    GridHeader,
    TableDescriptor,
  } from "@datadocs/canvas-datagrid-ng";
  import Condition from "../Condition.svelte";
  import { createEventDispatcher, getContext } from "svelte";
  import Icon from "../../../../../../../common/icons/Icon.svelte";
  import {
    DND_DRAG_OBJECT_CONTEXT_NAME,
    DND_DROP_TARGET_CONTEXT_NAME,
    MIME_TYPE_FILTER_CONDITION_REORDER,
  } from "./constant";
  import type { DndDragObject, DndDropTarget, DragContext } from "./type";
  import { writable } from "svelte/store";
  import tooltipAction from "../../../../../../../common/tooltip";
  import CommonSettingsModal from "../../../../../CommonSettingsModal.svelte";
  import DropdownWrapper from "../../../../../../../common/dropdown/DropdownWrapper.svelte";
  import { getOverridingBoolean } from "@datadocs/canvas-datagrid-ng/lib/data/data-source/filters/utils";

  const dragObject =
    getContext<DndDragObject>(DND_DRAG_OBJECT_CONTEXT_NAME) ?? writable();
  const dropTarget =
    getContext<DndDropTarget>(DND_DROP_TARGET_CONTEXT_NAME) ?? writable();

  const dispatch = createEventDispatcher<{
    changed: { condition: GridFilterCondition };
    remove: any;
  }>();

  export let table: TableDescriptor;
  export let targetHeader: GridHeader;
  export let group: GridFilterGroup;
  export let currentCondition: GridFilterCondition;
  export let level: number;
  export let order: number;

  const tableDsSettings = table.dataSource.getSettings();

  let element: HTMLElement;
  let showSettings = false;
  let dragContext: DragContext | undefined;
  let dropTargetReferenceCount = 0;

  $: dragging = dragContext && !dragContext.initializing;
  $: $dragObject = dragging
    ? { group, rule: currentCondition, layout: getLayoutBounds() }
    : undefined;
  $: top = dragging
    ? dragContext.current.y - dragContext.offset.y + "px"
    : "auto";
  $: left = dragging
    ? dragContext.current.x - dragContext.offset.x + "px"
    : "auto";
  $: hasDragObject = !!$dragObject;

  $: if (dropTargetReferenceCount <= 0) {
    $dropTarget = undefined;
  }

  function notifyChange(condition: GridFilterCondition) {
    dispatch("changed", { condition });
  }

  function onDragStart(e: DragEvent) {
    e.dataTransfer.dropEffect = "move";
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData(MIME_TYPE_FILTER_CONDITION_REORDER, "STUB");

    const rect = element.getBoundingClientRect();

    dragContext = {
      offset: {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      },
      current: {
        x: e.clientX,
        y: e.clientY,
      },
      initializing: true,
    };
  }

  function onDrag(e: DragEvent) {
    if (!dragContext) return;
    dragContext.initializing = false;
    e.preventDefault();
  }

  function onDragOverWindow(e: DragEvent) {
    if (!dragContext) return;
    dragContext.current = {
      x: e.clientX,
      y: e.clientY,
    };
  }

  function onDragEnd(e: DragEvent) {
    if (!dragContext) return;
    dragContext = undefined;
    e.preventDefault();
  }

  function toggleDisabled() {
    currentCondition.disabled = !currentCondition.disabled;
    notifyChange(currentCondition);
  }

  function getLayoutBounds() {
    const rect = element.getBoundingClientRect();
    return {
      width: rect.width,
      height: rect.height,
    };
  }
</script>

<svelte:window on:dragover={onDragOverWindow} />

<div
  bind:this={element}
  class="condition-container level-{level}"
  class:dragging
  class:disabled={currentCondition.disabled}
  style:top
  style:left
  data-drop-target-order={order}
  data-filter-rule-dragging={dragging}
>
  <Condition
    {table}
    {targetHeader}
    {currentCondition}
    isAdvancedView
    on:updated={({ detail }) => {
      notifyChange(detail.condition);
    }}
    on:clear={() => {
      dispatch("remove");
    }}
  />

  <div class="buttons">
    <button
      class="action-target"
      on:click={(e) => {
        e.preventDefault();
        toggleDisabled();
      }}
      use:tooltipAction={{
        content: currentCondition.disabled ? "Enable Rule" : "Disable Rule",
        disabled: hasDragObject,
      }}
    >
      <Icon
        icon={currentCondition.disabled
          ? "filter-state-enable"
          : "filter-state-disable"}
        size="14px"
      />
    </button>
    <button
      class="action-target"
      on:click={(e) => {
        dispatch("remove");
        e.preventDefault();
      }}
      use:tooltipAction={{
        content: "Delete Rule",
        disabled: hasDragObject,
      }}
    >
      <Icon icon="filter-delete" size="14px" />
    </button>
    <DropdownWrapper
      show={showSettings}
      class="flex items-stretch"
      freeFormWidth
      freeFormHeight
    >
      <button
        slot="button"
        class="action-target middle self-stretch"
        on:click={(e) => {
          showSettings = !showSettings;
          e.preventDefault();
        }}
        use:tooltipAction={{
          content: "Settings",
          disabled: hasDragObject,
        }}
      >
        <Icon icon="filter-settings" size="14px" />
      </button>
      <CommonSettingsModal
        slot="content"
        caseInsensitive={!getOverridingBoolean(
          currentCondition.caseSensitive,
          tableDsSettings.caseSensitive
        )}
        on:updated={({ detail }) => {
          currentCondition.caseSensitive = !detail.caseInsensitive;
          notifyChange(currentCondition);
        }}
      />
    </DropdownWrapper>
    <button
      class="reorder-button action-target"
      draggable="true"
      on:dragstart={onDragStart}
      on:drag={onDrag}
      on:dragend={onDragEnd}
      use:tooltipAction={{
        content: "Reorder Rule",
        disabled: hasDragObject,
      }}
    >
      <Icon icon="drag" size="14px" />
    </button>
  </div>
</div>

<style lang="postcss">
  .condition-container {
    @apply flex flex-row;

    &.dragging {
      @apply pointer-events-none fixed rounded-lg p-1 bg-white z-2000;
      box-shadow: 0px 5px 20px 0px rgba(55, 84, 170, 0.16);
    }

    &.disabled {
      @apply opacity-[0.5];
    }

    > .buttons {
      @apply flex items-stretch;

      .action-target {
        @apply flex text-dark-50 border border-solid border-light-100 w-32px border-r-0 items-center justify-center bg-white outline-none;

        &:last-child:not(.middle) {
          @apply border-r rounded-tr rounded-br;
        }

        &:hover,
        &:focus-visible {
          @apply text-dark-100 border-light-200;
        }
      }
    }

    .reorder-button {
      @apply cursor-move;
    }
  }
</style>
