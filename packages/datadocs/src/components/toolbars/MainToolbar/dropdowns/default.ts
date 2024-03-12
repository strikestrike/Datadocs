import { GRID_DEFAULT_FONT_FAMILY } from "../../../../app/store/store-toolbar";

export type FontFamilyDataFont = {
  type: "font";
  value: FontFamilyValueType;
  label: string;
};

export type FontFamilyDataList = {
  type: "list";
  value: FontFamilyValueType;
  label: string;
  fonts: FontFamilyDataItem[];
};

export type FontFamilyValueType = (typeof FONT_FAMILY_VALUES)[number];

export type FontFamilyDataItem = FontFamilyDataFont | FontFamilyDataList;

export const ZOOM_DROPDOWN_VALUES: number[] = [50, 75, 100, 125, 150, 175, 200];
export const FONT_SIZE_DROPDOWN_VALUES: number[] = [
  6, 7, 8, 9, 10, 11, 12, 14, 18, 24, 36,
];

export const FONT_FAMILY_VALUES = [
  "Amatic SC",
  "Arial",
  GRID_DEFAULT_FONT_FAMILY,
  "Caveat",
  "Caveat Brush",
  "Comfortaa",
  "Comic Sans MS",
  "Courier New",
  "EB Garamond",
  "Franklin Gothic",
  "Georgia",
  "Gill Sans",
  "Helvetica Neue",
  "Impact",
  "Lobster",
  "Lobster Two",
  "Lora",
  "Merriweather",
  "Montserrat",
  "Nunito",
  "Oswald",
  "Pacifico",
  "Playfair Display",
  "Poppins",
  "Roboto",
  "Roboto Condensed",
  "Roboto Mono",
  "Roboto Slab",
  "Spectral",
  "Times New Roman",
  "Trebuchet MS",
  "Verdana",
] as const;

export const HORIZONTAL_ALIGN_VALUES = ["left", "center", "right"] as const;
export type HorizontalAlignValue = (typeof HORIZONTAL_ALIGN_VALUES)[number];

export function getHAlignIcon(v: HorizontalAlignValue): string {
  switch (v) {
    case "center":
      return "align-center";
    case "right":
      return "align-right";
    default:
      return "align-left";
  }
}

export const VERTICAL_ALIGN_VALUES = ["top", "middle", "bottom"] as const;
export type VerticalAlignValue = (typeof VERTICAL_ALIGN_VALUES)[number];
export function getVAlignIcon(v: VerticalAlignValue): string {
  switch (v) {
    case "top":
      return "align-top";
    case "middle":
      return "align-middle";
    default:
      return "align-bottom";
  }
}

export const TEXT_WRAPPING_VALUES = ["overflow", "wrap", "clip"] as const;
export type TextWrappingValue = (typeof TEXT_WRAPPING_VALUES)[number];
export function getTextWrappingIcon(v: TextWrappingValue): string {
  switch (v) {
    case "overflow":
      return "text-wrapping-overflow";
    case "wrap":
      return "text-wrapping-wrap";
    default:
      return "text-wrapping-clip";
  }
}

export type MergeValue =
  | "merge_all"
  | "merge_horizontal"
  | "merge_vertical"
  | "merge_unmerge";
export function getMergeIcon(v: MergeValue) {
  switch (v) {
    case "merge_all":
      return "merge-all";
    case "merge_horizontal":
      return "merge-horizontal";
    case "merge_vertical":
      return "merge-vertical";
    default:
      return "merge-unmerge";
  }
}

export const BORDER_VALUES = [
  "all_borders",
  "inner_borders",
  "horizontal_borders",
  "vertical_borders",
  "outer_borders",
  "left_border",
  "top_border",
  "right_border",
  "bottom_border",
  "clear_borders",
] as const;
export const BORDER_STYLES = [
  "thin",
  "medium",
  "thick",
  "dashed",
  "dotted",
  "double",
] as const;
export type BorderValue = (typeof BORDER_VALUES)[number];
export type BorderStyle = (typeof BORDER_STYLES)[number];

export function getBorderIcon(v: BorderValue) {
  return v.replace("_", "-");
}

export function getBorderTooltip(v: BorderValue) {
  const result = v[0].toUpperCase() + v.slice(1);
  return result.replace("_", " ");
}

export const emptyFunction = () => null;

export const SELECT_COLOR_CONTEXT_NAME = "Toolbar:ColorDropdown:selectColor";
export const RESET_COLOR_CONTEXT_NAME = "Toolbar:ColorDropdown:resetColor";
export const GET_CURRENT_ACTIVE_COLOR =
  "Toolbar:ColorDropdown:getCurrentActiveColor";
export const HOVER_ON_COLOR_CONTEXT_NAME = "Toolbar:ColorDropdown:hoverOnColor";

export const OPEN_COLOR_PICKER_MENU = "Toolbar:ColorPicker:open";
export const RETURN_TO_MAIN_MENU = "Toolbar:ColorPicker:return";
export const CHILD_DROPDOWN_STATE_CHANGE = "Toolbar:childDropdownStateChange";
export const CHILD_DROPDOWN_CLASS_NAME = "toolbar-child-dropdown";

export type ChildToolbar = "home" | "image";
