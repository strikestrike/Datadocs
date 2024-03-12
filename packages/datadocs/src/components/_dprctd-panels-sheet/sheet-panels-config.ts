import type { PanelComponentConfig } from "../../layout/_dprctd/types";

export const sheetPanelConfigs = {};

export const sheetPanelComponents = {};

export const sheetPanelsList = [];

export function addPanel(
  componentConfig: PanelComponentConfig,
  Component: any
) {
  sheetPanelConfigs[componentConfig.name] = componentConfig;
  sheetPanelComponents[componentConfig.name] = Component;
  sheetPanelsList.push(componentConfig);
}
