import type { CellLinkedNode, GridPrivateProperties } from '../../types';
import type { StylePreview, StylePreviewType, CellInfo } from './base';
import { StaticStylePreview } from './static-style-preview';
import { ZoomStylePreview } from './zoom-style-preview';
import { DataFormatPreview } from './data-format-preview';

export class StylePreviewManager {
  stylePreview: StylePreview = null;

  constructor(private readonly grid: GridPrivateProperties) {}

  /**
   * Add a style preview
   *
   * If there is one exist remove it before add a new one
   * to make sure there is only one style preview at a time
   * @param type
   * @param data
   */
  addStylePreview = (type: StylePreviewType, data: any) => {
    this.removeStylePreview();

    switch (type) {
      case 'static-style': {
        this.stylePreview = new StaticStylePreview(this.grid, data);
        break;
      }
      case 'zoom': {
        this.stylePreview = new ZoomStylePreview(this.grid, data);
        break;
      }
      case 'data-format': {
        this.stylePreview = new DataFormatPreview(this.grid, data);
        break;
      }
      default:
        break;
    }
  };

  hasStylePreview = () => !!this.stylePreview;

  /**
   * Remove exist style preview
   */
  removeStylePreview = () => {
    if (this.stylePreview) {
      this.stylePreview.onDestroy();
      this.stylePreview = null;
    }
  };

  /**
   * Get preview text color of a cell if exist
   * @param cellInfo
   * @returns Text color or undefined
   */
  getTextColor = (cellInfo: CellInfo) => {
    return this.stylePreview
      ? this.stylePreview.getTextColor(cellInfo)
      : undefined;
  };

  /**
   * Get preview background color of a cell if exist
   * @param cellInfo
   * @returns Text color or undefined
   */
  getBackgroundColor = (cellInfo: CellInfo) => {
    return this.stylePreview
      ? this.stylePreview.getBackgroundColor(cellInfo)
      : undefined;
  };

  getCustomBorders = (cellNode: CellLinkedNode) => {
    return this.stylePreview
      ? this.stylePreview.getCustomBorders(cellNode)
      : undefined;
  };

  /**
   * Get preview font size of a cell if exist
   * @param cellInfo
   * @returns Font size or undefined
   */
  getFontSize = (cellInfo: CellInfo) => {
    return this.stylePreview
      ? this.stylePreview.getFontSize(cellInfo)
      : undefined;
  };

  /**
   * Get preview font family of a cell if exist
   * @param cellInfo
   * @returns Font family or undefined
   */
  getFontFamily = (cellInfo: CellInfo) => {
    return this.stylePreview
      ? this.stylePreview.getFontFamily(cellInfo)
      : undefined;
  };

  /**
   * Get preview font bold of a cell if exist
   * @param cellInfo
   * @returns Font bold style
   */
  getBold = (cellInfo: CellInfo) => {
    return this.stylePreview ? this.stylePreview.getBold(cellInfo) : undefined;
  };

  /**
   * Get preview font italic of a cell if exist
   * @param cellInfo
   * @returns Font italic style
   */
  getItalic = (cellInfo: CellInfo) => {
    return this.stylePreview
      ? this.stylePreview.getItalic(cellInfo)
      : undefined;
  };

  /**
   * Get preview font strikethrough of a cell if exist
   * @param cellInfo
   * @returns Font strikethrough style
   */
  getStrikethrough = (cellInfo: CellInfo) => {
    return this.stylePreview
      ? this.stylePreview.getStrikethrough(cellInfo)
      : undefined;
  };

  /**
   * Get preview text underline of a cell if exist
   * @param cellInfo
   * @returns Text underline style
   */
  getUnderline = (cellInfo: CellInfo) => {
    return this.stylePreview
      ? this.stylePreview.getUnderline(cellInfo)
      : undefined;
  };

  /**
   * Get preview data format of a cell if exist
   * @param cellInfo
   * @returns Data format or undefined
   */
  getDataFormat = (cellInfo: CellInfo) => {
    return this.stylePreview
      ? this.stylePreview.getDataFormat(cellInfo)
      : undefined;
  };

  /**
   * Indicate if a hyperlink is in previewing. It's only valid in data-format
   * preview for string type. A Hyperlink cell will lose its link style if other
   * string data-format is selected
   * @param cellInfo
   * @returns
   */
  isPreviewHyperlinkStyle = (cellInfo: CellInfo) => {
    return this.stylePreview
      ? this.stylePreview.isPreviewHyperlinkStyle(cellInfo)
      : undefined;
  };
}
