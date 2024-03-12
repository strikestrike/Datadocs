import { isCellSelected, isHeaderHighlighted } from '../../selections/util';
import { defineStylePreview } from '../../style/preview/util';
import type { CellLinkedNode } from '../../types/drawing';
import { DrawingStatus } from '../../types/drawing';
import type { GridPrivateProperties } from '../../types/grid';
import { getSurroundingNodes } from '../../utils/graph-node';
import type { CellCreationContext } from '../cell-creator/context';
import { defineCustomBorders } from '../cell-creator/define-border';
import { CellStatusDetector } from '../cell-creator/status-detector';
import type { DrawFrameCache } from '../frame-cache';
import type { CellListCreator } from './base';

export class CellListCreatorWithCache {
  private readonly frameCache: DrawFrameCache;
  private readonly self: GridPrivateProperties;
  private readonly statusDetector: CellStatusDetector;

  constructor(readonly base: CellListCreator) {
    this.self = base.self;
    this.frameCache = base.frameCache;
    this.statusDetector = new CellStatusDetector(this.self, this.frameCache);
  }

  /**
   * Create a normal cell list, or use the cells that are still valid from the
   * previous frame.
   * @param context
   * @param cachedNode The cached cells from the previous frame.
   * @returns The array of rows.
   * @see createCellList
   * @see drawCellList
   */
  readonly createCellListWithCache = (
    context: CellCreationContext,
    cachedNode?: CellLinkedNode[],
  ): CellLinkedNode[] => {
    const { base } = this;
    if (
      this.frameCache.isRedrawn('scroll') ||
      !cachedNode ||
      !cachedNode.length
    ) {
      const nodes = base.createCellList(context);
      defineStylePreview(this.self, nodes);
      return nodes;
    }

    // matched cache
    let lastNode: CellLinkedNode | undefined;
    for (let node of cachedNode) {
      while (node) {
        if (node.cell.drawingStatus !== DrawingStatus.SkipNotDrawn) {
          if (this.isCellCacheInvalid(node)) {
            base.cellCreator.recreateCachedCell(node);
            // Check surrounding cells a given invalid cached cell
            this.checkInvalidSurroundingCells(node);
          } else if (
            node.cell.drawingStatus !== DrawingStatus.PendingRedraw &&
            node.cell.drawingStatus !== DrawingStatus.RequestRedrawn
          ) {
            // The cell's drawing status may already be in `PendingRedraw`,
            // which might happen if grid is being scaled fractionally. In
            // that case, consider the cell's cache invalid and do not change
            // it here before the draw.
            node.cell.drawingStatus = DrawingStatus.SkipCached;
          }
        } else if (node.cell.mergedCell) {
          // Event thought the merge has status SkipNotDrawn, its borders
          // information should be up to date. The other cells might use
          // it to render their borders.
          defineCustomBorders(
            this.self,
            this.frameCache,
            this.statusDetector,
            node,
          );
        }
        lastNode = node;
        node = node.nextSibling;
      }
    }
    context.nextX =
      lastNode.cell.x +
      (lastNode.source.requestedColumnWidth ?? lastNode.source.columnWidth);
    context.nextY =
      lastNode.cell.y +
      (lastNode.source.requestedRowHeight ?? lastNode.source.rowHeight);

    defineStylePreview(this.self, cachedNode);
    // Update DrawingStatus for poluted cells
    this.requestRedrawingCells(cachedNode);
    return cachedNode;
  };

  /**
   * Create column headers using the normals, or use a cache if it is valid and
   * only update column headers that hava changed.
   * @param {CellLinkedNode} cellNode The normal cells tied together as siblings.
   * @param {CellLinkedNode} cachedNode The column headers from the previous frame.
   * @returns {CellLinkedNode} The resulting column headers.
   * @see createColumnHeaders
   */
  readonly createColumnHeadersWithCache = (
    cellNode: CellLinkedNode,
    cachedNode: CellLinkedNode,
  ): CellLinkedNode => {
    if (this.frameCache.isRedrawn('scroll') || !cachedNode) {
      return this.base.createColumnHeaders(cellNode);
    }

    let curNode = cachedNode;
    while (curNode) {
      const { cell } = curNode;
      if (this.isCellCacheInvalid(curNode)) {
        this.base.cellCreator.recreateCachedCell(curNode);
      } else {
        cell.drawingStatus = DrawingStatus.SkipCached;
      }
      curNode = curNode.nextSibling;
    }
    return cachedNode;
  };

