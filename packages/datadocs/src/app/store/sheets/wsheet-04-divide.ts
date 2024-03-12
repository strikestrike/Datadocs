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
                  groupType: "tabsGroup",
                  activeChild: 0,
                },
                children: [
                  {
                    id: getId(),
                    type: "pane",
                    placement: "container:center:main:inner",
                    size: "auto",
                    props: {
                      hasAutosize: true,
                      noBorder: true,
                      isClosable: false,
                      layerIndex: 0,
                      paneType: "tabbedPane",
                    },
                    content: {
                      view: {
                        id: "grid1111", //getId(),
                        name: "spreadsheet",
                        label: "Grid 1",
                        icon: "status-bar-spreadsheet",
                        config: {},
                      },
                    },
                  },
                  {
                    id: getId(),
                    type: "group",
                    placement: "container:center:main:inner",
                    size: "auto",
                    props: {
                      hasAutosize: true,
                      noBorder: true,
                      isClosable: false,
                      layerIndex: 0,
                      groupType: "tiledGroup",
                    },
                    content: {
                      view: {
                        id: getId(),
                        name: "container1",
                        icon: "container",
                        label: "Tiled Container",
                      },
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
                            label: "Image 2",
                            icon: "image",
                            config: {},
                          },
                        },
                      },
                    ],
                  },
                  {
                    id: getId(),
                    type: "group",
                    placement: "container:center:main:inner",
                    size: "auto",
                    props: {
                      hasAutosize: true,
                      noBorder: true,
                      isClosable: false,
                      layerIndex: 0,
                      groupType: "fixedGroup",
                    },
                    content: {
                      view: {
                        id: getId(),
                        name: "container2",
                        icon: "container",
                        label: "Fixed Group",
                      },
                    },
                    children: [
                      {
                        id: getId(),
                        type: "pane",
                        placement: "fixed",
                        props: {
                          paneType: "fixedPane",
                        },
                        content: {
                          view: {
                            id: getId(),
                            name: "spreadsheet",
                            label: "Grid 1",
                            icon: "status-bar-spreadsheet",
                            config: {
                              transform: {
                                x: 10,
                                y: 30,
                              },
                            },
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
                            config: {
                              transform: {
                                x: 230,
                                y: 300,
                              },
                            },
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
                            config: {
                              transform: {
                                x: 450,
                                y: 160,
                              },
                            },
                          },
                        },
                      },
                    ],
                  },
                ],
              },
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
                  groupType: "tabsGroup",
                  activeChild: 0,
                },
                children: [
                  {
                    id: getId(),
                    type: "pane",
                    placement: "container:center:main:inner",
                    size: "auto",
                    props: {
                      hasAutosize: true,
                      noBorder: true,
                      isClosable: false,
                      layerIndex: 0,
                      paneType: "tabbedPane",
                    },
                    content: {
                      view: {
                        id: "grid2222", //getId(),
                        name: "spreadsheet",
                        label: "Grid 1",
                        icon: "status-bar-spreadsheet",
                        config: {},
                      },
                    },
                  },
                  {
                    id: getId(),
                    type: "group",
                    placement: "container:center:main:inner",
                    size: "auto",
                    props: {
                      hasAutosize: true,
                      noBorder: true,
                      isClosable: false,
                      layerIndex: 0,
                      groupType: "tiledGroup",
                    },
                    content: {
                      view: {
                        id: getId(),
                        name: "container1",
                        icon: "container",
                        label: "Tiled Container",
                      },
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
                            label: "Image 2",
                            icon: "image",
                            config: {},
                          },
                        },
                      },
                    ],
                  },
                  {
                    id: getId(),
                    type: "group",
                    placement: "container:center:main:inner",
                    size: "auto",
                    props: {
                      hasAutosize: true,
                      noBorder: true,
                      isClosable: false,
                      layerIndex: 0,
                      groupType: "fixedGroup",
                    },
                    content: {
                      view: {
                        id: getId(),
                        name: "container2",
                        icon: "container",
                        label: "Fixed Group",
                      },
                    },
                    children: [
                      {
                        id: getId(),
                        type: "pane",
                        placement: "fixed",
                        props: {
                          paneType: "fixedPane",
                        },
                        content: {
                          view: {
                            id: getId(),
                            name: "spreadsheet",
                            label: "Grid 1",
                            icon: "status-bar-spreadsheet",
                            config: {
                              transform: {
                                x: 10,
                                y: 30,
                              },
                            },
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
                            config: {
                              transform: {
                                x: 230,
                                y: 300,
                              },
                            },
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
                            config: {
                              transform: {
                                x: 450,
                                y: 160,
                              },
                            },
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
    ],
  },
};

export default sheet;
