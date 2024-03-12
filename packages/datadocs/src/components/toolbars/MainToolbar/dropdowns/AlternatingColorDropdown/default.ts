import { writable } from "svelte/store";
import { convertHexToRgbaStringWithOpacity as convertColor } from "../utils/colorUtils";

export type AlternatingColor = {
  name: string;
  oddRow: string;
  evenRow: string;
  header?: string;
  footer?: string;
};

const defaultAlternatingColors: AlternatingColor[] = [
  {
    name: "default_1",
    oddRow: "#FFFFFF",
    evenRow: convertColor("#E8716E", 0.2),
    header: "#E8716E",
    footer: "",
  },
  {
    name: "default_2",
    oddRow: "#FFFFFF",
    evenRow: convertColor("#E7DA3C", 0.2),
    header: "#E7DA3C",
    footer: "",
  },
  {
    name: "default_3",
    oddRow: "#FFFFFF",
    evenRow: convertColor("#7ABC82", 0.2),
    header: "#7ABC82",
    footer: "",
  },
  {
    name: "default_4",
    oddRow: "#FFFFFF",
    evenRow: convertColor("#51C2F0", 0.2),
    header: "#51C2F0",
    footer: "",
  },
  {
    name: "default_5",
    oddRow: "#FFFFFF",
    evenRow: convertColor("#E7A157", 0.2),
    header: "#E7A157",
    footer: "",
  },
  {
    name: "default_6",
    oddRow: "#FFFFFF",
    evenRow: convertColor("#AC9978", 0.2),
    header: "#AC9978",
    footer: "",
  },
  {
    name: "default_7",
    oddRow: "#FFFFFF",
    evenRow: convertColor("#A7B0B5", 0.2),
    header: "#A7B0B5",
    footer: "",
  },
  {
    name: "default_8",
    oddRow: "#FFFFFF",
    evenRow: convertColor("#50585D", 0.2),
    header: "#50585D",
    footer: "",
  },
];

export const defaultAlternatingColorsStore = writable(defaultAlternatingColors);

let customCount = 1;
const customAlternatingColors: AlternatingColor[] = [];
export const customAlternatingColorsStore = writable(customAlternatingColors);

export function addCustomAlternatingColors(
  data: Omit<AlternatingColor, "name">
) {
  let name: string;
  const existNames = customAlternatingColors.map((v) => v.name);
  do {
    name = "custom_" + customCount;
    customCount++;
  } while (existNames.indexOf(name) !== -1);
  customAlternatingColors.push({ ...data, name });
  customAlternatingColorsStore.set(customAlternatingColors);
  setActiveAlternatingColors(name);
}

function isInDefault(name: string) {
  return !!defaultAlternatingColors.find((c) => c.name === name);
}

export function editCustomAlternatingColors(
  name: string,
  data: Omit<AlternatingColor, "name">
) {
  if (isInDefault(name) || !name) {
    addCustomAlternatingColors(data);
  } else {
    const customIndex = customAlternatingColors.findIndex(
      (c) => c.name === name
    );
    if (customIndex !== -1) {
      customAlternatingColors[customIndex] = {
        ...customAlternatingColors[customIndex],
        ...data,
      };
      customAlternatingColorsStore.set(customAlternatingColors);
    }
  }
}

/**
 * Get alternating color from default and custom styles, return null if not exist
 * @param name Name of alternating colors
 * @returns
 */
export function getAlternatingColorByName(name: string): AlternatingColor {
  const defaultColor = defaultAlternatingColors.find((c) => c.name === name);
  const customColor = customAlternatingColors.find((c) => c.name === name);
  return defaultColor || customColor || null;
}

export function getFirstAlternatingColor(): AlternatingColor {
  return defaultAlternatingColors[0];
}

// alternating colors
export const activeAlternatingColors = writable({ value: "" });

export function setActiveAlternatingColors(value: string) {
  activeAlternatingColors.set({ value });
}
