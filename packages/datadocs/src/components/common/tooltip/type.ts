import type { ComponentType } from 'svelte';

export type TooltipPostionType =
  | "vertical"
  | "horizontal"
  | "top"
  | "bottom"
  | "left"
  | "right";

export interface TooltipOptions {
  auto?: boolean;
  content?: string;
  contentComponent?: ComponentType;
  disabled?: boolean;
  disabledTooltipOnMousedown?: boolean;
  position?: TooltipPostionType;
  arrowSize?: number;
  backgroundStyle?: string;
  textStyle?: string;
  arrowColor?: string;
  closeFromOutside?: (immediate?: boolean) => void;
  openFromOutside?: () => void;
  distance?: number;
  parentSelector?: string;
  triggerRect?: TooltipTriggerRect;
}

export type TooltipTriggerRect = {
  top: number;
  left: number;
  bottom: number;
  right: number;
};
