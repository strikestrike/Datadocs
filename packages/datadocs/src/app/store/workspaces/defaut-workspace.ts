/**
 * @packageDocumentation
 * @module app/workspace-default
 */

import {
  PaneGroupType,
  PaneName,
  PaneSingleType,
  PaneType,
  Placement,
} from "src/layout/enums/pane";
import { PanelName } from "src/layout/enums/panel";
import type { WorkspaceConfig } from "src/layout/types/pane";

/**
 * Default workpace configuration. This configuration is applied on initial load
 * if there is no saved workspace available
 * @type {WorkspaceConfig}
 * @module app/workspace-default
 */
const panels: WorkspaceConfig = {
  root: {
    id: "9o6127p4bfk",
    type: PaneType.GROUP,
    placement: Placement.ROOT,
    props: { groupType: PaneGroupType.VERTICAL },
    size: "auto",
    children: [
      {
        id: "jx39hy5mscp",
        type: PaneType.GROUP,
        placement: Placement.CONTAINER,
        props: { groupType: PaneGroupType.HORIZONTAL },
        size: "auto",
        children: [
          {
            id: "2k31te19rqf",
            type: PaneType.GROUP,
            placement: Placement.CONTAINER_CENTER,
            size: "auto",
            props: {
              groupType: PaneGroupType.VERTICAL,
            },
            children: [
              {
                id: "yLXkysV4ac",
                type: PaneType.PANE,
                placement: Placement.CONTAINER_CENTER_MAIN,
                size: "auto",
                props: {},
                content: {
                  view: {
                    id: "yLXkysV4acxt",
                    name: PaneName.DASHBOARD,
                    label: "Dashboard",
                  },
                },
              },
            ],
          },
          {
            id: "bkd78pt4nlg",
            type: PaneType.GROUP,
            placement: Placement.CONTAINER_RIGHT,
            props: {
              groupType: PaneGroupType.TABS,
              activeId: "lw4wd23q7cs",
            },
            children: [
              {
                id: "23jxlap71pg",
                type: PaneType.PANE,
                placement: Placement.TAB,
                props: {
                  paneType: PaneSingleType.TABBED,
                },
                content: {
                  view: {
                    id: "lw4wd23q7cs",
                    name: PanelName.DATADOCS,
                    icon: "datadocs",
                    label: "Datadocs",
                  },
                },
              },
              {
                id: "8654if0qhy9",
                type: PaneType.PANE,
                placement: Placement.TAB,
                props: {
                  paneType: PaneSingleType.TABBED,
                },
                content: {
                  view: {
                    id: "kv12sc5fed",
                    name: "objects",
                    icon: "objects",
                    label: "Insert Objects",
                  },
                },
              },
              {
                id: "53jxlhp11pg",
                type: PaneType.PANE,
                placement: Placement.TAB,
                props: {
                  paneType: PaneSingleType.TABBED,
                },
                content: {
                  view: {
                    id: "lw4wd91q7cs",
                    name: PanelName.SOURCES,
                    icon: "sources",
                    label: "Sources",
                  },
                },
              },
              // {
              //   id: "7l2429bs6tu",
              //   type: PaneType.PANE,
              //   placement: Placement.TAB,
              //   props: {
              //     paneType: PaneSingleType.TABBED,
              //   },
              //   content: {
              //     view: {
              //       id: "7rfcxjqs7rq",
              //       name: "history",
              //       icon: "history",
              //       label: "History",
              //     },
              //   },
              // },
              // {
              //   id: "8l2419bs6za",
              //   type: PaneType.PANE,
              //   placement: Placement.TAB,
              //   props: {
              //     paneType: PaneSingleType.TABBED,
              //   },
              //   content: {
              //     view: {
              //       id: "7rfcxjqs7rq",
              //       name: "query-history",
              //       icon: "query-history",
              //       label: "Query History",
              //     },
              //   },
              // },
              // {
              //   id: "5sx08lza3jk",
              //   type: PaneType.PANE,
              //   placement: Placement.TAB,
              //   props: {
              //     paneType: PaneSingleType.TABBED,
              //   },
              //   content: {
              //     view: {
              //       id: "7rb51749u",
              //       name: "layers",
              //       icon: "layers",
              //       label: "Layers",
              //     },
              //   },
              // },
              {
                id: "p8353hpa2h",
                type: PaneType.PANE,
                placement: Placement.TAB,
                props: {
                  paneType: PaneSingleType.TABBED,
                },
                content: {
                  view: {
                    id: "7rb51749u",
                    name: PanelName.TABLE_VIEW,
                    icon: "table-view",
                    label: "Table View",
                  },
                },
              },
            ],
            size: "258px",
          },
        ],
      },
    ],
  },
};

export default panels;
