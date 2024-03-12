<script lang="ts">
  import type {
    GridFilterCondition,
    GridFilterConjunction,
    GridFilterGroup,
    GridFilterTarget,
    TableDescriptor,
  } from "@datadocs/canvas-datagrid-ng";
  import Group from "../Group.svelte";
  import DropdownSectionTitle from "../../../../../../../toolbars/MainToolbar/dropdowns/common/DropdownSectionTitle.svelte";
  import {
    createEmptyConditionTargetForFilter,
    filterRulesMatch,
  } from "@datadocs/canvas-datagrid-ng/lib/data/data-source/filters/utils";
  import FieldSelectorDropdown from "./FieldSelectorDropdown.svelte";
  import {
    CLOSE_DROPDOWN_CONTEXT_NAME,
    UPDATE_DROPDOWN_STYLE_CONTEXT_NAME,
  } from "../../../../../../../common/dropdown";
  import {
    createEventDispatcher,
    getContext,
    onMount,
    setContext,
    tick,
  } from "svelte";
  import { getFilterAndSortContext } from "../../../../util";
  import Button from "../../../../../../../common/form/Button.svelte";
  import { ensureAsync } from "@datadocs/canvas-datagrid-ng/lib/data/data-source/await";
  import { writable } from "svelte/store";
  import {
    ADVANCED_FILTER_NOTIFY_AFTER_UPDATE,
    DND_DRAG_OBJECT_CONTEXT_NAME,
    DND_DROP_TARGET_CONTEXT_NAME,
    DND_HANDLE_DROP_CONTEXT_NAME,
  } from "./constant";
  import type {
    DndDropTargetType,
    DndDragObject,
    DndDropTarget,
    DndDragObjectType,
    NotifyAfterUpdate,
    FieldSelectorTarget,
  } from "./type";
  import AutoApplyButton from "../../Value/AutoApplyButton.svelte";
  import {
    autoApplyFilter,
    tableInUse,
  } from "../../../../../../../../app/store/writables";
  import {
    GRID_FILTER_CONDITION_TYPE_SET,
    GRID_FILTER_DEFAULT_CUSTOM_FORMULA,
  } from "@datadocs/canvas-datagrid-ng/lib/data/data-source/filters/constants";
  import CircularSpinner from "../../../../../../../common/spinner/CircularSpinner.svelte";

  const dragObject: DndDragObject = writable<DndDragObjectType>();
  const dropTarget: DndDropTarget = writable<DndDropTargetType>();

  setContext(DND_DRAG_OBJECT_CONTEXT_NAME, dragObject);
  setContext(DND_DROP_TARGET_CONTEXT_NAME, dropTarget);
  setContext(DND_HANDLE_DROP_CONTEXT_NAME, handleDrop);

  const updateDropdown: () => void = getContext(
    UPDATE_DROPDOWN_STYLE_CONTEXT_NAME,
  );
  const notifyCloseDropdown: () => void = getContext(
    CLOSE_DROPDOWN_CONTEXT_NAME,
  );
  const notifyAfterUpdate: NotifyAfterUpdate = getContext(
    ADVANCED_FILTER_NOTIFY_AFTER_UPDATE,
  );
  const dispatch = createEventDispatcher<{
    updated: { filterTarget: GridFilterTarget };
  }>();

  export let table: TableDescriptor;

  let dataSourceTarget = getDataSourceTarget();
  let currentTarget = structuredClone(dataSourceTarget);

  let saving = false;

  $: hasChanges = !filterRulesMatch(
    currentTarget.filter,
    dataSourceTarget.filter,
  );
  $: showFieldSelectionOnly =
    currentTarget.filter.rules.length < 1 && !hasChanges;

  $: if ($autoApplyFilter) {
    trySavingFilter();
  }

  const collapsedGroups: GridFilterGroup[] = [];

  function getDataSourceTarget(): GridFilterTarget {
    const savedFilter = table.dataSource.getFilters();
    if (savedFilter) {
      if (savedFilter.type === "simple") {
        const targets = Object.values(savedFilter.targets);
        if (targets.length === 0) {
          return createEmptyTarget();
        } else if (targets.length === 1) {
          return {
            filter: targets[0].filter,
          };
        } else {
          const target: GridFilterTarget = createEmptyTarget("and");

          for (const subtarget of targets) {
            const { rules } = subtarget.filter;
            if (rules.length === 0) continue;
            if (rules.length === 1) {
              target.filter.rules.push(rules[0]);
            } else {
              target.filter.rules.push(subtarget.filter);
            }
          }
          return target;
        }
      } else {
        return savedFilter.target;
      }
    }

    return createEmptyTarget();
  }

  function createEmptyTarget(
    conjunction: GridFilterConjunction = "or",
  ): GridFilterTarget {
    return {
      filter: {
        type: "group",
        conjunction,
        rules: [],
      },
    };
  }

  async function add(target: FieldSelectorTarget) {
    const { rules } = currentTarget.filter;

    if (target.type === "column") {
      const header = await ensureAsync(
        table.dataSource.getHeaderById(target.columnId),
      );
      const context = getFilterAndSortContext(table, header, {
        pathInfo: target.pathInfo,
      });
      const filter = context.availableFilters[0];

      if (filter.conditionType !== GRID_FILTER_CONDITION_TYPE_SET) {
        const condition: GridFilterCondition = {
          type: "condition",
          target: createEmptyConditionTargetForFilter(filter, header.id, {
            pathInfo: target.pathInfo,
          }),
        };

        rules.push(condition);
      }
    } else {
      const condition: GridFilterCondition = {
        type: "condition",
        target: createEmptyConditionTargetForFilter(
          GRID_FILTER_DEFAULT_CUSTOM_FORMULA,
          undefined,
        ),
      };

      rules.push(condition);
    }

    currentTarget = currentTarget;
    notifyUpdate();
    scheduleDropdownUpdate();
  }

  function handleDrop(e: DragEvent) {
    const _dragObject = $dragObject;
    const _dropTarget = $dropTarget;

    if (!_dragObject || !_dropTarget || !removeRule(_dragObject)) {
      return;
    }

    if (_dropTarget.nearest) {
      const { group: targetGroup, nearest } = _dropTarget;
      const index = targetGroup.rules.indexOf(nearest.rule);
      if (index !== -1) {
        targetGroup.rules.splice(
          index + (nearest.onTop ? 0 : 1),
          0,
          _dragObject.rule,
        );
      }
    } else {
      _dropTarget.group.rules.push(_dragObject.rule);
    }

    e.preventDefault();

    currentTarget = currentTarget;
    notifyUpdate();
    scheduleDropdownUpdate();
  }

  function removeRule(dragObject: DndDragObjectType): boolean {
    const index = dragObject.group.rules.indexOf(dragObject.rule);
    if (index === -1) return false;
    dragObject.group.rules.splice(index, 1);
    return true;
  }

  async function notifyUpdate() {
    if (
      $autoApplyFilter &&
      !filterRulesMatch(currentTarget.filter, dataSourceTarget.filter)
    ) {
      await saveFilter(currentTarget);
    }

    dispatch("updated", { filterTarget: currentTarget });
  }

  async function handleApplyButton(e: Event) {
    e.preventDefault();
    await trySavingFilter();
    notifyCloseDropdown();
  }

  async function trySavingFilter() {
    if (hasChanges) {
      await saveFilter(currentTarget);
    }
  }

  async function saveFilter(filters: GridFilterTarget) {
    try {
      saving = true;

      if (await ensureAsync(table.dataSource.setFilterNg(filters))) {
        notifyAfterUpdate?.();
        dataSourceTarget = getDataSourceTarget();
      }
    } finally {
      saving = false;
    }
  }

  async function scheduleDropdownUpdate() {
    await tick();
    updateDropdown();
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

{#if showFieldSelectionOnly}
  <FieldSelectorDropdown
    {table}
    selectorTarget={undefined}
    title="Advanced Filters"
    keepMenuOpen
    on:change={({ detail }) => {
      add(detail.target);
    }}
  />
{:else}
  <div class="dropdown">
    <div class="advanced-filter-container">
      <div class="flex flex-row mt-2.5 px-5 items-center">
        <DropdownSectionTitle title="Advanced Filters" spacing="mr-2" />
        {#if saving}
          <CircularSpinner size={15} />
        {/if}
      </div>

      <Group
        group={currentTarget.filter}
        {table}
        {collapsedGroups}
        on:updated={({ detail }) => {
          currentTarget.filter = detail.group;
          notifyUpdate();
        }}
      />
    </div>
    <div class="flex flex-row px-5 pt-2 mb-3 text-11px">
      <AutoApplyButton bind:checked={$autoApplyFilter} />
      <Button
        color="secondary"
        disabled={currentTarget.filter.rules.length <= 0}
        spacing="px-3 py-1.5"
        class="ml-auto mr-1.5 leading-normal {$autoApplyFilter
          ? 'invisible'
          : ''}"
        on:click={notifyCloseDropdown}
      >
        Cancel
      </Button>
      <Button
        color="primary-accent"
        disabled={!hasChanges}
        spacing="px-3 py-1.5"
        class="leading-normal {$autoApplyFilter ? 'invisible' : ''}"
        on:click={handleApplyButton}
      >
        Apply
      </Button>
    </div>
  </div>
{/if}

<style lang="postcss">
  .dropdown {
    @apply flex flex-col relative text-13px bg-white rounded h-[inherit] overflow-x-hidden;
    box-shadow: 0px 5px 20px rgba(55, 84, 170, 0.16);
  }

  .advanced-filter-container {
    @apply flex flex-col flex-1 min-h-0;
  }
</style>
