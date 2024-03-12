import { validateCellDataFormat } from '../../data/data-format';
import {
  getDefaultDataFormat,
  isHyperlinkDataFormat,
} from '../../data/formatters';
import { getCellCustomBorder } from '../../draw/cell-creator/define-border';
import type { GridPosition } from '../../position';
import { SelectionType, getIntersection } from '../../selections/util';
import type {
  CellBorders,
  CellLinkedNode,
  GridPrivateProperties,
  SelectionDescriptor,
} from '../../types';
import {
  columnTypeToLongFormString,
  getBaseType,
  transformNumberType,
} from '../../utils/column-types';
import type { CellInfo, DataFormatPreviewOptions } from './base';
import { StylePreview } from './base';

export class DataFormatPreview extends StylePreview {
  constructor(
    grid: GridPrivateProperties,
    private readonly data: DataFormatPreviewOptions,
  ) {
    super(grid);
  }

  applyEntireColumn = () => this.data?.applyEntireColumn;

  checkMultipleTypes = () => this.data?.multipleType;

  getPreviewCellDataType = (cellInfo: CellInfo) => {
    if (cellInfo?.table) {
      const table = cellInfo.table;
      const rowIndex = cellInfo.rowIndex;
      const columnIndex = cellInfo.columnIndex;

      // table column header data type is string
      if (rowIndex === table.startRow) return 'string';

      const tableColumn = table.dataSource.getHeader(
        columnIndex - table.startColumn,
      );
      const type = columnTypeToLongFormString(tableColumn.type);

      if (type === 'variant') {
        return cellInfo?.cellValue?.dataType ?? type;
      } else {
        return type;
      }
    } else {
      const { cellValue, cellMeta } = cellInfo;
      const parserData = cellMeta?.parserData;
      let type: string;

      if (parserData?.dataType) {
        type = parserData.dataType;
      } else if (typeof cellValue === 'string') {
        type = 'string';
      }
      return type;
    }
  };

