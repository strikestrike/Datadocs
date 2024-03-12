<script lang="ts">
  import type {
    GridHeader,
    GridJsonTypeMap,
    GridStructPathType,
    TableDescriptor,
  } from "@datadocs/canvas-datagrid-ng/lib/types";
  import { getContext, setContext } from "svelte";
  import type {
    KeyControlActionOptions,
    KeyControlConfig,
  } from "../../../../../common/key-control/listKeyControl";
  import { keyControlAction } from "../../../../../common/key-control/listKeyControl";
  import PathItem from "./PathItem.svelte";
  import DropdownButton from "../../../../../common/form/button/DropdownButton.svelte";
  import { SET_PATH_CONTEXT_NAME } from "./JsonPathSelector";
  import type { SetJsonPathFunction } from "./types";
  import ToggleButton from "../../../../../common/form/button/SortToggleButton.svelte";
  import { getDataTypeIcon } from "../../../../../common/icons/utils";
  import { CLEAR_FILTER_CONTEXT_NAME } from "../../constant";
  import type { ClearFilterFunction } from "../../type";

  setContext(SET_PATH_CONTEXT_NAME, onChoose as SetJsonPathFunction);

  const clearFilter = getContext(
    CLEAR_FILTER_CONTEXT_NAME
  ) as ClearFilterFunction;

  export let table: TableDescriptor;
  export let header: GridHeader;
  export let typeMap: GridJsonTypeMap;

  /**
   * The path to use for sort and filters.
   */
  export let structPath: string;
  export let structPathType: GridStructPathType;

  export { className as class };
  let className = "";

  let dropdown: HTMLElement;

  function onChoose(newPath: string | undefined) {
    table.dataSource.setStructFilterPath(header.id, newPath);
    structPath = newPath;
  }

  const configList: KeyControlConfig[] = [];
  let keyControlOptions: KeyControlActionOptions = {
    configList,
  };

  let currentIndex = 0;
  function getIndex() {
    return currentIndex++;
  }

  function setCastType(castType: GridStructPathType) {
    table.dataSource.setStructFilterPathType(header.id, castType);
    structPathType = castType;
    clearFilter();
  }
</script>

<div class="container">
  <DropdownButton
    class="flex-1 min-w-0"
    disabled={Object.keys(typeMap).length < 1}
    smaller
    autoWidth
  >
    <svelte:fragment slot="label">Path</svelte:fragment>
    <span class="text" slot="value" class:no-target={!structPath}
      >{structPath || "Root"}</span
    >
    <div
      bind:this={dropdown}
      use:keyControlAction={keyControlOptions}
      class="dropdown"
      slot="dropdown"
    >
      <PathItem
        path={structPath}
        key=""
        children={typeMap}
        level={0}
        keyControlActionOptions={keyControlOptions}
        scrollContainer={dropdown}
        {getIndex}
      />
    </div>
  </DropdownButton>
  <div class="button-cast-button-group">
    <div class="cast-text">Treat as</div>
    <ToggleButton
      smaller
      iconOnly
      icon={getDataTypeIcon("string")}
      activated={structPathType === "string"}
      on:click={(e) => {
        e.preventDefault();
        setCastType("string");
      }}
    />
    <ToggleButton
      smaller
      iconOnly
      icon={getDataTypeIcon("int")}
      activated={structPathType === "number"}
      on:click={(e) => {
        e.preventDefault();
        setCastType("number");
      }}
    />
    <ToggleButton
      smaller
      activated={structPathType === "raw"}
      on:click={(e) => {
        e.preventDefault();
        setCastType("raw");
      }}>Raw</ToggleButton
    >
  </div>
</div>

<style lang="postcss">
  .dropdown {
    @apply relative bg-white rounded p-1.5 h-[inherit] overflow-y-auto overflow-x-hidden min-w-[100px];
    box-shadow: 0px 5px 20px rgba(55, 84, 170, 0.16);
  }

  .container {
    @apply flex flex-row items-center;
    column-gap: 6px;
  }

  .no-target {
    @apply text-dark-50;
  }

  .button-cast-button-group {
    @apply flex flex-row;
    column-gap: 6px;

    .cast-text {
      @apply flex flex-row items-center text-[11px];
    }
  }
</style>
