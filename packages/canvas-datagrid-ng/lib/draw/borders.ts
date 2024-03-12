import type { GridPosition } from '../position';
import type { CellBorder, GridPrivateProperties } from '../types';
import type { CellLinkedNode } from '../types/drawing';
import { DrawingStatus } from '../types/drawing';
import { dirToLinkedNodeKeys, getSurroundingNodes } from '../utils/graph-node';
import type { DrawFrameCache } from './frame-cache';
import type { DrawUtils } from './util';
import {
  borderList,
  borderOpposites,
  getCellCustomBorder,
  isSubsumedHiddenBorder,
} from './cell-creator/define-border';
import { parseColorString, rgbaArrayToString } from '../util';

export class DrawBorders {
  constructor(
    private readonly self: GridPrivateProperties,
    private readonly frameCache: DrawFrameCache,
    private readonly utils: DrawUtils,
  ) {}

  /**
   * Draw custom borders for cell (dashed, thick, double, etc).
   * The grid line will be drawn as custom borders as well.
   *
   * Custom borders should be drawn before any of other borders
   * as it can be overlapped by other borders such as activeCell,
   * selection, move cells borders
   * @param node
   * @returns
   */
  readonly drawCustomBorders = (node: CellLinkedNode) => {
    const { cell } = node;
    // Custom borders are on normal cells only
    if (!cell.isNormal) return;

    // Even though a merged cell not at top left will be marked as
    // DrawingStatus.SkipNotDrawn but its borders still need to be drawn
    if (
      cell.drawingStatus !== DrawingStatus.Drawn &&
      cell.drawingStatus !== DrawingStatus.Redrawn &&
      cell.drawingStatus !== DrawingStatus.PendingTextDraw &&
      cell.drawingStatus !== DrawingStatus.PendingBorderRedraw &&
      !cell.mergedCell
    ) {
      return;
    }

    // Put merged cell into visibleProps to notify other part e.g. header.
    if (cell.mergedCell && cell.isBaseMergedCell) {
      if (this.frameCache.visibleProps.indexOf(node.cell) === -1) {
        this.frameCache.visibleProps.push(cell);
      }
    }

    for (const pos of borderList) {
      const adjNode: CellLinkedNode = node[dirToLinkedNodeKeys[pos]];

      // When redrawing, we also draw the top and left borders (which we don't
      // normally do) to reapply them so that the redraw of the background of
      // the cells won't erase them.
      //
      // And when drawing, we need to draw top and left borders of a cell that
      // has siblings is inside merged cell, because most of cells inside
      // merged cell are marked as SkipNotDraw
      if (
        (pos === 'top' || pos === 'left') &&
        adjNode !== undefined &&
        cell.drawingStatus !== DrawingStatus.Redrawn &&
        cell.drawingStatus !== DrawingStatus.PendingTextDraw &&
        cell.drawingStatus !== DrawingStatus.PendingBorderRedraw &&
        !cell.mergedCell
      ) {
        continue;
      }

      // const adjBorder = adjNode?.cell.customBorders[borderOpposites[pos]];
      // const border = cell.customBorders[pos];

      // if (adjBorder) {
      //   this.drawCustomBorder(adjNode, borderOpposites[pos], adjBorder);
      // } else {
      //   this.drawCustomBorder(node, pos, border);
      // }

      const borderStyle = getCellCustomBorder(node, pos);
      this.drawCustomBorder(node, pos, borderStyle);
    }
  };

