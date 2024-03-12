import type { HyperlinkData, MetaRun } from '../types';
import type { PixelBoundingRect } from '../types/base-structs';

export type CellErrorData = {
  /**
   * Indicate where the cell helper need to be showed around
   */
  rect: PixelBoundingRect;
  message: string | string[];
};

export type CellPreviewStyle = {
  height: number;
  marginBottom: number;
  fontSize: number;
  fontFamily: string;
};

export type CellPreviewData = {
  rect: PixelBoundingRect;
  message: string;
  hasCellBadge: boolean;
} & CellPreviewStyle;

export type CellPreview = { value: string; dataType?: string };

declare module '../data/data-source/spec/base' {
  interface CellMeta {
    cellError?: string | string[];
    preview?: CellPreview;
    linkData?: HyperlinkData;
  }
}
