<script lang="ts">
  import {
    DataType,
    type GridFilterCondition,
    type GridHeader,
    type TableDescriptor,
  } from "@datadocs/canvas-datagrid-ng";
  import DropdownButton from "../../../../../../../common/form/button/DropdownButton.svelte";
  import FieldSelectorDropdown from "./FieldSelectorDropdown.svelte";
  import Icon from "../../../../../../../common/icons/Icon.svelte";
  import { getDataTypeIcon } from "../../../../../../../common/icons/utils";
  import { columnTypeToShortFormString } from "@datadocs/canvas-datagrid-ng/lib/utils/column-types";
  import { createEventDispatcher } from "svelte";
  import {
    GRID_FILTER_CONDITION_NAME_CUSTOM_FORMULA,
    GRID_FILTER_CONDITION_NAME_EQUALS,
    GRID_FILTER_CONDITION_TYPE_FORMULA,
    GRID_FILTER_CONDITION_TYPE_VARIABLE,
  } from "@datadocs/canvas-datagrid-ng/lib/data/data-source/filters/constants";
  import type { FieldSelectorTarget } from "./type";
  import { resolveStructField } from "@datadocs/canvas-datagrid-ng/lib/data/data-source/filters/utils";

  const dispatch = createEventDispatcher<{
    changed: { condition: GridFilterCondition };
  }>();

  export let table: TableDescriptor;
  export let currentCondition: GridFilterCondition | undefined;

  $: targetContext = getTargetContext(currentCondition);

  function getTargetContext(condition: GridFilterCondition | undefined): {
    target: FieldSelectorTarget;
    header?: GridHeader;
  } {
    if (!condition) return;

    const { target } = condition;

    if (target.conditionType === GRID_FILTER_CONDITION_TYPE_FORMULA) {
      return { target: { type: "formula" } };
    } else {
      return {
        target: {
          type: "column",
          columnId: target.columnId,
          pathInfo: target.pathInfo,
        },
        header: table.dataSource.getHeaderById(target.columnId),
      };
    }
  }

  function getFieldName(condition: GridFilterCondition, header: GridHeader) {
    if (
      condition.target.conditionType === GRID_FILTER_CONDITION_TYPE_FORMULA ||
      !header
    ) {
      return "";
    }

    return (
      (header.title ?? header.dataKey) +
      (condition.target.pathInfo ? "." + condition.target.pathInfo.path : "")
    );
  }

  function getFieldIcon(condition: GridFilterCondition, header: GridHeader) {
    if (
      condition.target.conditionType === GRID_FILTER_CONDITION_TYPE_FORMULA ||
      !header
    ) {
      return "";
    }

    let type = header.type;

    if (
      typeof header.type === "object" &&
      header.type.typeId === DataType.Struct &&
      condition.target.pathInfo
    ) {
      type =
        resolveStructField(
          { name: String(header.dataKey), type: header.type },
          condition.target.pathInfo.path
        )?.type ?? type;
    }
    return getDataTypeIcon(columnTypeToShortFormString(type));
  }

  function updateWithConditionTarget(target: FieldSelectorTarget) {
    if (target.type === "formula") {
      currentCondition = {
        type: "condition",
        target: {
          conditionType: GRID_FILTER_CONDITION_TYPE_FORMULA,
          conditionName: GRID_FILTER_CONDITION_NAME_CUSTOM_FORMULA,
          formula: "",
        },
      };
    } else {
      currentCondition = {
        type: "condition",
        target: {
          columnId: target.columnId,
          conditionType: GRID_FILTER_CONDITION_TYPE_VARIABLE,
          conditionName: GRID_FILTER_CONDITION_NAME_EQUALS,
          values: [],
          pathInfo: target.pathInfo,
        },
      };
    }

    dispatch("changed", { condition: currentCondition });
  }
</script>

<DropdownButton class="w-180px" placement="start">
  <svelte:fragment slot="value">
    {#if targetContext?.header}
      <Icon
        class="flex-shrink-0 h-full mr-1"
        icon={getFieldIcon(currentCondition, targetContext.header)}
        width="37px"
        height="20px"
      />

      <span class="field-input-field-name"
        >{getFieldName(currentCondition, targetContext.header)}</span
      >
    {:else if targetContext?.target.type === "formula"}
      <span class="field-input-field-name">Custom Formula</span>
    {:else}
      <span class="field-input-field-name">(Column)</span>
    {/if}
  </svelte:fragment>
  <FieldSelectorDropdown
    slot="dropdown"
    {table}
    selectorTarget={targetContext?.target}
    on:change={({ detail }) => updateWithConditionTarget(detail.target)}
  />
</DropdownButton>

<style lang="postcss">
  .field-input-field-name {
    @apply whitespace-nowrap overflow-x-hidden overflow-ellipsis font-normal;
  }
</style>
