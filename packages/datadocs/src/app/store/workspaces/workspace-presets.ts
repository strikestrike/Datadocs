/**
 * @packageDocumentation
 * @module app/workspace-sample
 */

import type { WorkspaceConfig } from "../../../layout/_dprctd/types";
import type { WorkspaceItem } from "../types";
import defaultWorkSpaceData from "./defaut-workspace";

/**
 * Workspace preset
 * @type {WorkspaceConfig}
 */
const workspace_2: WorkspaceConfig = {
  root: {
    id: "9o6127p4bfk",
    type: "group",
    placement: "root",
    props: {
      groupType: "vGroup",
      isFixed: true,
    },
    children: [
      {
        id: "jx39hy5mscp",
        type: "group",
        placement: "container",
        props: {
          groupType: "hGroup",
        },
        children: [
          {
            id: "k36aatvm9l",
            type: "group",
            size: 258.2,
            placement: "container:left",
            props: {
              isClosable: true,
              isClosed: true,
              activeChild: 0,
              groupType: "tabsGroup",
            },
            children: [
              {
                id: "5sx08lza3jk",
                type: "pane",
                placement: "tab",
                props: {
                  paneType: "tabbedPane",
                },
                content: {
                  view: {
                    id: "advxfmpwzga",
                    name: "query-history",
                    icon: "query-history",
                    label: "Query History",
                  },
                },
              },
            ],
          },
          {
            id: "2k31te19rqf",
            type: "group",
            placement: "container:center",
            size: 1348.296875,
            props: {
              hasAutosize: true,
              groupType: "vGroup",
              minWidth: 400,
              minHeight: 300,
            },
            children: [
              {
                id: "yLXkysV4ac",
                type: "pane",
                placement: "container:center:main",
                size: 849,
                props: {
                  dropAllowed: {},
                  hasAutosize: true,
                  isFixed: true,
                  noBorder: true,
                  minWidth: 400,
                  minHeight: 330,
                },
                content: {
                  view: {
                    id: "yLXkysV4acxt",
                    name: "dashboard",
                    label: "Dashboard",
                  },
                },
              },
            ],
          },
          {
            id: "8z1rst0dy9",
            type: "group",
            size: 300,
            placement: "container:right",
            props: {
              isClosable: true,
              isClosed: true,
              activeChild: 0,
              groupType: "tabsGroup",
            },
            children: [
              {
                id: "53jxlhp11pg",
                type: "pane",
                placement: "tab",
                props: {
                  paneType: "tabbedPane",
                },
                content: {
                  view: {
                    id: "7rb51749u",
                    name: "layers",
                    icon: "layers",
                    label: "Layers",
                  },
                },
              },
            ],
          },
        ],
      },
    ],
  },
};

// const workspace_3 = {
//   root: {
//     id: "9o6127p4bfk",
//     isRoot: true,
//     type: "group",
//     isVGroup: true,
//     isFixed: true,
//     placement: "root",
//     settings: {},
//     children: [
//       {
//         id: "jx39hy5mscp",
//         type: "group",
//         props: { isHGroup: true, },
//         placement: "container",
//         settings: {},
//         children: [
//           {
//             id: "k36aatvm9l",
//             type: "pane",
//             size: 258.2,
//             placement: "container:left",
//             props: {
//               isClosable: true,
//               isClosed: false,
//               noHBorder: true,
//             },
//             settings: {
//               active: 0,
//               tabs: [
//                 { id: "advxfmpwzga", name: "query-history", icon: "query-history", label: "Query History", },
//                 { id: "20ez527uz9p", name: "table-view", icon: "table-view", label: "Table View", },
//               ],
//             },
//           },
//           {
//             id: "2k31te19rqf",
//             type: "group",
//             size: "auto",
//             placement: "container:center",
//             props: {
//               isVGroup: true,
//               minWidth: 400,
//               minHeight: 300
//             },
//             children: [
//               {
//                 id: "yLXkysV4ac",
//                 type: "pane",
//                 size: "auto",
//                 props: {
//                   dropAllowed: {},
//                   isFixed: true,
//                   noBorder: true,
//                   minWidth: 400,
//                   minHeight: 300
//                 },
//                 placement: "container:center:main",
//                 settings: { view: { name: "dashboard" } },
//               }
//             ],
//           },
//           {
//             id: "8z1rst0dy9",
//             type: "pane",
//             size: 300,
//             placement: "container:right",
//             props: {
//               isClosable: true,
//               isClosed: true,
//               noHBorder: true,
//             },
//             settings: {
//               active: 0,
//               tabs: [
//                 { id: "lw4wd91q7cs", name: "sources", icon: "sources", label: "Sources" },
//               ],
//             },
//           }
//         ],
//       },
//     ],
//   },
// };