  /**
   * Draw borders for a given cell.
   *
   * The borders are drawn with the siblings in mind, and if the siblings'
   * borders are more important, e.g., when a sibling is selected but the
   * current cell is about to draw a normal border, the sibling's border is
   * prioritized.
   * @param {CellLinkedNode} node
   */
  readonly drawBorders = (node: CellLinkedNode) => {
    if (
      node.cell.drawingStatus !== DrawingStatus.Drawn &&
      node.cell.drawingStatus !== DrawingStatus.Redrawn &&
      node.cell.drawingStatus !== DrawingStatus.PendingTextDraw &&
      node.cell.drawingStatus !== DrawingStatus.PendingBorderRedraw
    ) {
      return;
    }

    const { self } = this;
    const { cell } = node;
    const { strokeRect } = this.utils;

    // We draw the active cell separately, assuming it will be thicker when
    // compared to normal borders.
    if (cell.active) {
      const { scaled } = self.style;
      self.ctx.lineWidth = scaled.activeCellBorderWidth;
      self.ctx.strokeStyle = self.style.activeCellBorderColor;

      // `def` is used to align the borders, assuming the active cell border
      // width is larger than the default border width.
      const shift =
        scaled.activeCellBorderWidth / 2 -
        Math.max(self.style.cellBorderWidth, scaled.cellBorderWidth) / 2;
      strokeRect(
        cell.x + shift,
        cell.y + shift,
        Math.floor(cell.width - scaled.activeCellBorderWidth / 2),
        Math.floor(cell.height - scaled.activeCellBorderWidth / 2),
      );
      return;
    }

    for (const pos of borderList) {
      const adjNode: CellLinkedNode = node[dirToLinkedNodeKeys[pos]];

      // When redrawing, we also draw the top and left borders (which we don't
      // normally do) to reapply them so that the redraw of the background of
      // the cells won't erase them.
      if (
        (pos === 'top' || pos === 'left') &&
        adjNode !== undefined &&
        node.cell.drawingStatus !== DrawingStatus.Redrawn &&
        node.cell.drawingStatus !== DrawingStatus.PendingTextDraw &&
        node.cell.drawingStatus !== DrawingStatus.PendingBorderRedraw
      ) {
        continue;
      }

      const adjBorder = adjNode?.cell.borders[borderOpposites[pos]];
      const border = cell.borders[pos];

      // Draw the neighbor's border if it is a special border (e.g., selection).
      if (
        adjNode?.cell?.picked ||
        adjNode?.cell?.active ||
        adjNode?.cell?.highlighted ||
        (adjBorder && !adjBorder.isHidden)
      ) {
        this.drawBorder(adjNode, borderOpposites[pos], adjBorder);
      } else {
        this.drawBorder(node, pos, border);
      }
    }

    node.cell.drawingStatus = DrawingStatus.SkipDrawn;
  };