  /**
   * Check if the cell is in preview area. In case of table column,
   * if we do data format for entire column, we should have preview
   * for all column even if the selected cells are not in visible area.
   * @param cellInfo
   * @returns
   */
  checkDataFormatPreviewing = (cellInfo: CellInfo) => {
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

  checkDataTypePreviewing = (cellInfo: CellInfo) => {
    const dataType = this.getPreviewCellDataType(cellInfo) ?? '';
    let dataFormat = this.data?.dataFormat;
    if (!dataFormat) dataFormat = getDefaultDataFormat(this.data.dataType);
    return dataFormat && validateCellDataFormat(dataType, dataFormat);
  };

  getDataFormat = (cellInfo: CellInfo) => {
    if (!this.checkDataFormatPreviewing(cellInfo)) {
      return this.getEmptyPreview();
    }

    const type = this.getPreviewCellDataType(cellInfo);
    const dataFormat = this.data?.dataFormat;
    if (type && dataFormat && validateCellDataFormat(type, dataFormat)) {
      return dataFormat;
    }

    return this.getEmptyPreview();
  };

  getBackgroundColor = (cellInfo: CellInfo) => {
    if (
      !this.checkMultipleTypes() ||
      !this.checkDataFormatPreviewing(cellInfo) ||
      !this.checkDataTypePreviewing(cellInfo)
    ) {
      return this.getEmptyPreview();
    }

    const type = this.getCellDataType(cellInfo);
    const bgColor = getTypePreviewColor(type, 'background');
    return bgColor ?? this.getEmptyPreview();
  };

  getTextColor = (cellInfo: CellInfo) => {
    // The text color is different if cells are marked as hyperlink
    if (
      !this.checkDataFormatPreviewing(cellInfo) ||
      !this.checkDataTypePreviewing(cellInfo) ||
      !isHyperlinkDataFormat(this.data.dataFormat)
    ) {
      return this.getEmptyPreview();
    }

    const style = this.grid.getLinkDefaultStyle();
    return style?.textColor ?? this.getEmptyPreview();
  };

  getCellInfoFromCellNode = (cellNode: CellLinkedNode) => {
    const cell = cellNode?.cell;
    if (!cell) return undefined;

    return {
      rowIndex: cell.rowIndex,
      columnIndex: cell.columnIndex,
      selected: cell.selected,
      cellValue: cell.value,
      cellMeta: cell.meta,
      table: cell.table,
    } as CellInfo;
  };

  getCellDataType = (cellInfo: CellInfo) => {
    if (!cellInfo) return '';
    const baseType = getBaseType(this.getPreviewCellDataType(cellInfo) ?? '');
    return transformNumberType(baseType);
  };

  getCustomBorders = (cellNode: CellLinkedNode) => {
    const cellInfo = this.getCellInfoFromCellNode(cellNode);

    if (
      !cellInfo ||
      !this.checkMultipleTypes() ||
      !this.checkDataFormatPreviewing(cellInfo) ||
      !this.checkDataTypePreviewing(cellInfo)
    ) {
      return this.getEmptyPreview();
    }

    const dataType = this.getCellDataType(cellInfo);
    const borderColor = getTypePreviewColor(dataType, 'border');
    if (!borderColor) return this.getEmptyPreview();
    const previewBorders: CellBorders = {
      top: { style: 'dashed', color: borderColor, type: 'preview' },
      bottom: { style: 'dashed', color: borderColor, type: 'preview' },
      left: { style: 'dashed', color: borderColor, type: 'preview' },
      right: { style: 'dashed', color: borderColor, type: 'preview' },
    };

    function checkCustomBorder(node: CellLinkedNode, position: GridPosition) {
      const border = getCellCustomBorder(node, position);
      return border && border.style !== 'empty' && border.type !== 'preview';
    }

    if (cellNode?.prevSibling) {
      const hasCustomBorder = checkCustomBorder(cellNode, 'left');
      if (hasCustomBorder) {
        previewBorders.left = undefined;
      }
    }

    if (cellNode?.nextSibling) {
      const hasCustomBorder = checkCustomBorder(cellNode, 'right');
      const info = this.getCellInfoFromCellNode(cellNode.nextSibling);
      const type = this.getCellDataType(info);
      if (
        hasCustomBorder ||
        (info &&
          this.checkDataFormatPreviewing(info) &&
          this.checkDataTypePreviewing(info) &&
          getTypePreviewColor(type))
      ) {
        previewBorders.right = undefined;
      }
    }

    if (cellNode?.upperSibling) {
      const hasCustomBorder = checkCustomBorder(cellNode, 'top');
      const info = this.getCellInfoFromCellNode(cellNode.upperSibling);
      const type = this.getCellDataType(info);
      if (
        hasCustomBorder ||
        (info &&
          this.checkDataFormatPreviewing(info) &&
          this.checkDataTypePreviewing(info) &&
          getTypePreviewColor(type) &&
          type === dataType)
      ) {
        previewBorders.top = undefined;
      }
    }

    if (cellNode?.lowerSibling) {
      const hasCustomBorder = checkCustomBorder(cellNode, 'bottom');
      const info = this.getCellInfoFromCellNode(cellNode.lowerSibling);
      const type = this.getCellDataType(info);
      if (
        hasCustomBorder ||
        (info &&
          this.checkDataFormatPreviewing(info) &&
          this.checkDataTypePreviewing(info) &&
          getTypePreviewColor(type))
      ) {
        previewBorders.bottom = undefined;
      }
    }
    return previewBorders;
  };

  getUnderline = (cellInfo: CellInfo) => {
    // There is underline style in case cells are marked as hyperlink
    if (
      !this.checkDataFormatPreviewing(cellInfo) ||
      !this.checkDataTypePreviewing(cellInfo) ||
      !isHyperlinkDataFormat(this.data.dataFormat)
    ) {
      return this.getEmptyPreview();
    }

    const style = this.grid.getLinkDefaultStyle();
    return style?.isUnderline ?? this.getEmptyPreview();
  };

  isPreviewHyperlinkStyle = (cellInfo: CellInfo) => {
    if (
      !this.checkDataFormatPreviewing(cellInfo) ||
      !this.checkDataTypePreviewing(cellInfo) ||
      this.data?.dataFormat?.type !== 'string'
    ) {
      return this.getEmptyPreview();
    }
    return true;
  };

  onDestroy = () => true;
}

export function getTypePreviewColor(
  dataType: string,
  type: 'background' | 'border' = 'background',
) {
  const alpha = type === 'background' ? 0.2 : 1;
  switch (dataType) {
    case 'boolean': {
      return getHexColor([117, 200, 253, alpha]);
    }
    case 'string': {
      return getHexColor([255, 188, 111, alpha]);
    }
    case 'bytes': {
      // not defined in design yet
      return getHexColor([255, 188, 111, alpha]);
    }
    case 'number':
    case 'int':
    case 'decimal':
    case 'float': {
      return getHexColor([194, 131, 255, alpha]);
    }
    case 'date': {
      return getHexColor([255, 134, 134, alpha]);
    }
    case 'time': {
      return getHexColor([103, 255, 248, alpha]);
    }
    case 'datetime': {
      return getHexColor([255, 137, 137, alpha]);
    }
    case 'timestamp': {
      return getHexColor([186, 255, 78, alpha]);
    }
    case 'interval': {
      return getHexColor([93, 255, 155, alpha]);
    }
    case 'geography': {
      // not defined in design yet
      return getHexColor([93, 255, 155, alpha]);
    }
    case 'json': {
      return getHexColor([255, 222, 87, alpha]);
    }
    case 'struct': {
      return getHexColor([82, 136, 255, alpha]);
    }
    default: {
      return undefined;
    }
  }
}

function getHexColor(rgba: number[]): string {
  const bg = [255, 255, 255];
  const alpha = rgba[3];
  const colors = [
    (1 - alpha) * bg[0] + alpha * rgba[0],
    (1 - alpha) * bg[1] + alpha * rgba[1],
    (1 - alpha) * bg[2] + alpha * rgba[2],
  ];
  return (
    '#' +
    colors.map((v) => Math.floor(v).toString(16).padStart(2, '0')).join('')
  );
}
