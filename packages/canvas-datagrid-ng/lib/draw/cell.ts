'use strict';

import type {
  CellBaseStyleName,
  GridHeader,
  GridPrivateProperties,
  NormalCellDescriptor,
} from '../types';
import type { DrawCache } from './cache';
import type { DrawFrameCache } from './frame-cache';
import { DrawCellTree } from './tree';
import { DrawUtils } from './util';
import type { CellLinkedNode } from '../types/drawing';
import { DrawingStatus } from '../types/drawing';
import { drawCellText } from './draw-cell-text';
import type { CellCreationContext } from './cell-creator/context';
import { CellListCreator } from './cell-list-creator/base';
import { CellListCreatorWithCache } from './cell-list-creator/with-cache';
import { DrawBorders } from './borders';
import { drawTableProps } from './table';
import { DrawCellCore } from './cell-core';

/**
 * This class is responsible for drawing cells and their props onto the canvas.
 */
export class DrawCell {
  readonly utils = new DrawUtils(this.self);

  readonly cellCore = new DrawCellCore(this.self, this.frameCache);
  readonly cellTree = new DrawCellTree(this.self, this.utils);
  readonly borders = new DrawBorders(this.self, this.frameCache, this.utils);

  readonly cellList = new CellListCreator(this.self, this.frameCache);
  readonly cellListWithCache = new CellListCreatorWithCache(this.cellList);
  readonly cellCreator = this.cellList.cellCreator;
  readonly derivedPropsCreator = this.cellCreator.derivedPropsCreator;

  /**
   * The last drawn cell at the bottom right corner of the grid.
   */
  private lastCell?: NormalCellDescriptor;

  constructor(
    private readonly self: GridPrivateProperties,
    private readonly cache: DrawCache,
    private readonly frameCache: DrawFrameCache,
  ) {}

  /**
   * Draws the cells.
   */
  draw = () => {
    this.drawFrozenRows();
    this.drawRows();
    this.clearBlankAreas();
    this.drawHeaders();
  };

  /**
   * This method ensures that non-drawn areas of the grid are kept clean, since
   * we do not do full `clearRect` for each draw.
   *
   * Note that this doesn't always run, so performance isn't an issue.
   */
  private clearBlankAreas = () => {
    const { self, frameCache, lastCell } = this;
    if (
      !lastCell ||
      (lastCell.x + lastCell.width >= self.width &&
        lastCell.y + lastCell.height >= self.height)
    ) {
      return;
    }

    const x =
      lastCell.x +
      lastCell.width +
      self.style.scaled.cellBorderWidth / 2 +
      self.canvasOffsetLeft;
    const y =
      lastCell.y +
      lastCell.height +
      self.style.scaled.cellBorderWidth / 2 +
      self.canvasOffsetTop;

    self.ctx.beginPath();
    self.ctx.moveTo(x, frameCache.topAreaHeight);
    self.ctx.lineTo(self.width, frameCache.topAreaHeight);
    self.ctx.lineTo(self.width, self.height);
    self.ctx.lineTo(0, self.height);
    self.ctx.lineTo(0, y);
    self.ctx.lineTo(x, y);
    self.ctx.lineTo(x, frameCache.topAreaHeight);
    self.ctx.fillStyle = self.style.gridBackgroundColor;
    self.ctx.fill();
  };

  /**
   * Draw the corner cell arrow.
   * @param cornerCellNode The node that contains the corner cell.
   */
  private drawCornerCellArrow = (cornerCellNode: CellLinkedNode) => {
    const { self } = this;
    const { cell } = cornerCellNode;
    const { scaled } = self.style;

    const x0 = cell.x + cell.width - scaled.cornerCellArrowMargin;
    const y0 = cell.y + cell.height - scaled.cornerCellArrowMargin;

    self.ctx.beginPath();
    self.ctx.moveTo(x0, y0);
    self.ctx.lineTo(x0 - scaled.cornerCellArrowSize, y0);
    self.ctx.lineTo(x0, y0 - scaled.cornerCellArrowSize);
    self.ctx.closePath();
    self.ctx.fillStyle = self.style.cornerCellArrowBackgroundColor;
    self.ctx.fill();
  };

