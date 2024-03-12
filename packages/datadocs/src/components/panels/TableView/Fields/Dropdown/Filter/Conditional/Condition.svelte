<script lang="ts">
  import type {
    Field,
    FilterableColors,
    GridFilterCondition,
    GridFilterConditionNameSet,
    GridHeader,
    List,
    TableDescriptor,
  } from "@datadocs/canvas-datagrid-ng";
  import { DataType } from "@datadocs/canvas-datagrid-ng";
  import {
    createEmptyConditionTargetForFilter,
    getFilterNameForColumnType,
    getFilterWithType,
    getFiltersForField,
    getPathInfo,
    isFilterConditionValid,
  } from "@datadocs/canvas-datagrid-ng/lib/data/data-source/filters/utils";
  import { createEventDispatcher, getContext, tick } from "svelte";
  import { UPDATE_DROPDOWN_STYLE_CONTEXT_NAME } from "../../../../../../common/dropdown";
  import type {
    MenuElementType,
    MenuItemType,
  } from "../../../../../../common/menu";
  import {
    MENU_DATA_ITEM_TYPE_LIST,
    MENU_DATA_ITEM_TYPE_ELEMENT,
    MENU_DATA_ITEM_TYPE_SEPARATOR,
  } from "../../../../../../common/menu";
  import FilterInput from "./../FilterInput.svelte";
  import MapFilterInput from "./../Input/MapFilterInput.svelte";
  import DropdownButton from "../../../../../../common/form/button/DropdownButton.svelte";
  import ValueSetInput from "./../Input/ValueSetInput.svelte";
  import {
    GRID_FILTER_CONDITION_NAME_CELL_COLOR,
    GRID_FILTER_CONDITION_NAME_CUSTOM_FORMULA,
    GRID_FILTER_CONDITION_NAME_SET_OP_ONLY,
    GRID_FILTER_CONDITION_NAME_TEXT_COLOR,
    GRID_FILTER_CONDITION_NAME_VALUE_INCLUSION,
    GRID_FILTER_CONDITION_TYPE_FORMULA,
    GRID_FILTER_CONDITION_TYPE_SET,
    GRID_FILTER_CONDITION_TYPE_VALUE,
    GRID_FILTER_CONDITION_TYPE_VARIABLE,
    GRID_FILTER_DEFAULT_CUSTOM_FORMULA,
    GRID_FILTER_GROUP_KEY_COLOR,
  } from "@datadocs/canvas-datagrid-ng/lib/data/data-source/filters/constants";
  import { getFilterAndSortContext } from "../../../util";
  import type { Placement } from "../../../../../../common/form/button/type";
  import ConditionFieldInput from "./Advanced/ConditionFieldInput.svelte";
  import ColorDropdown from "../../ColorDropdown/ColorDropdown.svelte";
  import type { ColorFilter } from "../../ColorDropdown/types";
  import { ensureAsync } from "@datadocs/canvas-datagrid-ng/lib/data/data-source/await";
  import { getInputTypeFromCondition } from "../FilterInput";

  const dispatch = createEventDispatcher<{
    updated: { condition: GridFilterCondition };
    clear: GridFilterCondition | undefined;
  }>();
  const updateDropdown: () => void = getContext(
    UPDATE_DROPDOWN_STYLE_CONTEXT_NAME
  );

  const emptyColorsData: FilterableColors = {
    cellColors: [],
    cellIcons: [],
    textColors: [],
  };
  const filterOnMenuData: MenuElementType[] = [
    {
      type: MENU_DATA_ITEM_TYPE_ELEMENT,
      state: "enabled",
      label: "Value",
      action: () => {
        if (isValueFilter) return;
        const pathInfo = getPathInfo(header, currentCondition?.target);
        const context = getFilterAndSortContext(table, header, {
          pathInfo,
        });
        const filter = context.availableFilters[0];

        if (filter.conditionType !== GRID_FILTER_CONDITION_TYPE_SET) {
          currentCondition = {
            type: "condition",
            target: createEmptyConditionTargetForFilter(filter, header.id, {
              pathInfo,
            }),
          };
          notifyUpdate();
        }
      },
    },
    {
      type: MENU_DATA_ITEM_TYPE_ELEMENT,
      state: "enabled",
      label: "Color",
      action: () => {
        if (isColorFilter) return;
        currentCondition = {
          type: "condition",
          target: {
            columnId: header.id,
            conditionType: GRID_FILTER_CONDITION_TYPE_VARIABLE,
            conditionName: GRID_FILTER_CONDITION_NAME_TEXT_COLOR,
            values: [{ valueType: "null" }],
            pathInfo: getPathInfo(header, currentCondition?.target),
          },
        };
        notifyUpdate();
      },
    },
  ];

  export let table: TableDescriptor;
  export let targetHeader: GridHeader;
  export let currentCondition: GridFilterCondition | undefined;
  export let isAdvancedView = false;

  export let emptyValuesWellCondition = false;

  $: header =
    targetHeader ??
    (currentCondition && currentCondition.target.columnId
      ? table.dataSource.getHeaderById(currentCondition.target.columnId)
      : table.dataSource.getHeader(0));
  $: currentFilter = currentCondition
    ? getFilterWithType(currentCondition.target.conditionName)
    : undefined;
  $: context = getFilterAndSortContext(table, header, {
    condition: currentCondition,
  });
  $: inputType = getInputTypeFromCondition(header, currentCondition);
  $: isValueFilter =
    !currentFilter || currentFilter.groupKey !== GRID_FILTER_GROUP_KEY_COLOR;
  $: isColorFilter = currentFilter?.groupKey === GRID_FILTER_GROUP_KEY_COLOR;
  $: isFormulaFilter =
    currentFilter?.conditionType === GRID_FILTER_CONDITION_TYPE_FORMULA;
  $: isLongInput =
    inputType === "date" ||
    inputType === "datetime" ||
    inputType === "time" ||
    inputType === "interval" ||
    inputType === "boolean" ||
    currentFilter?.conditionName === GRID_FILTER_CONDITION_NAME_CUSTOM_FORMULA;
  $: isSameLineInput =
    isAdvancedView ||
    (!isLongInput &&
      currentFilter?.conditionType === "variable" &&
      currentFilter.variableCount === 1);
  $: hasInput =
    !context.isGeo &&
    currentFilter &&
    currentFilter.conditionType !== "static" &&
    !emptyValuesWellCondition &&
    (!isAdvancedView || !isColorFilter);
  $: singleLineGroupInput =
    inputType === "number" &&
    currentFilter?.conditionType === "variable" &&
    currentFilter.variableCount > 1;

  $: conditionPickerPlacement = getConditionPickerPlacement(
    isAdvancedView,
    hasInput,
    isLongInput,
    isSameLineInput
  );
  $: inputPlacement = getInputPlacement(isSameLineInput);

  let availableColors = emptyColorsData;
  let menuData = getMenuData();

  $: header, updateInputs();
  $: currentCondition, scheduleDropdownUpdate();

  function notifyUpdate() {
    dispatch("updated", { condition: currentCondition });
  }

  function createMenuData(listSetFilter?: {
    field: Field;
    setOp: GridFilterConditionNameSet;
  }) {
    const menuList: MenuItemType[] = [];
    const targetField = listSetFilter?.field ?? context?.fieldToFilter;

    if (!targetField) {
      return menuList;
    }

    let filters = context.availableFilters ?? [];
    if (listSetFilter) {
      filters = getFiltersForField(listSetFilter.field);
    }

    if (!listSetFilter?.setOp && !isAdvancedView) {
      menuList.push({
        type: MENU_DATA_ITEM_TYPE_ELEMENT,
        label: "(Select Condition)",
        state: "enabled",
        action: () => {
          dispatch("clear", currentCondition);
        },
      });
    }

    let previousGroupKey: string | undefined;
    for (const filter of filters) {
      const groupKey = filter.groupKey;
      if (groupKey !== previousGroupKey && menuList.length > 0) {
        menuList.push({ type: MENU_DATA_ITEM_TYPE_SEPARATOR });
      }
      previousGroupKey = groupKey;

      if (filter.conditionType === "set") {
        if (
          typeof targetField.type === "object" &&
          targetField.type.typeId === DataType.List
        ) {
          if (filter.conditionName === GRID_FILTER_CONDITION_NAME_SET_OP_ONLY) {
            menuList.push({
              type: MENU_DATA_ITEM_TYPE_ELEMENT,
              label: getFilterNameForColumnType(targetField.type, filter),
              state: "enabled",
              action: () => {
                currentCondition = {
                  type: "condition",
                  target: {
                    columnId: header.id,
                    conditionType: GRID_FILTER_CONDITION_TYPE_VALUE,
                    conditionName: GRID_FILTER_CONDITION_NAME_VALUE_INCLUSION,
                    values: [],
                  },
                  setOp: GRID_FILTER_CONDITION_NAME_SET_OP_ONLY,
                };
                notifyUpdate();
              },
            });
          } else {
            menuList.push({
              type: MENU_DATA_ITEM_TYPE_LIST,
              label: getFilterNameForColumnType(targetField.type, filter),
              state: "enabled",
              children: createMenuData({
                field: (targetField.type as List).child,
                setOp: filter.conditionName,
              }),
            });
          }
        }
      } else {
        menuList.push({
          type: MENU_DATA_ITEM_TYPE_ELEMENT,
          label: getFilterNameForColumnType(targetField.type, filter),
          state: "enabled",
          status: "success",
          action: () => {
            const pathInfo = getPathInfo(header, currentCondition?.target);
            currentCondition = {
              type: "condition",
              target: createEmptyConditionTargetForFilter(filter, header.id, {
                pathInfo,
              }),
              setOp: listSetFilter?.setOp,
            };
            notifyUpdate();
          },
        });
      }
    }

    if (!isAdvancedView) {
      if (menuList.length > 0) {
        menuList.push({ type: MENU_DATA_ITEM_TYPE_SEPARATOR });
      }
      menuList.push({
        type: MENU_DATA_ITEM_TYPE_ELEMENT,
        label: "Custom Formula",
        state: "enabled",
        action: () => {
          currentCondition = {
            type: "condition",
            target: createEmptyConditionTargetForFilter(
              GRID_FILTER_DEFAULT_CUSTOM_FORMULA,
              header?.id
            ),
          };
          notifyUpdate();
        },
      });
    }

    return menuList;
  }

  function getMenuData() {
    return createMenuData();
  }

  async function updateInputs() {
    menuData = getMenuData();
    loadColors();
  }

  function getConditionPickerPlacement(
    isAdvancedView: boolean,
    hasInput: boolean,
    isLongInput: boolean,
    isSameLineInput: boolean
  ): Placement {
    if (isAdvancedView) {
      return "middle";
    }
    if (hasInput) {
      if (isLongInput || !isSameLineInput) {
        return "top";
      } else {
        return "start";
      }
    }
    return "none";
  }

  function getInputPlacement(isSameLineInput: boolean): Placement {
    if (isAdvancedView) return "middle";
    if (isSameLineInput) return "end";
    return "bottom";
  }

  function getColorFilterFromCondition(
    condition: GridFilterCondition
  ): ColorFilter {
    if (
      (condition.target.conditionName !==
        GRID_FILTER_CONDITION_NAME_TEXT_COLOR &&
        condition.target.conditionName !==
          GRID_FILTER_CONDITION_NAME_CELL_COLOR) ||
      !isFilterConditionValid(condition)
    ) {
      return;
    }

    const firstValue = condition.target.values[0];
    return {
      code: firstValue.valueType === "null" ? null : firstValue.value,
      type:
        condition.target.conditionName === GRID_FILTER_CONDITION_NAME_TEXT_COLOR
          ? "text"
          : "cell",
    };
  }

  async function loadColors() {
    if (!header || !isAdvancedView || !isColorFilter) return;

    availableColors = await ensureAsync(
      table.dataSource.getFilterableColorsForColumn(header.id, 1000)
    );
  }

  async function scheduleDropdownUpdate() {
    // Give the dropdown time to react to our layout changes.
    await tick();
    updateDropdown();
  }
