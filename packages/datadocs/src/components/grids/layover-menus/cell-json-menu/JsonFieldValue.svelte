<script lang="ts">
  import { getContext, tick } from "svelte";
  import { UPDATE_DROPDOWN_STYLE_CONTEXT_NAME } from "../../../common/dropdown";
  import { getDisplayValue, isJsonArray, isJsonObject } from "../util";
  import { checkDragging } from "../cell-struct-menu/constant";
  import { isDraggingStore } from "./constant";
  import NumChildBadge from "../NumChildBadge.svelte";

  export let data: any;
  export let isRoot = false;
  export let isHovered = false;
  export let alwaysExpand = false;

  const updateDropdownStyle: () => void = getContext(
    UPDATE_DROPDOWN_STYLE_CONTEXT_NAME
  );
  const isArray = isJsonArray(data);
  const isObject = isJsonObject(data);
  const childCount = isArray ? data.length : -1;
  const hasChildBadge = childCount >= 0;
  const isExpandable = isArray || isObject;
  const marginLeft = isRoot ? "" : "mx-1";
  const displayValue = getDisplayValue(
    {
      value: data,
      dataType: "json",
    },
    isRoot
  );

  let expand = alwaysExpand;
  let isChildHovered: boolean;
  let hoverList: boolean[] = [];

  async function onExpand(value: boolean) {
    if (!isExpandable || checkDragging() || alwaysExpand) return;
    expand = value;
    await tick();
    updateDropdownStyle();
  }

  function getObjectItems(data: any) {
    const fieldItems: Array<{ key: string; value: any }> = [];
    for (const key in data) {
      fieldItems.push({ key, value: data[key] });
    }
    return fieldItems;
  }

  function onHovered(value: boolean) {
    isHovered = value;
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
{#if isObject}
  {@const children = getObjectItems(data)}
  <div
    class="field-value expanded object-field {marginLeft}"
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
        {'"' +
          child.key +
          '"' +
          ": " +
          getDisplayValue({ value: child.value, dataType: "json" }, false)},
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
{#if isArray}
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

    {#each data as child, index}
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
  /* Object expanded child */
  .field-value.object-field.expanded *,
  /* Field bracket */
  .field-value .bracket {
    @apply pointer-events-none;
  }
</style>
