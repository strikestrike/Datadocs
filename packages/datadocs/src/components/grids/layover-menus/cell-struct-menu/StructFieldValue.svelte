<script lang="ts">
  import type { Struct, List } from "@datadocs/canvas-datagrid-ng";
  import type { CellValue } from "../type";
  import { columnTypeToLongFormString } from "@datadocs/canvas-datagrid-ng/lib/utils/column-types";
  import { getContext, tick } from "svelte";
  import { getDisplayValue } from "../util";
  import { UPDATE_DROPDOWN_STYLE_CONTEXT_NAME } from "../../../common/dropdown";
  import { isDraggingStore, checkDragging } from "./constant";
  import NumChildBadge from "../NumChildBadge.svelte";

  export let data: CellValue;
  export let isRoot = false;
  export let isHovered = false;

  const updateDropdownStyle: () => void = getContext(
    UPDATE_DROPDOWN_STYLE_CONTEXT_NAME
  );
  const marginLeft = isRoot ? "" : "mx-1";

  let childCount: number = -1;
  let isArrayType = false;
  let isStructType = false;
  let isExpandable = false;
  let expand = false;
  let isChildHovered: boolean;
  let hoverList: boolean[] = [];

  async function onExpand(value: boolean) {
    if (!isExpandable || checkDragging()) return;
    expand = value;
    await tick();
    updateDropdownStyle();
  }

  function onHovered(value: boolean) {
    isHovered = value;
  }

  function checkArray(value: CellValue) {
    if ("dataType" in value) {
      return value?.dataType?.endsWith?.("[]");
    } else {
      return columnTypeToLongFormString(value.columnType).endsWith("[]");
    }
  }

  function checkStruct(value: CellValue) {
    if ("dataType" in value) {
      return value?.dataType === "struct";
    } else {
      return columnTypeToLongFormString(value.columnType) === "struct";
    }
  }

  function getChildCount(value: CellValue) {
    if ("dataType" in value) {
      return value.value.length;
    } else {
      return value.value.length;
    }
  }

  function getStructChildren(value: CellValue) {
    const children: { key: string; value: CellValue }[] = [];
    if ("dataType" in value) {
      for (const key in value.value) {
        if (Object.prototype.hasOwnProperty.call(value.value, key)) {
          children.push({ key, value: value.value[key] });
        }
      }
    } else {
      const columnType = value.columnType as Struct;
      const childrenType = columnType.children;
      for (const childType of childrenType) {
        const key = childType.name;
        children.push({
          key,
          value: { columnType: childType.type, value: value.value[key] },
        });
      }
    }

    return children;
  }

  function getArrayChildren(value: CellValue): CellValue[] {
    if ("dataType" in value) {
      return value.value;
    } else {
      const childType = (value.columnType as List).child.type;
      return value.value.map((v) => {
        return { columnType: childType, value: v };
      });
    }
  }

  function onMouseDown() {
    document.addEventListener("mousemove", onMouseMove, true);
    document.addEventListener("mouseup", onMouseUp, true);
  }

  function onMouseMove() {
    isDraggingStore.set(true);
  }

  function onMouseUp() {
    setTimeout(() => {
      isDraggingStore.set(false);
    });
    document.removeEventListener("mousemove", onMouseMove, true);
    document.removeEventListener("mouseup", onMouseUp, true);
  }

  $: displayValue = getDisplayValue(data, isRoot);
  $: isArrayType = checkArray(data);
  $: isStructType = checkStruct(data);
  $: if (isArrayType) childCount = getChildCount(data);
  $: hasChildBadge = childCount >= 0;
  $: isExpandable = isArrayType || isStructType;
  $: isChildHovered = hoverList.some((e) => e === true);
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-mouse-events-have-key-events -->
{#if !expand || !isExpandable}
  {@const rightContent = hasChildBadge && isRoot ? 15 : 0}
  <div
    class="field-value closed {marginLeft}"
    class:root={isRoot}
    class:expandable={isExpandable}
    class:active={isHovered && !isChildHovered}
    on:mouseover={() => onHovered(true)}
    on:mouseleave={() => onHovered(false)}
    on:mousedown|stopPropagation={onMouseDown}
    on:click|stopPropagation={() => onExpand(true)}
  >
    <div
      style="max-width: calc(100% - {rightContent}px);"
      class="display-content whitespace-nowrap overflow-hidden overflow-ellipsis"
    >
      {displayValue + (isRoot ? "" : ",")}
    </div>

    {#if hasChildBadge && isRoot}
      <div class="flex-shrink-0 w-[15px]">
        <NumChildBadge count={childCount} />
      </div>
    {/if}
  </div>
{/if}

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-mouse-events-have-key-events -->
{#if isStructType}
  {@const children = getStructChildren(data)}
  <div
    class="field-value expanded struct-field {marginLeft}"
    class:root={isRoot}
    class:expandable={isExpandable}
    class:hidden={!expand}
    class:active={isHovered && !isChildHovered}
    on:mouseover={() => onHovered(true)}
    on:mouseleave={() => onHovered(false)}
    on:mousedown|stopPropagation={onMouseDown}
    on:click|stopPropagation={() => onExpand(false)}
  >
    <div
      style="max-width: calc(100%)"
      class="bracket whitespace-nowrap overflow-hidden overflow-ellipsis"
    >
      {"{"}
    </div>

    {#each children as child}
      <div
        style="max-width: calc(100%)"
        class="ml-2 whitespace-nowrap overflow-hidden overflow-ellipsis"
      >
        {'"' + child.key + '"' + ": " + getDisplayValue(child.value, false)},
      </div>
    {/each}

    <div
      style="max-width: calc(100%)"
      class="bracket whitespace-nowrap overflow-hidden overflow-ellipsis"
    >
      {"}" + (isRoot ? "" : ",")}
    </div>
  </div>
{/if}

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-mouse-events-have-key-events -->
{#if isArrayType}
  {@const children = getArrayChildren(data)}
  <div
    class="field-value expanded array-field {marginLeft}"
    class:root={isRoot}
    class:expandable={isExpandable}
    class:active={isHovered && !isChildHovered}
    class:hidden={!expand}
    on:mouseover={() => onHovered(true)}
    on:mouseleave={() => onHovered(false)}
    on:mousedown|stopPropagation={onMouseDown}
    on:click|stopPropagation={() => onExpand(false)}
  >
    <div
      style="max-width: calc(100%)"
      class="bracket whitespace-nowrap overflow-hidden overflow-ellipsis"
    >
      {"["}
    </div>

    {#each children as child, index}
      <svelte:self
        data={child}
        isRoot={false}
        bind:isHovered={hoverList[index]}
      />
    {/each}

    <div
      style="max-width: calc(100%)"
      class="bracket whitespace-nowrap overflow-hidden overflow-ellipsis"
    >
      {"]" + (isRoot ? "" : ",")}
    </div>
  </div>
{/if}

<style lang="postcss">
  .field-value {
    @apply cursor-pointer;
  }

  .field-value:not(.expanded).root.expandable .display-content {
    border-bottom: 1px dashed #a7b0b5;
  }

  .field-value:not(.expanded) {
    @apply flex flex-row items-center gap-0.5 p-0.5;
    border-radius: 3px;
  }

  .field-value.expanded {
    @apply p-0.5 italic;
    border-radius: 3px;
  }

  .field-value.expanded.root {
    border: 1px solid rgba(95, 137, 255, 0.1);
  }

  .field-value.active {
    @apply bg-primary-indigo-blue bg-opacity-[0.08];
  }

  /* Not expandable child */
  .field-value:not(.root):not(.expandable),
  /* Struct expanded child */
  .field-value.struct-field.expanded *,
  /* Field bracket */
  .field-value .bracket {
    @apply pointer-events-none;
  }
</style>
