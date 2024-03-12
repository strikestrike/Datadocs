import { convertHexToRgbaStringWithOpacity as convertColor } from "../utils/colorUtils";

export type BorderStyle = {
  borderStyle: string; // solid, dashed, dotted, etc.
  borderWidth: string;
  borderColor: string;
};

export type BorderPosition = "top" | "bottom" | "left" | "right";

const defaultBorderStyle: BorderStyle = {
  borderStyle: "solid",
  borderWidth: "1px",
  borderColor: "#E9EDF0",
};

const noteBorderStyle: BorderStyle = {
  borderStyle: "solid",
  borderWidth: "1px",
  borderColor: "#E7DA3C",
};

export type CellBorders = Partial<{ [key in BorderPosition]: BorderStyle }>;

export type CellText = {
  color: string;
  fontFamily: string;
  fontSize: string;
};

export type CellStyle = {
  name: string; // name should be unique among sections
  label: string; // the text will be show in dropdown
} & Partial<{
  textColor: string;
  fontFamily: string;
  fontSize: string;
  textDecoration: string;
  backgroundColor: string;
  borders: CellBorders;
}>;

export type CellStyleSections = {
  name: string;
  data: CellStyle[];
  /**
   * Use for styling cell style dropdown, shouldn't have border radius on "Heading and title" section item
   */
  hasBorderRadius?: boolean;
}[];

const goodBadNeutralSection: CellStyle[] = [
  {
    name: "cell_normal",
    label: "Normal",
    textColor: "#50585D",
    backgroundColor: "#FFFFFF",
    borders: {
      top: { ...defaultBorderStyle },
      bottom: { ...defaultBorderStyle },
      left: { ...defaultBorderStyle },
      right: { ...defaultBorderStyle },
    },
  },
  {
    name: "cell_bad",
    label: "Bad",
    textColor: "#DE2C36",
    backgroundColor: "rgba(222, 44, 54, 0.2)",
  },
  {
    name: "cell_good",
    label: "Good",
    textColor: "#79BC81",
    backgroundColor: "rgba(121, 188, 129, 0.2)",
  },
  {
    name: "cell_neutral",
    label: "Neutral",
    textColor: "#EFCD14",
    backgroundColor: "rgba(239, 205, 20, 0.2)",
  },
];

const THEME_ACCENT_1 = "#51C2F0";
const THEME_ACCENT_2 = "#9E1C53";
const THEME_ACCENT_3 = "#F3AC30";
const THEME_ACCENT_4 = "#1C9D9D";

const themeCellStyleSection: CellStyle[] = [
  // accent 1
  {
    name: "theme_accent1_20",
    label: "20%",
    textColor: "#50585D",
    backgroundColor: convertColor(THEME_ACCENT_1, 0.2),
  },
  {
    name: "theme_accent1_40",
    label: "40%",
    textColor: "#50585D",
    backgroundColor: convertColor(THEME_ACCENT_1, 0.4),
  },
  {
    name: "theme_accent1_60",
    label: "60%",
    textColor: "#50585D",
    backgroundColor: convertColor(THEME_ACCENT_1, 0.6),
  },
  {
    name: "theme_accent1_100",
    label: "Blue",
    textColor: "#FFFFFF",
    backgroundColor: convertColor(THEME_ACCENT_1, 1),
  },

  // accent 2
  {
    name: "theme_accent2_20",
    label: "20%",
    textColor: "#50585D",
    backgroundColor: convertColor(THEME_ACCENT_2, 0.2),
  },
  {
    name: "theme_accent2_40",
    label: "40%",
    textColor: "#50585D",
    backgroundColor: convertColor(THEME_ACCENT_2, 0.4),
  },
  {
    name: "theme_accent2_60",
    label: "60%",
    textColor: "#50585D",
    backgroundColor: convertColor(THEME_ACCENT_2, 0.6),
  },
  {
    name: "theme_accent2_100",
    label: "Brown",
    textColor: "#FFFFFF",
    backgroundColor: convertColor(THEME_ACCENT_2, 1),
  },

  // accent 3
  {
    name: "theme_accent3_20",
    label: "20%",
    textColor: "#50585D",
    backgroundColor: convertColor(THEME_ACCENT_3, 0.2),
  },
  {
    name: "theme_accent3_40",
    label: "40%",
    textColor: "#50585D",
    backgroundColor: convertColor(THEME_ACCENT_3, 0.4),
  },
  {
    name: "theme_accent3_60",
    label: "60%",
    textColor: "#50585D",
    backgroundColor: convertColor(THEME_ACCENT_3, 0.6),
  },
  {
    name: "theme_accent3_100",
    label: "Orange",
    textColor: "#FFFFFF",
    backgroundColor: convertColor(THEME_ACCENT_3, 1),
  },

  // accent 4
  {
    name: "theme_accent4_20",
    label: "20%",
    textColor: "#50585D",
    backgroundColor: convertColor(THEME_ACCENT_4, 0.2),
  },
  {
    name: "theme_accent4_40",
    label: "40%",
    textColor: "#50585D",
    backgroundColor: convertColor(THEME_ACCENT_4, 0.4),
  },
  {
    name: "theme_accent4_60",
    label: "60%",
    textColor: "#50585D",
    backgroundColor: convertColor(THEME_ACCENT_4, 0.6),
  },
  {
    name: "theme_accent4_100",
    label: "Green",
    textColor: "#FFFFFF",
    backgroundColor: convertColor(THEME_ACCENT_4, 1),
  },
];

