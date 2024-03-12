<script lang="ts">
  import type {
    GridFilterCondition,
    GridFilterConjunction,
    GridFilterGroup,
    GridFilterRule,
    GridHeader,
    TableDescriptor,
  } from "@datadocs/canvas-datagrid-ng";
  import Condition from "./Condition.svelte";
  import type { TabOption } from "../../../../../../common/form/TabButton";
  import TabButton from "../../../../../../common/form/TabButton.svelte";
  import {
    createEmptyConditionTargetForFilter,
    isFilterConditionValid,
  } from "@datadocs/canvas-datagrid-ng/lib/data/data-source/filters/utils";
  import { createEventDispatcher, getContext } from "svelte";
  import Icon from "../../../../../../common/icons/Icon.svelte";
  import {
    MENU_DATA_ITEM_TYPE_ELEMENT,
    type MenuItemType,
  } from "../../../../../../common/menu";
  import DropdownWrapper from "../../../../../../common/dropdown/DropdownWrapper.svelte";
  import Menu from "../../../../../../common/menu/Menu.svelte";
  import { getFilterAndSortContext } from "../../../util";
  import AdvancedCondition from "./Advanced/AdvancedCondition.svelte";
  import {
    DND_DRAG_OBJECT_CONTEXT_NAME,
    DND_DROP_TARGET_CONTEXT_NAME,
    DND_HANDLE_DROP_CONTEXT_NAME,
    MIME_TYPE_FILTER_GROUP_REORDER,
  } from "./Advanced/constant";
  import type {
    DndDragObject,
    DndDropTarget,
    DndDropTargetType,
    DndHandleDrop,
    DragContext,
    FieldSelectorTarget,
  } from "./Advanced/type";
  import { isAcceptableDragEvent } from "./Advanced/util";
  import { writable } from "svelte/store";
  import DndTarget from "./Advanced/DndTarget.svelte";
  import {
    GRID_FILTER_CONDITION_NAME_CUSTOM_FORMULA,
    GRID_FILTER_CONDITION_TYPE_FORMULA,
    GRID_FILTER_CONDITION_TYPE_SET,
    GRID_FILTER_SIMPLE_RULE_LIMIT,
  } from "@datadocs/canvas-datagrid-ng/lib/data/data-source/filters/constants";
  import AdvancedFiltersModal from "./Advanced/AdvancedFiltersModal.svelte";
  import DropdownSectionTitle from "../../../../../../toolbars/MainToolbar/dropdowns/common/DropdownSectionTitle.svelte";
  import DropdownButton from "../../../../../../common/form/button/DropdownButton.svelte";
  import FieldSelectorDropdown from "./Advanced/FieldSelectorDropdown.svelte";
  import tooltipAction from "../../../../../../common/tooltip";

  const dragObject =
    getContext<DndDragObject>(DND_DRAG_OBJECT_CONTEXT_NAME) ?? writable();
  const dropTarget =
    getContext<DndDropTarget>(DND_DROP_TARGET_CONTEXT_NAME) ?? writable();
  const handleDrop = getContext<DndHandleDrop>(DND_HANDLE_DROP_CONTEXT_NAME);

  const dispatch = createEventDispatcher<{
    updated: { group: GridFilterGroup | undefined };
    remove: any;
  }>();

  const tabOptions: (TabOption & { value: GridFilterConjunction })[] = [
    { title: "Or", value: "or" },
    { title: "And", value: "and" },
  ];

  const dragTargetDimensions = { w: 0, h: 0 };

  export let table: TableDescriptor;
  export let targetHeader: GridHeader | undefined = undefined;

  export let parent: GridFilterGroup | undefined = undefined;
  export let group: GridFilterGroup;
  export let level = 0;
  export let order = 0;

  export let collapsedGroups: GridFilterGroup[] = [];

  let rules = group.rules ?? [];
  let conjunction = group.conjunction ?? "or";
  let showAddDropdown = false;
  let showAdvancedFilterModal = false;

  $: updateWithGroup(group);
  $: conditions = getConditions(rules);

  let rulesElement: HTMLElement;
  let dragElement: HTMLElement;
  let dragContext: DragContext | undefined;
  let dropTargetReferenceCount = 0;

  $: dragging = !!dragContext && !dragContext.initializing;
  $: $dragObject = dragging
    ? { group: parent, rule: group, layout: getLayoutBounds() }
    : undefined;
  $: top = dragging
    ? dragContext.current.y - dragContext.offset.y + "px"
    : "auto";
  $: left = dragging
    ? dragContext.current.x - dragContext.offset.x + "px"
    : "auto";
  $: isDropTarget = $dropTarget?.group == group;
  $: dropTargetOrdinal = getDropTargetOrdinal($dropTarget);
  $: hasDragObject = !!$dragObject;
  $: dimensions = $dragObject?.layout;

  $: ruleCount =
    rules.length -
    ($dragObject?.group == group && $dropTarget ? 1 : 0) +
    ($dropTarget?.group == group ? 1 : 0);

  $: if (dropTargetReferenceCount <= 0 && level === 0) {
    $dropTarget = undefined;
  }

  $: context = isAdvancedFilterView
    ? undefined
    : getFilterAndSortContext(table, targetHeader);

  $: isAdvancedFilterView = !targetHeader;
  $: isSubgroup = level > 0;
  $: numberOfConditions = isLastConditionValid(conditions)
    ? Math.min(
        conditions.length + 1,
        context?.isGeo ? 1 : GRID_FILTER_SIMPLE_RULE_LIMIT
      )
    : Math.max(conditions.length, 1);
  $: collapsed = collapsedGroups.indexOf(group) !== -1;
  $: containsGroups =
    rules.findIndex(
      (rule) =>
        rule.type == "group" && ($dragObject?.rule != rule || !$dropTarget)
    ) !== -1;

  const subgroupMenuData: MenuItemType[] = [
    {
      type: MENU_DATA_ITEM_TYPE_ELEMENT,
      state: "enabled",
      label: "Rule",
      action: () => {
        addCondition();
        showAddDropdown = false;
      },
    },
    {
      type: MENU_DATA_ITEM_TYPE_ELEMENT,
      state: "enabled",
      label: "Group",
      action: () => {
        addGroup();
        showAddDropdown = false;
      },
    },
  ];

  const conjunctionMenuData: MenuItemType[] = [
    {
      type: MENU_DATA_ITEM_TYPE_ELEMENT,
      state: "enabled",
      label: "OR",
      action: () => {
        setConjunction("or");
      },
    },
    {
      type: MENU_DATA_ITEM_TYPE_ELEMENT,
      state: "enabled",
      label: "AND",
      action: () => {
        setConjunction("and");
      },
    },
  ];

  function updateWithChanges() {
    ensureGroupExists();

    group.conjunction = conjunction;
    group.rules = rules;

    dispatch("updated", { group });
  }

  function updateWithGroup(group: GridFilterGroup) {
    conjunction = group.conjunction;
    rules = group.rules;
  }

  function getConditions(rules: GridFilterRule[]) {
    const conditions: GridFilterCondition[] = [];
    for (const rule of rules) {
      if (rule.type === "condition") conditions.push(rule);
    }
    return conditions;
  }

  function addGroup() {
    const group: GridFilterGroup = {
      type: "group",
      conjunction: "or",
      rules: [],
    };

    rules.push(group);
    updateWithChanges();
  }

  function addCondition(target?: FieldSelectorTarget) {
    if (target && target.type === "formula") {
      const condition: GridFilterCondition = {
        type: "condition",
        target: {
          conditionType: GRID_FILTER_CONDITION_TYPE_FORMULA,
          conditionName: GRID_FILTER_CONDITION_NAME_CUSTOM_FORMULA,
          formula: "",
        },
      };

      rules.push(condition);
      updateWithChanges();
    } else {
      const header =
        target && target.type === "column"
          ? table.dataSource.getHeaderById(target.columnId)
          : table.dataSource.getHeader(0);
      const context = getFilterAndSortContext(table, header);
      const item = context.availableFilters[0];

      if (item.conditionType !== GRID_FILTER_CONDITION_TYPE_SET) {
        const condition: GridFilterCondition = {
          type: "condition",
          target: createEmptyConditionTargetForFilter(item, header.id, {
            pathInfo: target?.type === "column" && target.pathInfo,
          }),
        };

        rules.push(condition);
        updateWithChanges();
      }
    }
  }

  function ensureGroupExists() {
    if (group) return;
    group = {
      type: "group",
      conjunction: "or",
      rules: [],
    };
  }

  function removeRuleAt(index: number) {
    rules.splice(index, 1);
    updateWithChanges();
  }

  function setConjunction(value: string) {
    if (value !== "and" && value !== "or") return;
    conjunction = value;
    updateWithChanges();
  }

  function toggleCollapsed() {
    const index = collapsedGroups.indexOf(group);
    if (index === -1) {
      collapsedGroups.push(group);
    } else {
      collapsedGroups.splice(index, 1);
    }
    collapsedGroups = collapsedGroups;
  }

  function toggleDisabled() {
    group.disabled = !group.disabled;
    updateWithChanges();
  }

  function isLastConditionValid(conditions: GridFilterRule[]) {
    const lastItem = conditions[conditions.length - 1];
    if (!lastItem || lastItem.type == "group") return false;
    return lastItem && isFilterConditionValid(lastItem);
  }

  function onDragEnter(e: DragEvent) {
    if (!isAcceptableDragEvent(e) || $dragObject?.rule == group) {
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
    if (e.defaultPrevented) return;
    handleDrop(e);
  }

  function onDragStart(e: DragEvent) {
    e.dataTransfer.dropEffect = "move";
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData(MIME_TYPE_FILTER_GROUP_REORDER, "STUB");

    const rect = dragElement.getBoundingClientRect();

    dragContext = {
      offset: {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      },
      current: {
        x: e.clientX,
        y: e.clientY,
      },
      initializing: true,
    };

    dragTargetDimensions.w = rect.width;
    dragTargetDimensions.h = rect.height;
  }

  function onDrag(e: DragEvent) {
    if (!dragContext) return;
    dragContext.initializing = false;
    e.preventDefault();
  }

  function onDragOverWindow(e: DragEvent) {
    if (!dragContext) return;
    dragContext.current = {
      x: e.clientX,
      y: e.clientY,
    };
  }

  function onDragEnd(e: DragEvent) {
    if (!dragContext) return;
    dragContext = undefined;
    e.preventDefault();
  }

  function updateAsDropTarget(e: DragEvent) {
    const { children } = rulesElement;
    const { clientY: pos } = e;

    if (rules.length === 0) {
      $dropTarget = {
        group,
      };
    } else if ($dragObject?.group == group && rules.length === 1) {
      // Do not allow the group to be a drop target if it contains only one rule
      // and it is currently being dragged.
      $dropTarget = undefined;
    } else if (children.length > 0) {
      let nearestAbove: HTMLElement | undefined;
      let nearestBelow: HTMLElement | undefined;

      for (const child of children) {
        if (
          !(child instanceof HTMLElement) ||
          !child.dataset.dropTargetOrder ||
          child.dataset.filterRuleDragging === "true"
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
          0
        );
        const diffBottom = Math.max(
          nearestBelow.getBoundingClientRect().top - pos,
          0
        );

        target = diffTop < diffBottom ? nearestAbove : nearestBelow;
      } else {
        target = nearestAbove || nearestBelow;
      }

      let targetRule: GridFilterRule | undefined;
      if (target) {
        targetRule = group.rules[parseInt(target.dataset.dropTargetOrder, 10)];
      }

      if (target && targetRule) {
        setAsDropTarget(e, target, targetRule);
        return;
      }
    }
  }

  function setAsDropTarget(
    e: DragEvent,
    element: HTMLElement,
    rule: GridFilterRule
  ) {
    const rect = element.getBoundingClientRect();
    const middle = rect.top + (rect.bottom - rect.top) / 2;
    const onTop = e.clientY <= middle;

    const targetIndex = group.rules.indexOf(rule);
    const targetIndexNormalized = targetIndex + (onTop ? 0 : 1);
    const draggingIndex = group.rules.indexOf($dragObject?.rule);

    if (
      rule == $dragObject?.rule ||
      (targetIndex !== -1 &&
        draggingIndex !== -1 &&
        (targetIndexNormalized == draggingIndex ||
          targetIndexNormalized - 1 == draggingIndex))
    ) {
      $dropTarget = undefined;
    } else {
      $dropTarget = {
        nearest: {
          rule,
          onTop,
          order: targetIndex,
        },
        group,
      };
    }
  }

  function getDropTargetOrdinal(target: DndDropTargetType) {
    if (!target || target.group != group || !target.nearest) return -1;
    return target.nearest.order + (target.nearest.onTop ? 0 : 1);
  }

  function getLayoutBounds() {
    const rect = dragElement.getBoundingClientRect();
    return {
      width: rect.width,
      height: rect.height,
    };
  }
</script>

<svelte:window on:dragover={onDragOverWindow} />

{#if isAdvancedFilterView}
  <div
    bind:this={dragElement}
    class="advanced-view level-{level}"
    class:collapsed
    class:dragging
    class:disabled={group.disabled}
    style={dragging ? `width: ${dragTargetDimensions.w}px` : ""}
    style:top
    style:left
    on:dragenter={onDragEnter}
    on:dragover={onDragOver}
    on:dragleave={onDragLeave}
    on:drop={onDrop}
    data-drop-target-order={order}
    data-filter-rule-dragging={dragging}
  >
    {#if isSubgroup}
      <div
        class="flex flex-row items-center"
        class:mb-1={(ruleCount > 0 || isDropTarget) && !collapsed}
      >
        <DropdownSectionTitle title="Group Filter" />
        <div class="subgroup-toolbar ml-auto">
          <button
            on:click={(e) => {
              toggleCollapsed();
              e.preventDefault();
            }}
            use:tooltipAction={{
              content: collapsed ? "Expand Group" : "Collapse Group",
              disabled: hasDragObject,
            }}
          >
            <Icon
              icon={collapsed ? "filter-group-expand" : "filter-group-collapse"}
              size="14px"
            />
          </button>

          <DropdownWrapper bind:show={showAddDropdown} data={subgroupMenuData}>
            <button
              slot="button"
              on:click={() => {
                if (level >= 2) {
                  addCondition();
                } else {
                  showAddDropdown = !showAddDropdown;
                }
              }}
              use:tooltipAction={{
                content: "Add...",
                disabled: hasDragObject,
              }}
            >
              <Icon icon="filter-add-advanced" size="14px" />
            </button>
            <Menu slot="content" data={subgroupMenuData} />
          </DropdownWrapper>
          <button
            on:click={(e) => {
              toggleDisabled();
              e.preventDefault();
            }}
            use:tooltipAction={{
              content: group.disabled ? "Enable Group" : "Disable Group",
              disabled: hasDragObject,
            }}
          >
            <Icon
              icon={group.disabled
                ? "filter-state-enable"
                : "filter-state-disable"}
              size="14px"
            />
          </button>
          <button
            on:click={(e) => {
              dispatch("remove");
              e.preventDefault();
            }}
            use:tooltipAction={{
              content: "Delete Group",
              disabled: hasDragObject,
            }}
          >
            <Icon icon="filter-delete" size="14px" />
          </button>
          <button
            class="cursor-move"
            draggable="true"
            on:dragstart={onDragStart}
            on:drag={onDrag}
            on:dragend={onDragEnd}
            use:tooltipAction={{
              content: "Reorder Group",
              disabled: hasDragObject,
            }}
          >
            <Icon icon="drag" size="12px" />
          </button>
        </div>
      </div>
    {/if}
    <div class="flex flex-row min-h-0">
      {#if ruleCount > 1 && !collapsed}
        <div
          class="condition-container"
          class:centered={ruleCount > 2 || containsGroups}
        >
          <DropdownButton
            class="mr-2 min-w-72px z-100"
            buttonClass="bg-white"
            data={conjunctionMenuData}
            allowMinimalWidth
          >
            <span slot="value" class="uppercase font-normal">{conjunction}</span
            >
          </DropdownButton>
          <div class="path">&nbsp;</div>
        </div>
      {/if}
      {#if !isSubgroup || !collapsed}
        <div bind:this={rulesElement} class="rules-container">
          {#each rules as rule, i}
            {#if dropTargetOrdinal === i || ($dragObject?.rule == rule && !$dropTarget)}
              <DndTarget
                isDragTarget={$dragObject?.rule == rule}
                verticalMargin={$dragObject?.rule.type === "group" ? 4 : 0}
                {dimensions}
              />
            {/if}
            {#if rule.type === "group"}
              <svelte:self
                parent={group}
                group={rule}
                {table}
                {targetHeader}
                {collapsedGroups}
                level={level + 1}
                order={i}
                on:updated={({ detail }) => {
                  rules[i] = detail.group;
                  updateWithChanges();
                }}
                on:remove={() => {
                  removeRuleAt(i);
                }}
              />
            {:else if rule.type === "condition"}
              <AdvancedCondition
                {table}
                {targetHeader}
                {level}
                {group}
                order={i}
                currentCondition={rule}
                on:changed={({ detail }) => {
                  rules[i] = detail.condition;
                  updateWithChanges();
                }}
                on:remove={() => {
                  removeRuleAt(i);
                }}
              />
            {/if}
          {/each}
          {#if dropTargetOrdinal === rules.length || (isDropTarget && rules.length === 0)}
            <DndTarget
              verticalMargin={$dragObject?.rule.type === "group" ? 4 : 0}
              {dimensions}
            />
          {/if}
        </div>
      {:else}
        <button on:click={toggleCollapsed} class="outline-none">
          <Icon icon="filter-group-collapsed" width="40px" height="14px" />
        </button>
      {/if}
    </div>
    {#if level === 0}
      <div class="main-group-subtoolbar">
        <DropdownButton
          autoWidth
          class="mr-1"
          icon="filter-add-advanced"
          buttonType="action"
        >
          <svelte:fragment slot="value">Rule</svelte:fragment>
          <FieldSelectorDropdown
            slot="dropdown"
            {table}
            on:change={({ detail }) => addCondition(detail.target)}
          />
        </DropdownButton>
        <DropdownButton
          autoWidth
          icon="filter-add-advanced"
          buttonType="action"
          onClick={() => {
            addGroup();
            return true;
          }}
        >
          <svelte:fragment slot="value">Group</svelte:fragment>
        </DropdownButton>
      </div>
    {/if}
  </div>
{:else}
  {#each { length: numberOfConditions } as _, i}
    {#if i > 0}
      <div class="conjunction-input-container">
        <div class="tab-button-container">
          <div class="tab-button-line" />
          {#if i === 1}
            <TabButton
              options={tabOptions}
              value={conjunction}
              on:changed={({ detail }) => {
                setConjunction(detail.value);
              }}
            />
            <div class="tab-button-line" />
          {/if}
        </div>
        {#if !isAdvancedFilterView && level === 0}
          <DropdownWrapper
            bind:show={showAdvancedFilterModal}
            class="flex items-center"
            freeFormHeight
          >
            <button
              slot="button"
              class="advanced-filter-button"
              on:click={(e) => {
                e.preventDefault();
                showAdvancedFilterModal = !showAdvancedFilterModal;
              }}>Advanced Filter</button
            >
            <AdvancedFiltersModal slot="content" {table} />
          </DropdownWrapper>
        {/if}
      </div>
    {/if}
    <div>
      <Condition
        currentCondition={conditions[i]}
        on:updated={({ detail }) => {
          conditions[i] = detail.condition;
          rules = conditions;
          updateWithChanges();
        }}
        on:clear={() => {
          conditions.splice(i, 1);
          rules = conditions;
          updateWithChanges();
        }}
        {table}
        {targetHeader}
        emptyValuesWellCondition={group.rules.length === 1 &&
          level === 0 &&
          i === 0 &&
          conditions[0]?.type === "condition" &&
          conditions[0].meta?.sourceValuesWell &&
          !isFilterConditionValid(conditions[0])}
      />
    </div>
  {/each}
{/if}

<style lang="postcss">
  .advanced-view {
    @apply flex flex-col self-stretch min-w-670px px-5 py-2;

    .main-group-subtoolbar {
      @apply flex flex-row pt-2.5 pb-3 items-center;
    }

    .condition-container {
      @apply flex relative items-end;

      &.centered {
        @apply justify-center items-center;
      }

      .path {
        @apply absolute border border-solid border-light-200 rounded-tl rounded-bl border-r-0 top-16px left-[47%] right-0 bottom-16px border;
      }
    }

    .rules-container {
      @apply rounded flex flex-col flex-1 overflow-y-auto overflow-x-hidden items-start;
      row-gap: 4px;
    }

    &.disabled {
      @apply opacity-[0.5];
    }

    &.level-0 {
      @apply min-h-0 pr-0 flex-1;

      .rules-container {
        @apply pr-5;
      }

      .main-group-subtoolbar {
        @apply pr-5 mt-auto;
      }
    }

    &.level-1 {
      .rules-container {
        @apply overflow-y-hidden;
      }
    }

    &.dragging {
      @apply fixed rounded-lg z-2000 pointer-events-none;
      box-shadow: 0px 5px 20px 0px rgba(55, 84, 170, 0.16);
    }

    &:not(.level-0) {
      @apply rounded my-1;
    }

    &.level-1 {
      @apply bg-light-50;
    }

    &.level-2 {
      @apply bg-light-100;
    }

    .empty-group-notice {
      @apply text-dark-100 w-600px;
    }

    .subgroup-toolbar {
      @apply flex flex-row;

      button {
        @apply text-dark-50 p-1.5 rounded outline-none;

        &:hover,
        &:focus-visible {
          @apply bg-white text-dark-200;
          box-shadow: 1px 2px 6px 0px rgba(55, 84, 170, 0.16);
        }
      }
    }
  }

  .conjunction-input-container {
    @apply flex flex-row;
    justify-content: space-between;

    .tab-button-container {
      @apply flex flex-col;
      align-items: flex-start;

      .tab-button-line {
        @apply border-0 border-left border-light-200 border-l-1px h-8px ml-2.5;
      }
    }

    .advanced-filter-button {
      @apply text-primary-indigo-blue bg-transparent my-0 ml-auto border-none p-0 text-11px uppercase font-semibold;
    }
  }
</style>
