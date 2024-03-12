import type { GridPrivateProperties } from '../../types';
import type { ZoomStylePreviewOptions } from './base';
import { StylePreview } from './base';

const MAX_USER_SCALE = 2;
const MIN_USER_SCALE = 0.5;

export class ZoomStylePreview extends StylePreview {
  originalUserScale: number;

  constructor(grid: GridPrivateProperties, data: ZoomStylePreviewOptions) {
    super(grid);
    this.originalUserScale = grid.userScale;
    if (
      data?.zoom &&
      data.zoom >= MIN_USER_SCALE &&
      data.zoom <= MAX_USER_SCALE
    ) {
      grid.userScale = data.zoom;
      grid.resize(false);
    }
  }

  onDestroy = () => {
    this.grid.userScale = this.originalUserScale;
    this.grid.resize(false);
  };
}
