import { isCellSelected, isHeaderHighlighted } from '../../selections/util';
import {
  DataType,
  type CellBaseStyleName,
  type GridHeader,
  type GridPrivateProperties,
  type NormalCellDescriptor,
  type ColumnType,
} from '../../types';
import type { CellLinkedNode, CellSource } from '../../types/drawing';
import { DrawingStatus } from '../../types/drawing';
import { integerToAlpha } from '../../util';
import {
  CellStyleCreator,
  addCellDefaultStyle,
  addColumnBorders,
  addColumnStyle,
} from './cell-style';
import { DrawConditionalFormatting } from '../draw-conditional-formatting';
import type { DrawFrameCache } from '../frame-cache';
import { CellTextUtils } from './cell-text';
import type { CellCreationContext } from './context';
import { defineCustomBorders } from './define-border';
import { defineIndicators } from './define-indicators';
import { defineSelectionHandles } from './define-selection-handle';
import { CellDerivedPropsCreator } from './derived-props-creator';
import { CellStatusDetector } from './status-detector';
import { columnTypeToString } from '../../utils/column-types';
import { isHyperlinkDataFormat } from '../../data/formatters';
import {
  getTableCellStringValue,
  isHyperlinkDataValid,
} from '../../utils/hyperlink';
import {
  createTableContext,
  getTableFieldOrGroupHeader,
  getTableGroupHeader,
  getTableSummaryFn,
} from '../../data/table/util';
import { getGenericIcon } from '../icons/generic-icon';

export class CellCreator {
  readonly statusDetector: CellStatusDetector;
  readonly derivedPropsCreator: CellDerivedPropsCreator;
  readonly cellStyleCreator: CellStyleCreator;
  readonly conditionalFormmatting: DrawConditionalFormatting;

  constructor(
    private readonly self: GridPrivateProperties,
    private readonly frameCache: DrawFrameCache,
  ) {
    this.statusDetector = new CellStatusDetector(self, frameCache);
    this.cellStyleCreator = new CellStyleCreator(self);
    this.conditionalFormmatting = new DrawConditionalFormatting(this.self);

    const cellTextUtils = new CellTextUtils(self, frameCache, this);
    this.derivedPropsCreator = new CellDerivedPropsCreator(cellTextUtils);
  }

  /**
   * Create a cell for a given context.
   * @param {CellCreationContext} context The context to create the cell for.
   * @param {CellLinkedNode} cellNode
   * @see createCellInternal
   */
  readonly createCell = (
    context: CellCreationContext,
    cellNode: CellLinkedNode,
  ) => {
    const { source } = cellNode;
    this.createCellInternal(cellNode, context.nextX, context.nextY);
    context.nextX += source.requestedColumnWidth ?? source.columnWidth;
  };

  /**
   * Recreate a cached cell, and get the dependent cells ready for draw.
   * @param node To refresh.
   */
  readonly recreateCachedCell = (node: CellLinkedNode) => {
    this.createCellInternal(node, node.cell.x, node.cell.y);
    this.derivedPropsCreator.calculateRelationalCellData(node);

    // Need to define overflow status for the whole row when drawing cached
    // cell because overflow cell text can be any cell on the row (cells with
    // Text-rotation style not be affected by non-empty cells)
    this.derivedPropsCreator.defineOverflowStatusForRow(node);

    node.cell.drawingStatus = DrawingStatus.PendingRedraw;
    /*
    let curNode = node.prevSibling;

    // Check if this cell depends cells on the left, and mark them ready for
    // redraw if they are connected to this cell.
    while (
      curNode &&
      (curNode.cell.subsumedByLeftNeighbor ||
        curNode.cell.subsumedRightCellCount > 0)
    ) {
      curNode.cell.drawingStatus = DrawingStatus.PendingRedraw;
      if (curNode.cell.subsumedRightCellCount > 0) break;

      curNode = curNode.prevSibling;
    }
    */

    this.updateSubsumedCellsDrawingStatus(node);
  };

