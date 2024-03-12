import type { TableAggregationOptsEvent } from "@datadocs/canvas-datagrid-ng";
import type { DropdownTriggerRect } from "../../../common/dropdown/type";
import { CONTEXT_MENU_CONTAINER_ID } from "../../../common/context-menu";
import OptionsDropdown from "./Aggregration/OptionsDropdown.svelte";

export default function showAggregationOptionsDropdown(
  e: TableAggregationOptsEvent
) {
  const {
    cellPos: pos,
    table,
    header,
    cell,
    currentFn,
    availableFns,
    onClose,
    closeHandle,
  } = e;
  const triggerRect: DropdownTriggerRect = {
    left: pos.x,
    top: pos.y,
    right: pos.x + pos.width,
    bottom: pos.y + pos.height,
  };

  const container = document.getElementById(CONTEXT_MENU_CONTAINER_ID);
  const component = new OptionsDropdown({
    props: {
      triggerRect,
      table,
      header,
      cell,
      currentFn,
      availableFns,
      onClose() {
        component.$destroy();
        onClose();
      },
    },
    target: container ?? document.body,
  });

  closeHandle.onClose = () => component.$destroy();
}
