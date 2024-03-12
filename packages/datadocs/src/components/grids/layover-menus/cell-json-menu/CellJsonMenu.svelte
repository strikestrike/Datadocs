<script lang="ts">
  import { getContext } from "svelte";
  import type { NormalCellDescriptor } from "@datadocs/canvas-datagrid-ng";
  import { UPDATE_DROPDOWN_STYLE_CONTEXT_NAME } from "../../../common/dropdown";
  import { getCellJsonValue, isJsonArray, isJsonObject } from "../util";
  import JsonFieldValue from "./JsonFieldValue.svelte";

  export let data: NormalCellDescriptor;
  let value = getCellJsonValue(data);
  let isArray = isJsonArray(value);
  let isObject = isJsonObject(value);
  let fieldItems: Array<{ key: string; value: any }>;

  function getObjectItems() {
    if (!isObject) return;
    fieldItems = [];
    for (const key in value) {
      fieldItems.push({ key, value: value[key] });
    }
  }

  $: if (value && isObject) {
    getObjectItems();
  }
</script>

<div class="flex flex-col py-2 max-h-full">
  <div
    class="menu-container flex-grow overflow-y-auto"
    style="max-height: 250px"
  >
    {#if isObject}
      <div class="menu-grid">
        {#each fieldItems as item}
          <div class="field-key">{item.key}</div>

          <div class="field-value-container">
            <JsonFieldValue data={item.value} isRoot={true} />
          </div>
        {/each}
      </div>
    {:else if isArray}
      <div class="field-value-container w-[300px] px-2">
        <JsonFieldValue data={value} isRoot={true} alwaysExpand={true} />
      </div>
    {/if}
  </div>
</div>

<style lang="postcss">
  .menu-container :global(*) {
    @apply select-text;
  }

  .menu-grid {
    @apply pl-4 pr-2.5;
    display: grid;
    grid-template-columns: 70px 280px;
    column-gap: 2px;
    row-gap: 4px;
  }

  .field-key {
    @apply py-[3px] whitespace-nowrap overflow-x-hidden overflow-ellipsis;
    @apply uppercase text-11px font-medium;
  }

  .field-value-container {
    @apply text-[#294EB7] text-12px;
  }
</style>