</script>

<div
  class="conditional-filter-container"
  class:same-line-input={isSameLineInput}
  class:advanced={isAdvancedView}
  class:flex-1={context.isGeo}
>
  {#if isAdvancedView}
    <ConditionFieldInput
      {currentCondition}
      {table}
      on:changed={({ detail }) => {
        currentCondition = detail.condition;
        notifyUpdate();
      }}
    />
    {#if !isFormulaFilter}
      <DropdownButton
        data={filterOnMenuData}
        class="w-120px"
        disabled={!context.fieldToFilter}
        allowMinimalWidth={true}
        placement="middle"
      >
        <span class="font-normal" slot="value"
          >{#if isValueFilter}Value{:else}Color{/if}</span
        >
      </DropdownButton>
    {/if}

    {#if isColorFilter}
      <ColorDropdown
        class="w-120px"
        hideLabel
        color={getColorFilterFromCondition(currentCondition)}
        colors={availableColors}
        placement="middle"
        on:selected={({ detail }) => {
          currentCondition = {
            type: "condition",
            target: {
              conditionType: GRID_FILTER_CONDITION_TYPE_VARIABLE,
              conditionName:
                detail.type === "text"
                  ? GRID_FILTER_CONDITION_NAME_TEXT_COLOR
                  : GRID_FILTER_CONDITION_NAME_CELL_COLOR,
              columnId: header.id,
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
            },
          };

          notifyUpdate();
        }}
      />
    {/if}
  {/if}

  {#if context.isGeo}
    <MapFilterInput
      {currentCondition}
      {table}
      {header}
      {isAdvancedView}
      on:updated={({ detail }) => {
        currentCondition = detail.condition;
        notifyUpdate();
      }}
    />
  {:else if !isAdvancedView || !isColorFilter}
    {#if !isAdvancedView || !isFormulaFilter}
      <DropdownButton
        data={menuData}
        class="select-condition-menu {isAdvancedView ? 'w-120px' : 'flex-1'}"
        disabled={!context.fieldToFilter}
        allowMinimalWidth={true}
        placement={conditionPickerPlacement}
      >
        <span class="pr-2 font-normal overflow-hidden overflow-ellipsis " slot="value">
          {#if currentCondition && !emptyValuesWellCondition}
            {#if currentCondition.setOp}
              {#if currentCondition.setOp === "arrayContainsAll"}
                All elements
              {:else if currentCondition.setOp === "arrayContainsAny"}
                Any elements
              {:else if currentCondition.setOp === "arrayContainsNone"}
                No elements
              {:else if currentCondition.setOp === "arrayContainsOnly"}
                Elements are exactly
              {/if}
              {#if currentCondition.setOp !== "arrayContainsOnly"}
                <span class="text-light-200">&gt;</span>
              {/if}
            {/if}
            {#if currentCondition.setOp !== "arrayContainsOnly"}
              {getFilterNameForColumnType(
                context.fieldToFilter.type,
                currentFilter,
                currentCondition.setOp
              )}
            {/if}
          {:else}
            (Select Condition)
          {/if}
        </span>
      </DropdownButton>
    {/if}

    {#if hasInput}
      <div
        class="input {isLongInput
          ? 'flex-col'
          : 'flex-row'} placement-{inputPlacement}"
        class:no-outline={inputType === "boolean" ||
          currentFilter.conditionType === "value"}
      >
        {#if currentCondition.target.conditionType === GRID_FILTER_CONDITION_TYPE_VARIABLE && currentFilter.conditionType === GRID_FILTER_CONDITION_TYPE_VARIABLE}
          {#each { length: currentFilter.variableCount } as _, i}
            {#if !isLongInput && i > 0}
              <div class="and"><span class="text">And<span /></span></div>
            {/if}
            <div class="filter-container">
              <FilterInput
                value={currentCondition.target.values[i]}
                {table}
                {header}
                {currentCondition}
                {singleLineGroupInput}
                placement={inputPlacement}
                on:updated={({ detail }) => {
                  if (
                    currentCondition.target.conditionType ===
                    GRID_FILTER_CONDITION_TYPE_VARIABLE
                  ) {
                    currentCondition.target.values[i] = detail.value;
                  }
                  notifyUpdate();
                }}
              />
              {#if isLongInput && currentFilter.variableCount > 1}
                {#if i === currentFilter.variableCount - 1}
                  <div class="long-input-filter-spacing" />
                {:else}
                  <div class="long-input-filter-and">
                    <span class="text">And</span>
                  </div>
                {/if}
              {/if}
            </div>
          {/each}
        {:else if currentCondition?.target?.conditionType === "formula"}
          <div class="filter-container longer">
            <input
              bind:value={currentCondition.target.formula}
              class="outline-none px-2.5 text-dark-200 min-w-0 rounded bg-transparent flex-1"
              type="text"
              placeholder="Formula"
              on:input={notifyUpdate}
            />
          </div>
        {:else if currentFilter.conditionType === "value"}
          <ValueSetInput
            class="min-w-0 {isAdvancedView ? 'w-120px' : 'flex-1'}"
            currentRule={currentCondition}
            {table}
            {header}
            placement={inputPlacement}
            fieldToFilter={context.fieldToFilter}
            structPath={context.structPath}
            structPathType={context.structPathType}
            on:updated={({ detail }) => {
              if (detail.rule.type === "condition") {
                currentCondition = detail.rule;
              }
              notifyUpdate();
            }}
          />
        {/if}
      </div>
    {/if}
  {/if}
</div>

<style lang="postcss">
  .conditional-filter-container {
    @apply flex flex-col items-stretch justify-stretch;

    &.same-line-input {
      @apply flex-row;
    }

    &.advanced {
      .filter-container {
        @apply w-120px;

        &.longer {
          @apply w-240px;
        }
      }
    }

    &:not(.advanced) {
      @apply flex-1;

      &.same-line-input {
        justify-content: space-evenly;
      }

      .filter-container {
        @apply flex-1;
      }
    }

    .filter-container {
      @apply flex min-w-0 my-auto;
      column-gap: 4px;
    }
  }

  :global(.select-condition-menu .menu-element .font-medium),
  :global(.select-condition-menu .contextmenu-list-element .font-medium) {
    @apply !font-normal;
  }

  .long-input-filter-spacing {
    @apply w-[38px];
  }

  .long-input-filter-and {
    @apply flex relative border border-solid border-light-100 border-l-0 w-[17px] min-w-[17px] mr-17px;
    top: 20px;
  }

  .long-input-filter-and .text {
    @apply relative uppercase text-dark-50 text-[10px] font-medium m-auto min-w-[34px] text-center;
    line-height: 15px;
  }

  .input {
    @apply flex flex-1 min-w-0 min-h-32px;

    &:not(.no-outline) {
      @apply border border-light-100 bg-white;

      &:not(.no-outline):focus-within,
      &:hover {
        @apply border-light-200;
      }
    }

    &.placement-none {
      @apply rounded;
    }

    &.placement-start {
      @apply rounded-tl rounded-bl border-r-0;
    }

    &.placement-middle {
      @apply rounded-0 border-r-0;
    }

    &.placement-end {
      @apply rounded-tr rounded-br;
    }

    &.placement-top {
      @apply rounded-tl rounded-tr border-b-0;
    }

    &.placement-bottom {
      @apply rounded-bl rounded-br;
    }
  }

  .and {
    @apply uppercase text-dark-50 font-medium text-[10px] flex-grow-0;
    align-self: center;
    line-height: 15px;
  }

  /* this design only apply for number and string type with variableCount > 0 */
  .literal-filter-container.variable {
    @apply rounded gap-0;

    &:not(.same-line-input) {
      /* don't show increase/decrease if there are multiple number inputs */
      :global(.input-container .radio-button-container) {
        @apply hidden;
      }

      .input {
        @apply gap-0;

        .and {
          @apply relative h-full flex flex-row items-center;

          &::before {
            @apply absolute bg-light-100 z-0;
            content: "";
            top: 0px;
            bottom: 0px;
            left: 50%;
            width: 1px;
          }

          .text {
            @apply relative bg-white z-10;
            @apply text-11px leading-[17px] font-medium text-dark-50;
          }
        }
      }
    }
  }
</style>
