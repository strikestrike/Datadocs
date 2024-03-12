import type { PanelComponentConfig } from "./types";
import type { ComponentType } from "svelte";

export const panelConfigs: { [name: string]: PanelComponentConfig } = {};

export const panelComponents: { [name: string]: ComponentType } = {};

export const panelsList: PanelComponentConfig[] = [];

export function addPanel(
  componentConfig: PanelComponentConfig,
  Component: ComponentType
) {
  panelConfigs[componentConfig.name] = componentConfig;
  panelComponents[componentConfig.name] = Component;
  panelsList.push(componentConfig);
}
