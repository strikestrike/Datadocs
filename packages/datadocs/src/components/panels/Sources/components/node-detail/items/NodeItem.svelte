<script lang="ts">
  import Icon from "../../../../../common/icons/Icon.svelte";
  import tooltipAction from "../../../../../common/tooltip";
  import type { ReferenceItem } from "../type";

  export let items: ReferenceItem[] = [];
  export let name: string;
  export let type: string;
  export let value: string = null;
  // export let manager: SourceStateManager<SourceNodeItem>;

  function getItemIcon(type: string, disable: boolean = false): string {
    if (type === "uitable") {
      return "panel-uitable";
    } else if (type === "dbtable") {
      return "panel-dbtable";
    } else if (type === "file") {
      if (disable) {
        return "tw-source-csv-disabled";
      } else {
        return "tw-source-csv";
      }
    }
    return "";
  }
</script>

<div class="flex flex-row items-center gap-2">
  <div
    class="flex-grow flex-shrink w-26 whitespace-nowrap overflow-hidden overflow-ellipsis text-dark-50 text-[11px]"
  >
    {name}
  </div>
  <div class="flex flex-row flex-wrap w-36 gap-1">
    {#if items && items.length > 0}
      {#each items as item}
        <div
          class="reference-item {item.type} flex flex-row items-center text-11px gap-1"
          use:tooltipAction={{
            content: item.tooltip,
            disabled: item.tooltip ? false : true,
          }}
          class:disabled={item.tooltip ? true : false}
        >
          <div class="pr-1">
            <Icon icon={getItemIcon(item.type)} size="16px" />
          </div>
          <div
            class="reference-text flex-grow flex-shrink text-black whitespace-nowrap overflow-hidden overflow-ellipsis"
          >
            {item.name}
          </div>
        </div>
      {/each}
    {/if}
    {#if value}
      {#if type === "status"}
        <div
          class="flex-grow flex-shrink text-black whitespace-nowrap overflow-hidden overflow-ellipsis text-11px gap-1"
        >
          <div
            class="status-content max-w-fit inline-block px-3 py-1 rounded-xl font-semibold"
          >
            {value}
          </div>
        </div>
      {:else}
        <div
          class="flex-grow flex-shrink text-black whitespace-nowrap overflow-hidden overflow-ellipsis text-11px gap-1"
        >
          {value}
        </div>
      {/if}
    {/if}
  </div>
</div>

<style lang="postcss">
  .reference-item {
    max-width: 100px;
    padding: 2px 8px 2px 4px;
    border-radius: 4px;
  }
  .dbtable {
    background-color: #9e1c530f;
  }
  .uitable {
    background-color: #5f89ff14;
  }
  .file {
    background-color: #58d2661a;
  }
  .status-content {
    background-color: #58d2661a;
    color: #58d266;
  }

  .reference-item.disabled:hover {
    background-color: #f7f9fa;
  }

  .reference-item.disabled:hover .reference-text {
    @apply text-dark-50;
  }
</style>
