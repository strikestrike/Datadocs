import type { DropdownTriggerRect } from "../../../../common/dropdown/type";
import type {
  TableFieldDropdownEvent,
  GridPublicAPI,
  TableDescriptor,
  GridHeader,
} from "@datadocs/canvas-datagrid-ng";
import type { SvelteComponent } from "svelte";
import { CONTEXT_MENU_CONTAINER_ID } from "../../../../common/context-menu";
import FieldDropdown from "../../../../panels/TableView/Fields/FieldDropdown.svelte";
import { getGridStore } from "../../../../../app/store/grid/base";

let activeGrid: GridPublicAPI;

const componentHolder = {
  component: undefined as SvelteComponent,
  onClose: function () {} as Function,
  grid: null as GridPublicAPI,
  table: null as TableDescriptor,
  header: null as GridHeader,
};

const closeFieldDropdown = () => {
  if (typeof componentHolder.onClose === "function") {
    componentHolder.onClose();
  }
  componentHolder?.component?.$destroy();
  componentHolder.component = undefined;
};

export default function showTableFieldDropdown(e: TableFieldDropdownEvent) {
  const isSameButton =
    componentHolder.table === e.table && componentHolder.header === e.header;

  // Click on the same button again will close it
  if (componentHolder?.component) {
    if (isSameButton) {
      if (typeof e.onClose === "function") e.onClose();
      return closeFieldDropdown();
    } else {
      closeFieldDropdown();
    }
  }

  const { buttonPos: pos, table, header } = e;
  const triggerRect: DropdownTriggerRect = {
    left: pos.x,
    top: pos.y,
    right: pos.x + pos.width,
    bottom: pos.y + pos.height,
  };

  const container = document.getElementById(CONTEXT_MENU_CONTAINER_ID);

  componentHolder.component = new FieldDropdown({
    props: {
      grid: e.grid,
      triggerRect,
      onClose: closeFieldDropdown,
      table,
      header: header,
    },
    target: container ?? document.body,
  });
  componentHolder.onClose = e.onClose;
  componentHolder.grid = activeGrid;
  componentHolder.table = e.table;
  componentHolder.header = e.header;
  e.onOpen?.();
}

getGridStore().subscribe((grid) => {
  activeGrid = grid;

  // Field dropdown should be closed in case active grid changes
  if (componentHolder.grid !== activeGrid) closeFieldDropdown();
});
