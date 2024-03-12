import type { GridPosition } from '@datadocs/canvas-datagrid-ng/lib/position';

/**
 * Contain all supported metadata's properties that are supported in
 * the metadata table
 */
export type Metadata = {
  style: {
    isBold: boolean;
    isItalic: boolean;
    isStrikethrough: boolean;
    isUnderline: boolean;
    textColor: string;
    backgroundColor: string;
    fontSize: number;
    textRotation: number;
    fontFamily: string;
    iconSet: string;
    horizontalAlignment: string;
    verticalAlignment: string;
    wrapMode: string;
    borders: Record<GridPosition, { style: string; color: string }>;
    dataFormat: Record<string, any>;
  };
  linkData: {
    effectiveText: string;
    originalTextHash: string;
    spans: Array<{
      startOffset: number;
      endOffset: number;
      label: string;
      ref: string;
    }>;
  };
};
