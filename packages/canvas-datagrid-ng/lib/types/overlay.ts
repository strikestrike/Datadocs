import type { GridPublicAPI } from './grid';

export type OverlayDescriptor = {
  id: string;
  element: HTMLElement;
  onResize: (
    overlay: OverlayDescriptor,
    pixelsBounds: { left: number; top: number; width: number; height: number },
    grid: GridPublicAPI,
  ) => any;
  dispose?(): void;
};
