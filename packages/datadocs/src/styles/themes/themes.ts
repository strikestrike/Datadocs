// src/themes/index.ts
import defaultTheme from "./theme_default";
import darkTheme from "./theme_dark";
import type { IThemes } from "./utils";

/**
 * The default theme to load
 */
export const DEFAULT_THEME = "default-theme";
export const DARK_THEME = "dark-theme";

export const themes: IThemes = {
  [DEFAULT_THEME]: defaultTheme,
  [DARK_THEME]: darkTheme,
};
