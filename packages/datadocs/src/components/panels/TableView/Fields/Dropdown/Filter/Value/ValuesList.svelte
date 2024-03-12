<script lang="ts">
  import type {
    Field,
    GridFilterRule,
    GridHeader,
    GridStructPathType,
    TableDescriptor,
  } from "@datadocs/canvas-datagrid-ng";
  import ValueFilter from "./ValuesWell.svelte";
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher<{
    updated: { rule: GridFilterRule };
  }>();

  export let table: TableDescriptor;
  export let header: GridHeader;
  export let structPath: string | undefined;
  export let pathCastType: GridStructPathType;

  export let fieldToFilter: Field | undefined;

  export let currentRule: GridFilterRule | undefined;

  function notifyUpdate() {
    dispatch("updated", { rule: currentRule });
  }
</script>

<div class="dropdown">
  <ValueFilter
    {currentRule}
    {table}
    {header}
    {structPath}
    structPathType={pathCastType}
    {fieldToFilter}
    isValueHelper
    on:updated={({ detail }) => {
      notifyUpdate();
      currentRule = detail.rule;
    }}
  />
</div>

<style lang="postcss">
  .dropdown {
    @apply flex flex-col relative text-[13px] bg-white rounded h-[inherit] overflow-x-hidden overflow-y-auto;
    box-shadow: 0px 5px 20px rgba(55, 84, 170, 0.16);
  }
</style>
