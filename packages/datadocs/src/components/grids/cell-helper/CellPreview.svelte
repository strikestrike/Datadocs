<script lang="ts">
  import type { GridPublicAPI } from "@datadocs/canvas-datagrid-ng/lib/types/grid";
  import type { CellPreviewData } from "@datadocs/canvas-datagrid-ng/lib/types/index";
  import { getGridStore } from "../../../app/store/grid/base";
  import type { DropdownTriggerRect } from "../../common/dropdown/type";
  import Dropdown from "../../common/dropdown/Dropdown.svelte";
  import FormulaPreviewContent from "./FormulaPreviewContent.svelte";

  export let showClosePreviewButton: boolean = false;
  export let triggerRect: DropdownTriggerRect = null;
  export let message: string = "";
  export let fontSize: number = 13;
  export let fontFamily: string = "Consolas BoldItalic, Arial, sans-serif";
  export let height: number = 22;
  export let marginBottom: number = 2;
  /**
   * Indicate show/hide cell preview according to event or not
   * In case Cell preview is show with formula bar, the formula
   * bar should take control when to show/hide it.
   */
  export let controlByEvent = true;

  let maxWidth: number;
  let hasCellBadge: boolean = false;
  const gridStore = getGridStore();
  let oldGrid: GridPublicAPI = null;

  function handleShowCellPreview(event: any) {
    try {
      const cellPreviewData: CellPreviewData = event.data;
      const rect = cellPreviewData.rect;
      triggerRect = {
        top: rect.y,
        bottom: rect.y + rect.height,
        left: rect.x,
        right: rect.x + rect.width,
      };
      message = cellPreviewData.message;
      fontFamily = cellPreviewData.fontFamily;
      hasCellBadge = cellPreviewData.hasCellBadge;
      fontSize = cellPreviewData.fontSize;
      height = cellPreviewData.height;
      marginBottom = cellPreviewData.marginBottom;
      maxWidth = window.innerWidth - triggerRect.left - 10;
    } catch (error) {
      console.error(error);
      handleHideCellPreview();
    }
  }

  function handleHideCellPreview() {
    message = "";
    triggerRect = null;
  }

  function onActiveGridChange() {
    if (oldGrid && controlByEvent) {
      oldGrid.removeEventListener("showcellpreview", handleShowCellPreview);
      oldGrid.removeEventListener("hidecellpreview", handleHideCellPreview);
    }

    if (grid && controlByEvent) {
      grid.addEventListener("showcellpreview", handleShowCellPreview);
      grid.addEventListener("hidecellpreview", handleHideCellPreview);
    }

    oldGrid = grid;
  }

  $: grid = $gridStore;
  $: grid, onActiveGridChange();
  $: if (triggerRect && !controlByEvent)
    maxWidth = window.innerWidth - triggerRect.left - 5;
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
{#if message && triggerRect}
  <Dropdown
    wrapperElement={null}
    {triggerRect}
    position="top"
    distanceToDropdown={marginBottom}
    closeOnMouseDownOutside={false}
    closeOnEscapeKey={false}
  >
    <div
      slot="content"
      class="dropdown relative flex flex-row items-center bg-white"
      class:has-cell-badge={hasCellBadge}
      style="font-size:{fontSize}px;height:{height}px;min-width: 20px;max-width:{maxWidth}px;"
      data-grideditorcompanion="true"
    >
      <FormulaPreviewContent
        {showClosePreviewButton}
        {fontFamily}
        {height}
        {fontSize}
        {message}
        {triggerRect}
      />
    </div>
  </Dropdown>
{/if}

<style lang="postcss">
  .dropdown {
    box-shadow: 0 1px 2px rgb(0 0 0 / 50%);
  }

  .dropdown.has-cell-badge {
    box-shadow: rgb(0 0 0 / 50%) 0px 0.1em 0.2em;
  }

  .dropdown::before {
    background-color: white;
    bottom: -4.5px;
    box-shadow: 2px 2px 2px rgb(0 0 0 / 20%);
    content: "";
    display: block;
    margin-left: 4px;
    height: 10px;
    position: absolute;
    transform: rotate(45deg);
    width: 10px;
  }

  .dropdown.has-cell-badge::before {
    display: none;
  }
</style>
