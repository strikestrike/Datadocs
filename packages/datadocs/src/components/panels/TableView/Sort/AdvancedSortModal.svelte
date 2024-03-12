<script lang="ts">
  import { getContext, onMount, setContext, tick } from "svelte";
  import type {
    FilterableColors,
    GridSort,
    TableDescriptor,
  } from "@datadocs/canvas-datagrid-ng";
  import {
    CLOSE_DROPDOWN_CONTEXT_NAME,
    UPDATE_DROPDOWN_STYLE_CONTEXT_NAME,
  } from "../../../common/dropdown";
  import DropdownSectionTitle from "../../../toolbars/MainToolbar/dropdowns/common/DropdownSectionTitle.svelte";
  import AutoApplyButton from "../Fields/Dropdown/Filter/Value/AutoApplyButton.svelte";
  import Button from "../../../common/form/Button.svelte";
  import { autoApplyFilter, tableInUse } from "../../../../app/store/writables";
  import SortItem from "./SortItem.svelte";
  import { ensureAsync } from "@datadocs/canvas-datagrid-ng/lib/data/data-source/await";
  import FieldSelectorDropdown from "../Fields/Dropdown/Filter/Conditional/Advanced/FieldSelectorDropdown.svelte";
  import DropdownButton from "../../../common/form/button/DropdownButton.svelte";
  import { isAcceptableDragEvent } from "./util";
  import type {
    DndDragObject,
    DndDragObjectType,
    DndDropTarget,
    DndDropTargetType,
  } from "./type";
  import {
    DND_DRAG_OBJECT_CONTEXT_NAME,
    DND_DROP_TARGET_CONTEXT_NAME,
  } from "./constants";
  import { writable } from "svelte/store";
  import DndTarget from "../Fields/Dropdown/Filter/Conditional/Advanced/DndTarget.svelte";
  import type { FieldSelectorTarget } from "../Fields/Dropdown/Filter/Conditional/Advanced/type";
  import { sortsMatch } from "@datadocs/canvas-datagrid-ng/lib/data/data-source/sorters/utils";
  import CircularSpinner from "../../../common/spinner/CircularSpinner.svelte";

  const updateDropdown: () => void = getContext(
    UPDATE_DROPDOWN_STYLE_CONTEXT_NAME,
  );
  const notifyCloseDropdown: () => void = getContext(
    CLOSE_DROPDOWN_CONTEXT_NAME,
  );

  const dragObject: DndDragObject = writable<DndDragObjectType>();
  const dropTarget: DndDropTarget = writable<DndDropTargetType>();

  setContext(DND_DRAG_OBJECT_CONTEXT_NAME, dragObject);
  setContext(DND_DROP_TARGET_CONTEXT_NAME, dropTarget);

  export let table: TableDescriptor;

  let savedSorts = table.dataSource.getSorters();
  let currentSorts = structuredClone(savedSorts);

  let dropdownElement: HTMLElement;
  let sortsElement: HTMLElement;

  let saving = false;
  let dropTargetReferenceCount = 0;

  $: dropTargetOrdinal = getDropTargetOrdinal($dropTarget);
  $: if (dropTargetReferenceCount <= 0) {
    $dropTarget = undefined;
  }
  $: dimensions = $dragObject?.layout;
  $: hasChanges = checkChanges(savedSorts, currentSorts);
  $: if ($autoApplyFilter) {
    notifyUpdate();
  }
  $: showFieldSelectionOnly = savedSorts.length < 1 && !hasChanges;
  $: showFieldSelectionOnly, scheduleDropdownUpdate();

  const colorsCache: Record<string, FilterableColors> = {};

  function checkChanges(a: GridSort[], b: GridSort[]) {
    a = sanitizeSorts(a);
    b = sanitizeSorts(b);
    if (a.length !== b.length) return true;

    for (let i = 0; i < a.length; i++) {
      const sortA = a[i];
      const sortB = b[i];

      if (!sortsMatch(sortA, sortB)) {
        return true;
      }
    }

    return false;
  }

  function sanitizeSorts(sorts: GridSort[]) {
    return sorts.filter((sorter) => !!sorter);
  }

  function apply(e: Event) {
    e.preventDefault();

    saveSort(currentSorts);
    notifyCloseDropdown();
  }

  function clear(e: Event) {
    e.preventDefault();
    currentSorts.length = 0;
    scheduleDropdownUpdate();
  }

  function add(target: FieldSelectorTarget) {
    if (target.type === "formula") {
      currentSorts.push({ type: "formula", formula: "" });
    } else {
      currentSorts.push({
        type: "preset",
        columnId: target.columnId,
        dir: "asc",
        on: { type: "value", pathInfo: target.pathInfo },
      });
    }

    currentSorts = currentSorts;
    notifyUpdate();
  }

  function removeAt(index: number) {
    currentSorts.splice(index, 1);
    currentSorts = currentSorts;
    notifyUpdate();
  }

  async function scheduleDropdownUpdate() {
    await tick();
    updateDropdown();
  }

  function notifyUpdate() {
    scheduleDropdownUpdate();
    if (!$autoApplyFilter || !checkChanges(savedSorts, currentSorts)) {
      return;
    }
    saveSort(currentSorts);
  }

  async function saveSort(sorts: GridSort[]) {
    sorts = sanitizeSorts(sorts);
    saving = true;

    try {
      const setSorterOp = table.dataSource.setSorter(sorts);
      if (await ensureAsync(setSorterOp)) {
        savedSorts = table.dataSource.getSorters?.();
        return true;
      }
    } finally {
      saving = false;
    }

    return false;
  }

  function onDragEnter(e: DragEvent) {
    if (!isAcceptableDragEvent(e)) {
      return;
    }

    dropTargetReferenceCount++;
    e.preventDefault();
  }

  function onDragOver(e: DragEvent) {
    if (dropTargetReferenceCount <= 0 || e.defaultPrevented) return;
    updateAsDropTarget(e);
    e.preventDefault();
  }

  function onDragLeave(e: DragEvent) {
    if (dropTargetReferenceCount <= 0) return;
    dropTargetReferenceCount--;
    e.preventDefault();
  }

  function onDrop(e: DragEvent) {
    dropTargetReferenceCount = 0;

    const _dragObject = $dragObject;
    const _dropTarget = $dropTarget;

    if (
      !_dragObject ||
      !_dropTarget ||
      !removeSort(currentSorts, _dragObject.sort)
    ) {
      return;
    }

    if (_dropTarget.nearest) {
      addSort(
        currentSorts,
        _dropTarget.nearest.rule,
        _dropTarget.nearest.onTop,
        _dragObject.sort,
      );

      e.preventDefault();

      currentSorts = currentSorts;
      notifyUpdate();
    }
  }

  function updateAsDropTarget(e: DragEvent) {
    const { children } = sortsElement;
    const { clientY: pos } = e;

    if (children.length > 0) {
      let nearestAbove: HTMLElement | undefined;
      let nearestBelow: HTMLElement | undefined;

      for (const child of children) {
        if (
          !(child instanceof HTMLElement) ||
          !child.dataset.dropTargetOrder ||
          child.dataset.sortItemDragging === "true"
        ) {
          continue;
        }

        const rect = child.getBoundingClientRect();
        const rectAbove = nearestAbove?.getBoundingClientRect();
        const rectBelow = nearestBelow?.getBoundingClientRect();

        if (
          (!rectAbove || rectAbove.bottom < rect.bottom) &&
          rect.top < e.clientY
        ) {
          nearestAbove = child;
        }

        if (
          (!rectBelow || rectBelow.top > rect.top) &&
          rect.bottom > e.clientY
        ) {
          nearestBelow = child;
        }
      }

      let target: HTMLElement | undefined;
      if (nearestAbove && nearestBelow) {
        const diffTop = Math.max(
          pos - nearestAbove.getBoundingClientRect().bottom,
          0,
        );
        const diffBottom = Math.max(
          nearestBelow.getBoundingClientRect().top - pos,
          0,
        );

        target = diffTop < diffBottom ? nearestAbove : nearestBelow;
      } else {
        target = nearestAbove || nearestBelow;
      }

      let targetRule: GridSort | undefined;
      if (target) {
        targetRule = currentSorts[parseInt(target.dataset.dropTargetOrder, 10)];
      }

      if (target && targetRule) {
        setAsDropTarget(e, target, targetRule);
        return;
      }
    }

    if (currentSorts[0] === $dragObject?.sort) {
      $dropTarget = undefined;
    }
  }

  function setAsDropTarget(e: DragEvent, element: HTMLElement, sort: GridSort) {
    const rect = element.getBoundingClientRect();
    const middle = rect.top + (rect.bottom - rect.top) / 2;
    const onTop = e.clientY <= middle;

    const targetIndex = currentSorts.indexOf(sort);
    const targetIndexNormalized = targetIndex + (onTop ? 0 : 1);
    const draggingIndex = currentSorts.indexOf($dragObject?.sort);

    if (
      sort == $dragObject?.sort ||
      (targetIndex !== -1 &&
        draggingIndex !== -1 &&
        (targetIndexNormalized == draggingIndex ||
          targetIndexNormalized - 1 == draggingIndex))
    ) {
      $dropTarget = undefined;
    } else {
      $dropTarget = {
        nearest: {
          rule: sort,
          onTop,
          order: targetIndex,
        },
      };
    }
  }

  function addSort(
    sorts: GridSort[],
    nearest: GridSort,
    onTop: boolean,
    reordering: GridSort,
  ) {
    const index = sorts.indexOf(nearest);
    if (index === -1) return false;
    sorts.splice(index + (onTop ? 0 : 1), 0, reordering);
    return true;
  }

  function removeSort(sorts: GridSort[], sort: GridSort): boolean {
    const index = sorts.indexOf(sort);
    if (index !== -1) sorts.splice(index, 1);
    return true;
  }

  function getDropTargetOrdinal(target: DndDropTargetType) {
    if (!target?.nearest) return -1;
    return target.nearest.order + (target.nearest.onTop ? 0 : 1);
  }

  onMount(() => {
    dropdownElement?.focus();
    scheduleDropdownUpdate();

    if (!$tableInUse) {
      $tableInUse = table;
      return () => {
        $tableInUse = undefined;
      };
    }
  });