  /**
   * Draw the invisible base cells of the merged cells.
   * @param rows Rows to use to guess which merged cells needs drawing.
   * @see createInvisibleMergedCells
   */
  private drawInvisibleMergedCells = (rows: CellLinkedNode[]) => {
    const expandingRows = this.cellList.createInvisibleMergedCells(rows);
    if (expandingRows?.length) this.drawCellList(expandingRows);
  };

  /**
   * Draw the column and row headers that are visible.
   */
  private drawHeaders = () => {
    const { self, frameCache } = this;
    const { columnHeaderCellHeight, rowHeaderCellWidth } = this.frameCache;

    if (self.attributes.showRowHeaders) {
      if (this.cache.frozenRowHeaders) {
        // Draw the row headers generated by the frozen cells.
        this.drawCellList(this.cache.frozenRowHeaders);
      }

      // Draw the row headers generated by the normal cells and clip them if
      // they might end up being drawn over the frozen row headers.
      if (this.cache.rowHeaders) {
        if (self.frozenRow > 0) {
          self.ctx.save();
          this.utils.clipFrozenArea(1);
        }
        this.drawCellList(this.cache.rowHeaders);
        if (self.frozenRow > 0) {
          self.ctx.restore();
        }
      }
    }

    let lastColNode: CellLinkedNode | undefined;

    if (self.attributes.showColumnHeaders) {
      // Draw the column headers generated by the frozen cells.
      if (this.cache.frozenColumnHeaders) {
        this.drawCellList([this.cache.frozenColumnHeaders]);
      }

      // Draw the column headers generated by the normal cells and clip them if
      // they might end up being drawn over the frozen column headers.
      if (this.cache.columnHeaders) {
        if (self.frozenColumn > 0) {
          self.ctx.save();
          this.utils.clipFrozenArea(2);
        }
        lastColNode = this.drawCellList([this.cache.columnHeaders]);
        if (self.frozenColumn > 0) {
          self.ctx.restore();
        }
      }
    }

    if (self.attributes.showColumnHeaders) {
      const context: CellCreationContext = {
        startRowIndex: 0,
        startColumnIndex: 0,
        nextX: frameCache.rowGroupAreaWidth,
        nextY: frameCache.columnGroupAreaHeight,
      };

      // Draw the column cap if there isn't enough columns to cover the whole
      // grid.
      if (
        lastColNode &&
        lastColNode.cell.x + lastColNode.cell.width < frameCache.width
      ) {
        context.nextX = lastColNode.cell.x + lastColNode.cell.width;
        const cellCap: GridHeader = {
          id: '',
          dataKey: '',
          width: self.style.scrollBarWidth,
          style: 'columnHeaderCellCap',
          isColumnHeaderCell: true,
          isColumnHeaderCellCap: true,
          type: 'string',
          // TODO: The following property looks like incorrect
          // index: schema.length,
        };
        const cellNode: CellLinkedNode = {
          source: {
            cellValue: '',
            // rowData: { endCap: '' },
            rowOrderIndex: -1,
            rowIndex: -1,
            header: cellCap,
            headerIndex: -1,
            columnOrderIndex: -1,
            columnWidth: rowHeaderCellWidth,
            rowHeight: columnHeaderCellHeight,
          },
        };
        this.cellCreator.createCell(context, cellNode);
        this.derivedPropsCreator.calculateRelationalCellData(cellNode);
        this.cellCore.drawCell(cellNode);
        this.borders.drawBorders(cellNode);
      }
      // Draw the corner cell that cell appears on the top-left side of the
      // grid.
      if (self.attributes.showRowHeaders) {
        context.nextX = frameCache.rowGroupAreaWidth;
        context.nextY = frameCache.columnGroupAreaHeight;
        const cornerHeader: GridHeader = {
          id: '',
          dataKey: 'cornerCell',
          width: rowHeaderCellWidth,
          style: 'cornerCell',
          type: 'string',
        };

        const cellNode: CellLinkedNode = {
          source: {
            cellValue: '',
            // rowData: { cornerCell: '' },
            rowOrderIndex: -1,
            rowIndex: -1,
            header: cornerHeader,
            headerIndex: -1,
            columnOrderIndex: -1,
            columnWidth: rowHeaderCellWidth,
            rowHeight: columnHeaderCellHeight,
          },
        };

        this.cellCreator.createCell(context, cellNode);
        this.derivedPropsCreator.calculateRelationalCellData(cellNode);
        this.cellCore.drawCell(cellNode);
        this.borders.drawBorders(cellNode);

        this.drawCornerCellArrow(cellNode);
      }
    }
  };