  /**
   * Update drawing status of subsumed of a cell
   *
   * Need to redraw if this cell depends cells on the left/right, for example text
   * overflow right/center will occupy empty cells on their left for drawing text.
   * @param node
   */
  readonly updateSubsumedCellsDrawingStatus = (
    node: CellLinkedNode,
    status?: number,
  ) => {
    status = status ?? DrawingStatus.PendingRedraw;

    // Chek left of current node
    let curNode = node.prevSibling;
    while (
      curNode &&
      (curNode.cell.subsumedByLeftNeighbor ||
        curNode.cell.subsumedRightCellCount > 0 ||
        curNode.cell.subsumedByRightNeighbor ||
        curNode.cell.subsumedLeftCellCount > 0)
    ) {
      if (
        curNode.cell.drawingStatus !== DrawingStatus.SkipNotDrawn &&
        curNode.cell.drawingStatus !== DrawingStatus.PendingRedraw
      ) {
        curNode.cell.drawingStatus = status;
      }
      curNode = curNode.prevSibling;
    }

    // Check right of current node
    curNode = node.nextSibling;
    while (
      curNode &&
      (curNode.cell.subsumedByLeftNeighbor ||
        curNode.cell.subsumedRightCellCount > 0 ||
        curNode.cell.subsumedByRightNeighbor ||
        curNode.cell.subsumedLeftCellCount > 0)
    ) {
      if (
        curNode.cell.drawingStatus !== DrawingStatus.SkipNotDrawn &&
        curNode.cell.drawingStatus !== DrawingStatus.PendingRedraw
      ) {
        curNode.cell.drawingStatus = status;
      }
      curNode = curNode.nextSibling;
    }
  };

  /**
   * Create an out-of-order cell whose source generated in-place.
   * @param rowIndex The row index of the cell to generate.
   * @param columnIndex The column index of the cell to generate.
   * @param startX X-axis coordinate of the cell.
   * @param startY Y-axis coordinate of the cell.
   * @param sourceExtras {@link CellSource} extras to override.
   * @return The resulting cell node.
   */
  readonly createSingularCell = (
    rowIndex: number,
    columnIndex: number,
    startX: number,
    startY: number,
    sourceExtras?: Partial<CellSource>,
  ) => {
    const { self, cellStyleCreator: cellStyle } = this;
    const cellValue = self.dataSource.getCellValue(rowIndex, columnIndex);
    const customStyle = self.dataSource.getCellStyle?.(rowIndex, columnIndex);
    const cellMeta = self.dataSource.getCellMeta?.(rowIndex, columnIndex);
    const mergedCell = self.getMergedCell(rowIndex, columnIndex);
    const table = self.dataSource.getTableByIndex(rowIndex, columnIndex);
    const header = self.dataSource.getHeader(columnIndex);
    const rowHeight = self.dp(self.getRowHeight(rowIndex));
    const columnWidth = self.dp(self.getColumnWidth(columnIndex));
    const tableGroupHeader = table && getTableGroupHeader(table, rowIndex);

    const source: CellSource = {
      cellValue,
      get cellMeta() {
        return self.dataSource.getCellMeta?.(
          this.rowIndex,
          this.columnOrderIndex,
        );
      },
      customStyle: cellStyle.addStyleFromMeta(customStyle, cellMeta),
      columnOrderIndex: columnIndex,
      columnWidth,
      header,
      headerIndex: columnIndex,
      rowHeight,
      rowIndex,
      rowOrderIndex: rowIndex,
      mergedCell,
      table,
      tableGroupHeader,
    };
    const node: CellLinkedNode = { source };
    if (sourceExtras) Object.assign(node.source, sourceExtras);

    this.createCellInternal(node, startX, startY);
    return node;
  };

  /**
   * Create a column header using a normal cell node.
   * @param {CellLinkedNode} cellNode To create the column header from.
   * @returns {CellLinkedNode} The resulting column header.
   */
  readonly createColumnHeader = (cellNode: CellLinkedNode): CellLinkedNode => {
    const { self } = this;
    const { columnHeaderCellHeight, columnGroupAreaHeight } = this.frameCache;
    const { header, headerIndex, columnOrderIndex, table, tableGroupHeader } =
      cellNode.source;

    const columnHeader: GridHeader = {
      id: header.id,
      title: header.title,
      dataKey: header.dataKey,
      columnIndex: header.columnIndex,
      columnViewIndex: header.columnViewIndex,
      width: header.width || self.style.cellWidth,
      style: 'columnHeaderCell',
      type: 'string',
    };
    // const columnHeaderCell = {
    //   columnHeaderCell: header.title || header.name,
    // };
    const node: CellLinkedNode = {
      source: {
        cellValue: integerToAlpha(header.columnIndex).toUpperCase(),
        rowOrderIndex: -1,
        rowIndex: -1,
        header: columnHeader,
        headerIndex: headerIndex,
        columnOrderIndex: columnOrderIndex,
        columnWidth: self.dp(self.getColumnWidth(headerIndex)),
        rowHeight: columnHeaderCellHeight,
        tableGroupHeader,
      },
    };

    if (
      table &&
      table.style.showHeaderRow &&
      cellNode.cell.rowIndex > table.startRow &&
      self.frozenRow === 0
    ) {
      const tableHeader = getTableFieldOrGroupHeader(table, header.columnIndex);
      const headerText = tableHeader
        ? tableHeader.title || tableHeader.dataKey
        : '';
      node.source.cellValue = headerText;
      node.source.table = table;
    }

    const context: CellCreationContext = {
      nextX: cellNode.cell.x,
      nextY: columnGroupAreaHeight,
      startRowIndex: 0,
      startColumnIndex: columnOrderIndex,
    };

    this.createCell(context, node);
    return node;
  };