  /**
   * Draw a border for a given cell.
   * @param {NormalCellDescriptor} cell
   * @param {GridPosition} position Which border side to draw.
   * @param {CellBorder} [border] The border data.
   */
  readonly drawBorder = (
    node: CellLinkedNode,
    position: GridPosition,
    border?: CellBorder,
  ) => {
    const { self } = this;
    const { cell } = node;
    const { drawLine } = this.utils;

    if (cell.active) {
      // Active cell borders are not normally drawn here, however, when the
      // is a sibling cell that is active, we might redraw it from the other
      // cells to preverse the borders of the active cell and avoid the
      // clipping effect.
      self.ctx.strokeStyle = self.style.activeCellBorderColor;
      self.ctx.lineWidth = Math.max(
        self.style.scaled.cellBorderWidth,
        self.style.cellBorderWidth,
      );
    } else if (
      !border ||
      border.isHidden ||
      border.style === 'solid' ||
      border.style === 'table' ||
      border.style === 'pick'
    ) {
      // return if the border is not define and the cell is a normal cell
      // because it has been drawn previously with custom borders
      if (cell.isNormal && !border) return;

      // Return if the border is hidden, or the cell is part of another cell,
      // and they are connected.
      if (
        !cell.highlighted &&
        (border?.isHidden || isSubsumedHiddenBorder(node, position))
      ) {
        return;
      }

      const selectedCount = Math.min(
        cell.selectedCount,
        node[dirToLinkedNodeKeys[position]]?.cell.selectedCount ?? 0,
      );

      if (cell.highlighted) {
        self.ctx.strokeStyle =
          self.style[cell.style + 'HighlightedBorderColor'];
      } else if (border?.style === 'pick') {
        self.ctx.strokeStyle = self.style.pickedCellBorderColor;
        self.ctx.lineWidth = Math.max(
          self.style.scaled.cellBorderWidth,
          self.style.cellBorderWidth,
        );
        self.ctx.setLineDash(self.style.pickedCellBorderSegments);
      } else if (selectedCount >= 1 && cell.isNormal) {
        let rgb: number[];

        // Blend the selection overlay color so that the lines don't look too
        // contrasty.
        for (let i = 0; i < cell.selectedCount; i++) {
          rgb = this.utils.blendColors(
            parseColorString(self.style.cellSelectedBackgroundColor),
            i > 0 ? rgb : parseColorString(self.style.cellBorderColor),
          );
        }
        self.ctx.strokeStyle = rgbaArrayToString(rgb);
      } else if (border?.style === 'table') {
        self.ctx.strokeStyle = self.style.tableBorderColor;
      } else {
        self.ctx.strokeStyle = self.style[cell.style + 'BorderColor'];
      }
      self.ctx.lineWidth = Math.max(
        self.style.scaled[cell.style + 'BorderWidth'],
        self.style[cell.style + 'BorderWidth'],
      );
    } else if (border.style === 'selection') {
      self.ctx.lineWidth = self.style.scaled.selectionOverlayBorderWidth;
      self.ctx.strokeStyle = self.style.selectionOverlayBorderColor;
    } else if (border.style === 'fill') {
      self.ctx.strokeStyle = self.style.fillOverlayBorderColor;
      self.ctx.lineWidth = Math.max(
        self.style.scaled.fillOverlayBorderWidth,
        self.style.fillOverlayBorderWidth,
      );
      self.ctx.setLineDash(self.style.fillOverlayBorderSegments);
    } else if (border.style === 'move') {
      self.ctx.lineWidth = Math.max(
        self.style.scaled.moveOverlayBorderWidth,
        self.style.moveOverlayBorderWidth,
      );
      self.ctx.strokeStyle = self.style.moveOverlayBorderColor;
      self.ctx.setLineDash(self.style.moveOverlayBorderSegments);
    }

    // When drawing border of cells at the edge of canvas, part of
    // the border will not being show. So take special care for those
    // by changing its coordinates a bit.
    if (cell.rowIndex === -1 || cell.columnIndex === -1) {
      let { x, y, width, height } = cell;
      const delta = Math.floor(self.style.scaled.cellBorderWidth / 2) + 1;
      if (cell.columnIndex === -1 && cell.x === 0) {
        x += delta;
        width -= delta;
      }

      if (cell.rowIndex === -1 && cell.y === 0) {
        y += delta;
        height -= delta;
      }
      const shouldDraw =
        cell.rowIndex !== cell.columnIndex ||
        (position !== 'right' && position !== 'bottom');
      if (shouldDraw) drawLine({ x, y, width, height }, position);
    } else {
      drawLine(cell, position);
    }

    self.ctx.setLineDash([]);
  };

