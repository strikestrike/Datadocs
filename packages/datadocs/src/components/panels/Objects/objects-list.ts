import { ObjectEnum } from "src/layout/enums/object";
import type { ObjectsList } from "src/layout/types/object";

export const objectsList: ObjectsList = [
  {
    name: "containers",
    label: "Containers",
    objects: [
      {
        type: ObjectEnum.CONTAINER,
        label: "Blank",
        icon: "object-container",
      },
      {
        type: ObjectEnum.CONTAINER_TILED,
        label: "Tiled",
        icon: "object-container-tiled",
      },
      {
        type: ObjectEnum.SPREADSHEET,
        label: "Spreadsheet",
        icon: "object-spreadsheet",
      },
    ],
  },
  {
    name: "objects",
    label: "Objects",
    objects: [
      {
        type: ObjectEnum.SHAPE,
        label: "Shape",
        icon: "object-chart",
      },
    ],
  },
];