  /**
   * A helper method to draw a row of cells.
   * @param {CellLinkedNode} curNode The first node of the row.
   * @returns {CellLinkedNode} The last node of the row.
   */
  private drawRow = (curNode?: CellLinkedNode) => {
    if (!curNode || !curNode.cell) return;

    const { self } = this;
    let lastNode = curNode;

    self.viewport.setRowHeight(
      curNode.source.rowOrderIndex,
      curNode.source.rowHeight,
    );

    while (curNode) {
      this.cellCore.drawCell(curNode);
      lastNode = curNode;
      curNode = curNode.nextSibling;
    }

    return lastNode;
  };

  /**
   * Draw all the frozen rows.
   *
   * @see drawRows
   * @see drawHeaders
   */
  private drawFrozenRows = () => {
    const { self, cellListWithCache } = this;
    const { clipFrozenArea } = this.utils;
    const { topAreaHeight, leftAreaWidth } = this.frameCache;

    const startX = leftAreaWidth;
    const startY = topAreaHeight;

    const context: CellCreationContext = {
      nextX: startX,
      nextY: startY,
      startRowIndex: 0,
      startColumnIndex: 0,
      untilRowIndex: self.frozenRow,
      untilColumnIndex: self.frozenColumn,
    };

    let rows: CellLinkedNode[] | undefined;

    // This draws the frozen the frozen area that is not scrollable on the
    // top-left side of the grid when there is both frozen rows and columns.
    //
    // This is how it appears:
    // |x|-|
    // |-|-|
    if (self.frozenRow > 0 && self.frozenColumn > 0) {
      rows = this.cache.frozenCellsTopLeft =
        cellListWithCache.createCellListWithCache(
          context,
          this.cache.frozenCellsTopLeft,
        );
      this.drawCellList(rows);
    }

    self.lastFrozenRowPixel = context.nextY;
    self.lastFrozenColumnPixel = context.nextX;

    // Draw the frozen area that is only horizontally scrollable.
    // This is also used to create the frozen row headers.
    //
    // This is how it appears:
    // |x|x| or |-|x| (with frozen columns)
    // |-|-|    |-|-|
    if (self.frozenRow > 0) {
      context.nextX =
        -self.dp(self.scrollPixelLeft) + this.getNonFrozenColumnStartX();
      context.nextY = startY;
      context.startColumnIndex = self.scrollIndexLeft;
      context.untilColumnIndex = undefined;

      if (self.frozenColumn > 0) {
        self.ctx.save();
        clipFrozenArea(2);
      }

      rows = this.cache.frozenCellsTopRight =
        cellListWithCache.createCellListWithCache(
          context,
          this.cache.frozenCellsTopRight,
        );
      this.drawCellList(rows);
      this.drawInvisibleMergedCells(rows);

      this.cache.frozenRowHeaders = cellListWithCache.createRowHeadersWithCache(
        rows,
        this.cache.frozenRowHeaders,
      );

      if (self.frozenColumn > 0) {
        self.ctx.restore();
      }

      self.lastFrozenRowPixel = context.nextY;
    }

    // Draw the frozen area that is only vertically scrollable.
    // This is also used to create the frozen column headers.
    //
    // This is how it appears:
    // |x|-| or |-|-| (with frozen rows)
    // |x|-|    |x|-|
    if (self.frozenColumn > 0) {
      context.nextX = startX;
      context.nextY =
        (!self.attributes.snapToRow ? -self.dp(self.scrollPixelTop) : 0) +
        this.getNonFrozenRowStartY();
      context.startRowIndex = self.scrollIndexTop;
      context.untilRowIndex = undefined;
      context.startColumnIndex = 0;
      context.untilColumnIndex = self.frozenColumn;

      if (self.frozenRow > 0) {
        self.ctx.save();
        clipFrozenArea(1);
      }

      rows = this.cache.frozenCellsBottomLeft =
        cellListWithCache.createCellListWithCache(
          context,
          this.cache.frozenCellsBottomLeft,
        );
      this.drawCellList(rows);
      this.drawInvisibleMergedCells(rows);

      if (rows[0]) {
        this.cache.frozenColumnHeaders =
          cellListWithCache.createColumnHeadersWithCache(
            rows[0],
            this.cache.frozenColumnHeaders,
          );
      }

      if (self.frozenRow > 0) {
        self.ctx.restore();
      }

      self.lastFrozenColumnPixel = context.nextX;
    }
  };