  /**
   * Create a row header using a normal cell node.
   * @param {CellLinkedNode} cellNode To create a row header from.
   * @returns {CellLinkedNode} The resulting row header.
   */
  readonly createRowHeader = (cellNode: CellLinkedNode): CellLinkedNode => {
    const { self, frameCache } = this;
    const { dataSourceState, rowGroupAreaWidth } = frameCache;
    const { rowIndex, rowOrderIndex } = cellNode.source;
    const context: CellCreationContext = {
      startRowIndex: cellNode.source.rowIndex,
      startColumnIndex: 0,
      nextX: rowGroupAreaWidth,
      nextY: cellNode.cell.y,
    };

    let filteredRowNumber;
    if (rowIndex < dataSourceState.rows)
      filteredRowNumber = self.getBoundRowIndexFromViewRowIndex(rowIndex) + 1;
    else filteredRowNumber = dataSourceState.rows + 1;

    const rowHeaderValue =
      self.hasActiveFilters() || frameCache.hasCollapsedRowGroup
        ? filteredRowNumber
        : rowIndex + 1;
    // const rowHeaderCell = { rowHeaderCell: rowHeaderValue };
    const headerDescription: GridHeader = {
      id: '',
      dataKey: 'rowHeaderCell',
      width: frameCache.rowHeaderCellWidth,
      style: 'rowHeaderCell',
      type: 'string',
      title: rowHeaderValue,
      columnIndex: -1,
      columnViewIndex: -1,
      truncateWithEllipsis: false,
    };
    const node: CellLinkedNode = {
      source: {
        cellValue: rowHeaderValue,
        // rowData: rowHeaderCell,
        rowOrderIndex,
        rowIndex,
        header: headerDescription,
        headerIndex: -1,
        columnOrderIndex: -1,
        columnWidth: frameCache.rowHeaderCellWidth,
        rowHeight: cellNode.source.rowHeight,
      },
    };
    this.createCell(context, node);
    return node;
  };