  /**
   * Create row headers using the normal cells, or use the cached headers only
   * updating the ones that have changed.
   * @param {CellLinkedNode[]} rows Whose first nodes are used to create row headers.
   * @param {CellLinkedNode[]} cachedNode The row headers from the previous frame.
   * @returns {CellLinkedNode[]} The resulting row headers.
   * @see createRowHeaders
   */
  readonly createRowHeadersWithCache = (
    rows: CellLinkedNode[],
    cachedNode: CellLinkedNode[],
  ): CellLinkedNode[] => {
    if (
      this.frameCache.isRedrawn('scroll') ||
      !cachedNode ||
      !cachedNode.length
    ) {
      return this.base.createRowHeaders(rows);
    }

    for (let node of cachedNode) {
      while (node) {
        const { cell } = node;
        if (this.isCellCacheInvalid(node)) {
          this.base.cellCreator.recreateCachedCell(node);
        } else {
          cell.drawingStatus = DrawingStatus.SkipCached;
        }
        node = node.nextSibling;
      }
    }
    return cachedNode;
  };

  /**
   * Request redraw poluted cells found at {@link DrawCell.checkInvalidSurroundingCells}
   *
   * It's simply replace flag {@link DrawingStatus.RequestRedrawn} by
   * {@link DrawingStatus.PendingRedraw} for poluted cells
   * @param rows
   */
  readonly requestRedrawingCells = (rows: CellLinkedNode[]) => {
    if (
      this.frameCache.isRedrawn('selection') ||
      this.frameCache.isRedrawn('fillOverlay') ||
      this.frameCache.isRedrawn('moveOverlay')
    ) {
      for (let node of rows) {
        while (node) {
          if (node.cell.drawingStatus === DrawingStatus.RequestRedrawn)
            node.cell.drawingStatus = DrawingStatus.PendingRedraw;
          node = node.nextSibling;
        }
      }
    }
  };

