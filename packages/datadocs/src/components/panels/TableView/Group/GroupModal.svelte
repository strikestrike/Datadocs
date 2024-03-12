<script lang="ts">
  import type {
    DataGroup,
    TableDescriptor,
  } from "@datadocs/canvas-datagrid-ng";
  import FieldSelectorDropdown from "../Fields/Dropdown/Filter/Conditional/Advanced/FieldSelectorDropdown.svelte";
  import type { FieldSelectorTarget } from "../Fields/Dropdown/Filter/Conditional/Advanced/type";
  import Group from "./Group.svelte";
  import DropdownButton from "../../../common/form/button/DropdownButton.svelte";
  import DropdownSectionTitle from "../../../toolbars/MainToolbar/dropdowns/common/DropdownSectionTitle.svelte";
  import {
    DND_DRAG_OBJECT_CONTEXT_NAME,
    DND_DROP_TARGET_CONTEXT_NAME,
    MIME_TYPE_GROUP_ITEM,
  } from "./constants";
  import { writable } from "svelte/store";
  import type {
    DndDragObject,
    DndDragObjectType,
    DndDropTarget,
    DndDropTargetType,
  } from "./type";
  import { getContext, onMount, setContext } from "svelte";
  import { autoApplyFilter, tableInUse } from "../../../../app/store/writables";
  import { ensureAsync } from "@datadocs/canvas-datagrid-ng/lib/data/data-source/await";
  import AutoApplyButton from "../Fields/Dropdown/Filter/Value/AutoApplyButton.svelte";
  import Button from "../../../common/form/Button.svelte";
  import {
    CLOSE_DROPDOWN_CONTEXT_NAME,
    UPDATE_DROPDOWN_STYLE_CONTEXT_NAME,
  } from "../../../common/dropdown";
  import DndTarget from "../Fields/Dropdown/Filter/Conditional/Advanced/DndTarget.svelte";
  import { filterPathsMatch } from "@datadocs/canvas-datagrid-ng/lib/data/data-source/filters/utils";
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

  export let savedGroups = getSavedGroups();
  export let currentGroups = structuredClone(savedGroups);

  let dropdownElement: HTMLElement;
  let groupsElement: HTMLElement;
  let dropTargetReferenceCount = 0;

  let saving = false;

  $: hasGroups = savedGroups.length > 0 || currentGroups.length > 0;
  $: hideColumnIds = currentGroups.map((group) => group.columnId);

  $: dropTargetOrdinal = getDropTargetOrdinal($dropTarget);
  $: if (dropTargetReferenceCount <= 0) {
    $dropTarget = undefined;
  }
  $: dimensions = $dragObject?.layout;
  $: hasChanges = checkChanges(savedGroups, currentGroups);
  $: if ($autoApplyFilter) {
    notifyUpdate();
  }

  function add(target: FieldSelectorTarget) {
    if (target.type === "formula") return;
    currentGroups.push({
      columnId: target.columnId,
      ascending: true,
      collapsedValues: [],
      pathInfo: target.pathInfo,
    });
    currentGroups = currentGroups;
    setTimeout(notifyUpdate);
  }

  function apply(e: Event) {
    e.preventDefault();
    if (!hasChanges) return;

    saveGroups(currentGroups);
    notifyCloseDropdown();
  }

  function clear(e: Event) {
    e.preventDefault();
    currentGroups.length = 0;
    notifyUpdate();
  }

  function checkChanges(a: DataGroup[], b: DataGroup[]) {
    if (a.length !== b.length) return true;

    for (let i = 0; i < a.length; i++) {
      const groupA = a[i];
      const groupB = b[i];

      if (
        groupA.columnId !== groupB.columnId ||
        groupA.ascending !== groupB.ascending ||
        groupA.caseSensitive !== groupB.caseSensitive ||
        !!groupA.disabled !== !!groupB.disabled ||
        !filterPathsMatch(groupA.pathInfo, groupB.pathInfo)
      ) {
        return true;
      }
    }
    return false;
  }

  function notifyUpdate() {
    if (!$autoApplyFilter || !checkChanges(savedGroups, currentGroups)) return;
    saveGroups(currentGroups);
    updateDropdown();
  }

  function removeAt(order: number) {
    currentGroups.splice(order, 1);
    clearCollapsedValues(currentGroups, order);
    currentGroups = currentGroups;
    notifyUpdate();
  }

  function getDropTargetOrdinal(target: DndDropTargetType) {
    if (!target?.nearest) return -1;
    return target.nearest.order + (target.nearest.onTop ? 0 : 1);
  }

  function getSavedGroups() {
    return table.dataSource.getGroups();
  }

  async function saveGroups(groups: DataGroup[]) {
    try {
      saving = true;

      if (await ensureAsync(table.dataSource.setGroups(groups))) {
        savedGroups = getSavedGroups();
      }
    } finally {
      saving = false;
    }
  }

  function updateAsDropTarget(e: DragEvent) {
    const { children } = groupsElement;
    const { clientY: pos } = e;

    if (children.length > 0) {
      let nearestAbove: HTMLElement | undefined;
      let nearestBelow: HTMLElement | undefined;

      for (const child of children) {
        if (
          !(child instanceof HTMLElement) ||
          !child.dataset.dropTargetOrder ||
          child.dataset.groupItemDragging === "true"
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

      let targetRule: DataGroup | undefined;
      if (target) {
        targetRule =
          currentGroups[parseInt(target.dataset.dropTargetOrder, 10)];
      }

      if (target && targetRule) {
        setAsDropTarget(e, target, targetRule);
        return;
      }
    }

    if (currentGroups[0] === $dragObject?.group) {
      $dropTarget = undefined;
    }
  }

  function setAsDropTarget(
    e: DragEvent,
    element: HTMLElement,
    group: DataGroup,
  ) {
    const rect = element.getBoundingClientRect();
    const middle = rect.top + (rect.bottom - rect.top) / 2;
    const onTop = e.clientY <= middle;

    const targetIndex = currentGroups.indexOf(group);
    const targetIndexNormalized = targetIndex + (onTop ? 0 : 1);
    const draggingIndex = currentGroups.indexOf($dragObject?.group);

    if (
      group == $dragObject?.group ||
      (targetIndex !== -1 &&
        draggingIndex !== -1 &&
        (targetIndexNormalized == draggingIndex ||
          targetIndexNormalized - 1 == draggingIndex))
    ) {
      $dropTarget = undefined;
    } else {
      $dropTarget = {
        nearest: {
          group,
          onTop,
          order: targetIndex,
        },
      };
    }
  }

  function onDragEnter(e: DragEvent) {
    if (e.dataTransfer.types.indexOf(MIME_TYPE_GROUP_ITEM) === -1) {
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

    let affectedMinIndex = currentGroups.indexOf(_dragObject.group);

    if (
      !_dragObject ||
      !_dropTarget ||
      !removeGroup(currentGroups, _dragObject.group)
    ) {
      return;
    }

    if (_dropTarget.nearest) {
      addGroup(
        currentGroups,
        _dropTarget.nearest.group,
        _dropTarget.nearest.onTop,
        _dragObject.group,
      );

      affectedMinIndex = Math.max(
        Math.min(affectedMinIndex, currentGroups.indexOf(_dragObject.group)),
      );
      clearCollapsedValues(currentGroups, affectedMinIndex);

      e.preventDefault();

      currentGroups = currentGroups;
      notifyUpdate();
    }
  }

  /**
   * Remove the collapsed values if they are affected by the reorder or removal
   * of a group.
   * @param groups
   * @param fromIndex
   */
  function clearCollapsedValues(groups: DataGroup[], fromIndex: number) {
    for (let i = fromIndex; i < groups.length; i++) {
      groups[i].collapsedValues = [];
    }
  }

  function addGroup(
    groups: DataGroup[],
    nearest: DataGroup,
    onTop: boolean,
    reordering: DataGroup,
  ) {
    const index = groups.indexOf(nearest);
    if (index === -1) return false;
    groups.splice(index + (onTop ? 0 : 1), 0, reordering);
    return true;
  }

  function removeGroup(groups: DataGroup[], group: DataGroup) {
    const index = groups.indexOf(group);
    if (index === -1) return false;

    groups.splice(index, 1);
    return true;
  }

  onMount(() => {
    if (!$tableInUse) {
      $tableInUse = table;
      return () => {
        $tableInUse = undefined;
      };
    }
  });
</script>

{#if hasGroups}
  <div
    class="dropdown"
    on:dragenter={onDragEnter}
    on:dragover={onDragOver}
    on:dragleave={onDragLeave}
    on:drop={onDrop}
  >
    <div class="flex flex-row items-center mx-5 mt-2.5 mb-0.5">
      <DropdownSectionTitle title="Group" spacing="mr-2" />
      {#if saving}
        <CircularSpinner size={15} />
      {/if}
    </div>
    <div bind:this={groupsElement} class="group-list-container">
      {#each currentGroups as group, i}
        {#if dropTargetOrdinal === i || ($dragObject?.group == group && !$dropTarget)}
          <DndTarget
            {dimensions}
            isDragTarget={$dragObject?.group == group && !$dropTarget}
          />
        {/if}

        <Group
          {table}
          {group}
          {hideColumnIds}
          order={i}
          on:updated={({ detail }) => {
            currentGroups[i] = detail.group;
            notifyUpdate();
          }}
          on:remove={() => {
            removeAt(i);
          }}
        />
      {/each}
      {#if dropTargetOrdinal === currentGroups.length}
        <DndTarget {dimensions} />
      {/if}
      <div class="flex flex-row mr-7.5 justify-stretch">
        <DropdownButton
          autoWidth
          class="flex-1 w-180px {currentGroups.length > 0 ? 'mt-1' : ''}"
          icon="sort-add"
          buttonType="action"
        >
          <svelte:fragment slot="value">Add Subgroup</svelte:fragment>
          <FieldSelectorDropdown
            slot="dropdown"
            {table}
            {hideColumnIds}
            hideCustomFormulaOption
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
        disabled={currentGroups.length <= 0}
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
{:else}
  <FieldSelectorDropdown
    {table}
    {hideColumnIds}
    title="Group By"
    keepMenuOpen
    hideCustomFormulaOption
    on:change={({ detail }) => {
      add(detail.target);
    }}
  />
{/if}

<style lang="postcss">
  .dropdown {
    @apply flex flex-col justify-stretch relative bg-white rounded overflow-y-hidden overflow-x-hidden text-[13px] min-w-500px h-full outline-none;
    box-shadow: 0px 5px 20px rgba(55, 84, 170, 0.16);

    .group-list-container {
      @apply flex flex-col flex-1 pt-1 px-5 pb-3 overflow-y-auto overflow-x-hidden items-start;
      row-gap: 4px;
    }

    .button-container {
      @apply flex flex-row px-5 pt-2 pb-3 text-11px flex-shrink-0;
    }
  }
</style>
