import type {
  Field,
  GridFilterList,
  GridSortLabels,
  GridStructPathType,
} from "@datadocs/canvas-datagrid-ng";

export type ClearFilterFunction = () => any;

export type FilterAndSorterContext = {
  fieldToFilter: Field;
  availableFilters: GridFilterList;
  geoSortType: "string" | "proximity" | undefined;
  isBool: boolean;
  isGeo: boolean;
  isJson: boolean;
  isStruct: boolean;
  needsStructFieldSelection: boolean;
  sortLabels: GridSortLabels | undefined;
  structPath: string | undefined;
  structPathType: GridStructPathType | undefined;
};