  /**
   * Draw the normal rows.
   *
   * This draws a both horizontally and vertically scrollable
   * part of the grid when compared to frozen areas.
   *
   * This is how it appears in the grid:
   *    |x|x|         |-|-|              |-|x|               |-|-|
   *    |x|x|         |x|x|              |-|x|               |-|x|
   * Not frozen | With frozen rows | With frozen cols | With frozen both
   *
   * @see drawFrozenRows
   * @see drawHeaders
   */
  private drawRows = () => {
    const { self, cellList, cellListWithCache } = this;
    const { rows: rowsCount } = this.frameCache.dataSourceState;
    const { clipFrozenArea } = this.utils;

    if (self.frozenRow > 0 || self.frozenColumn) {
      self.ctx.save();
      if (self.frozenRow > 0 && self.frozenColumn > 0) {
        clipFrozenArea(0);
      } else if (self.frozenRow > 0) {
        clipFrozenArea(1);
      } else {
        clipFrozenArea(2);
      }
    }

    const startX =
      -self.dp(self.scrollPixelLeft) + this.getNonFrozenColumnStartX();
    const context: CellCreationContext = {
      nextX: startX,
      nextY:
        (!self.attributes.snapToRow ? -self.dp(self.scrollPixelTop) : 0) +
        this.getNonFrozenRowStartY(),
      startRowIndex: self.scrollIndexTop,
      startColumnIndex: self.scrollIndexLeft,
    };

    const rows = (this.cache.cells = cellListWithCache.createCellListWithCache(
      context,
      this.cache.cells,
    ));
    let lastNode = this.drawCellList(rows);
    this.drawInvisibleMergedCells(rows);

    if (rows[0]) {
      this.cache.columnHeaders = cellListWithCache.createColumnHeadersWithCache(
        rows[0],
        this.cache.columnHeaders,
      );
    }
    this.cache.rowHeaders = cellListWithCache.createRowHeadersWithCache(
      rows,
      this.cache.rowHeaders,
    );

    if (self.attributes.showNewRow) {
      context.nextX = startX;

      const curNode = cellList.createCellListForRow(
        context,
        self.newRow,
        rowsCount,
        // rowsCount,
      );

      lastNode = this.drawCellList([curNode]);
      this.cache.rowHeaders.push(curNode);
    }

    if (lastNode) {
      self.scrollIndexRight = lastNode.source.columnOrderIndex;
      self.scrollPixelRight = lastNode.cell.x;
      self.scrollIndexBottom = lastNode.source.rowOrderIndex;
      self.scrollPixelBottom = lastNode.cell.y;
      this.lastCell = lastNode.cell;
    }

    if (self.frozenRow > 0 || self.frozenColumn) {
      self.ctx.restore();
    }
  };

