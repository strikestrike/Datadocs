import { isSelectionSingular } from '../selections/util';
import { parseColorString, rgbaArrayToString } from '../util';
import type { CellLinkedNode } from '../types/drawing';
import { DrawingStatus } from '../types/drawing';
import { drawCellText } from './draw-cell-text';
import { defineSelectionHandles } from './cell-creator/define-selection-handle';
import { drawTableProps } from './table';
import type { NormalCellDescriptor } from '../types/cell';
import type { GridPrivateProperties } from '../types/grid';
import type { DrawFrameCache } from './frame-cache';
import { DrawUnhideIndicator } from './unhide-indicator';
import { DrawUtils } from './util';
import { DrawConditionalFormatting } from './draw-conditional-formatting';
import { DrawFilterButton } from './filter-button';
import { DrawCellTree } from './tree';
import { DrawCellErrorIndication } from './error-indication';

export class DrawCellCore {
  readonly utils = new DrawUtils(this.self);
  readonly cellTree = new DrawCellTree(this.self, this.utils);
  readonly filterButton = new DrawFilterButton(this.self, this.utils);
  readonly unhideIndicator = new DrawUnhideIndicator(this.self, this.utils);
  readonly conditionalFormmatting = new DrawConditionalFormatting(this.self);
  readonly errorIndication = new DrawCellErrorIndication(this.self);

  constructor(
    private readonly self: GridPrivateProperties,
    private readonly frameCache: DrawFrameCache,
  ) {}