  /**
   * Draw a border for a given normal cell
   * We also draw default border here in order to separate
   * it from other borders (selection, fill, move)
   * @param node
   * @param position
   * @param border
   */
  readonly drawCustomBorder = (
    node: CellLinkedNode,
    position: GridPosition,
    border?: CellBorder,
  ) => {
    const { self } = this;
    const { cell } = node;
    const { drawLines } = this.utils;

    // Return if the border is hidden, or the cell is part of another cell,
    // and they are connected.
    if (
      !cell.highlighted &&
      (border?.isHidden || isSubsumedHiddenBorder(node, position))
    ) {
      return;
    }

    // Not draw inner border of a merged cell
    if (cell.mergedCell) {
      const { mergedCell: merge } = cell;
      if (
        (merge.startColumn < cell.columnIndex && position === 'left') ||
        (merge.endColumn > cell.columnIndex && position === 'right') ||
        (merge.startRow < cell.rowIndex && position === 'top') ||
        (merge.endRow > cell.rowIndex && position === 'bottom')
      ) {
        return;
      }
    }

    let borderWidth: number;
    if (border) {
      self.ctx.fillStyle = self.ctx.strokeStyle =
        border.color || self.style.cellBorderColor;
      self.ctx.lineWidth = borderWidth =
        self.style.scaled[border.style + 'BorderWidth'];

      if (border.style === 'dashed' || border.style === 'dotted') {
        const segmentWidth =
          self.style.scaled[border.style + 'BorderSegmentWidth'];
        self.ctx.setLineDash([segmentWidth, segmentWidth]);
      }
    } else {
      const selectedCount = Math.min(
        cell.selectedCount,
        node[dirToLinkedNodeKeys[position]]?.cell.selectedCount ?? 0,
      );

      if (selectedCount >= 1 && cell.isNormal) {
        let rgb: number[];

        // Blend the selection overlay color so that the lines don't look too
        // contrasty.
        for (let i = 0; i < cell.selectedCount; i++) {
          rgb = this.utils.blendColors(
            parseColorString(self.style.cellSelectedBackgroundColor),
            i > 0 ? rgb : parseColorString(self.style.cellBorderColor),
          );
        }
        self.ctx.strokeStyle = rgbaArrayToString(rgb, true);
      } else {
        self.ctx.strokeStyle = self.style.cellBorderColor;
      }
      self.ctx.lineWidth = borderWidth = self.style.scaled['cellBorderWidth'];
    }

    // The border will be draw from (fromX, fromY) to (toX, toY)
    // There is an additional line from (fromX2, fromY2) to (toX2, toY2)
    // in case of double border, which is created from two thin borders
    let fromX: number;
    let fromY: number;
    let toX: number;
    let toY: number;
    let fromX2: number;
    let fromY2: number;
    let toX2: number;
    let toY2: number;
    // Should a border take priority horizontally
    let horizontalPriority: boolean;
    // Should a border take priority vertically
    let verticalPriority: boolean;
    const thinBorderWidth = self.getBorderWidth({ style: 'thin' });
    const isDoubleStyle = border && border.style === 'double';

    // An individual border position depends on its surrounding borders
    // and the border with higher priority should be draw over other
    // lower priority one.
    // Assume that the horizontal border will have higher priority and
    // right side border will win over left side one.
    if (position === 'bottom' || position === 'top') {
      let verticalWidth: number;
      const isBorderTop = position === 'top';
      const leftBottom = isBorderTop
        ? getCellCustomBorder(node, 'left')
        : getCellCustomBorder(node.lowerSibling, 'left');
      const leftTop = isBorderTop
        ? getCellCustomBorder(node.upperSibling, 'left')
        : getCellCustomBorder(node, 'left');
      const leftLeft = getCellCustomBorder(node.prevSibling, position);
      const rightBottom = isBorderTop
        ? getCellCustomBorder(node, 'right')
        : getCellCustomBorder(node.lowerSibling, 'right');
      const rightTop = isBorderTop
        ? getCellCustomBorder(node.upperSibling, 'right')
        : getCellCustomBorder(node, 'right');
      const rightRight = getCellCustomBorder(node.nextSibling, position);

      // Handle left part of top/bottom border
      verticalWidth = Math.max(
        self.getBorderWidth(leftTop),
        self.getBorderWidth(leftBottom),
      );
      if (!isDoubleStyle) {
        horizontalPriority = self.isHigherPriorityBorder(
          border?.style,
          [leftLeft?.style],
          true,
        );
        verticalPriority = self.isHigherPriorityBorder(
          border?.style,
          [leftTop?.style, leftBottom?.style],
          true,
        );
        fromX =
          horizontalPriority && verticalPriority
            ? cell.x - verticalWidth / 2
            : cell.x + verticalWidth / 2;
      } else {
        if (leftTop?.style === 'double') {
          fromX = cell.x + verticalWidth / 2 - thinBorderWidth;
        } else if (leftLeft?.style === 'double') {
          fromX = cell.x;
        } else {
          fromX = cell.x - verticalWidth / 2;
        }

        if (leftBottom?.style === 'double') {
          fromX2 = cell.x + verticalWidth / 2 - thinBorderWidth;
        } else if (leftLeft?.style === 'double') {
          fromX2 = cell.x;
        } else {
          fromX2 = cell.x - verticalWidth / 2;
        }
      }

      // Handle right part of top/bottom border
      verticalWidth = Math.max(
        self.getBorderWidth(rightTop),
        self.getBorderWidth(rightBottom),
      );
      if (!isDoubleStyle) {
        horizontalPriority = self.isHigherPriorityBorder(border?.style, [
          rightRight?.style,
        ]);
        verticalPriority = self.isHigherPriorityBorder(
          border?.style,
          [rightTop?.style, rightBottom?.style],
          true,
        );
        toX =
          horizontalPriority && verticalPriority
            ? cell.x + cell.borderWidth + verticalWidth / 2
            : cell.x + cell.borderWidth - verticalWidth / 2;
      } else {
        if (rightTop?.style === 'double') {
          toX = cell.x + cell.borderWidth - verticalWidth / 2 + thinBorderWidth;
        } else if (rightRight?.style === 'double') {
          toX = cell.x + cell.borderWidth;
        } else {
          toX = cell.x + cell.borderWidth + verticalWidth / 2;
        }

        if (rightBottom?.style === 'double') {
          toX2 =
            cell.x + cell.borderWidth - verticalWidth / 2 + thinBorderWidth;
        } else if (rightRight?.style === 'double') {
          toX2 = cell.x + cell.borderWidth;
        } else {
          toX2 = cell.x + cell.borderWidth + verticalWidth / 2;
        }
      }
      if (!isDoubleStyle) {
        fromY = toY = position === 'top' ? cell.y : cell.y + cell.borderHeight;
      } else {
        fromY = toY =
          position === 'top'
            ? cell.y - borderWidth / 2 + thinBorderWidth / 2
            : cell.y +
              cell.borderHeight -
              borderWidth / 2 +
              thinBorderWidth / 2;

        fromY2 = toY2 =
          position === 'top'
            ? cell.y + borderWidth / 2 - thinBorderWidth / 2
            : cell.y +
              cell.borderHeight +
              borderWidth / 2 -
              thinBorderWidth / 2;
      }
    } else {
      let horizontalWidth: number;
      const isBorderLeft = position === 'left';
      const topLeft = isBorderLeft
        ? getCellCustomBorder(node.prevSibling, 'top')
        : getCellCustomBorder(node, 'top');
      const topRight = isBorderLeft
        ? getCellCustomBorder(node, 'top')
        : getCellCustomBorder(node.nextSibling, 'top');
      const topTop = getCellCustomBorder(node.upperSibling, position);
      const bottomLeft = isBorderLeft
        ? getCellCustomBorder(node.prevSibling, 'bottom')
        : getCellCustomBorder(node, 'bottom');
      const bottomRight = isBorderLeft
        ? getCellCustomBorder(node, 'bottom')
        : getCellCustomBorder(node.nextSibling, 'bottom');
      const bottomBottom = getCellCustomBorder(node.lowerSibling, position);

      // Handle top part of left/right border
      horizontalWidth = Math.max(
        self.getBorderWidth(topLeft),
        self.getBorderWidth(topRight),
      );
      if (!isDoubleStyle) {
        horizontalPriority = self.isHigherPriorityBorder(border?.style, [
          topLeft?.style,
          topRight?.style,
        ]);
        verticalPriority = self.isHigherPriorityBorder(
          border?.style,
          [topTop?.style],
          true,
        );
        fromY =
          horizontalPriority && verticalPriority
            ? cell.y - horizontalWidth / 2
            : cell.y + horizontalWidth / 2;
      } else {
        if (topLeft?.style === 'double') {
          fromY = cell.y + horizontalWidth / 2;
        } else if (topTop?.style === 'double') {
          fromY = cell.y;
        } else {
          fromY = cell.y - horizontalWidth / 2;
        }

        if (topRight?.style === 'double') {
          fromY2 = cell.y + horizontalWidth / 2;
        } else if (topTop?.style === 'double') {
          fromY2 = cell.y;
        } else {
          fromY2 = cell.y - horizontalWidth / 2;
        }
      }

      // Handle bottom part of left/right border
      horizontalWidth = Math.max(
        self.getBorderWidth(bottomLeft),
        self.getBorderWidth(bottomRight),
      );
      if (!isDoubleStyle) {
        horizontalPriority = self.isHigherPriorityBorder(border?.style, [
          bottomLeft?.style,
          bottomRight?.style,
        ]);
        verticalPriority = self.isHigherPriorityBorder(
          border?.style,
          [bottomBottom?.style],
          true,
        );
        toY =
          horizontalPriority && verticalPriority
            ? cell.y + cell.borderHeight + horizontalWidth / 2
            : cell.y + cell.borderHeight - horizontalWidth / 2;
      } else {
        if (bottomLeft?.style === 'double') {
          toY = cell.y + cell.borderHeight - horizontalWidth / 2;
        } else if (bottomBottom?.style === 'double') {
          toY = cell.y + cell.borderHeight;
        } else {
          toY = cell.y + cell.borderHeight + horizontalWidth / 2;
        }

        if (bottomRight?.style === 'double') {
          toY2 = cell.y + cell.borderHeight - horizontalWidth / 2;
        } else if (bottomBottom?.style === 'double') {
          toY2 = cell.y + cell.borderHeight;
        } else {
          toY2 = cell.y + cell.borderHeight + horizontalWidth / 2;
        }
      }

      if (!isDoubleStyle) {
        fromX = toX = position === 'left' ? cell.x : cell.x + cell.borderWidth;
      } else {
        fromX = toX =
          position === 'left'
            ? cell.x - borderWidth / 2 + thinBorderWidth / 2
            : cell.x + cell.borderWidth - borderWidth / 2 + thinBorderWidth / 2;

        fromX2 = toX2 =
          position === 'left'
            ? cell.x + borderWidth / 2 - thinBorderWidth / 2
            : cell.x + cell.borderWidth + borderWidth / 2 - thinBorderWidth / 2;
      }
    }

    if (!isDoubleStyle) {
      drawLines([fromX, fromY, toX, toY]);
    } else {
      self.ctx.lineWidth = thinBorderWidth;
      drawLines([fromX, fromY, toX, toY]);
      drawLines([fromX2, fromY2, toX2, toY2]);
    }

    // In redrawing, after drawing custom borders, need to redraw
    // selection/move/fill borders that around the custom border
    // because these borders can be damaged.
    if (!this.frameCache.isRedrawn('scroll')) {
      for (const curNode of getSurroundingNodes(node)) {
        if (
          curNode &&
          curNode.cell.drawingStatus !== DrawingStatus.Drawn &&
          curNode.cell.drawingStatus !== DrawingStatus.Redrawn &&
          curNode.cell.drawingStatus !== DrawingStatus.PendingTextDraw &&
          curNode.cell.drawingStatus !== DrawingStatus.PendingBorderRedraw &&
          curNode.cell.drawingStatus !== DrawingStatus.SkipNotDrawn
        ) {
          curNode.cell.drawingStatus = DrawingStatus.Redrawn;
          this.drawBorders(curNode);
          if (this.frameCache.visibleProps.indexOf(curNode.cell) === -1)
            this.frameCache.visibleProps.push(curNode.cell);
        }
      }
    }

    self.ctx.setLineDash([]);
  };

  /**
   * Mark neightbour cell borders should be redrawn.
   *
   * After a cell is redrawn, its background might clear a part of existing
   * big size borders such as thick, double.
   * @param node
   */
  readonly requestRedrawCellBorders = (node: CellLinkedNode) => {
    if (node.cell.drawingStatus !== DrawingStatus.Redrawn) return;
    for (const curNode of getSurroundingNodes(node)) {
      if (
        curNode &&
        curNode.cell.isNormal &&
        (curNode.cell.drawingStatus === DrawingStatus.SkipDrawn ||
          curNode.cell.drawingStatus === DrawingStatus.SkipCached)
      ) {
        curNode.cell.drawingStatus = DrawingStatus.PendingBorderRedraw;
        // If the cell borders is going to be redrawn, it might damage
        // other cells (e.g., a header), so need to add it to visibleProps
        // so that the damaged cell know that it needs to be redrawn
        if (this.frameCache.visibleProps.indexOf(curNode.cell) === -1)
          this.frameCache.visibleProps.push(curNode.cell);
      }
    }
  };
}
