<script lang="ts">
  import type {
    Field,
    FilterableColors,
    GridFilterRule,
    GridFilterTarget,
    GridHeader,
    GridJsonTypeMap,
    GridPublicAPI,
    GridSort,
    TableDescriptor,
  } from "@datadocs/canvas-datagrid-ng";
  import { DataType } from "@datadocs/canvas-datagrid-ng";
  import Dropdown from "../../../common/dropdown/Dropdown.svelte";
  import type { DropdownTriggerRect } from "../../../common/dropdown/type";
  import DropdownSectionTitle from "../../../toolbars/MainToolbar/dropdowns/common/DropdownSectionTitle.svelte";
  import ColorDropdown from "./Dropdown/ColorDropdown/ColorDropdown.svelte";
  import ValueFilter from "./Dropdown/Filter/Value/ValuesWell.svelte";
  import Sort from "./Dropdown/Sort.svelte";
  import type {
    GridKeyControlActionOptions,
    GridKeyControlConfig,
  } from "../../../common/key-control/gridKeyControl";
  import { gridKeyControlAction } from "../../../common/key-control/gridKeyControl";
  import Icon from "../../../common/icons/Icon.svelte";
  import StructFieldSelector from "./Dropdown/StructField/StructFieldSelector.svelte";
  import {
    deepCopyFilterTarget,
    filterRulesMatch,
    getFilterWithType,
    sanitizeFilterTarget,
  } from "@datadocs/canvas-datagrid-ng/lib/data/data-source/filters/utils";
  import AutoApplyButton from "./Dropdown/Filter/Value/AutoApplyButton.svelte";
  import Button from "../../../common/form/Button.svelte";
  import type { MenuElementType } from "../../../common/menu";
  import { MENU_DATA_ITEM_TYPE_ELEMENT } from "../../../common/menu";
  import { onDestroy, onMount, setContext } from "svelte";
  import DropdownButton from "../../../common/form/button/DropdownButton.svelte";
  import JsonPathSelector from "./Dropdown/Json/JsonPathSelector.svelte";
  import {
    CLEAR_FILTER_CONTEXT_NAME,
    SWITCH_TO_ADVANCED_FILTERS_CONTEXT_NAME,
  } from "./constant";
  import type { ClearFilterFunction } from "./type";
  import { autoApplyFilter, tableInUse } from "../../../../app/store/writables";
  import Group from "./Dropdown/Filter/Conditional/Group.svelte";
  import { ensureAsync } from "@datadocs/canvas-datagrid-ng/lib/data/data-source/await";
  import {
    GRID_FILTER_CONDITION_NAME_CELL_COLOR,
    GRID_FILTER_CONDITION_NAME_TEXT_COLOR,
    GRID_FILTER_CONDITION_TYPE_VARIABLE,
  } from "@datadocs/canvas-datagrid-ng/lib/data/data-source/filters/constants";
  import type { ColorFilter } from "./Dropdown/ColorDropdown/types";
  import { tracker } from "../../../../app/store/readable-disposable";
  import type { DataEvent } from "@datadocs/canvas-datagrid-ng/lib/data/data-source/spec/events";
  import { getFilterAndSortContext } from "./util";
  import AdvancedFiltersModal from "./Dropdown/Filter/Conditional/Advanced/AdvancedFiltersModal.svelte";
  import { ADVANCED_FILTER_NOTIFY_AFTER_UPDATE } from "./Dropdown/Filter/Conditional/Advanced/constant";
  import type { NotifyAfterUpdate } from "./Dropdown/Filter/Conditional/Advanced/type";
  import { sortsMatch } from "@datadocs/canvas-datagrid-ng/lib/data/data-source/sorters/utils";
  import CircularSpinner from "../../../common/spinner/CircularSpinner.svelte";

  setContext(CLEAR_FILTER_CONTEXT_NAME, clearFilter as ClearFilterFunction);

  setContext(SWITCH_TO_ADVANCED_FILTERS_CONTEXT_NAME, () => {
    // TODO: Implement
  });
  setContext<NotifyAfterUpdate>(
    ADVANCED_FILTER_NOTIFY_AFTER_UPDATE,
    handleAdvancedFilterUpdate,
  );

  export let grid: GridPublicAPI;
  export let table: TableDescriptor;
  export let header: GridHeader;

  export let triggerRect: DropdownTriggerRect;
  export let onClose: () => any | undefined = undefined;

  let dataSourceTarget = getDataSourceFilter();
  let dataSourceSort = table.dataSource.getSorter?.(header.id);

  let currentTarget = getSavedFilter();
  let currentSort = getSavedSorter();

  $: dataSourceTargetSanitized = sanitizeFilterTarget(dataSourceTarget);
  $: currentTargetSanitized = sanitizeFilterTarget(currentTarget);

  const isStruct =
    typeof header.type === "object" && header.type.typeId === DataType.Struct;
  const isJson =
    typeof header.type === "object" && header.type.typeId === DataType.Json;

  const tableStore = tracker(table, {
    noNullable: true,
    onUpdate(newValue) {
      newValue.dataSource.addListener(handleDataSourceEvent);
    },
    onDispose(lastValue) {
      lastValue.dataSource.removeListener(handleDataSourceEvent);
    },
  });
  $: $tableStore = table;

  const geoSortOptions: MenuElementType[] = [
    {
      type: MENU_DATA_ITEM_TYPE_ELEMENT,
      state: "enabled",
      label: "By string",
      action: () => {
        context.geoSortType = "string";
      },
    },
    {
      type: MENU_DATA_ITEM_TYPE_ELEMENT,
      state: "disabled",
      label: "By proximity",
      action: () => {
        context.geoSortType = "proximity";
      },
    },
  ];

  let jsonTypeMap: GridJsonTypeMap = {};

  let wrapperElement: HTMLElement;
  let dropdownElement: HTMLElement;

  let savingSort = false;
  let savingFilter = false;

  $: context = getFilterAndSortContext(table, header);
  $: hasAdvancedFilters = loadAdvancedFilterState(dataSourceTarget);
  $: hasFilterChanges = !filterRulesMatch(
    currentTargetSanitized.filter,
    dataSourceTargetSanitized.filter,
  );

  $: hasSorterChanges = !sortsMatch(currentSort, dataSourceSort);
  $: hasChanges = hasFilterChanges || hasSorterChanges;
  $: hasFilter = currentTarget.filter.rules.length > 0;
  $: hasSorter =
    currentSort?.type === "preset" && currentSort.columnId === header.id;

  $: if ($autoApplyFilter) {
    saveAfterEnablingAutoApplyButton();
  }

  let filterableColors: FilterableColors = {
    cellColors: [],
    textColors: [],
    cellIcons: [],
  };

  $: colorFilter = getColorFilterFromTarget(currentTarget);
  $: dropdownWidth = getDropdownWidth(context.fieldToFilter, currentTarget);

  const configList: GridKeyControlConfig[][] = [];
  const gridKeyControlOptions: GridKeyControlActionOptions = {
    configList: configList,
  };

  async function loadFilterableColors() {
    filterableColors = await ensureAsync(
      table.dataSource.getFilterableColorsForColumn(header.id, 1000),
    );

    // Some hard code data to test design of color dropdown
    // filterableColors = {
    //   cellColors: [
    //     { color: "#FF0000", usageCount: 20 },
    //     { color: "#00FF00", usageCount: 25 },
    //     { color: "#0000FF", usageCount: 30 },
    //   ],
    //   textColors: [
    //     { color: "#FF0000", usageCount: 20 },
    //     { color: "#00FF00", usageCount: 25 },
    //     { color: "#0000FF", usageCount: 30 },
    //   ],
    //   cellIcons: [],
    // };
  }

  function getSavedFilter(): GridFilterTarget {
    return deepCopyFilterTarget(dataSourceTarget);
  }

  function getSavedSorter(): GridSort | undefined {
    if (!dataSourceSort) return;
    return { ...dataSourceSort };
  }

  function getDropdownWidth(
    field: Field | undefined,
    target: GridFilterTarget | undefined,
  ) {
    if (context.isGeo) {
      return 420;
    } else if (isJson) {
      return 360;
    }

    let width = 316;
    if (!target) {
      return width;
    }

    const traverse = (rule: GridFilterRule) => {
      if (rule.type === "group") {
        for (const subrule of rule.rules) {
          traverse(subrule);
        }
      } else if (rule.type === "condition") {
        const filter = getFilterWithType(rule.target.conditionName);
        if (
          typeof field?.type === "object" &&
          field.type.typeId === DataType.Interval &&
          filter
        ) {
          width = Math.max(
            width,
            filter?.conditionType === "variable" && filter.variableCount > 1
              ? 381
              : 350,
          );
        }
      }
    };

    traverse(target.filter);

    return 316;
  }

  async function loadJsonStructure(): Promise<GridJsonTypeMap> {
    if (!isJson) return;
    jsonTypeMap = await table.dataSource.getJsonFieldStructure(header.id, 1000);
  }

  function clearFilter() {
    currentTarget.filter.rules.length = 0;
    currentTarget.filter.conjunction = "or";
    notifyFilterUpdate(currentTarget);
  }

  function clearSorter() {
    currentSort = undefined;
    notifySortUpdate(currentSort);
  }

  function notifyFilterUpdate(filterTarget: GridFilterTarget = currentTarget) {
    currentTarget = filterTarget;
    if (!$autoApplyFilter) return;

    const target = sanitizeFilterTarget(filterTarget);
    if (filterRulesMatch(target.filter, dataSourceTargetSanitized.filter)) {
      return;
    }

    saveFilter(target);
  }

  function notifySortUpdate(sort: GridSort = currentSort) {
    currentSort = sort;
    if (!$autoApplyFilter || sortsMatch(sort, dataSourceSort)) return;

    saveSort(sort);
  }

  function handleApplyButton(e: Event) {
    e.preventDefault();
    saveWithApplyButton();
  }

  async function saveWithApplyButton() {
    if (hasFilterChanges) {
      await saveFilter(currentTargetSanitized);
    }
    if (hasSorterChanges) {
      await saveSort(currentSort);
    }
    onClose();
  }

  async function saveAfterEnablingAutoApplyButton() {
    await notifyFilterUpdate();
    await notifySortUpdate();
  }

  async function saveFilter(target: GridFilterTarget | undefined) {
    savingFilter = true;
    try {
      const setFilterOp = table.dataSource.setFilterNg(target, header.id);
      if (await ensureAsync(setFilterOp)) {
        updateDataSourceTarget();
        return true;
      }
    } finally {
      savingFilter = false;
    }
    return false;
  }

  async function saveSort(sorter: GridSort | undefined) {
    savingSort = true;
    try {
      const setSorterOp = sorter
        ? table.dataSource.setSorter(sorter)
        : table.dataSource.removeSorter(header.id);
      if (await ensureAsync(setSorterOp)) {
        dataSourceSort = table.dataSource.getSorter?.(header.id);
        return true;
      }
    } finally {
      savingSort = false;
    }
    return false;
  }

  function createEmptyTarget(): GridFilterTarget {
    return {
      filter: {
        type: "group",
        conjunction: "or",
        rules: [],
      },
    };
  }

  function getColorFilterFromTarget(target: GridFilterTarget): ColorFilter {
    const { rules } = target.filter;
    const first = rules[0];
    if (
      rules.length !== 1 ||
      first?.type !== "condition" ||
      (first.target.conditionName !== GRID_FILTER_CONDITION_NAME_TEXT_COLOR &&
        first.target.conditionName !== GRID_FILTER_CONDITION_NAME_CELL_COLOR) ||
      first.target.values.length !== 1 ||
      (first.target.values[0].valueType !== "null" &&
        first.target.values[0].valueType !== "string")
    ) {
      return;
    }
    const firstValue = first.target.values[0];
    return {
      code: firstValue.valueType === "null" ? null : firstValue.value,
      type:
        first.target.conditionName === GRID_FILTER_CONDITION_NAME_TEXT_COLOR
          ? "text"
          : "cell",
    };
  }

  function handleAdvancedFilterUpdate() {
    updateDataSourceTarget();
    currentTarget = getSavedFilter();
  }

  function updateDataSourceTarget() {
    dataSourceTarget = getDataSourceFilter();
  }

  function handleDataSourceEvent(dataEvent: DataEvent) {
    if (dataEvent.name !== "fieldsetting" || dataEvent.columnId !== header.id) {
      return;
    }
    header = table.dataSource.getHeaderById(header.id);
  }

  function getDataSourceFilter(): GridFilterTarget {
    return table.dataSource.getFilter?.(header.id) ?? createEmptyTarget();
  }

  function loadAdvancedFilterState(_: GridFilterTarget) {
    const savedFilter = table.dataSource.getFilters();
    return savedFilter?.type === "advanced" && !savedFilter.simplified;
  }

  onMount(() => {
    loadFilterableColors();
    dropdownElement.focus();
    loadJsonStructure();

    if (!$tableInUse) {
      $tableInUse = table;
      return () => {
        $tableInUse = undefined;
      };
    }
  });
