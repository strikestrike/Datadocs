<script lang="ts">
  import type { ComponentType } from "svelte";
  import type {
    GridHeader,
    PixelBoundingRect,
    TableDescriptor,
    CellDetailTypeData,
  } from "@datadocs/canvas-datagrid-ng";
  import { tableFieldTooltipDataStore } from "../../app/store/writables";
  import tooltipAction from "../common/tooltip";
  import type { TooltipOptions } from "../common/tooltip";
  import TypeMenu from "./type-menu/TypeMenu.svelte";
  import { bind } from "../common/modal";

  let table: TableDescriptor = null;
  let header: GridHeader = null;
  let position: PixelBoundingRect = null;
  let tooltipData: CellDetailTypeData = null;
  let tooltipMenu: ComponentType;
  let tooltipOptions: TooltipOptions = {
    closeFromOutside: () => {},
    openFromOutside: () => {},
  };

  function isSameTooltip() {
    return (
      table === tableFieldTooltipData.table &&
      header === tableFieldTooltipData.header
    );
  }

  function updateTooltip() {
    if (isSameTooltip()) return;

    // console.log("debug here ====== updateTooltip === ");
    table = tableFieldTooltipData.table;
    header = tableFieldTooltipData.header;
    position = tableFieldTooltipData.buttonPos;
    tooltipData = tableFieldTooltipData.tooltipData;

    if (position && tooltipData) {
      tooltipMenu = bind(TypeMenu, { dataType: tooltipData });
      tooltipOptions.contentComponent = tooltipMenu;
      tooltipOptions.triggerRect = {
        top: position.y,
        bottom: position.y + position.height,
        left: position.x,
        right: position.x + position.width,
      };
      tooltipOptions.closeFromOutside(true);
      setTimeout(() => {
        tooltipOptions.openFromOutside();
      });
    } else {
      tooltipOptions.contentComponent = null;
      tooltipOptions.triggerRect = null;
      setTimeout(() => {
        tooltipOptions.closeFromOutside();
      });
    }

    tooltipOptions = tooltipOptions;
  }

  $: tableFieldTooltipData = $tableFieldTooltipDataStore;
  $: if (tableFieldTooltipData) {
    updateTooltip();
  }
</script>

<div class="hidden" use:tooltipAction={tooltipOptions} />