  /**
   * Draw a list of cells include in multiple rows.
   * @param {CellLinkedNode[]} nodes To draw.
   * @returns {CellLinkedNode} The last node on the column of the last row.
   */
  private drawCellList = (nodes: CellLinkedNode[]) => {
    let lastNode: CellLinkedNode | undefined;

    const drawCellsWithOverflowingText = (firstNode: CellLinkedNode) => {
      let curNode = firstNode;
      while (curNode) {
        const { cell } = curNode;
        if (cell.drawingStatus === DrawingStatus.PendingTextDraw) {
          drawCellText(
            this.self,
            this.utils,
            this.frameCache,
            this.cellTree,
            curNode,
          );
          if (cell.table) drawTableProps(this.self, this.utils, curNode);
          cell.drawingStatus = DrawingStatus.Redrawn;
        }
        curNode = curNode.nextSibling;
      }
    };

    for (const curNode of nodes) {
      if (!curNode || !curNode.source) continue;
      lastNode = this.drawRow(curNode);
      drawCellsWithOverflowingText(curNode);
    }

    // No need to reques redraw cell borders if draw grid without cache
    if (!this.frameCache.isRedrawn('scroll')) {
      for (let curNode of nodes) {
        while (curNode) {
          if (curNode.cell.isNormal)
            this.borders.requestRedrawCellBorders(curNode);
          curNode = curNode.nextSibling;
        }
      }
    }

    // Borders will be divided into two layers, the first layer is
    // for custom borders (thick, dashed, double, etc) and the second
    // one is for selection, move, fill, etc.
    //
    // The reason is selection/move/fill borders will be drawn on top
    // of custom borders (according to Google Sheets), and some big size
    // borders such as thick/double could go outside the cell area and
    // damage some part of the previously drawn cells.
    for (let curNode of nodes) {
      while (curNode) {
        this.borders.drawCustomBorders(curNode);
        curNode = curNode.nextSibling;
      }
    }

    for (let curNode of nodes) {
      while (curNode) {
        this.borders.drawBorders(curNode);
        curNode = curNode.nextSibling;
      }
    }

    return lastNode;
  };

  /**
   * Changed: This no longer modifies the cordinates.
   *
   * Get the last frozen pixel on the `x` axis to start drawing from.
   *
   * If there is no frozen column, this will return a value that is the end of
   * the row headers, and if there is, this will add the frozen marker length
   * to the value so that the frozen marker isn't drawn over the cells.
   * @returns {number} The last frozen pixel on the x axis.
   * @see getNonFrozenRowStartY
   */
  private getNonFrozenColumnStartX = () => {
    const { self } = this;
    return self.lastFrozenColumnPixel;
  };

  /**
   * Changed: This no longer modifies the cordinates.
   *
   * Get the last frozen pixel on the `y` axis to start drawing from.
   *
   * If there is no frozen row, this will return a value that is the end of
   * the column headers, and if there is, this will add the frozen marker
   * length to the value so that the frozen marker isn't drawn over the cells.
   * @returns {number} The last frozen pixel on the y axis.
   * @see getNonFrozenColumnStartX
   */
  private getNonFrozenRowStartY = () => {
    const { self } = this;
    return self.lastFrozenRowPixel;
  };

  /**
   * Get Horizontal alignment for cell base on type and cell style
   * @param cellNode
   * @param cellStyle
   * @returns
   */
  private getHorizontalAlignment = (
    cellNode: CellLinkedNode,
    cellStyle: CellBaseStyleName,
  ): string => {
    const { self } = this;
    const { source } = cellNode;
    const { header } = source;
    const isNumeric =
      header.type === 'number' ||
      header.type === 'int' ||
      header.type === 'float';
    return isNumeric ? 'right' : self.style[cellStyle + 'HorizontalAlignment'];
  };
}
