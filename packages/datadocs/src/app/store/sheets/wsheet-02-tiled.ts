import { getId } from "../../../layout/_dprctd/core/utils";
import type { WorkspaceConfig } from "../../../layout/_dprctd/types";

const sheet: WorkspaceConfig = {
  root: {
    id: getId(),
    type: "group",
    placement: "root",
    props: {
      isRoot: true,
      groupType: "hGroup",
    },
    children: [
      {
        id: getId(),
        type: "group",
        placement: "container",
        props: {
          groupType: "vGroup",
          isClosable: false,
          layerIndex: 0,
        },
        children: [
          {
            id: getId(),
            type: "group",
            placement: "container:center",
            size: "auto",
            props: {
              hasAutosize: true,
              groupType: "hGroup",
              minWidth: 400,
              minHeight: 300,
              isClosable: false,
              layerIndex: 0,
            },
            children: [
              {
                id: getId(),
                type: "group",
                placement: "container:center:main",
                size: "auto",
                props: {
                  hasAutosize: true,
                  noBorder: true,
                  isClosable: false,
                  layerIndex: 0,
                  groupType: "tiledGroup",
                },
                children: [
                  {
                    id: getId(),
                    type: "pane",
                    placement: "tile",
                    props: {
                      paneType: "tiledPane",
                    },
                    content: {
                      view: {
                        id: getId(),
                        name: "spreadsheet",
                        label: "Grid 1",
                        icon: "status-bar-spreadsheet",
                        config: {},
                      },
                    },
                  },
                  {
                    id: getId(),
                    type: "pane",
                    placement: "tile",
                    props: {
                      paneType: "tiledPane",
                    },
                    content: {
                      view: {
                        id: getId(),
                        name: "spreadsheet",
                        label: "Grid 2",
                        icon: "status-bar-spreadsheet",
                        config: {},
                      },
                    },
                  },
                  {
                    id: getId(),
                    type: "pane",
                    placement: "tile",
                    props: {
                      paneType: "tiledPane",
                    },
                    content: {
                      view: {
                        id: getId(),
                        name: "image",
                        label: "Image 1",
                        icon: "image",
                        config: {},
                      },
                    },
                  },
                  {
                    id: getId(),
                    type: "pane",
                    placement: "tile",
                    props: {
                      paneType: "tiledPane",
                    },
                    content: {
                      view: {
                        id: getId(),
                        name: "graph",
                        label: "Graph 1",
                        icon: "graph",
                        config: {},
                      },
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
};

export default sheet;
