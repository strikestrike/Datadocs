<script lang="ts">
  import type {
    Field,
    GridFilterRule,
    GridHeader,
    GridStructPathType,
    TableDescriptor,
  } from "@datadocs/canvas-datagrid-ng";
  import DropdownButton from "../../../../../../common/form/button/DropdownButton.svelte";
  import ValueHelper from "../Value/ValuesList.svelte";
  import { getCurrentCondition } from "../value-utils";
  import { getFilterValueAsString } from "@datadocs/canvas-datagrid-ng/lib/data/data-source/filters/utils";
  import { createEventDispatcher } from "svelte";
  import type { Placement } from "../../../../../../common/form/button/type";
  import { GRID_FILTER_CONDITION_TYPE_VALUE } from "@datadocs/canvas-datagrid-ng/lib/data/data-source/filters/constants";

  const dispatch = createEventDispatcher<{
    updated: { rule: GridFilterRule };
  }>();

  export let table: TableDescriptor;
  export let header: GridHeader;
  export let structPath: string | undefined;
  export let structPathType: GridStructPathType;
  export let fieldToFilter: Field | undefined;
  export let currentRule: GridFilterRule | undefined;
  export let placement: Placement;

  $: currentCondition = getCurrentCondition(currentRule, true);
  $: values =
    currentCondition?.target?.conditionType === GRID_FILTER_CONDITION_TYPE_VALUE
      ? currentCondition.target.values
      : [];

  let className = "";
  export { className as class };

  function notifyUpdate() {
    dispatch("updated", { rule: currentRule });
  }
</script>

<DropdownButton
  class={className}
  buttonClass="input-container"
  position="bottom"
  {placement}
>
  <ul slot="value" class="value-list">
    {#each values as value}
      <li>
        {getFilterValueAsString(value)}
      </li>
    {:else}
      (Pick a value)
    {/each}
  </ul>

  <ValueHelper
    slot="dropdown"
    {currentRule}
    {table}
    {header}
    {structPath}
    pathCastType={structPathType}
    {fieldToFilter}
    on:updated={({ detail }) => {
      notifyUpdate();
      currentRule = detail.rule;
    }}
  />
</DropdownButton>

<style lang="postcss">
  ul.value-list {
    @apply flex flex-row flex-1 font-normal;
    column-gap: 4px;

    li {
      @apply flex bg-primary-datadocs-blue text-light-50 text-11px px-2 py-0.5 rounded-10px;
      line-height: 16.5px;
    }
  }
</style>
