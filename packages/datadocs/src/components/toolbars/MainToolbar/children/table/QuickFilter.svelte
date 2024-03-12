<script lang="ts">
  import type {
    GridFilterGroup,
    TableEvent,
  } from "@datadocs/canvas-datagrid-ng";
  import { disposableReadable } from "../../../../../app/store/readable-disposable";
  import { uniqueReadable } from "../../../../../app/store/readable-unique";
  import { selectedTable } from "../../../../../app/store/writables";
  import AdvancedSortModal from "../../../../panels/TableView/Sort/AdvancedSortModal.svelte";
  import ToolbarWideButton from "../../buttons/ToolbarWideButton.svelte";
  import { onMount } from "svelte";
  import AdvancedFiltersModal from "../../../../panels/TableView/Fields/Dropdown/Filter/Conditional/Advanced/AdvancedFiltersModal.svelte";
  import GroupModal from "../../../../panels/TableView/Group/GroupModal.svelte";

  const tableStore = disposableReadable(uniqueReadable(selectedTable), {
    noNullable: true,
    onUpdate(table) {
      table.addEventListener(onTableEvent);
    },
    onDispose(table) {
      table.removeEventListener(onTableEvent);
    },
  });

  $: table = $tableStore;

  $: table, countAll();

  let filterCount = 0;
  let sortCount = 0;
  let groupCount = 0;

  function onTableEvent(e: TableEvent) {
    if (e.type === "datasource") {
      switch (e.dataSourceEvent.name) {
        case "sort":
          countSorts();
          break;
        case "filter":
          countFilters();
          break;
        case "dataGroup":
          countGroups();
      }
    }
  }

  async function countSorts() {
    if (!table) return;

    sortCount = 0;

    const sorts = table.dataSource.getSorters();
    sorts.forEach((sort) => {
      if (sort.disabled) return;
      sortCount++;
    });
  }

  async function countFilters() {
    if (!table) return;

    filterCount = 0;

    const filters = table.dataSource.getFilters();
    const countGroup = (group: GridFilterGroup) => {
      for (const subrule of group.rules) {
        if (subrule.disabled) continue;
        if (subrule.type === "group") {
          countGroup(subrule);
        } else if (subrule.type === "condition") {
          filterCount++;
        }
      }
    };

    if (filters?.type === "simple") {
      for (const filter of Object.values(filters.targets)) {
        countGroup(filter.filter);
      }
    } else if (filters) {
      countGroup(filters.target.filter);
    }
  }

  function countGroups() {
    if (!table) return;

    groupCount = 0;

    const groups = table.dataSource.getGroups();
    groups.forEach((group) => {
      if (group.disabled) return;
      groupCount++;
    });
  }

  function countAll() {
    countSorts();
    countFilters();
    countGroups();
  }

  onMount(() => {
    countAll();
  });
</script>

{#if table}
  <div class="quick-filter-options-container">
    <ToolbarWideButton
      icon="sort"
      distanceToDropdown={6}
      dropdownComponent={AdvancedSortModal}
      counter={sortCount}
      resize={sortCount > 0 ? "horizontal" : "none"}
      dropdownProps={{ table }}
      freeFormHeight
      freeFormWidth>Sort</ToolbarWideButton
    >
    <ToolbarWideButton
      icon="filter"
      distanceToDropdown={6}
      dropdownComponent={AdvancedFiltersModal}
      resize={filterCount > 0 ? "both" : "none"}
      counter={filterCount}
      dropdownProps={{ table }}
      freeFormHeight
      freeFormWidth>Filter</ToolbarWideButton
    >
    <ToolbarWideButton
      icon="group"
      distanceToDropdown={6}
      counter={groupCount}
      dropdownComponent={GroupModal}
      dropdownProps={{ table }}
      freeFormHeight
      freeFormWidth>Group</ToolbarWideButton
    >
  </div>
{/if}

<style lang="postcss">
  .quick-filter-options-container {
    @apply flex flex-row items-center;
    column-gap: 4px;
  }
</style>