</script>

<div bind:this={wrapperElement}>
  <Dropdown
    {wrapperElement}
    {triggerRect}
    {onClose}
    closeOnMouseDownOutside={false}
    closeOnMouseClickOutside={true}
    resize={context.isBool ? "none" : "both"}
    width={dropdownWidth}
    position="left-right"
    freeFormHeight
  >
    <div
      bind:this={dropdownElement}
      use:gridKeyControlAction={gridKeyControlOptions}
      class="dropdown"
      tabindex="-1"
      slot="content"
    >
      {#if isStruct}
        <div class="struct-target-container">
          <Icon class="text-dark-100" icon="tw-column-json" size="16px" />
          <span class="text">Struct Field</span>
          <StructFieldSelector
            {table}
            {header}
            structPath={context.structPath}
            class="flex-grow"
            on:updated={({ detail }) => {
              header = detail.header;
              clearFilter();
              notifyFilterUpdate();
              triggerRect = triggerRect;
            }}
          />
        </div>
      {:else if isJson}
        <div class="json-path-container">
          <JsonPathSelector
            {table}
            {header}
            structPath={context.structPath}
            structPathType={context.structPathType}
            typeMap={jsonTypeMap}
            class="flex-grow"
          />
        </div>
      {/if}

      <div
        class="flex flex-col flex-1 font-medium px-4 mt-2.5"
        class:disabled={context.needsStructFieldSelection}
      >
        <div class="flex flex-row items-center mb-1.5">
          <DropdownSectionTitle title="Sort" spacing="mr-2" />
          {#if savingSort}
            <CircularSpinner size={15} />
          {/if}
          {#if context.isGeo}
            <DropdownButton
              class="ml-2 min-w-[104px]"
              smaller
              autoWidth={false}
              allowMinimalWidth={true}
              data={geoSortOptions}
            >
              <svelte:fragment slot="value"
                >{context.geoSortType === "string"
                  ? "By string"
                  : "By proximity"}</svelte:fragment
              >
            </DropdownButton>
          {/if}

          <!-- Only show Clear button if there is a sorter -->
          <button
            class="clear-button {hasSorter ? '' : 'invisible'}"
            on:click={clearSorter}
          >
            Clear
          </button>
        </div>
        <Sort
          {currentSort}
          {header}
          {filterableColors}
          sortLabels={context.sortLabels}
          on:updated={({ detail }) => {
            notifySortUpdate(detail.sort);
          }}
        />
        <!-- separator -->
        <div class="relative mt-3 mb-2.5">
          <div
            class="absolute -left-4 -right-4 h-1px border-b border-light-100"
          />
        </div>
        <div class="flex flex-row items-center mb-1.5">
          <DropdownSectionTitle title="Filters" spacing="mr-2" />
          {#if savingFilter}
            <CircularSpinner size={15} />
          {/if}

          <!-- Only show Clear button if there is a filter -->
          <button
            class="clear-button {hasFilter ? '' : 'invisible'}"
            on:click={clearFilter}
          >
            Clear
          </button>
        </div>
        <div class="mb-2.5">
          <ColorDropdown
            color={colorFilter}
            colors={filterableColors}
            on:selected={async ({ detail }) => {
              if (detail) {
                currentTarget.filter.rules.length = 0;
                currentTarget.filter.rules.push({
                  type: "condition",
                  target: {
                    conditionType: GRID_FILTER_CONDITION_TYPE_VARIABLE,
                    conditionName:
                      detail.type === "text"
                        ? GRID_FILTER_CONDITION_NAME_TEXT_COLOR
                        : GRID_FILTER_CONDITION_NAME_CELL_COLOR,
                    values: [
                      detail.code
                        ? {
                            valueType: "string",
                            value: detail.code,
                          }
                        : {
                            valueType: "null",
                          },
                    ],
                    columnId: header.id,
                  },
                });
                notifyFilterUpdate(currentTarget);
              }
            }}
          />
        </div>

        {#if hasAdvancedFilters}
          <DropdownButton autoWidth={false} freeFormHeight freeFormWidth>
            <span class="font-normal" slot="value">(Advanced Filters)</span>
            <AdvancedFiltersModal slot="dropdown" {table} />
          </DropdownButton>
        {:else}
          <Group
            group={currentTarget.filter}
            {table}
            targetHeader={header}
            on:updated={({ detail }) => {
              currentTarget.filter = detail.group;
              notifyFilterUpdate(currentTarget);
            }}
          />
        {/if}

        {#if !context.isGeo && !context.isBool}
          <div class="mt-2.5" />
          <ValueFilter
            currentRule={currentTarget.filter}
            {table}
            {header}
            fieldToFilter={context.fieldToFilter}
            structPath={context.structPath}
            structPathType={context.structPathType}
            on:updated={({ detail }) => {
              if (detail.rule.type === "group") {
                currentTarget.filter = detail.rule;
                notifyFilterUpdate(currentTarget);
              }
            }}
          />
        {/if}

        <div class="button-container">
          <AutoApplyButton bind:checked={$autoApplyFilter} class="ml-2.5" />

          <!-- Cancel and Apply buttons should be hidden on autoApply mode -->
          <Button
            color="secondary"
            class="leading-normal ml-auto mr-1.5 {$autoApplyFilter
              ? 'invisible'
              : ''}"
            spacing="px-3 py-1.5"
            on:click={onClose}
          >
            Cancel
          </Button>
          <Button
            color="primary-accent"
            class="leading-normal {$autoApplyFilter ? 'invisible' : ''}"
            spacing="px-3 py-1.5"
            disabled={!hasChanges}
            on:click={handleApplyButton}
          >
            Apply
          </Button>
        </div>
      </div>
    </div>
  </Dropdown>
</div>

<style lang="postcss">
  .dropdown {
    @apply flex flex-col justify-stretch relative bg-white rounded overflow-y-auto overflow-x-hidden text-[13px] min-w-[100px] h-full outline-none;
    box-shadow: 0px 5px 20px rgba(55, 84, 170, 0.16);
  }

  .struct-target-container,
  .json-path-container {
    @apply flex flex-row items-center border-light-100 border-b px-4 py-2.5 mb-1;
  }

  .struct-target-container .text {
    @apply text-[11px] text-dark-200 font-medium ml-1 mr-3;
  }

  .button-container {
    @apply my-2.5 flex flex-row text-[11px];
  }

  .clear-button {
    @apply text-primary-indigo-blue bg-transparent my-0 ml-auto border-none p-0 text-11px uppercase font-semibold;
  }
</style>