/**
 * Workspace configuration for mobile screen
 * @type {WorkspaceConfig}
 */
const mobileWorkspaceData: WorkspaceConfig = {
  root: {
    id: "mobile:workspace:root",
    type: "group",
    placement: "root",
    children: [
      {
        id: "mobile:workspace:center",
        type: "pane",
        placement: "container:center",
        content: {
          view: {
            id: "yLXkysV4acxt",
            name: "dashboard",
            label: "Dashboard",
          },
        },
      },
      {
        id: "mobile:workspace:bottom:panel",
        type: "pane",
        placement: "container:bottom",
        children: [
          {
            id: "8654if0qhy9",
            type: "pane",
            placement: "tab",
            props: {
              paneType: "tabbedPane",
            },
            content: {
              view: {
                id: "kv12sc5fed",
                name: "table-view",
                icon: "table-view",
                label: "Table View",
              },
            },
          },
          {
            id: "53jxlhp11pg",
            type: "pane",
            placement: "tab",
            props: {
              paneType: "tabbedPane",
            },
            content: {
              view: {
                id: "lw4wd91q7cs",
                name: "sources",
                icon: "sources",
                label: "Sources",
              },
            },
          },
          {
            id: "8l2419bs6za",
            type: "pane",
            placement: "tab",
            props: {
              paneType: "tabbedPane",
            },
            content: {
              view: {
                id: "7rfcxjqs7rq",
                name: "query-history",
                icon: "query-history",
                label: "Query History",
              },
            },
          },
        ],
      },
    ],
  },
};

/**
 * Workspace preset for mobile screen
 * @type {WorkspaceConfig}
 */
export const mobileWorkspace: WorkspaceItem = {
  id: "default_mobile_workspace",
  name: "Mobile workspace",
  type: "default",
  data: structuredClone(mobileWorkspaceData),
  initData: structuredClone(mobileWorkspaceData),
  isActive: true,
};

/**
 * Workspace presets for desktop
 * @type {WorkspaceConfig}
 */
export const defaultWorkspaceSamples: WorkspaceItem[] = [
  {
    id: "df_p4bfk5mscp",
    name: "Default",
    type: "default",
    data: structuredClone(defaultWorkSpaceData),
    initData: structuredClone(defaultWorkSpaceData),
    isActive: false,
  },
  {
    id: "df_5mscpp4bfk",
    name: "Dashboard Designer",
    type: "default",
    data: structuredClone(workspace_2),
    initData: structuredClone(workspace_2),
    isActive: false,
  },
  // {
  //   id: "workspace_sample_3",
  //   name: "Essential",
  //   type: "default",
  //   data: JSON.stringify(workspace_3),
  //   initData: JSON.stringify(workspace_3),
  //   isActive: false,
  // },
];

/**
 * @hidden
 */
export const customWorkspaceSamples: WorkspaceItem[] = [
  // {
  //   id: "workspace_sample_3",
  //   name: "This is a name for example, will be removed later.",
  //   type: "custom",
  //   data: JSON.stringify(workspace_2),
  //   initData: JSON.stringify(workspace_2),
  //   isActive: false,
  // },
  // {
  //   id: "workspace_sample_4",
  //   name: "Custom 2",
  //   type: "custom",
  //   data: JSON.stringify(defaultWorkSpaceData),
  //   initData: JSON.stringify(defaultWorkSpaceData),
  //   isActive: false,
  // },
];