</script>

{#if showFieldSelectionOnly}
  <FieldSelectorDropdown
    {table}
    title="Sort By"
    keepMenuOpen
    on:change={({ detail }) => {
      add(detail.target);
    }}
  />
{:else}
  <div
    bind:this={dropdownElement}
    class="dropdown"
    tabindex="-1"
    on:dragenter={onDragEnter}
    on:dragover={onDragOver}
    on:dragleave={onDragLeave}
    on:drop={onDrop}
  >
    <div class="flex flex-row items-center mx-5 mt-2.5 mb-0.5">
      <DropdownSectionTitle title="Sort" spacing="mr-2" />
      {#if saving}
        <CircularSpinner size={15} />
      {/if}
    </div>

    <div bind:this={sortsElement} class="sorts-list-container">
      {#each currentSorts as sort, i}
        {#if dropTargetOrdinal === i || ($dragObject?.sort == sort && !$dropTarget)}
          <DndTarget
            {dimensions}
            isDragTarget={$dragObject?.sort == sort && !$dropTarget}
          />
        {/if}

        <SortItem
          currentSort={sort}
          order={i}
          {table}
          {colorsCache}
          on:updated={({ detail }) => {
            currentSorts[i] = detail.sort;
            notifyUpdate();
          }}
          on:remove={() => removeAt(i)}
        />
      {/each}
      {#if dropTargetOrdinal === currentSorts.length}
        <DndTarget {dimensions} />
      {/if}
      <div class="flex flex-row mr-7.5 justify-stretch">
        <DropdownButton
          autoWidth
          class="flex-1 w-180px {currentSorts.length > 0 ? 'mt-1' : ''}"
          icon="sort-add"
          buttonType="action"
        >
          <svelte:fragment slot="value">Add New Sort</svelte:fragment>
          <FieldSelectorDropdown
            slot="dropdown"
            {table}
            on:change={({ detail }) => add(detail.target)}
          />
        </DropdownButton>
      </div>
    </div>

    <div class="button-container">
      <AutoApplyButton bind:checked={$autoApplyFilter} />

      <Button
        color="secondary"
        class="leading-normal ml-auto mr-1.5 {$autoApplyFilter
          ? 'invisible'
          : ''}"
        spacing="px-3 py-1.5"
        disabled={currentSorts.length <= 0}
        on:click={clear}
      >
        Clear All
      </Button>
      <Button
        color="primary-accent"
        class="leading-normal {$autoApplyFilter ? 'invisible' : ''}"
        spacing="px-3 py-1.5"
        disabled={!hasChanges}
        on:click={apply}
      >
        Apply
      </Button>
    </div>
  </div>
{/if}

<style lang="postcss">
  .dropdown {
    @apply flex flex-col justify-stretch relative bg-white rounded overflow-y-hidden overflow-x-hidden text-[13px] min-w-500px h-full outline-none;
    box-shadow: 0px 5px 20px rgba(55, 84, 170, 0.16);

    .sorts-list-container {
      @apply flex flex-col flex-1 pt-1 px-5 pb-3 overflow-y-auto overflow-x-hidden items-start;
      row-gap: 4px;
    }

    .button-container {
      @apply flex flex-row px-5 pt-2 pb-3 text-11px flex-shrink-0;
    }
  }
</style>
