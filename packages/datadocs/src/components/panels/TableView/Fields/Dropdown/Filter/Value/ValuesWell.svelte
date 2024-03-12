<script lang="ts">
  import VirtualList from "@sveltejs/svelte-virtual-list";
  import type {
    Field,
    FilterableValueDescriptor,
    FilterableValues,
    GetFilterableValuesOptions,
    GridFilter,
    GridFilterConditionNameSet,
    GridFilterTypeValue,
    GridFilterRule,
    GridFilterValue,
    GridHeader,
    GridStructPathType,
    TableDescriptor,
  } from "@datadocs/canvas-datagrid-ng";
  import { DataType } from "@datadocs/canvas-datagrid-ng";
  import FilterableValue from "./FilterableValue.svelte";
  import SearchInput from "./SearchInput.svelte";
  import {
    containsFilterValue,
    filterSubdates,
    filterValuesMatch,
    getFilterAsValuesFilter,
    getPathInfo,
    sortFilterValues,
    updateFilterableValues,
  } from "@datadocs/canvas-datagrid-ng/lib/data/data-source/filters/utils";
  import { getCurrentCondition } from "../value-utils";
  import {
    createEventDispatcher,
    getContext,
    onMount,
    setContext,
  } from "svelte";
  import { CLEAR_FILTER_CONTEXT_NAME } from "../../../constant";
  import type { ClearFilterFunction } from "../../../type";
  import { TOGGLE_FILTER_CONTEXT_NAME } from "./ValuesWell";
  import type { ToggleFilterFunction } from "./type";
  import {
    GRID_FILTER_CONDITION_NAME_SET_OP_ANY,
    GRID_FILTER_CONDITION_NAME_VALUE_EXCLUSION,
    GRID_FILTER_CONDITION_NAME_VALUE_INCLUSION,
    GRID_FILTER_CONDITION_TYPE_VALUE,
    GRID_FILTER_DEFAULT_VALUES_EXCLUSION,
    GRID_FILTER_DEFAULT_VALUES_INCLUSION,
  } from "@datadocs/canvas-datagrid-ng/lib/data/data-source/filters/constants";
  import { getInputTypeFromCondition } from "../FilterInput";
  import { ensureAsync } from "@datadocs/canvas-datagrid-ng/lib/data/data-source/await";

  const dispatch = createEventDispatcher<{
    updated: { rule: GridFilterRule | undefined };
  }>();

  const clearFilter = getContext(
    CLEAR_FILTER_CONTEXT_NAME
  ) as ClearFilterFunction;

  export let table: TableDescriptor;
  export let header: GridHeader;
  export let structPath: string | undefined;
  export let structPathType: GridStructPathType;

  export let fieldToFilter: Field | undefined;

  export let currentRule: GridFilterRule | undefined;
  export let isValueHelper = false;

  setContext(TOGGLE_FILTER_CONTEXT_NAME, toggleFilter as ToggleFilterFunction);

  $: currentCondition = getCurrentCondition(currentRule, isValueHelper);
  $: updateWithFilter(currentCondition ?? currentRule);
  $: pathInfo = getPathInfo(header, currentCondition?.target);

  const isStruct =
    typeof header.type === "object" && header.type.typeId === DataType.Struct;

  $: isDate =
    typeof fieldToFilter?.type === "object" &&
    fieldToFilter.type.typeId === DataType.Date;
  $: isDateTime =
    typeof fieldToFilter?.type === "object" &&
    fieldToFilter.type.typeId === DataType.DateTime;
  $: isArray =
    typeof fieldToFilter?.type === "object" &&
    fieldToFilter.type.typeId === DataType.List;

  $: nest = isDate || isDateTime;

  $: inputType = currentCondition
    ? getInputTypeFromCondition(header, currentCondition)
    : undefined;
  $: structPath, (inputType = inputType);

  let searchKeyword: string | undefined;
  let searchTimeout: NodeJS.Timeout | undefined;
  $: searchKeyword, scheduleSearch();

  let filterableValues: FilterableValues | undefined;
  let values: FilterableValueDescriptor[] = [];

  let updateTrigger = {};

  $: fieldToFilter, structPathType, loadFilterableValues();

  async function loadFilterableValues() {
    const search = searchKeyword;
    const pathInfo = getPathInfo(header, currentCondition?.target);
    const options: GetFilterableValuesOptions = {
      search,
      unnest: isArray,
      filter: currentRule,
      pathInfo,
    };

    filterableValues = await ensureAsync(
      table.dataSource.getFilterableValuesForColumn(header.id, options)
    );

    values = filterableValues.data;
  }

  function scheduleSearch() {
    if (searchTimeout) clearTimeout(searchTimeout);

    searchTimeout = setTimeout(() => {
      loadFilterableValues();
      searchTimeout = undefined;
    }, 500);
  }

  async function updateWithFilter(rule: GridFilterRule | undefined) {
    updateFilterableValues(values, header.id, rule, {
      search: searchKeyword?.trim(),
    });
    updateTrigger = updateTrigger;
  }

  async function toggleFilter(descriptor: FilterableValueDescriptor) {
    let [currentFilter, currentValues] = getFilterAsValuesFilter(
      currentCondition ?? currentRule
    );

    let currentSetOp =
      currentCondition?.setOp ??
      (isArray ? GRID_FILTER_CONDITION_NAME_SET_OP_ANY : undefined);

    if (descriptor.isSelectAll) {
      currentFilter =
        currentFilter.conditionName ===
        GRID_FILTER_CONDITION_NAME_VALUE_INCLUSION
          ? GRID_FILTER_DEFAULT_VALUES_EXCLUSION
          : GRID_FILTER_DEFAULT_VALUES_INCLUSION;

      currentValues.length = 0;
    } else {
      currentValues = mark(currentFilter, currentValues, descriptor);
    }

    if (
      !isValueHelper &&
      currentValues.length === 0 &&
      currentFilter.conditionType === GRID_FILTER_CONDITION_TYPE_VALUE &&
      currentFilter.conditionName === GRID_FILTER_CONDITION_NAME_VALUE_EXCLUSION
    ) {
      currentFilter = undefined;
    } else {
      sortFilterValues(currentValues);
    }

    saveFilter(currentFilter, currentSetOp, currentValues);
  }

  function mark(
    currentFilter: GridFilter,
    currentValues: GridFilterValue[],
    descriptor: FilterableValueDescriptor,
    newState?: boolean
  ): GridFilterValue[] {
    const filtering = newState !== undefined ? newState : !descriptor.filtered;
    const action =
      currentFilter?.conditionType === "value" && currentFilter.conditionName;

    let marker = descriptor;
    while (marker) {
      if (containsFilterValue(currentValues, marker.filterValue)) break;
      marker = marker.parent;
    }

    const remove = (
      values: GridFilterValue[],
      descriptor: FilterableValueDescriptor
    ) =>
      values.filter(
        (value) => !filterValuesMatch(value, descriptor.filterValue)
      );

    if (marker && marker != descriptor) {
      let values = remove(currentValues, marker);

      const recursiveAdd = (current: FilterableValueDescriptor) => {
        if (!current.subvalues) return;
        const containsThis = current.subvalues.findIndex(
          (oth) => oth == descriptor
        );
        for (const sub of current.subvalues) {
          if (sub == descriptor) continue;
          values.push(sub.filterValue);
          if (!containsThis) recursiveAdd(sub);
        }
      };

      recursiveAdd(marker);
      return values;
    }

    if ((isDate || isDateTime) && descriptor.filterValue.valueType === "date") {
      currentValues = filterSubdates(currentValues, descriptor.filterValue);
    }

    if (filtering === (action === GRID_FILTER_CONDITION_NAME_VALUE_EXCLUSION)) {
      currentValues.push(descriptor.filterValue);
      return currentValues;
    }

    return remove(currentValues, descriptor);
  }

  function saveFilter(
    filter: GridFilterTypeValue | undefined,
    setOp: GridFilterConditionNameSet | undefined,
    values: GridFilterValue[]
  ) {
    if (isValueHelper) {
      if (
        currentRule.type === "condition" &&
        currentRule.target.conditionType === GRID_FILTER_CONDITION_TYPE_VALUE
      ) {
        currentRule.target.pathInfo = pathInfo;
        if (filter) {
          currentRule.target.values = values;
        } else {
          currentRule.target.values = [];
        }
        notifyUpdate();
      }
    } else {
      if (filter) {
        if (currentRule.type === "group") {
          currentRule.rules.length = 0;
          currentRule.rules.push({
            type: "condition",
            target: {
              columnId: header.id,
              conditionType: filter.conditionType,
              conditionName: filter.conditionName,
              values,
              pathInfo,
            },
            setOp,
            meta: {
              sourceValuesWell: false,
            },
          });
          notifyUpdate();
        }
      } else {
        clearFilter();
      }
    }
  }

  function notifyUpdate() {
    dispatch("updated", { rule: currentRule });
  }

  onMount(() => {
    loadFilterableValues();
  });
</script>

<div class="flex flex-col flex-1">
  <SearchInput bind:value={searchKeyword} {inputType} />
  <div class="value-filter-container">
    <VirtualList items={values} let:item>
      <!-- this will be rendered for each currently visible item -->
      <FilterableValue
        {nest}
        {updateTrigger}
        descriptor={item}
        isFirst={item == values[0]}
        isLast={item == values[values.length - 1]}
      />
    </VirtualList>
  </div>
</div>

<style lang="postcss">
  .value-filter-container {
    @apply flex flex-col flex-grow rounded-bl rounded-br border border-t-0 border-solid border-light-100 min-h-153px h-153px;
  }
</style>
