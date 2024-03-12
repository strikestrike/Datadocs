<script lang="ts">
  import { setContext, tick } from "svelte";
  import type { SvelteComponent } from "svelte";
  import type { NormalCellDescriptor } from "@datadocs/canvas-datagrid-ng/lib/types";
  import { cellLayoverDataStore } from "../../../app/store/writables";
  import type { DropdownTriggerRect } from "../../common/dropdown/type";
  import Dropdown from "../../common/dropdown/Dropdown.svelte";
  import CellStructMenu from "./cell-struct-menu/CellStructMenu.svelte";
  import CellStructArrayMenu from "./cell-struct-array-menu/CellStructArrayMenu.svelte";
  // import UnimplementedMenu from "./UnimplementedMenu.svelte";
  import {
    getCellDataType,
    hasHyperlinkRuns,
    shouldShowJsonLayover,
  } from "./util";
  import CellJsonMenu from "./cell-json-menu/CellJsonMenu.svelte";
  import CellHyperlinkMenu from "./cell-hyperlink-menu/CellHyperlinkMenu.svelte";
  import { CLOSE_LAYOVER_MENU_CONTEXT } from "./constant";
  import { isHyperlinkDataFormat } from "@datadocs/canvas-datagrid-ng/lib/data/formatters/util";
  import HyperlinkDataFormatLayover from "./cell-hyperlink-menu/HyperlinkDataFormatLayover.svelte";
  import CellSummaryMenu from "./cell-summary-menu/CellSummaryMenu.svelte";

  const LAYOVER_MENU_TIMEOUT = 500;
  let wrapperElement: HTMLElement;
  let triggerRect: DropdownTriggerRect = null;
  let hasLayoverMenu = false;
  let show: boolean = false;

  let closeLayoverMenuTimeOut = null;
  let openLayoverMenuTimeOut = null;
  let layoverMenuData: NormalCellDescriptor;
  let mouseOverLayover = false;

  let layoverComponent: typeof SvelteComponent;

  function hasTypeLayoverMenu(cell: NormalCellDescriptor) {
    if (cell.subtargets.aggregationOptsButton?.expanded) {
      return false;
    }
    if (cell.tableContext?.isTotalRow) {
      return true;
    }
    const dataType: string = getCellDataType(cell);
    const dataFormat = cell.dataFormat;
    return (
      ((dataType === "struct" || dataType === "struct[]") &&
        dataFormat?.type === "struct" &&
        dataFormat?.format === "chip") ||
      (dataType === "json" && shouldShowJsonLayover(cell))
    );
  }

  function showLayoverMenu(cell: NormalCellDescriptor) {
    return hasTypeLayoverMenu(cell) || hasHyperlinkRuns(cell);
  }

  function getLayoverMenu(cell: NormalCellDescriptor): typeof SvelteComponent {
    if (!showLayoverMenu(cell)) return null;
    
    if (hasTypeLayoverMenu(cell)) {
      if (cell.tableContext?.isTotalRow && cell.tableContext?.summaryContext) {
        return CellSummaryMenu;
      }
      const dataType: string = getCellDataType(cell);
      switch (dataType) {
        case "struct": {
          return CellStructMenu;
        }
        case "struct[]": {
          return CellStructArrayMenu;
        }
        case "json": {
          return CellJsonMenu;
        }
        default: {
          break;
        }
      }
    } else if (hasHyperlinkRuns(cell)) {
      if (isHyperlinkDataFormat(cell.dataFormat)) {
        return HyperlinkDataFormatLayover;
      } else {
        return CellHyperlinkMenu;
      }
    }
    
    return null;
  }

  async function updateLayoverMenu() {
    if (
      (cellLayoverData?.cell?.isNormal ||
        (cellLayoverData?.cell?.tableContext?.isTotalRow &&
          cellLayoverData.cell.tableContext.summaryContext)) &&
      cellLayoverData?.cellPos
    ) {
      const { cell, cellPos } = cellLayoverData;
      hasLayoverMenu = showLayoverMenu(cell);

      // if not struct data, just close the layover menu
      if (!hasLayoverMenu) {
        return closeLayoverMenu();
      }

      triggerRect = {
        left: cellPos.x,
        top: cellPos.y,
        right: cellPos.x + cellPos.width,
        bottom: cellPos.y + cellPos.height,
      };

      if (!show) {
        layoverMenuData = cell;
        openLayoverMenu();
      } else if (isDifferentCell(cell, layoverMenuData)) {
        layoverMenuData = cell;
        closeLayoverMenu(true);
        await tick();
        openLayoverMenu(true);
      } else {
        layoverMenuData = cell;
        clearCloseTimeout();
      }
    } else {
      closeLayoverMenu();
    }
  }

  function openLayoverMenu(immediate?: boolean) {
    clearCloseTimeout();
    if (show) return;

    // open layover immediatly
    if (immediate) return onOpen();

    if (openLayoverMenuTimeOut) return;
    openLayoverMenuTimeOut = setTimeout(() => {
      // closeLayoverMenu(true);
      onOpen();
    }, LAYOVER_MENU_TIMEOUT);
  }

  function closeLayoverMenu(immediate: boolean = false) {
    clearOpenTimeout();
    if (!show) return;

    // remove layover menu immediately
    if (immediate) return onClose();

    if (closeLayoverMenuTimeOut) return;
    closeLayoverMenuTimeOut = setTimeout(() => {
      onClose();
    }, LAYOVER_MENU_TIMEOUT);
  }

  function onDropdownMouseOver(value: boolean) {
    mouseOverLayover = value;
    if (!mouseOverLayover) return;
    // Not close the menu when it is hovered
    clearCloseTimeout();
  }

  function clearCloseTimeout() {
    if (closeLayoverMenuTimeOut) {
      clearTimeout(closeLayoverMenuTimeOut);
      closeLayoverMenuTimeOut = null;
    }
  }

  function clearOpenTimeout() {
    if (openLayoverMenuTimeOut) {
      clearTimeout(openLayoverMenuTimeOut);
      openLayoverMenuTimeOut = null;
    }
  }

  function onOpen() {
    layoverComponent = getLayoverMenu(layoverMenuData);
    show = true;
    clearOpenTimeout();
  }

  function onClose() {
    layoverComponent = null;
    show = false;
    mouseOverLayover = false;
    cellLayoverDataStore.set({});
    clearCloseTimeout();
  }

  function isDifferentCell(
    cell1: NormalCellDescriptor,
    cell2: NormalCellDescriptor
  ) {
    return (
      cell1?.rowIndex !== cell2?.rowIndex ||
      cell1?.columnIndex !== cell2?.columnIndex
    );
  }

  $: cellLayoverData = $cellLayoverDataStore;
  $: if (cellLayoverData && !mouseOverLayover) {
    updateLayoverMenu();
  }

  setContext(CLOSE_LAYOVER_MENU_CONTEXT, onClose);
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<div
  bind:this={wrapperElement}
  class="cell-data-layover-menu fixed w-0 h-0 z-999999"
>
  {#if show && layoverMenuData && layoverComponent}
    <Dropdown
      {wrapperElement}
      {triggerRect}
      position="top-bottom"
      distanceToDropdown={0}
    >
      <div
        on:mouseover={() => onDropdownMouseOver(true)}
        on:mouseleave={() => onDropdownMouseOver(false)}
        slot="content"
        class="layover-menu h-full max-h-full overflow-hidden"
      >
        <!-- <CellStructMenu data={layoverMenuData} /> -->
        <svelte:component this={layoverComponent} data={layoverMenuData} />
      </div>
    </Dropdown>
  {/if}
</div>

<style lang="postcss">
  .layover-menu {
    @apply bg-white rounded;
    box-shadow: 0px 5px 20px rgba(55, 84, 170, 0.16);
  }
</style>
