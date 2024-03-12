import type { CellInfo, StaticStylePreviewOptions } from './base';
import { StylePreview } from './base';
import type { GridPrivateProperties, SelectionDescriptor } from '../../types';
import { SelectionType, getIntersection } from '../../selections/util';

export class StaticStylePreview extends StylePreview {
  private textColor: string;
  private fontSize: number;
  private fontFamily: string;
  private backgroundColor: string;
  private isBold: boolean;
  private isItalic: boolean;
  private isStrikethrough: boolean;
  private isUnderline: boolean;

  constructor(
    grid: GridPrivateProperties,
    private readonly options: StaticStylePreviewOptions,
  ) {
    super(grid);
    const previewStyle = options.data;

    if (previewStyle.textColor) {
      this.textColor = grid.getDrawableColorValue(previewStyle.textColor);
    }
    if (previewStyle.fontSize) this.fontSize = previewStyle.fontSize;
    if (previewStyle.fontFamily) this.fontFamily = previewStyle.fontFamily;
    if (previewStyle.backgroundColor) {
      this.backgroundColor = grid.getDrawableColorValue(
        previewStyle.backgroundColor,
      );
    }
    if (previewStyle.isBold != null) this.isBold = previewStyle.isBold;
    if (previewStyle.isItalic != null) this.isItalic = previewStyle.isItalic;
    if (previewStyle.isStrikethrough != null) {
      this.isStrikethrough = previewStyle.isStrikethrough;
    }
    if (previewStyle.isUnderline != null) {
      this.isUnderline = previewStyle.isUnderline;
    }
  }

  applyEntireColumn = () => this.options?.applyEntireColumn;

  checkCellPreviewing = (cellInfo: CellInfo) => {
    // Cell is in selection area
    if (this.isPreviewing(cellInfo)) return true;

    // Check if there is selected cell inside table
    if (this.applyEntireColumn() && cellInfo.table) {
      const table = cellInfo.table;
      const isTableHeader = cellInfo.rowIndex === table.startRow;
      if (isTableHeader) return false;

      const tableColumnSelection: SelectionDescriptor = {
        type: SelectionType.Cells,
        startColumn: cellInfo.columnIndex,
        endColumn: cellInfo.columnIndex,
        startRow: table.startRow,
        endRow: table.endRow,
      };
      const selections = this.grid.selections;

      for (const selection of selections) {
        if (getIntersection(selection, tableColumnSelection)) {
          return true;
        }
      }
    }

    return false;
  };

  getTextColor = (cellInfo: CellInfo) => {
    return this.checkCellPreviewing(cellInfo)
      ? this.textColor
      : this.getEmptyPreview();
  };

  getFontSize = (cellInfo: CellInfo) => {
    return this.checkCellPreviewing(cellInfo)
      ? this.fontSize
      : this.getEmptyPreview();
  };

  getFontFamily = (cellInfo: CellInfo) => {
    return this.checkCellPreviewing(cellInfo)
      ? this.fontFamily
      : this.getEmptyPreview();
  };

  getBackgroundColor = (cellInfo: CellInfo) => {
    return this.checkCellPreviewing(cellInfo)
      ? this.backgroundColor
      : this.getEmptyPreview();
  };

  getBold = (cellInfo: CellInfo) => {
    return this.checkCellPreviewing(cellInfo)
      ? this.isBold
      : this.getEmptyPreview();
  };

  getItalic = (cellInfo: CellInfo) => {
    return this.checkCellPreviewing(cellInfo)
      ? this.isItalic
      : this.getEmptyPreview();
  };

  getStrikethrough = (cellInfo: CellInfo) => {
    return this.checkCellPreviewing(cellInfo)
      ? this.isStrikethrough
      : this.getEmptyPreview();
  };

  getUnderline = (cellInfo: CellInfo) => {
    return this.checkCellPreviewing(cellInfo)
      ? this.isUnderline
      : this.getEmptyPreview();
  };
}
