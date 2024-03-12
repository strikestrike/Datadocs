import type { GridPrivateProperties } from '../types/grid';
import type { OverlayDescriptor } from '../types/overlay';
import { copyMethods } from '../util';
import {
  getDefaultLoadingIndicator,
  defaultLoadingResizer,
} from './default-loading-indicator';
import { dimOverlayResizer, getDimOverlay } from './dim-overlay';
import type { DimOverlayOptions } from './types';

export default function loadGridOverlayManager(self: GridPrivateProperties) {
  copyMethods(new GridOverlayManager(self), self);
}

export class GridOverlayManager {
  _prevLoadingState = false;
  constructor(private readonly grid: GridPrivateProperties) {}

  resizeOverlays = (only?: OverlayDescriptor) => {
    const { componentRoot: container, overlays } = this.grid;
    const gridPublicApi = this.grid.publicApi;
    const rect = container.getBoundingClientRect();
    const pixelsBounds = {
      left: 0,
      top: 0,
      width: rect.width,
      height: rect.height,
    };
    if (only) return onResize(only);
    overlays.forEach((overlay) => {
      try {
        onResize(overlay);
      } catch (error) {
        console.error(error);
      }
    });
    function onResize(overlay: OverlayDescriptor) {
      overlay.onResize(overlay, pixelsBounds, gridPublicApi);
      // apply forced style in here:
      overlay.element.style.position = 'absolute';
    }
  };

  addOverlay = (overlay: OverlayDescriptor) => {
    if (!overlay.id) return;

    const { overlays, parentDOMNode } = this.grid;
    const existed = overlays.get(overlay.id);
    if (existed) return;

    parentDOMNode.appendChild(overlay.element);
    overlays.set(overlay.id, overlay);
    this.resizeOverlays(overlay);
  };

  removeOverlay = (overlay: OverlayDescriptor | string) => {
    let overlayId: string;
    if (typeof overlay === 'string') overlayId = overlay;
    else if (typeof overlay.id !== 'string') overlayId = overlay.id;
    else return;

    const { overlays, parentDOMNode } = this.grid;
    const resolved = overlays.get(overlayId);
    if (!resolved) return;
    parentDOMNode.removeChild(resolved.element);
    overlays.delete(overlayId);
    resolved.dispose?.();
  };

  checkShowLoadingUI = (dim: DimOverlayOptions = 'scroll') => {
    const prevLoadingState = this._prevLoadingState;
    const currentLoading = this.grid.loading;
    this._prevLoadingState = currentLoading;

    if (currentLoading !== prevLoadingState) {
      if (currentLoading) {
        this._showLoadingUI();
        if (dim) this.showDimOverlay(dim);
      } else {
        this._hideLoadingUI();
        this.hideDimOverlay();
      }
    }
  };
  private _showLoadingUI = () => {
    const self = this.grid;
    const renderer = self.attributes.loadingRenderer;
    if (renderer) {
      this.addOverlay({
        ...renderer(self.publicApi),
        id: 'loading',
      });
      return;
    }

    this.addOverlay({
      id: 'loading',
      element: getDefaultLoadingIndicator(this.grid.style),
      onResize: defaultLoadingResizer,
    });
  };
  private _hideLoadingUI = () => this.removeOverlay('loading');

  showDimOverlay = (dim?: DimOverlayOptions) => {
    const self = this.grid;
    const overlay = getDimOverlay(self);
    if (dim === 'scroll') overlay.addEventListener('wheel', self.scrollWheel);
    this.addOverlay({
      id: 'dim-overlay',
      element: overlay,
      onResize: dimOverlayResizer,
      dispose: () => overlay.removeEventListener('wheel', self.scrollWheel),
    });
  };
  hideDimOverlay = () => this.removeOverlay('dim-overlay');
}