  /**
   * Checks if the given cached is still valid.
   *
   * The checking is done on things that has been invalidated. For instance,
   * if the selections changed, we check if the cell is still selected.
   *
   * If the cell is under a prop, the cache for that cell is always considered
   * invalid because we cannot know if the prop will be in the same place next
   * time. To give an example, the selection handles are drawn on top of cells
   * and may change positions depending on the selection, and they are also
   * generated by the cell themselves, so we cannot exactly know if they have
   * changed positions.
   *
   * Also, we always check for the borders and if they are any different
   * since a cell may stay selected even when it is no longer at the edge of
   * a selection.
   * @param {CellLinkedNode} cell The cached cell node to check.
   * @returns True if the cache for the cell is invalid
   */
  private isCellCacheInvalid = (node: CellLinkedNode): boolean => {
    const { self, statusDetector } = this;
    const { cell } = node;
    const prevCell = node.prevSibling?.cell;
    const { scaled } = self.style;
    return (
      node.cell.drawingStatus === DrawingStatus.PendingRedraw ||
      ((self.frozenRow > 0 || cell.isRowHeader) &&
        cell.y + cell.height > self.lastFrozenRowPixel &&
        cell.y < self.lastFrozenRowPixel + scaled.frozenMarkerShadowBlur) ||
      (cell.subsumedByLeftNeighbor &&
        (prevCell.drawingStatus === DrawingStatus.Pending ||
          prevCell.drawingStatus === DrawingStatus.PendingRedraw ||
          prevCell.drawingStatus === DrawingStatus.PendingTextDraw)) ||
      ((self.frozenColumn > 0 || cell.isColumnHeader) &&
        cell.x + cell.width > self.lastFrozenColumnPixel &&
        cell.x < self.lastFrozenColumnPixel + scaled.frozenMarkerShadowBlur) ||
      (this.frameCache.isRedrawn('selection') &&
        (cell.selected !==
          isCellSelected(self.selections, cell.rowIndex, cell.columnIndex) ||
          cell.picked != self.isCellPicked(cell.rowIndex, cell.columnIndex) ||
          (cell.isHeader &&
            cell.highlighted !==
              isHeaderHighlighted(
                self.selections,
                cell.rowIndex,
                cell.columnIndex,
              )) ||
          cell.active !==
            (cell.rowIndex === self.activeCell.rowIndex &&
              cell.columnIndex === self.activeCell.columnIndex))) ||
      (this.frameCache.isRedrawn('fillOverlay') &&
        cell.isInFillRegion !==
          statusDetector.isCellInFillRegion(cell.rowIndex, cell.columnIndex)) ||
      (this.frameCache.isRedrawn('moveOverlay') &&
        cell.moveHighlighted !==
          statusDetector.isCellMoveHighlighted(
            cell.rowIndex,
            cell.columnIndex,
          )) ||
      this.frameCache.isUnderProp(cell) ||
      defineCustomBorders(self, this.frameCache, statusDetector, node) ||
      (this.frameCache.isRedrawn('hover') &&
        (cell.hovered !==
          statusDetector.isCellHovered(cell.rowIndex, cell.columnIndex) ||
          (cell.hovered && cell.hoverContext !== self.currentDragContext) ||
          cell.groupHovered !==
            statusDetector.isCellGroupHovered(cell.rowIndex, cell.columnIndex)))
    );
  };

  /**
   * Check surrounding cells of a given invalid cached cell
   *
   * The cell state may not change but in case we have dashed or dotted borders,
   * the border will have empty space and it cannot fully fill over previously
   * drawn borders such as selection, move, fill.
   * @param node
   */
  private checkInvalidSurroundingCells = (node: CellLinkedNode) => {
    if (!node.cell.isNormal) return;
    if (
      this.frameCache.isRedrawn('selection') ||
      this.frameCache.isRedrawn('fillOverlay') ||
      this.frameCache.isRedrawn('moveOverlay')
    ) {
      for (const neighbourNode of getSurroundingNodes(node)) {
        if (
          neighbourNode &&
          neighbourNode.cell.drawingStatus !== DrawingStatus.SkipNotDrawn &&
          neighbourNode.cell.drawingStatus !== DrawingStatus.PendingRedraw
        ) {
          neighbourNode.cell.drawingStatus = DrawingStatus.RequestRedrawn;

          this.base.cellCreator.updateSubsumedCellsDrawingStatus(
            neighbourNode,
            DrawingStatus.RequestRedrawn,
          );
          /*
          // Check if this cell depends cells on the left, and mark them ready for
          // redraw if they are connected to this cell.
          let curNode = neighbourNode.prevSibling;
          while (
            curNode &&
            (curNode.cell.subsumedByLeftNeighbor ||
              curNode.cell.subsumedRightCellCount > 0)
          ) {
            if (
              curNode.cell.drawingStatus !== DrawingStatus.SkipNotDrawn &&
              curNode.cell.drawingStatus !== DrawingStatus.PendingRedraw
            )
              curNode.cell.drawingStatus = DrawingStatus.RequestRedrawn;
            if (curNode.cell.subsumedRightCellCount > 0) break;
            curNode = curNode.prevSibling;
          }

          // Do check on the right as well
          curNode = neighbourNode.nextSibling;
          while (curNode && curNode.cell.subsumedByLeftNeighbor) {
            if (
              curNode.cell.drawingStatus !== DrawingStatus.SkipNotDrawn &&
              curNode.cell.drawingStatus !== DrawingStatus.PendingRedraw
            )
              curNode.cell.drawingStatus = DrawingStatus.RequestRedrawn;
            curNode = curNode.nextSibling;
          }
          */
        }
      }
    }
  };
}
