<script lang="ts">
  import { getContext } from "svelte";
  import { UPDATE_DROPDOWN_STYLE_CONTEXT_NAME } from "../../../common/dropdown";
  import type { NormalCellDescriptor } from "@datadocs/canvas-datagrid-ng";
  import AllStruct from "./AllStruct.svelte";
  import CellStructMenu from "../cell-struct-menu/CellStructMenu.svelte";
  import Pagination from "./Pagination.svelte";

  export let data: NormalCellDescriptor;

  const updateDropdownStyle: () => void = getContext(
    UPDATE_DROPDOWN_STYLE_CONTEXT_NAME
  );
  const chipsCount = data.chipsCount;
  let showAllStruct = false;
  let chipIndex = 0;

  function onStructElementSelect(event) {
    showAllStruct = false;
    chipIndex = event.detail.index;
    setTimeout(updateDropdownStyle);
  }

  function onStructIndexChange(event) {
    const newStructIndex = event.detail.pageIndex;

    if (chipIndex === newStructIndex) {
      return;
    }

    chipIndex = newStructIndex;
    setTimeout(updateDropdownStyle);
  }

  function goBackAllStructMenu() {
    showAllStruct = true;
    setTimeout(updateDropdownStyle);
  }
</script>

{#if showAllStruct}
  <AllStruct on:select={onStructElementSelect} {data} {chipIndex} />
{:else}
  {#key chipIndex}
    <div class="h-full max-h-full">
      <div
        class="px-2 pt-2 pb-0 h-[30px] flex flex-row items-center justify-between"
      >
        <button
          on:click={goBackAllStructMenu}
          class="flex flex-row items-center gap-1"
        >
          <div>
            <svg
              width="7"
              height="11"
              viewBox="0 0 7 11"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6 1.5L2 5.5L6 9.5"
                stroke="#A7B0B5"
                stroke-width="1.5"
              />
            </svg>
          </div>

          <span class="text-10px uppercase font-medium text-dark-50">
            All Struct
          </span>
        </button>

        <Pagination
          on:change={onStructIndexChange}
          pageCount={chipsCount}
          pageIndex={chipIndex}
        />
      </div>

      <div style="height: calc(100% - 30px);max-height: calc(100% - 30px)">
        <CellStructMenu {data} {chipIndex} isChildMenu={true} />
      </div>
    </div>
  {/key}
{/if}
