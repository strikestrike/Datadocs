<script lang="ts">
  import type { ColumnType, List, Struct } from "@datadocs/canvas-datagrid-ng";
  import Icon from "../../../../../common/icons/Icon.svelte";
  import type { NodeDetailColumn } from "../type";
  import { getDataTypeIcon } from "../../../../../common/icons/utils";
  import { columnTypeToShortFormString } from "@datadocs/canvas-datagrid-ng/lib/utils/column-types";
  import { onMount } from "svelte";

  export let name: string;
  export let type: ColumnType;
  export let items: NodeDetailColumn[] = null;
  let prefixIconWidth = "";
  let prefixIconHeight = "";
  let prefixIcon: string = "";
  let canCollapse: boolean = false;
  let isOpened: boolean = true;

  function getPrefixSvgIcon(): string {
    prefixIconWidth = "29px";
    prefixIconHeight = "14px";
    return getDataTypeIcon(columnTypeToShortFormString(type), false);
  }

  function updateChildrenNodeColumns() {
    function getChildrenNodeColumns(ctype: ColumnType): NodeDetailColumn[] {
      if ((ctype as Struct).children) {
        canCollapse = true;
        return (ctype as Struct).children.map((f) => {
          return { name: f.name, type: f.type };
        });
      } else if ((ctype as List).child) {
        return getChildrenNodeColumns((ctype as List).child.type);
      } else {
        canCollapse = false;
      }
      return null;
    }
    items = getChildrenNodeColumns(type);
  }

  function handleToggle() {
    if (canCollapse) {
      isOpened = !isOpened;
    }
  }

  onMount(() => {
    prefixIcon = getPrefixSvgIcon();
    updateChildrenNodeColumns();
  });
</script>

<div class="flex flex-row items-center px-1.5 py-1 gap-1">
  {#if prefixIcon}
    <div class="flex-grow-0 flex-shrink-0 w-[29px] mr-1">
      <Icon
        icon={prefixIcon}
        width={prefixIconWidth}
        height={prefixIconHeight}
        fill="none"
      />
    </div>
  {/if}
  <div
    class="flex-grow flex-shrink text-black whitespace-nowrap overflow-hidden overflow-ellipsis text-11px gap-1"
  >
    {name}
  </div>
  {#if canCollapse}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div
      class="flex-grow-0 flex-shrink-0 mr-1 transform cursor-pointer"
      class:rotate-180={isOpened}
      on:click={handleToggle}
    >
      <Icon icon="tw-expand-arrow" fill="none" />
    </div>
  {/if}
</div>
{#if canCollapse && isOpened && items && items.length > 0}
  <div class="pl-2">
    {#each items as item}
      <svelte:self name={item.name} type={item.type} />
    {/each}
  </div>
{/if}
