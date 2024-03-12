import TableSettings from "./TableSettings.svelte";
import QuickFilter from "./QuickFilter.svelte";
import ShowTableView from "./ShowTableView.svelte";

import type { ToolbarSectionSubtoolbar } from "../type";
import { getGridStore } from "../../../../../app/store/grid/base";
import { get } from "svelte/store";

export const tableViewShowComponentName = "toolbar_table_view_show";

export const tableSubtoolbar: ToolbarSectionSubtoolbar = {
  type: "subtoolbar",
  name: "table-subtoolbar",
  hidden: true,
  alwaysFloating: {
    getInitialPosition(subtoolbarRect: DOMRect) {
      const grid = get(getGridStore());
      if (!grid) return { x: 10, y: 10 };

      const rect = grid.canvas.getBoundingClientRect();
      return {
        x: rect.left + (rect.width / 2 - subtoolbarRect.width / 2),
        y: rect.top - subtoolbarRect.height / 2,
      };
    },
  },
  sections: [
    {
      type: "component",
      name: "toolbar_table_settings",
      width: 204,
      component: TableSettings,
    },
    {
      type: "component",
      name: "toolbar_table_quick_filter",
      width: 231,
      component: QuickFilter,
    },
    {
      type: "component",
      name: tableViewShowComponentName,
      width: 30,
      visibility: "when-undocked",
      component: ShowTableView,
    },
  ],
};