const headingAndTitleSection: CellStyle[] = [
  { name: "heading_1", label: "Heading 1", fontSize: "17px" },
  { name: "heading_2", label: "Heading 2", fontSize: "15px" },
  { name: "heading_3", label: "Heading 3", fontSize: "13px" },
  { name: "heading_4", label: "Heading 4", fontSize: "11px" },
  {
    name: "title_1",
    label: "Title",
    fontSize: "21px",
    borders: {
      bottom: {
        borderStyle: "solid",
        borderWidth: "2px",
        borderColor: "#3BC7FF",
      },
    },
  },
  {
    name: "total_1",
    label: "Total",
    borders: {
      top: { borderStyle: "solid", borderWidth: "1px", borderColor: "#3BC7FF" },
      bottom: {
        borderStyle: "double",
        borderWidth: "3px",
        borderColor: "#3BC7FF",
      },
    },
  },
];

const dataAndModelSection: CellStyle[] = [
  {
    name: "data_modal_explanation",
    label: "Explanation",
    textColor: "#A7B0B5",
    borders: {
      top: { ...defaultBorderStyle },
      bottom: { ...defaultBorderStyle },
      left: { ...defaultBorderStyle },
      right: { ...defaultBorderStyle },
    },
  },
  {
    name: "data_modal_hyperlink",
    label: "Hyperlink",
    textColor: "#51C2F0",
    textDecoration: "underline",
    borders: {
      top: { ...defaultBorderStyle },
      bottom: { ...defaultBorderStyle },
      left: { ...defaultBorderStyle },
      right: { ...defaultBorderStyle },
    },
  },
  {
    name: "data_modal_note",
    label: "Note",
    textColor: "#50585D",
    backgroundColor: "rgba(231, 218, 60, 0.2)",
    borders: {
      top: { ...noteBorderStyle },
      bottom: { ...noteBorderStyle },
      left: { ...noteBorderStyle },
      right: { ...noteBorderStyle },
    },
  },
  {
    name: "data_modal_warning",
    label: "Warning",
    textColor: "#DE2C36",
    backgroundColor: "#FFFFFF",
  },
];

export const cellStyleData: CellStyleSections = [
  {
    name: "Good, bad or neutral",
    hasBorderRadius: true,
    data: goodBadNeutralSection,
  },
  {
    name: "Themed cell styles",
    hasBorderRadius: true,
    data: themeCellStyleSection,
  },
  {
    name: "Headings and titles",
    hasBorderRadius: false,
    data: headingAndTitleSection,
  },
  { name: "Data and model", hasBorderRadius: true, data: dataAndModelSection },
];