  /**
   * Draw a cell (but not its borders).
   *
   * This method respects the {@link DrawingStatus} of the cell, so
   * if it is not in a pending state, it is not drawn.
   * @param {CellLinkedNode} cellNode To draw.
   */
  readonly drawCell = (cellNode: CellLinkedNode) => {
    const { source, cell } = cellNode;
    const { self, frameCache, unhideIndicator } = this;
    if (
      cell.drawingStatus !== undefined &&
      cell.drawingStatus !== DrawingStatus.Pending &&
      cell.drawingStatus !== DrawingStatus.PendingRedraw
    ) {
      // If the cell is cached and its not damaged, it is not drawn, however,
      // we need to add it to the visible cells because it is not included
      // in there.
      if (
        cell.drawingStatus === DrawingStatus.SkipCached &&
        !cellNode.source.isLeftOverflowingInvisibleCell &&
        !cellNode.source.isRightOverflowingInvisibleCell
      ) {
        this.pushVisibleCell(cell);
        defineSelectionHandles(this.self, this.frameCache, cell);
      }
      return;
    }
    // If the cell is in a pending redraw state, it might damage
    // other cells when redrawn, so we add it as a visible prop
    // so that if it overwrites another cell, e.g., a header,
    // it can also redraw itself. Also, notice that 'redrawing'
    // is different from 'drawing'.
    if (cell.drawingStatus === DrawingStatus.PendingRedraw) {
      frameCache.visibleProps.push(cell);
    }
    cell.drawingStatus =
      cell.drawingStatus === DrawingStatus.PendingRedraw
        ? DrawingStatus.Redrawn
        : DrawingStatus.Drawn;
    const { drawOrderByArrow, fillRect, blendColors } = this.utils;
    const { primarySelection } = frameCache;
    const customHighlightBg = cell.customHighlight?.meta?.color;
    let orderByArrowSize = 0;

    if (
      !cellNode.source.isLeftOverflowingInvisibleCell &&
      !cellNode.source.isRightOverflowingInvisibleCell
    ) {
      this.pushVisibleCell(cell);
    }

    if (self.dispatchEvent('beforerendercell', cell.event)) {
      return;
    }

    let bgColor: string =
      customHighlightBg ||
      cell.backgroundColor ||
      self.style[cell.style + 'BackgroundColor'] ||
      self.style.cellBackgroundColor;

    const blend = (fg: string) => {
      const rgb = blendColors(parseColorString(fg), parseColorString(bgColor));
      bgColor = rgbaArrayToString(rgb);
    };

    if (cell.groupHovered) {
      const color = self.style[cell.style + 'GroupHoverBackgroundColor'];
      if (color) blend(color);
    } else if (cell.hovered) {
      const color = self.style[cell.style + 'HoverBackgroundColor'];
      if (color) blend(bgColor);
    }
    if (cell.selected && !cell.isNormal) {
      const color = self.style[cell.style + 'SelectedBackgroundColor'];
      if (color) blend(color);
    } else if (
      cell.isNormal &&
      (cell.picked ||
        (cell.selected &&
          (!cell.active ||
            !isSelectionSingular(primarySelection) ||
            self.selections.length > 1)))
    ) {
      const colorOnTop: string =
        (cell.picked && self.style.pickedCellBackgroundColor) ||
        self.style[cell.style + 'SelectedBackgroundColor'] ||
        self.style.cellSelectedBackgroundColor;
      const count = cell.picked ? 1 : cell.selectedCount;

      // If the cell has been selected multiple times, blend the same background
      // multiple times to make it darker.  This is cheaper than drawing multiple
      // times.
      for (let i = 0; i < count; i++) {
        blend(colorOnTop);
      }
    } else if (cell.highlighted) {
      const color = self.style[cell.style + 'HighlightedBackgroundColor'];
      if (color) blend(color);
    }

    // Finally apply the color.
    self.ctx.fillStyle = bgColor;

    if (!cell.isGrid) {
      self.dispatchEvent('rendercell', cell.event);
      fillRect(cell.x, cell.y, cell.width, cell.height);
      // Make sure we are removing the border with no leftover if this cell
      // is a part of another cell on the left.
      if (cell.subsumedByLeftNeighbor) {
        self.ctx.strokeStyle = self.ctx.fillStyle;
        this.utils.drawLine(cell, 'left');
      }

      if (cell.isReadOnly) {
        this.drawReadOnlyCellCage(cellNode);
      }
    }
    self.dispatchEvent('afterrendercell', cell.event);
    if (
      source.requestedRowHeight !== undefined &&
      source.requestedRowHeight !== source.rowHeight
    ) {
      if (self.setRowHeight(cell.rowIndex, source.requestedColumnWidth, true)) {
        frameCache.checkScrollHeight = true;
      }
    }
    if (
      (self.attributes.showRowNumbers && cell.isRowHeader) ||
      !cell.isRowHeader
    ) {
      if (cell.isGrid) {
        self.dispatchEvent('beforerendercellgrid', cell.event);
      } else {
        const dir = frameCache.columnIdsDir.get(source.header.id);
        if (cell.isHeader && dir) {
          if (!self.dispatchEvent('renderorderbyarrow', cell.event)) {
            orderByArrowSize = drawOrderByArrow(
              cell.x + self.style.scaled[cell.style + 'PaddingLeft'],
              0,
              dir,
            );
          }
        }
        cell.orderByArrowWidth = orderByArrowSize;
        // Draw the text after all the other cells are drawn so that it doesn't
        // get overwritten by other cells, or draw it now if the cell is not
        // connected to another cell.
        if (cell.subsumedRightCellCount > 0) {
          cell.drawingStatus = DrawingStatus.PendingTextDraw;
        } else {
          drawCellText(
            this.self,
            this.utils,
            this.frameCache,
            this.cellTree,
            cellNode,
          );
        }
      }
    }

    if (cell.isFilterable) this.filterButton.drawOnCell(cell);
    if (
      cell.isRowHeader &&
      self.attributes.showRowNumbers &&
      self.attributes.showRowNumberGaps &&
      frameCache.hasSorter === false
    ) {
      /** @todo get row gap from the data frame */
      const hasRowGap = false;
      if (hasRowGap) {
        const barHeight = self.style.rowHeaderCellRowNumberGapHeight;
        const barColor = self.style.rowHeaderCellRowNumberGapColor;

        self.ctx.save();

        self.ctx.fillStyle = barColor;

        fillRect(cell.x, cell.y - barHeight / 2, cell.width, barHeight);

        self.ctx.restore();
      }
    }

    if (
      cell.containsUnhideIndicatorAtEnd ||
      cell.containsUnhideIndicatorAtStart
    ) {
      if (cell.isColumnHeader) {
        unhideIndicator.drawOnColumnHeader(cellNode, orderByArrowSize);
      }
      if (cell.isRowHeader) {
        unhideIndicator.drawOnRowHeader(cellNode);
      }
    }

    if (cell.table && cell.drawingStatus !== DrawingStatus.PendingTextDraw) {
      drawTableProps(self, this.utils, cellNode);
    }

    if (cell.drawingStatus !== DrawingStatus.PendingTextDraw) {
      this.conditionalFormmatting.draw(cellNode.cell);
    }

    // Draw cell's error indication
    this.errorIndication.draw(cell);

    if (cell.table?.isSpilling) {
      this.drawCellSpillIndicators(cellNode);
    }

    if (cell.tableContext?.hasResizeHandle && !cell.containsBottomRightHandle) {
      const x = cell.x + cell.width;
      const y = cell.y + cell.height;
      const { tableResizeHandleWidth: w, tableResizeHandleHeight: h } =
        self.style.scaled;
      self.ctx.fillStyle = self.style.tableResizeHandleColor;
      self.ctx.strokeStyle = self.style.tableResizeHandleColor;
      self.ctx.lineWidth = 1;
      fillRect(x - w, y - h, w, h);
      this.utils.strokeRect(x - w, y - h, w, h);
      fillRect(x - h, y - w, h, w);
      this.utils.strokeRect(x - h, y - w, h, w);
    }

    // Draw the resize marker a header when hovered.
    if (
      !self.pendingDragResize &&
      /row-resize|column-resize/.test(cell.hoverContext)
    ) {
      const resizingRow = self.currentDragContext === 'row-resize';
      const { x, y, width, height } = cell;
      const markerSize = Math.min(
        resizingRow ? height : width,
        self.style.scaled.resizeMarkerHeaderSize,
      );

      self.ctx.fillStyle = self.style.resizeMarkerColor;
      fillRect(
        x + (resizingRow ? 0 : width - markerSize),
        y + (resizingRow ? height - markerSize : 0),
        resizingRow ? width : markerSize,
        resizingRow ? markerSize : height,
      );
    }
  };

