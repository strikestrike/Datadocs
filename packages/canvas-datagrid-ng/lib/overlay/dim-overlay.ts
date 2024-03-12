import type { OverlayDescriptor } from '../types/overlay';
import type { GridPrivateProperties } from '../types/grid';

export const dimOverlayResizer: OverlayDescriptor['onResize'] = (
  overlay,
  pixelsBounds,
  gridApi,
) => {
  const targetStyle = overlay.element.style;
  targetStyle.width = pixelsBounds.width + 'px';
  targetStyle.height = pixelsBounds.height + 'px';
};

export function getDimOverlay(grid: GridPrivateProperties) {
  const loadingClassName = `datagrid-dim-overlay`;
  const overlay = document.createElement('div');
  overlay.className = `${loadingClassName}`;
  overlay.style.display = 'block';
  overlay.style.left = '0px';
  overlay.style.top = '0px';
  overlay.style.background = grid.style.dimOverlayBackgroundColor;
  overlay.style.zIndex = grid.getZIndex('overlayBackground');
  return overlay;
}
