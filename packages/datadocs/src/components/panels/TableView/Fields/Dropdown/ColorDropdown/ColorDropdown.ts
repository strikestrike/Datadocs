import type {
  GridHeader,
  GridSort,
  GridSortTarget,
  GridSortTypePreset,
} from "@datadocs/canvas-datagrid-ng";
import type { ColorFilter } from "./types";

export function getSortFromColorFilter(
  header: GridHeader,
  filter: ColorFilter,
  sort: GridSort
): GridSortTypePreset {
  const on: GridSortTarget = {
    type: "color",
    code: filter.code,
    colorType: filter.type === "cell" ? "cell" : "text",
  };
  if (sort?.type === "preset") {
    sort.on = on;
  } else {
    sort = {
      type: "preset",
      columnId: header.id,
      dir: "asc",
      on,
    };
  }

  return sort;
}

export function getColorFilterFromSort(
  sort: GridSort
): ColorFilter | undefined {
  if (!sort || sort.type !== "preset" || sort.on.type !== "color") return;
  return {
    code: sort.on.code,
    type: sort.on.colorType === "cell" ? "cell" : "text",
  };
}
