<script lang="ts">
  import type { GridPublicAPI } from "@datadocs/canvas-datagrid-ng/lib/types/grid";
  import type { CellErrorData } from "@datadocs/canvas-datagrid-ng/lib/types/index";
  import { each } from "svelte/internal";
  import { getGridStore } from "../../../app/store/grid/base";

  import Dropdown from "../../common/dropdown/Dropdown.svelte";
  import type { DropdownTriggerRect } from "../../common/dropdown/type";

  const gridStore = getGridStore();
  let oldGrid: GridPublicAPI = null;
  let triggerRect: DropdownTriggerRect = null;
  let error: string | object = "";

  function handleShowCellError(event: any) {
    try {
      const cellErrorData: CellErrorData = event.data;
      error = cellErrorData.message;
      if (Array.isArray(error) && error.length === 1) {
        error = error[0];
      }
      const { x, y, width, height } = cellErrorData.rect;
      triggerRect = {
        top: y + 1,
        bottom: y + height - 1,
        left: x + 1,
        right: x + width - 1,
      };
    } catch (error) {
      console.log(error);
      handleHideCellError();
    }
  }

  function handleHideCellError() {
    error = "";
    triggerRect = null;
  }

  function onActiveGridChange() {
    if (oldGrid) {
      oldGrid.removeEventListener("showcellerror", handleShowCellError);
      oldGrid.removeEventListener("hidecellerror", handleHideCellError);
    }

    if (grid) {
      grid.addEventListener("showcellerror", handleShowCellError);
      grid.addEventListener("hidecellerror", handleHideCellError);
    }

    oldGrid = grid;
  }

  $: grid = $gridStore;
  $: grid, onActiveGridChange();
</script>

{#if !!error && !!triggerRect}
  <Dropdown
    wrapperElement={null}
    {triggerRect}
    position="left-right"
    distanceToDropdown={0}
  >
    <div slot="content" class="dropdown">
      <div class="flex flex-row rounded overflow-hidden">
        <div class="w-1.5 bg-tertiary-error shrink-0" />
        <div class="flex-grow min-h-[100px] py-3 pl-3 pr-6">
          <div class="text-13px font-semibold text-tertiary-error mb-1">
            {#if typeof error === "string"}
              Error
            {:else}
              Errors
            {/if}
          </div>
          <div class="text-13px text-dark-300">
            {#if typeof error === "string"}
              {@html error}
            {:else if Array.isArray(error)}
              <ul class="error-list">
                {#each error as line}
                  <li>{@html line}</li>
                {/each}
              </ul>
            {/if}
          </div>
        </div>
      </div>
    </div>
  </Dropdown>
{/if}

<style lang="postcss">
  .dropdown {
    @apply rounded bg-white;
    box-shadow: 0px 5px 20px rgba(55, 84, 170, 0.16);
    width: 200px;
  }
  .error-list {
    list-style: circle;
    padding-left: 5%;
  }
  .error-list li:not(:last-child) {
    margin-bottom: 4%;
  }
</style>
