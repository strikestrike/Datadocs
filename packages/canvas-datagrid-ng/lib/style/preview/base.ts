import type {
  CellDataFormat,
  CellLinkedNode,
  CellMeta,
  CellStyleDeclaration,
  GridPrivateProperties,
  TableDescriptor,
} from '../../types';

export type StylePreviewType =
  | 'data-bars'
  | 'data-format'
  | 'static-style'
  | 'zoom';

/**
 * Cell information to retrieve style for previewing
 */
export type CellInfo = {
  columnIndex: number;
  rowIndex: number;
  selected: boolean;
  cellValue: any;
  cellMeta: CellMeta;
  table: TableDescriptor;
};

export type DataFormatPreviewOptions = {
  dataFormat: CellDataFormat;
  dataType: string;
  multipleType: boolean;
  applyEntireColumn: boolean;
};

export type ZoomStylePreviewOptions = {
  zoom: number;
};

export type StaticStylePreviewOptions = {
  data: Partial<CellStyleDeclaration>;
  applyEntireColumn: boolean;
};

export class StylePreview {
  constructor(readonly grid: GridPrivateProperties) {}

  /**
   * A cell is in previewing if it's in selected area.
   * @param cellInfo
   * @returns
   */
  isPreviewing = (cellInfo: CellInfo) => {
    return (
      cellInfo.selected && cellInfo.rowIndex >= 0 && cellInfo.columnIndex >= 0
    );
  };

  isPreviewHyperlinkStyle = (cellInfo: CellInfo) => {
    return this.getEmptyPreview();
  };

  getEmptyPreview = () => {
    return undefined;
  };

  getTextColor = (cellInfo: CellInfo) => {
    return this.getEmptyPreview();
  };

  getBackgroundColor = (cellInfo: CellInfo) => {
    return this.getEmptyPreview();
  };

  getCustomBorders = (cellNode: CellLinkedNode) => {
    return this.getEmptyPreview();
  };

  getFontFamily = (cellInfo: CellInfo) => {
    return this.getEmptyPreview();
  };

  getFontSize = (cellInfo: CellInfo) => {
    return this.getEmptyPreview();
  };

  getBold = (cellInfo: CellInfo) => {
    return this.getEmptyPreview();
  };

  getItalic = (cellInfo: CellInfo) => {
    return this.getEmptyPreview();
  };

  getStrikethrough = (cellInfo: CellInfo) => {
    return this.getEmptyPreview();
  };

  getUnderline = (cellInfo: CellInfo) => {
    return this.getEmptyPreview();
  };

  getDataFormat = (cellInfo: CellInfo) => {
    return this.getEmptyPreview();
  };

  /**
   * Should be called before a style preview is going to be removed
   */
  onDestroy = () => {
    // Destroy method is empty by default
  };
}