  private drawCellSpillIndicators = (cellNode: CellLinkedNode) => {
    const { self } = this;
    const { cell } = cellNode;
    const { scaled } = self.style;

    const margin = cell.active
      ? scaled.activeCellBorderWidth + scaled.cellSpillArrowMargin
      : 0;
    const x0 = cell.x + margin;
    const y0 = cell.y + margin;

    self.ctx.beginPath();
    self.ctx.moveTo(x0, y0);
    self.ctx.lineTo(x0 + scaled.cellSpillArrowSize, y0);
    self.ctx.lineTo(x0, y0 + scaled.cellSpillArrowSize);
    self.ctx.closePath();
    self.ctx.fillStyle = self.style.cellSpillArrowColor;
    self.ctx.fill();
  };

  private drawReadOnlyCellCage = (node: CellLinkedNode) => {
    const { self } = this;
    const { cell } = node;
    if (!cell.isReadOnly || !cell.isNormal || !cell.selected) return;

    const {
      readOnlyCellCageLineWidth: lineWidth,
      readOnlyCellCageSpacing: spacing,
    } = self.style.scaled;

    self.ctx.save();
    this.utils.radiusRect(cell.x, cell.y, cell.width, cell.height, 0);
    self.ctx.clip();

    self.ctx.lineWidth = lineWidth;
    self.ctx.strokeStyle = self.style.readonlyCellCageLineColor;

    for (let pos = -(spacing / 2); pos <= cell.width; pos += spacing) {
      this.utils.drawLines([
        cell.x + pos,
        cell.y + cell.height,
        cell.x + pos + spacing,
        cell.y,
      ]);
    }

    self.ctx.restore();
  };

  /**
   * Insert a cell into the `self.visibleCells` array.
   *
   * This method also updates `self.viewport` property.
   *
   * This method exists so that we can generate different props from cells
   * when they are actually drawn or just pushed into visible cells (as in
   * the case of cached cells).
   * @param {NormalCellDescriptor} cell To push.
   */
  private pushVisibleCell = (cell: NormalCellDescriptor) => {
    const { self, frameCache } = this;
    self.visibleCells.unshift(cell);
    self.viewport.addCell(cell);
    if (cell.isRowHeader) {
      if (
        cell.containsUnhideIndicatorAtStart ||
        cell.containsUnhideIndicatorAtEnd
      ) {
        frameCache.hasUnhideRowButtons = true;
      }

      if (cell.value) {
        frameCache.maxRowNumberColumnDigitCount = Math.max(
          frameCache.maxRowNumberColumnDigitCount,
          String(cell.value).length,
        );
      }
    }

    if (cell.containsUnhideIndicatorAtEnd) {
      self.visibleUnhideIndicators.push(
        cell.isRowHeader
          ? this.unhideIndicator.createRowIndicator(cell, false)
          : this.unhideIndicator.createColumnIndicator(cell, false),
      );
    }

    if (cell.containsUnhideIndicatorAtStart) {
      self.visibleUnhideIndicators.push(
        cell.isRowHeader
          ? this.unhideIndicator.createRowIndicator(cell, true)
          : this.unhideIndicator.createColumnIndicator(cell, true),
      );
    }
  };
}
