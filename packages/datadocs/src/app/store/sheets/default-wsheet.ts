import { PANE_GROUP_SPREADSHEET } from "src/layout/_dprctd/core/constants";
import { getId } from "../../../layout/_dprctd/core/utils";
import type { WorkspaceConfig } from "../../../layout/_dprctd/types";

export default function getDefaultWorksheet(): WorkspaceConfig {
  return {
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
                    groupType: PANE_GROUP_SPREADSHEET,
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
              ],
            },
          ],
        },
      ],
    },
  };
}
