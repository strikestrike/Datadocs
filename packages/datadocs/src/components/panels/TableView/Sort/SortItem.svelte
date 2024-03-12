<script lang="ts">
  import {
    DataType,
    type FilterableColors,
    type GridHeader,
    type GridSort,
    type GridSortTarget,
    type OrderDirection,
    type TableDescriptor,
  } from "@datadocs/canvas-datagrid-ng";
  import DropdownButton from "../../../common/form/button/DropdownButton.svelte";
  import FieldSelectorDropdown from "../Fields/Dropdown/Filter/Conditional/Advanced/FieldSelectorDropdown.svelte";
  import Icon from "../../../common/icons/Icon.svelte";
  import { createEventDispatcher, getContext, tick } from "svelte";
  import { columnTypeToShortFormString } from "@datadocs/canvas-datagrid-ng/lib/utils/column-types";
  import { getDataTypeIcon } from "../../../common/icons/utils";
  import {
    MENU_DATA_ITEM_TYPE_ELEMENT,
    type MenuItemType,
  } from "../../../common/menu";
  import ColorDropdown from "../Fields/Dropdown/ColorDropdown/ColorDropdown.svelte";
  import { ensureAsync } from "@datadocs/canvas-datagrid-ng/lib/data/data-source/await";
  import {
    getColorFilterFromSort,
    getSortFromColorFilter,
  } from "../Fields/Dropdown/ColorDropdown/ColorDropdown";
  import {
    DND_DRAG_OBJECT_CONTEXT_NAME,
    MIME_TYPE_SORT_ITEM,
  } from "./constants";
  import type { DndDragObject } from "./type";
  import { writable } from "svelte/store";
  import type {
    DragContext,
    FieldSelectorTarget,
  } from "../Fields/Dropdown/Filter/Conditional/Advanced/type";
  import tooltipAction from "../../../common/tooltip";
  import DropdownWrapper from "../../../common/dropdown/DropdownWrapper.svelte";
  import CommonSettingsModal from "../CommonSettingsModal.svelte";
  import {
    getOverridingBoolean,
    resolveStructField,
  } from "@datadocs/canvas-datagrid-ng/lib/data/data-source/filters/utils";
  import FieldIcon from "../Fields/FieldIcon.svelte";

  const dragObject =
    getContext<DndDragObject>(DND_DRAG_OBJECT_CONTEXT_NAME) ?? writable();

  const dispatch = createEventDispatcher<{
    updated: { sort: GridSort };
    remove: { sort: GridSort };
  }>();

  const emptyColorsData: FilterableColors = {
    cellColors: [],
    textColors: [],
    cellIcons: [],
  };

  const sortOnOptions: MenuItemType[] = [
    {
      type: MENU_DATA_ITEM_TYPE_ELEMENT,
      label: "Value",
      state: "enabled",
      action: () => {
        setSortOn({ type: "value" });
      },
    },
    {
      type: MENU_DATA_ITEM_TYPE_ELEMENT,
      label: "Color",
      state: "enabled",
      action: () => {
        if (filterableColors.cellColors.length > 0) {
          const first = filterableColors.cellColors[0];
          setSortOn({ type: "color", colorType: "cell", code: first.color });
        } else if (filterableColors.textColors.length > 0) {
          const first = filterableColors.textColors[0];
          setSortOn({ type: "color", colorType: "text", code: first.color });
        } else {
          setSortOn({ type: "color", colorType: "cell", code: null });
        }
      },
    },
  ];

  const dragTargetDimensions = { w: 0, h: 0 };

  export let table: TableDescriptor;
  export let currentSort: GridSort;
  export let order: number;
  export let colorsCache: Record<string, FilterableColors>;

  const tableDsSettings = table.dataSource.getSettings();

  $: updateInputs(currentSort);

  let header: GridHeader | undefined;
  let formula = "";

  $: filterableColors = (header && colorsCache[header.id]) || emptyColorsData;
  $: colorSort = getColorFilterFromSort(currentSort);
  $: isFormulaSort = currentSort?.type === "formula";
  $: selectorTarget = getFieldSelectorTarget(currentSort);

  let element: HTMLElement;
  let showSettings = false;
  let dragContext: DragContext | undefined;

  $: dragging = dragContext && !dragContext.initializing;
  $: $dragObject = dragging
    ? { sort: currentSort, layout: getLayoutBounds() }
    : undefined;
  $: top = dragging
    ? dragContext.current.y - dragContext.offset.y + "px"
    : "auto";
  $: left = dragging
    ? dragContext.current.x - dragContext.offset.x + "px"
    : "auto";
  $: hasDragObject = !!$dragObject;

  $: hasMetadata = checkHasMetadata(filterableColors);
  $: updateMetadata(header);

  async function updateInputs(sort: GridSort | undefined) {
    if (sort.type === "formula") {
      formula = sort.formula;
    } else {
      header = table.dataSource.getHeaderById(sort.columnId);
    }
  }

  async function updateMetadata(header: GridHeader | undefined) {
    if (header) {
      filterableColors =
        colorsCache[header.id] ||
        (await ensureAsync(
          table.dataSource.getFilterableColorsForColumn(header.id, 100)
        ));
      colorsCache[header.id] = filterableColors;
    } else {
      filterableColors = emptyColorsData;
    }
  }

  function save() {
    switch (currentSort?.type) {
      case "formula":
        formula = currentSort.formula;
        break;
      case "preset":
        header = table.dataSource.getHeaderById(currentSort.columnId);
        break;
      default:
        return;
    }

    dispatch("updated", { sort: currentSort });
  }

  function remove(e: Event) {
    e.preventDefault();
    dispatch("remove", { sort: currentSort });
  }

  function toggleDisabled() {
    currentSort.disabled = !currentSort.disabled;
    save();
  }

  function getFieldName(sort: GridSort, header: GridHeader) {
    if (sort?.type !== "preset" || !header) return "";

    return (
      (header.title ?? header.dataKey) +
      (sort.on.type === "value" && sort.on.pathInfo
        ? "." + sort.on.pathInfo.path
        : "")
    );
  }

  function getFieldIcon(sort: GridSort, header: GridHeader) {
    if (sort?.type !== "preset" || !header) {
      return "";
    }

    let type = header.type;

    if (
      typeof header.type === "object" &&
      header.type.typeId === DataType.Struct &&
      sort.on.type === "value" &&
      sort.on.pathInfo
    ) {
      type =
        resolveStructField(
          { name: String(header.dataKey), type: header.type },
          sort.on.pathInfo.path
        )?.type ?? type;
    }
    return getDataTypeIcon(columnTypeToShortFormString(type));
  }

  function getSortOnText(sortOn: GridSortTarget | undefined) {
    if (!sortOn) return "Sort On";
    switch (sortOn.type) {
      case "value":
        return "Value";
      case "color":
        return "Color";
    }
  }

  function getDirectionText(
    sortOn: GridSortTarget | undefined,
    direction: OrderDirection
  ) {
    if (!direction) return "Order";
    if (!sortOn || sortOn.type == "value") {
      return direction === "asc" ? "Ascending" : "Descending";
    } else {
      return direction === "asc" ? "On Top" : "On Bottom";
    }
  }

  function getFieldSelectorTarget(
    sort: GridSort | undefined
  ): FieldSelectorTarget {
    if (sort?.type === "formula") {
      return sort;
    } else if (sort?.type === "preset") {
      return {
        type: "column",
        columnId: sort.columnId,
        pathInfo: sort.on.type === "value" ? sort.on.pathInfo : undefined,
      };
    }
  }

  function getOrderOptions(sortOn: GridSortTarget | undefined): MenuItemType[] {
    const isValue = !sortOn || sortOn.type === "value";
    return [
      {
        type: MENU_DATA_ITEM_TYPE_ELEMENT,
        label: isValue ? "Ascending" : "On Top",
        prefixIcon: isValue ? "sort-text-ascending" : undefined,
        state: "enabled",
        action: () => {
          if (currentSort.type !== "preset") return;
          currentSort.dir = "asc";
          save();
        },
      },
      {
        type: MENU_DATA_ITEM_TYPE_ELEMENT,
        label: isValue ? "Descending" : "On Bottom",
        prefixIcon: isValue ? "sort-text-descending" : undefined,
        state: "enabled",
        action: () => {
          if (currentSort.type !== "preset") return;
          currentSort.dir = "desc";
          save();
        },
      },
    ];
  }

  function updateWithSelectorTarget(target: FieldSelectorTarget) {
    if (target.type === "formula") {
      if (currentSort.type !== "formula") {
        currentSort = {
          type: "formula",
          formula: "",
        };

        save();
      }
    } else {
      if (currentSort?.type === "preset") {
        currentSort.columnId = target.columnId;
      } else {
        currentSort = {
          type: "preset",
          columnId: header.id,
          on: {
            type: "value",
          },
          dir: "asc",
        };
      }

      if (target.pathInfo) {
        if (currentSort.on.type === "value") {
          currentSort.on.pathInfo = target.pathInfo;
        } else {
          currentSort.on = {
            type: "value",
            pathInfo: target.pathInfo,
          };
        }
      } else if (currentSort.on.type === "value") {
        currentSort.on.pathInfo = undefined;
      }

      save();
    }
  }

  function setSortOn(on: GridSortTarget) {
    if (currentSort.type !== "preset") return;
    currentSort.on = on;
    save();
  }

  function onDragStart(e: DragEvent) {
    e.dataTransfer.dropEffect = "move";
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData(MIME_TYPE_SORT_ITEM, "STUB");

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

  function checkHasMetadata(filterableColors: FilterableColors | undefined) {
    return (
      filterableColors &&
      (filterableColors.cellColors.length > 0 ||
        filterableColors.cellIcons.length > 0 ||
        filterableColors.textColors.length > 0)
    );
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
  class="sort-item-container"
  class:dragging
  class:disabled={currentSort.disabled}
  class:with-metadata={hasMetadata}
  style:top
  style:left
  data-drop-target-order={order}
  data-sort-item-dragging={dragging}
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
      class:text-dark-50={!header && !isFormulaSort}
    >
      {#if header && currentSort.type === "preset"}
        <Icon
          class="flex-shrink-0 h-full mr-1"
          icon={getFieldIcon(currentSort, header)}
          width="37px"
          height="20px"
        />

        <span class="field-title">{getFieldName(currentSort, header)}</span>
      {:else if isFormulaSort}
        <span class="field-title">Custom Formula</span>
      {:else}
        <span class="field-title">(Column)</span>
      {/if}
    </div>
    <FieldSelectorDropdown
      slot="dropdown"
      {table}
      {selectorTarget}
      on:change={({ detail }) => {
        updateWithSelectorTarget(detail.target);
      }}
    />
  </DropdownButton>
  {#if hasMetadata && currentSort.type === "preset" && !isFormulaSort}
    <DropdownButton
      allowMinimalWidth
      class="w-120px"
      placement="middle"
      data={sortOnOptions}
    >
      <span class="font-normal" slot="value" class:no-value={!currentSort.on}
        >{getSortOnText(currentSort.on)}</span
      >
    </DropdownButton>
  {/if}
  {#if currentSort.type === "formula"}
    <div class="formula-input-container">
      <input
        bind:value={formula}
        class="outline-none px-2.5 text-dark-200 min-w-0 rounded bg-transparent flex-1"
        type="text"
        placeholder="Formula"
        on:input={save}
      />
    </div>
  {:else}
    <DropdownButton
      allowMinimalWidth
      class={hasMetadata && currentSort.type === "preset"
        ? "w-120px"
        : "w-180px"}
      placement="middle"
      data={getOrderOptions(currentSort.on)}
    >
      <span class="flex flex-row items-center font-normal" slot="value">
        {#if currentSort.on.type === "value"}
          <Icon
            size="18px"
            class="mr-1"
            icon={currentSort.dir === "asc"
              ? "sort-text-ascending"
              : "sort-text-descending"}
          />
        {/if}
        {getDirectionText(currentSort.on, currentSort.dir)}
      </span>
    </DropdownButton>
  {/if}
  {#if currentSort.type === "preset" && (currentSort.on.type === "color" || currentSort.on.type === "icon")}
    <ColorDropdown
      color={colorSort}
      colors={filterableColors}
      class="w-120px"
      hideLabel
      blockContainer={currentSort.on.type === "color" && currentSort.on.code}
      placement="middle"
      on:selected={({ detail }) => {
        if (currentSort.type === "preset") {
          const sort = getSortFromColorFilter(header, detail, currentSort);
          currentSort.on = sort.on;
          save();
        }
      }}
    />
  {/if}
  <button
    class="action-target"
    on:click={toggleDisabled}
    use:tooltipAction={{
      content: currentSort.disabled ? "Enable Sort" : "Disable Sort",
      disabled: hasDragObject,
    }}
  >
    <Icon
      icon={currentSort.disabled
        ? "filter-state-enable"
        : "filter-state-disable"}
      size="14px"
    />
  </button>
  <button
    class="action-target"
    on:click={remove}
    use:tooltipAction={{
      content: "Delete Sort",
      disabled: hasDragObject,
    }}
  >
    <Icon icon="filter-delete" size="14px" />
  </button>
  {#if currentSort.type === "preset"}
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
          currentSort.caseSensitive,
          tableDsSettings.caseSensitive
        )}
        on:updated={({ detail }) => {
          if (currentSort.type === "preset") {
            currentSort.caseSensitive = !detail.caseInsensitive;
            save();
          }
        }}
      />
    </DropdownWrapper>
  {/if}
  <button
    class="action-target reorder-button action-target"
    draggable={order > -1}
    on:dragstart={onDragStart}
    on:drag={onDrag}
    on:dragend={onDragEnd}
    use:tooltipAction={{
      content: "Reorder Sort",
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
