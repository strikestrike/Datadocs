<script lang="ts">
  import {
    DataType,
    type DataGroup,
    type GridHeader,
    type TableDescriptor,
  } from "@datadocs/canvas-datagrid-ng";
  import DropdownButton from "../../../common/form/button/DropdownButton.svelte";
  import { createEventDispatcher, getContext } from "svelte";
  import { getSortLabelsForColumnType } from "@datadocs/canvas-datagrid-ng/lib/data/data-source/sorters/utils";
  import type {
    DragContext,
    FieldSelectorTarget,
  } from "../Fields/Dropdown/Filter/Conditional/Advanced/type";
  import type { DndDragObject } from "./type";
  import {
    DND_DRAG_OBJECT_CONTEXT_NAME,
    MIME_TYPE_GROUP_ITEM,
  } from "./constants";
  import { writable } from "svelte/store";
  import {
    MENU_DATA_ITEM_TYPE_ELEMENT,
    type MenuItemType,
  } from "../../../common/menu";
  import FieldSelectorDropdown from "../Fields/Dropdown/Filter/Conditional/Advanced/FieldSelectorDropdown.svelte";
  import Icon from "../../../common/icons/Icon.svelte";
  import { getDataTypeIcon } from "../../../common/icons/utils";
  import { columnTypeToShortFormString } from "@datadocs/canvas-datagrid-ng/lib/utils/column-types";
  import tooltipAction from "../../../common/tooltip";
  import DropdownWrapper from "../../../common/dropdown/DropdownWrapper.svelte";
  import CommonSettingsModal from "../CommonSettingsModal.svelte";
  import {
    getOverridingBoolean,
    resolveStructField,
  } from "@datadocs/canvas-datagrid-ng/lib/data/data-source/filters/utils";

  const dragObject =
    getContext<DndDragObject>(DND_DRAG_OBJECT_CONTEXT_NAME) ?? writable();

  const dispatch = createEventDispatcher<{
    updated: { group: DataGroup };
    remove: { group: DataGroup };
  }>();

  const dragTargetDimensions = { w: 0, h: 0 };

  export let table: TableDescriptor;
  export let group: DataGroup;
  export let order: number;
  export let hideColumnIds: string[];

  const tableDsSettings = table.dataSource.getSettings();

  let element: HTMLElement;
  let dragContext: DragContext | undefined;

  let showSettings = false;

  $: header = table.dataSource.getHeaderById(group.columnId);
  $: sortLabels = getSortLabelsForColumnType(header.type) ?? [
    "Ascending",
    "Descending",
  ];
  $: selectorTarget = getSelectorTarget(group);
  $: sortMenuData = getSortMenuData(sortLabels);

  $: dragging = dragContext && !dragContext.initializing;
  $: $dragObject = dragging ? { group, layout: getLayoutBounds() } : undefined;
  $: top = dragging
    ? dragContext.current.y - dragContext.offset.y + "px"
    : "auto";
  $: left = dragging
    ? dragContext.current.x - dragContext.offset.x + "px"
    : "auto";
  $: hasDragObject = !!$dragObject;

  function notify() {
    dispatch("updated", { group });
  }

  function remove() {
    dispatch("remove", { group });
  }

  function toggleEnabled() {
    group.disabled = !group.disabled;
    notify();
  }

  function getSortMenuData(labels: string[]): MenuItemType[] {
    return [
      {
        type: MENU_DATA_ITEM_TYPE_ELEMENT,
        label: labels[0],
        state: "enabled",
        action: () => {
          group.ascending = true;
          notify();
        },
      },
      {
        type: MENU_DATA_ITEM_TYPE_ELEMENT,
        label: labels[1],
        state: "enabled",
        action: () => {
          group.ascending = false;
          notify();
        },
      },
    ];
  }

  function getLayoutBounds() {
    const rect = element.getBoundingClientRect();
    return {
      width: rect.width,
      height: rect.height,
    };
  }

  function getSelectorTarget(group: DataGroup): FieldSelectorTarget {
    return {
      type: "column",
      columnId: group.columnId,
      pathInfo: group.pathInfo,
    };
  }

  function getFieldName(group: DataGroup, header: GridHeader) {
    if (!header) return "";

    return (
      (header.title ?? header.dataKey) +
      (group.pathInfo ? "." + group.pathInfo.path : "")
    );
  }

  function getFieldIcon(group: DataGroup, header: GridHeader) {
    if (!header) return "";

    let type = header.type;

    if (
      typeof header.type === "object" &&
      header.type.typeId === DataType.Struct &&
      group.pathInfo
    ) {
      type =
        resolveStructField(
          { name: String(header.dataKey), type: header.type },
          group.pathInfo.path
        )?.type ?? type;
    }
    return getDataTypeIcon(columnTypeToShortFormString(type));
  }

  function updateField(target: FieldSelectorTarget) {
    if (target.type === "formula") return;
    group.columnId = target.columnId;
    group.pathInfo = target.pathInfo;
    notify();
  }

  function onDragStart(e: DragEvent) {
    e.dataTransfer.dropEffect = "move";
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData(MIME_TYPE_GROUP_ITEM, "STUB");

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

    dragTargetDimensions.w = rect.width;
    dragTargetDimensions.h = rect.height;
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
</script>

<svelte:window on:dragover={onDragOverWindow} />

<div
  bind:this={element}
  class="sort-item-container"
  class:dragging
  class:disabled={group.disabled}
  style:top
  style:left
  data-drop-target-order={order}
  data-group-item-dragging={dragging}
>
  <DropdownButton
    class="w-180px"
    placement="start"
    allowMinimalWidth
    buttonType={header ? "container" : "dropdown"}
  >
    <div
      class="flex flex-row items-center font-normal overflow-x-hidden"
      slot="value"
    >
      {#if header}
        <Icon
          class="flex-shrink-0 h-full mr-1"
          icon={getFieldIcon(group, header)}
          width="37px"
          height="20px"
        />

        <span class="field-title">{getFieldName(group, header)}</span>
      {:else}
        <span class="field-title">(Column)</span>
      {/if}
    </div>
    <FieldSelectorDropdown
      slot="dropdown"
      {table}
      {selectorTarget}
      {hideColumnIds}
      hideCustomFormulaOption
      on:change={({ detail }) => {
        updateField(detail.target);
      }}
    />
  </DropdownButton>
  <DropdownButton
    allowMinimalWidth
    class="w-180px"
    placement="middle"
    data={sortMenuData}
  >
    <span class="flex flex-row items-center font-normal" slot="value">
      <Icon
        size="18px"
        class="mr-1"
        icon={group.ascending ? "sort-text-ascending" : "sort-text-descending"}
      />
      {sortLabels[group.ascending ? 0 : 1] ?? "Ascending"}
    </span>
  </DropdownButton>
  <button
    class="action-target"
    on:click={toggleEnabled}
    use:tooltipAction={{
      content: group.disabled ? "Enable Group" : "Disable Group",
      disabled: hasDragObject,
    }}
  >
    <Icon
      icon={group.disabled ? "filter-state-enable" : "filter-state-disable"}
      size="14px"
    />
  </button>
  <button
    class="action-target"
    on:click={remove}
    use:tooltipAction={{
      content: "Delete Group",
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
        group.caseSensitive,
        tableDsSettings.caseSensitive
      )}
      on:updated={({ detail }) => {
        group.caseSensitive = !detail.caseInsensitive;
        notify();
      }}
    />
  </DropdownWrapper>
  <button
    class="action-target reorder-button action-target"
    draggable={order > -1}
    on:dragstart={onDragStart}
    on:drag={onDrag}
    on:dragend={onDragEnd}
    use:tooltipAction={{
      content: "Reorder Group",
      disabled: hasDragObject,
    }}
  >
    <Icon icon="drag" width="8px" height="13px" />
  </button>
</div>

<style lang="postcss">
  .sort-item-container {
    @apply flex flex-row;

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

    .field-title {
      @apply whitespace-nowrap overflow-x-hidden overflow-ellipsis;
    }

    .formula-input-container {
      @apply flex flex-1 min-w-0 min-h-32px border border-light-100 bg-white border-r-0;

      &:focus-within,
      &:hover {
        @apply border-light-200;
      }
    }

    .reorder-button {
      @apply cursor-move;
    }

    .no-value {
      @apply text-dark-50;
    }

    &.dragging {
      @apply fixed pointer-events-none p-0.5 bg-white rounded;
      box-shadow: 0px 5px 20px 0px rgba(55, 84, 170, 0.16);
    }

    &.disabled {
      @apply opacity-[0.5];
    }
  }
</style>
