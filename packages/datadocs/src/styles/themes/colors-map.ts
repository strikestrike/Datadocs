import type { ITheme } from "./utils";

export function getColorsMap(colorSettings: ITheme) {
  return {
    // Sample
    // '--color-primary': colorSettings.primary || '',
    // '--color-secondary': colorSettings.secondary || '',
    // '--color-positive': colorSettings.positive || '',
    // '--color-negative': colorSettings.negative || '',
    // '--color-text-primary': colorSettings.textPrimary || '',
    // '--background-primary': colorSettings.backgroundPrimary || '',
    // '--background-sec': colorSettings.backgroundSecondary || '',

    // Panels
    "--panels-bg": colorSettings.panelsBG || "",
    "--datagrid-panel-bg": colorSettings.datagridPanelBG || "",
    "--toolbar-button-normal-color":
      colorSettings.toolbarButtonNormalColor || "",
    "--toolbar-button-active-color":
      colorSettings.toolbarButtonActiveColor || "",
    "--tabs-normal-color": colorSettings.tabsNormalColor || "",
    "--tabs-active-color": colorSettings.tabsActiveColor || "",
    "--separator-line-color": colorSettings.separatorLineColor || "",
    "--dropdown-item-hover-bg": colorSettings.dropdownItemHoverBG || "",
  };
}