  /**
   * Create a cell and assign it to {@link CellLinkedNode.cell}.
   * @param cellNode
   * @param cellStartX
   * @param cellStartY
   */
  private readonly createCellInternal = (
    cellNode: CellLinkedNode,
    cellStartX: number,
    cellStartY: number,
  ) => {
    const { self, frameCache, statusDetector } = this;
    const { source } = cellNode;
    const {
      cellValue,
      cellMeta,
      rowOrderIndex,
      rowIndex,
      header,
      headerIndex,
      columnOrderIndex,
      mergedCell,
      table,
      tableGroupHeader,
    } = source;
    const { getCellHeight, getCellWidth, width } = frameCache;

    const deprecatedRowDataGetter = self.dataSource.deprecated_getRowData.bind(
      self.dataSource,
      rowOrderIndex,
    );

    let customStyle = source.customStyle;

    const active =
        !self.passive &&
        self.activeCell.rowIndex === rowOrderIndex &&
        self.activeCell.columnIndex === columnOrderIndex,
      isTableHeader =
        table?.indexes?.headerRow === rowOrderIndex &&
        table.style.showHeaderRow &&
        !table.isSpilling,
      tableContext = createTableContext(source),
      rawValue = table?.isSpilling ? '#SPILL' : cellValue,
      valueType: ColumnType =
        (isTableHeader && 'string') ||
        tableContext?.summaryContext?.dataType ||
        tableContext?.header?.type ||
        header.type,
      cellStyle: CellBaseStyleName =
        header.style ||
        (isTableHeader && 'tableHeaderCell') ||
        ((tableContext?.groupContext?.isHeaderColumn ||
          tableContext?.isTotalRow) &&
          'tableGroupHeader') ||
        (active && !self.passive && 'activeCell') ||
        'cell',
      isHeader = /HeaderCell/.test(cellStyle) && !isTableHeader,
      isCorner = /cornerCell/.test(cellStyle),
      isRowHeader = 'rowHeaderCell' === cellStyle,
      isColumnHeader = 'columnHeaderCell' === cellStyle,
      isColumnTableHeader =
        isColumnHeader && table !== undefined && !table.isSpilling,
      isFilterable =
        self.filterable.rows.includes(rowIndex) &&
        self.filterable.columns.includes(headerIndex),
      isReadOnly =
        header.isReadOnly || table?.isReadOnly || customStyle?.isReadOnly,
      isBaseMergedCell =
        mergedCell &&
        mergedCell.startRow === rowIndex &&
        mergedCell.startColumn === columnOrderIndex,
      picked = self.isCellPicked(rowOrderIndex, columnOrderIndex),
      // TODO: optimize it by `getSelectionStateFromCells`
      selected =
        !self.passive &&
        isCellSelected(self.selections, rowOrderIndex, columnOrderIndex),
      customHighlight = self.getCellHightlightInfo(
        rowOrderIndex,
        columnOrderIndex,
      ),
      hovered = statusDetector.isCellHovered(rowOrderIndex, columnOrderIndex),
      groupHovered = statusDetector.isCellGroupHovered(
        rowOrderIndex,
        columnOrderIndex,
      ),
      openedFilter =
        self.selectedFilterButton.rowIndex == rowIndex &&
        self.selectedFilterButton.columnIndex == headerIndex,
      highlighted = isHeaderHighlighted(
        self.selections,
        rowOrderIndex,
        columnOrderIndex,
      ),
      moveHighlighted = statusDetector.isCellMoveHighlighted(
        rowOrderIndex,
        columnOrderIndex,
      ),
      isColumnHeaderCellCap = cellStyle === 'columnHeaderCellCap',
      // @todo: Remove `isGrid` after making sure it is not being used.
      isGrid = (header.type as any) === 'canvas-datagrid',
      previewInfo = {
        columnIndex: columnOrderIndex,
        rowIndex,
        selected,
        cellMeta,
        cellValue,
        table: table,
      },
      // For now, all cell from table is readonly
      isValueReadOnly = !!table,
      linkRuns = isHyperlinkDataValid(
        cellMeta?.linkData,
        getTableCellStringValue(cellValue),
        isValueReadOnly,
      )
        ? cellMeta?.linkData?.spans
        : null;

    // Generate custom style from table column types. E.g Boolean columns
    // have center alignment as default. Have to do it before applying
    // other custom styles such as preview styles.
    const tableHeader = tableContext?.header;
    if (!isTableHeader && tableHeader?.columnStyle) {
      customStyle = addColumnStyle(customStyle, tableHeader);
    }

    const isPreviewLinkStyle =
      self.stylePreviewManager.isPreviewHyperlinkStyle(previewInfo);
    customStyle = addCellDefaultStyle(
      customStyle,
      cellMeta,
      !isTableHeader && !isColumnTableHeader ? tableHeader : null,
      rawValue,
      isPreviewLinkStyle ? {} : self.getLinkDefaultStyle(),
    );

    const previewBold = self.stylePreviewManager.getBold(previewInfo),
      isBold = previewBold ?? customStyle?.isBold,
      previewItalic = self.stylePreviewManager.getItalic(previewInfo),
      isItalic = previewItalic ?? customStyle?.isItalic,
      previewStrikethrough =
        self.stylePreviewManager.getStrikethrough(previewInfo),
      isStrikethrough = previewStrikethrough ?? customStyle?.isStrikethrough,
      previewUnderline = self.stylePreviewManager.getUnderline(previewInfo),
      isUnderline = previewUnderline ?? customStyle?.isUnderline,
      previewFontSize = self.stylePreviewManager.getFontSize(previewInfo),
      fontSize =
        previewFontSize ||
        (customStyle && customStyle.fontSize) ||
        self.style[cellStyle + 'FontSize'] ||
        0,
      previewFontFamily = self.stylePreviewManager.getFontFamily(previewInfo),
      fontFamily =
        previewFontFamily ||
        (customStyle && customStyle.fontFamily) ||
        self.style[cellStyle + 'FontFamily'],
      styleRuns = customStyle && customStyle.styleRuns,
      horizontalAlignment =
        (table?.isSpilling && 'center') ||
        (isColumnTableHeader && 'left') ||
        customStyle?.horizontalAlignment ||
        self.style[cellStyle + 'HorizontalAlignment'],
      verticalAlignment =
        (customStyle && customStyle.verticalAlignment) ||
        self.style[cellStyle + 'VerticalAlignment'],
      previewTextColor = self.stylePreviewManager.getTextColor(previewInfo),
      textColor =
        previewTextColor || self.getDrawableColorValue(customStyle?.textColor),
      backgroundColor =
        self.stylePreviewManager.getBackgroundColor(previewInfo) ||
        self.getDrawableColorValue(customStyle?.backgroundColor) ||
        (table &&
          table.firstRowIndex <= rowIndex &&
          table.lastRowIndex >= rowIndex &&
          table.firstColumnIndex <= columnOrderIndex &&
          table.lastColumnIndex >= columnOrderIndex &&
          ((table.style.bandedRows &&
            (table.firstRowIndex - rowIndex) % 2 === 0) ||
            (table.style.bandedColumns &&
              (table.firstColumnIndex - columnOrderIndex) % 2 === 0)) &&
          self.style.tableBandedCellBackgroundColor) ||
        '',
      customWrapMode = (customStyle && customStyle.wrapMode) || '',
      dataFormat =
        self.stylePreviewManager.getDataFormat(previewInfo) ||
        tableContext?.summaryContext?.fn?.format ||
        customStyle?.dataFormat,
      drawStyleRuns = structuredClone(styleRuns ?? []),
      subtargets: NormalCellDescriptor['subtargets'] = {},
      showTotalRowButton =
        (hovered ||
          (table &&
            self.activeAggregationOptsDropdown?.table == table &&
            self.activeAggregationOptsDropdown.header == tableHeader &&
            self.activeAggregationOptsDropdown.rowIndex === rowIndex)) &&
        (tableContext?.isTotalRow || tableContext?.isSubtotalRow);

    let cellWidth = source.columnWidth,
      mergingHeight = 0,
      mergingWidth = 0,
      fontHeight = fontSize * self.scale;

    // Make sure style preview make changes to cell's style-runs
    if (self.stylePreviewManager.hasStylePreview()) {
      for (const run of drawStyleRuns) {
        if (previewBold != null && run.style.isBold != null) {
          delete run.style.isBold;
        }
        if (previewItalic != null && run.style.isItalic != null) {
          delete run.style.isItalic;
        }
        if (previewStrikethrough != null && run.style.isStrikethrough != null) {
          delete run.style.isStrikethrough;
        }
        if (previewUnderline != null && run.style.isUnderline != null) {
          delete run.style.isUnderline;
        }
        if (previewFontSize != null && run.style.fontSize) {
          delete run.style.fontSize;
        }
        if (previewFontFamily && run.style.fontFamily) {
          delete run.style.fontFamily;
        }
        if (previewTextColor && run.style.textColor != null) {
          delete run.style.textColor;
        }
      }
    }

    if (styleRuns && styleRuns.length > 0) {
      for (const styleRun of styleRuns) {
        if (
          styleRun.startOffset < styleRun.endOffset &&
          styleRun.style.fontSize
        ) {
          fontHeight = Math.max(
            fontHeight,
            self.scale * styleRun.style.fontSize,
          );
        }
      }
    }

    if (isBaseMergedCell) {
      for (let i = mergedCell.startColumn + 1; i <= mergedCell.endColumn; i++) {
        const nextWidth = getCellWidth(i) * self.scale;
        mergingWidth += nextWidth;
      }

      for (let i = mergedCell.startRow + 1; i <= mergedCell.endRow; i++) {
        const nextHeight = getCellHeight(i) * self.scale;
        mergingHeight += nextHeight;
      }
    }
    if (isColumnHeaderCellCap) {
      cellWidth = width + self.style.cellBorderWidth - cellStartX;
    }

    // Define hyperlink label/ref for String cell
    let linkLabel: string;
    let linkRef: string;
    let missingLinkRef = false;

    if (
      dataFormat &&
      isHyperlinkDataFormat(dataFormat) &&
      // Check if whether a cell is String or not
      ((typeof cellValue === 'object' && cellValue?.dataType === 'string') ||
        header?.type === 'string')
    ) {
      const formatStyle = dataFormat.style;
      if (dataFormat.value) {
        if (formatStyle === 'ltext') {
          linkLabel = dataFormat.value;
        } else if (table && formatStyle === 'lcolumn') {
          linkLabel = self.dataSource.getTableCellValueByColumnId?.(
            table,
            dataFormat.value,
            rowOrderIndex,
          );
        }

        if (formatStyle === 'rtext') {
          linkRef = dataFormat.value;
        } else if (table && formatStyle === 'rcolumn') {
          linkRef = self.dataSource.getTableCellValueByColumnId?.(
            table,
            dataFormat.value,
            rowOrderIndex,
          );
        }
      }

      if (formatStyle?.startsWith('r') && !linkRef) {
        missingLinkRef = true;
      }
    }

    const {
      tableHeaderCellTypeIconHeight: typeIconHeight,
      tableHeaderCellTypeIconMarginLeft: typeIconMarginLeft,
      tableHeaderCellTypeIconWidth: typeIconWidth,
      tableTotalRowDropdownIconWidth,
      tableTotalRowPadding,
    } = self.style.scaled;

    let cell: NormalCellDescriptor = {
      type: header.type,
      style: cellStyle,
      nodeType: 'canvas-datagrid-cell',
      x: cellStartX,
      y: cellStartY,
      // fontHeight: fontSize * self.scale,
      fontHeight: fontHeight,
      fontWeight: isBold ? 'bold' : '',
      fontStyle: isItalic ? 'italic' : '',
      isStrikethrough,
      isUnderline,
      fontSize,
      fontFamily,
      textColor,
      textRotation: customStyle?.textRotation ?? 0,
      backgroundColor,
      styleRuns: styleRuns,
      drawStyleRuns,
      linkRuns,
      explicitLink: !!linkRuns,
      horizontalAlignment: horizontalAlignment,
      verticalAlignment: verticalAlignment,
      paddingLeft:
        (tableContext?.groupContext?.isTopHeaderColumn &&
          self.style.scaled.tableGroupHeaderIconWidth +
            self.style.scaled.tableGroupHeaderIconPadding * 2) ||
        (!tableContext?.groupContext?.isTopHeaderColumn &&
          tableContext?.groupContext?.isHeaderColumn &&
          ((tableGroupHeader?.level || 0) + 1) *
            (self.style.scaled.tableGroupHeaderToggleButtonSize +
              self.style.scaled.tableGroupHeaderIconPadding * 2)) ||
        self.style.scaled[cellStyle + 'PaddingLeft'] ||
        0,
      paddingTop: self.style.scaled[cellStyle + 'PaddingTop'] || 0,
      paddingRight:
        (showTotalRowButton &&
          tableTotalRowDropdownIconWidth + tableTotalRowPadding * 2) ||
        ((isTableHeader || isColumnTableHeader) &&
          !tableContext?.groupContext?.isTopHeaderColumn &&
          typeIconWidth +
            typeIconMarginLeft * 2 +
            (table.style.showFilterButton
              ? self.style.scaled.tableDropdownButtonSize
              : 0)) ||
        (self.style[cellStyle + 'PaddingRight'] || 0) * self.scale,
      paddingBottom:
        (self.style[cellStyle + 'PaddingBottom'] || 0) * self.scale,
      prefixWidth: 0,
      wrapMode:
        ((isHeader ||
          isTableHeader ||
          isColumnTableHeader ||
          showTotalRowButton) &&
          'truncated') ||
        customWrapMode ||
        (header.wrapMode ?? self.style.cellWrapMode),
      dataFormat,
      truncateWithEllipsis: header.truncateWithEllipsis ?? true,
      lineHeight: self.style.cellLineHeight,
      lineSpacing: self.style.scaled.cellLineSpacing,
      offsetTop: self.canvasOffsetTop + cellStartY,
      offsetLeft: self.canvasOffsetLeft + cellStartX,
      active,
      hovered,
      groupHovered,
      selected,
      picked,
      selectedCount: 0,
      customHighlight,
      highlighted,
      moveHighlighted,
      isInFillRegion: statusDetector.isCellInFillRegion(
        rowOrderIndex,
        columnOrderIndex,
      ),
      width: cellWidth + mergingWidth,
      contentWidth: cellWidth + mergingWidth,
      height: source.rowHeight + mergingHeight,
      offsetWidth: cellWidth + mergingWidth,
      offsetHeight: source.rowHeight + mergingHeight,
      borderWidth: cellWidth,
      borderHeight: source.rowHeight,
      parentNode: self.parentNode,
      offsetParent: self.parentNode,
      isCorner: isCorner,
      isHeader: isHeader,
      isColumnHeader: isColumnHeader,
      isColumnHeaderCellCap: isColumnHeaderCellCap,
      isRowHeader: isRowHeader,
      isTableHeader: isTableHeader || isColumnTableHeader,
      isReadOnly,
      isValueReadOnly,
      isFilterable: isFilterable,
      openedFilter: openedFilter,
      header: header,

      columnIndex: columnOrderIndex,
      rowIndex: rowOrderIndex,

      viewRowIndex: rowOrderIndex,
      viewColumnIndex: columnOrderIndex,

      sortColumnIndex: headerIndex,
      sortRowIndex: rowIndex,

      isGrid: isGrid,
      isNormal: !isGrid && !isCorner && !isHeader,
      isEmpty:
        !isGrid &&
        (rawValue == null ||
          (typeof rawValue === 'string' && rawValue.trim().length === 0)),
      gridId: `${self.attributes.name || ''}` + rowIndex + ':' + headerIndex,
      innerHTML: '',
      // We don't need to support named columns yet, but when we do, the columns
      // will have to have undefined/null names instead of the column letters
      // being baked into them.
      value: rawValue,
      valueType,
      linkLabel,
      linkRef,
      error: missingLinkRef,
      locale: self.attributes.locale,
      isRowTree:
        rowOrderIndex >= 0 &&
        columnOrderIndex == self.cellTree.rowTreeColIndex &&
        self.cellTree.rows.length > 0 &&
        self.cellTree.rows[rowOrderIndex].icon,
      isColumnTree:
        columnOrderIndex >= 0 &&
        self.cellTree.columns[rowOrderIndex] &&
        self.cellTree.columns[rowOrderIndex][columnOrderIndex].icon,
      calculatedLineHeight: 0,
      paddedWidth: 0,
      paddedHeight: 0,
      subsumedLeftCellCount: 0,
      subsumedRightCellCount: 0,
      subsumedByLeftNeighbor: false,
      subsumedByRightNeighbor: false,
      firstSubsumedByRightNeighbor: false,

      mergedCell,
      isBaseMergedCell,

      borders: {},
      customBorders: customStyle?.borders || {},

      // @ts-nocheck
      event: undefined,

      table,
      tableContext,
      subtargets,
      onReady: {
        formattedValue: [],
      },
    };
    Object.defineProperty(cell, 'data', { get: deprecatedRowDataGetter });
    Object.defineProperty(cell, 'meta', {
      get(this: NormalCellDescriptor) {
        return self.dataSource.getCellMeta(this.rowIndex, this.columnIndex);
      },
    });

    cell.event = cell.event ?? {
      value: rawValue,
      header: source.header,
      cell,
    };

    Object.defineProperty(cell.event, 'row', { get: deprecatedRowDataGetter });

    try {
      cell = self.transformers.reduce((p, n) => n(p, source), cell);
    } catch (e) {
      console.error(e);
    }

    if (cell.hovered) {
      cell.hoverContext = self.currentDragContext;
    }

    if (cell.selected && cell.isHeader) {
      const isRow = cell.isRowHeader;
      cell.isNonReorderable = !statusDetector.isHeaderReorderable(
        isRow ? cell.rowIndex : cell.columnIndex,
        isRow,
      );
    }

    cell.calculatedLineHeight =
      cell.fontHeight * cell.lineHeight + cell.lineSpacing;
    cell.paddedHeight = cell.height - cell.paddingTop - cell.paddingBottom;

    // Need more padding left to accomodate the make sure we have enough
    // space for adding conditional formatting icon
    if (customStyle.iconSet) {
      const value = cell.meta?.parserData ?? cell.value;
      const icon = this.conditionalFormmatting.getIcon(
        cell,
        customStyle.iconSet,
        value,
      );
      if (icon) {
        cell.prefixWidth += icon.iconRect.width;
        cell.conditionalFormatIcon = icon;
      }
    }
    cell.paddedWidth = Math.max(
      cell.width - cell.paddingRight - cell.paddingLeft,
      0,
    );

    cellNode.cell = cell;

    if (cell.active) {
      frameCache.activeCell = cell;
    }
    if (mergedCell && !isBaseMergedCell) {
      cellNode.cell.drawingStatus = DrawingStatus.SkipNotDrawn;
    }
    // Check and assign if the cell should contain the table resize handle.
    if (table && !table.isSpilling) {
      cell.tableHeader = tableHeader;

      // Number type wrapMode should be truncated
      const cellType = columnTypeToString(cell.tableHeader.type);
      if (
        !cell.textRotation &&
        (cellType === 'int' || cellType === 'float' || cellType === 'decimal')
      ) {
        cell.wrapMode = 'truncated';
      }
    }

    if (tableContext) {
      if (
        tableContext?.groupContext?.isHeaderColumn &&
        (tableContext.groupContext.header?.rowType === 'intermediate' ||
          tableContext.groupContext.header?.rowType === 'dataStart')
      ) {
        const {
          tableGroupHeaderToggleButtonSize: buttonSize,
          tableGroupHeaderIconPadding: paddingX,
        } = self.style.scaled;

        const x = cell.x + cell.paddingLeft - paddingX - buttonSize;
        const y = cell.y + Math.max((cell.height - buttonSize) / 2, 0);

        subtargets.groupToggleButton = {
          x,
          y,
          width: buttonSize,
          height: buttonSize,
          collapsed: tableContext.groupContext.header.collapsed,
          hovered: cell.hovered,
        };
      }

      if (
        (tableContext?.isTotalRow || tableContext?.isSubtotalRow) &&
        showTotalRowButton
      ) {
        cell.onReady.formattedValue.push(() => {
          const { tableHeader: header } = cell;
          const {
            tableTotalRowDropdownIconHeight: iconHeight,
            tableTotalRowDropdownIconWidth: iconWidth,
            tableTotalRowPadding: padding,
          } = self.style.scaled;

          self.ctx.save();
          self.ctx.restore();

          const iconX = cell.x + cell.width - padding - iconWidth;
          const iconY = Math.max(cell.y + (cell.height - iconHeight) / 2, 0);

          const checkExpanded = () => {
            if (!subtargets.aggregationOptsButton) return;
            subtargets.aggregationOptsButton.expanded =
              self.activeAggregationOptsDropdown?.table == table &&
              self.activeAggregationOptsDropdown.header == header;
          };

          subtargets.aggregationOptsButton = {
            x: iconX,
            y: iconY,
            width: iconWidth,
            height: iconHeight,
            hovered: false,
            expanded: false,
            draw() {
              checkExpanded();

              const collapseIcon = getGenericIcon(
                subtargets.aggregationOptsButton.expanded
                  ? 'collapse'
                  : 'expand',
              );
              self.ctx.drawImage(
                collapseIcon,
                iconX,
                iconY,
                iconWidth,
                iconHeight,
              );
            },
          };

          checkExpanded();
        });
      }
    }

    if (
      cell.isTableHeader &&
      !cell.tableContext?.groupContext?.isTopHeaderColumn
    ) {
      if (cell.table.style.showFilterButton) {
        const {
          tableDropdownButtonSize: buttonSize,
          tableDropdownButtonHorizontalMargin: marginX,
          tableDropdownButtonVerticalMargin: marginY,
        } = self.style.scaled;
        const x = Math.max(cell.x + cell.width - buttonSize - marginX, cell.x);
        let y = cell.y + marginY;
        if (cell.verticalAlignment === 'middle') {
          y = cell.y + (cell.height - buttonSize) / 2;
        } else if (cell.verticalAlignment === 'bottom') {
          y = cell.y + cell.height - buttonSize - marginY;
        }

        cell.tableButton = {
          nodeType: 'table-dropdown-button',
          x,
          y,
          width: buttonSize,
          height: buttonSize,
          rowIndex: cell.rowIndex,
          columnIndex: cell.columnIndex,
        };
      }

      cell.onReady.formattedValue.push(() => {
        const typeIconRightMost = cell.tableButton?.x ?? cell.x + cell.width;
        const { y, height } = cell.tableButton ?? cell;
        const typeIconY = y + Math.round((height - typeIconHeight) / 2);
        const typeIconX = Math.min(
          cell.x + cell.paddingLeft + cell.text.width + typeIconMarginLeft,
          typeIconRightMost - typeIconWidth - typeIconMarginLeft,
        );

        // Define type icon button here because position of button is
        // not fixed and depend on remaining space
        cell.tableTypeButton = {
          nodeType: 'table-type-icon-button',
          x: typeIconX,
          y: typeIconY,
          width: typeIconWidth,
          height: typeIconHeight,
          rowIndex: cell.rowIndex,
          columnIndex: cell.columnIndex,
        };
      });
    }

    if (!isTableHeader && tableHeader?.borderStyle) {
      addColumnBorders(self, cellNode);
    }

    defineCustomBorders(self, frameCache, statusDetector, cellNode);
    if (
      !source.isLeftOverflowingInvisibleCell &&
      !source.isRightOverflowingInvisibleCell
    ) {
      defineIndicators(self, cellNode);
      defineSelectionHandles(self, frameCache, cell);
    }
  };
}
