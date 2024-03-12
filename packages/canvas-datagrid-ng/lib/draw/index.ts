'use strict';

import { resizeGridScroller } from '../events/resize-grid-scroller';
import type { GridPrivateProperties } from '../types';
import { copyMethods } from '../util';
import { DrawCache } from './cache';
import { DrawCell } from './cell';
import { DrawDebugInfo } from './debug';
import { DrawFrameCache } from './frame-cache';
import { DrawGroupArea } from './group';
import { drawScrollBars } from './scrollbar';
import { DrawUtils } from './util';

/**
 * The possible flags to invalidate the drawing with.  Please note that almost
 * all of these concern cells and wired up to work with cells.  You can create
 * a different invalidation points for things that are drawn over the cells,
 * but you may need to keep track of where they were previously drawn so that
 * you can redraw the dirty cells that are cached and are not normally redrawn
 * when those things change position or stop existing.
 * @see DrawFrameCache.isUnderProp
 */
export type DrawDirtyFlag =
  /**
   * Invalidate everything and cause a full draw.
   */
  | 'all'
  /**
   * Invalidate the fill overlay related areas.
   */
  | 'fillOverlay'
  /**
   * Invaliddate drawings that are sensitive to mouse/touch hover.
   */
  | 'hover'
  /**
   * Invalidate drag move related areas.
   */
  | 'moveOverlay'
  /**
   * Invalidate selection related areas.
   */
  | 'selection'
  /**
   * Invalidate 'scroll' related areas.  Note that this is considered almost
   * a full redraw because almost everything needs a draw after this.
   */
  | 'scroll';

export type DrawDirtyFlags = Partial<Record<DrawDirtyFlag, boolean>>;

export default function loadGridDrawManager(self: GridPrivateProperties) {
  copyMethods(new GridDrawManager(self), self);
}

export class GridDrawManager {
  private _cache: DrawCache;
  private _drawUtils: DrawUtils;
  private _debugUtils: DrawDebugInfo;

  private _drawRequest?: number;
  private _dirtyFlags: DrawDirtyFlags = {};

  private _frameRateMultiplier = 0;
  private _lastFrameTime = 0 as DOMHighResTimeStamp;

  constructor(private readonly self: GridPrivateProperties) {
    this._drawUtils = new DrawUtils(self);
    this._debugUtils = new DrawDebugInfo(self, this._drawUtils);
    this._cache = new DrawCache(self);
  }

  /**
   * Request a redraw if the renderer loop is active.
   *
   * This draws immediately if {@link this.self.attributes.drawSynchronously}
   * is set to true or if the renderer is loop is not running.
   * @deprecated Use {@link requestRedraw()} and {@link redrawCommit()} instead.
   * @param internal
   * @see requestRedraw
   * @see redrawCommit
   */
  draw = (internal?: boolean) => {
    const { self } = this;
    this._dirtyFlags.all = true;
    if (this._drawRequest && !self.attributes.drawSynchronously) {
      return;
    }
    if (!self.attributes.drawSynchronously) {
      console.warn('Renderer loop is not running. Drawing immediately!');
    }
    this._drawNow();
  };

  /**
   * Start the renderer loop to draw asynchrounously when a {@link DrawDirtyFlag}
   * is set to `true` with {@link requestRedraw()} or one of the related methods.
   * @see stopRendererLoop
   */
  startRendererLoop = () => {
    this._drawRequest =
      this._drawRequest || requestAnimationFrame(this._doRenderLoop);
  };

  /**
   * Stop the renderer loop.
   * @see startRendererLoop
   */
  stopRendererLoop = () => {
    const request = this._drawRequest;
    if (request) {
      cancelAnimationFrame(request);
      this._drawRequest = undefined;
    }
  };

  /**
   * Redraw immediately even if the renderer loop is running.  This may not be
   * what you want if you don't need an immediate redraw that is not affected
   * by the small delay of {@link requestAnimationFrame}.
   * @param flag To invalidate.
   * @see requestRedraw
   * @see redrawCommit
   */
  redrawNow = (flag: DrawDirtyFlag) => {
    this.requestRedraw(flag);
    this._drawNow();
  };

  /**
   * This method does nothing unless {@link self.attributes.drawSynchronously}
   * is set to true and there are dirty areas set with {@link requestRedraw()},
   * which is different from {@link draw()} which draws immediately when
   * synchronous drawing is active.
   *
   * This method should be put at the end of event functions such as `mousemove`
   * or `keydown` so that when the renderer loop is not active or when
   * synchrounous drawing is active, we can redraw when there is a need for it,
   * i.e., when something has been invalidated.
   *
   * This method was added because we still run the test synchrounously and we
   * don't need the tests to be performany but easy to work with.
   *
   * This is how it should be used:
   * ```
   * if (true) {
   *    self.requestRedraw('selection');
   * }
   * if (false) {
   *   self.requestRedraw('hover');
   * }
   * self.redrawCommit();
   * ```
   * @see requestRedraw
   * @see draw
   */
  redrawCommit = () => {
    const { self } = this;
    if (
      (this._drawRequest && !self.attributes.drawSynchronously) ||
      !this._hasDirty()
    ) {
      return;
    }
    this._drawNow();
  };

  /**
   * Request a draw invalidating a cached drawing. This never draws but only
   * invalidates the given flag for an area to be redrawn.
   *
   * Almost always, the renderer loop will pick up your requests and draw them
   * in an animation frame using {@link requestAnimationFrame}. Sometimes, like
   * in tests, we draw synchronously, so in that case, this will wait for
   * {@link redrawCommit} to be invoked.
   * @param flag To invalidate.  Usually, `all`.
   * @see DrawDirtyFlag
   * @see redrawCommit
   * @see draw
   * @see startRendererLoop
   */
  requestRedraw = (flag: DrawDirtyFlag) => {
    this._dirtyFlags[flag] = true;
  };

  private _hasDirty = () =>
    Object.values(this._dirtyFlags).indexOf(true) !== -1;

  private _doRenderLoop = (time: DOMHighResTimeStamp) => {
    // Update the frame rate multiplier
    this._frameRateMultiplier =
      60 / (1000 / (time - (this._lastFrameTime || 0)));
    this._lastFrameTime = time;

    if (!this._drawRequest) {
      // We are not in a loop, meaning `startRendererLoop` hasn't been called,
      // or rendering has been stopped with `stopRendererLoop`, so to avoid
      // accidentally restarting the loop, we just return.
      return;
    }
    if (this._hasDirty()) {
      this._drawNow();
    }
    this._drawRequest = requestAnimationFrame(this._doRenderLoop);
  };

  private _drawNow = () => {
    const { self } = this;
    const profiler = self.attributes.showPerformance && self.profiler;
    if (profiler) profiler.startDraw();

    const flags = this._dirtyFlags;
    this._dirtyFlags = {};

    try {
      self.ctx.save();
      this._drawNowInternal(flags);
    } catch (error) {
      self.dispatchEvent('error', Object.assign(error, { context: 'draw' }));
      console.error(error);
    } finally {
      self.ctx.restore();
      if (profiler) {
        profiler.endDraw();
        profiler.stopTiming('clickdelay');
      }
    }
  };

  /**
   * The main logic of rendering
   */
  private _drawNowInternal = (flags: DrawDirtyFlags) => {
    const { self } = this;

    if (self.dispatchEvent('beforedraw', {}) || !self.height || !self.width) {
      return;
    }

    const frameCache = new DrawFrameCache(self, flags, this._cache);
    const groupArea = new DrawGroupArea(self, this._drawUtils);
    const cell = new DrawCell(self, this._cache, frameCache);

    this._debugUtils.drawCount++;
    this._debugUtils.perfCounter = performance.now();

    // if data length has changed, there is no way to know
    // if (frameCache.viewDataLength > self.orders.rows.length) {
    //   self.createRowOrders();
    // }

    this._initDraw();
    cell.draw();
    groupArea.draw();
    this._drawFrozenMarkers(frameCache);
    this._drawSelectionHandles(frameCache);
    this._drawReorderMarkers(frameCache);
    this._drawResizeMarkers(frameCache);
    drawScrollBars(self, this._drawUtils);
    if (frameCache.checkScrollHeight) {
      self.resize(true);
    }
    if (
      frameCache.hasUnhideRowButtons !== self.rowNumberShowingUnhideButtons ||
      frameCache.maxRowNumberColumnDigitCount !== self.rowNumberColumnDigitCount
    ) {
      // Max number of digits contained the visible rows have changed, so update
      // the row number column width accordingly.
      self.rowNumberShowingUnhideButtons = frameCache.hasUnhideRowButtons;
      self.calcRowHeaderWidth(frameCache.maxRowNumberColumnDigitCount);
      resizeGridScroller(self);
      self.requestRedraw('all');
    }
    this._initVariablesAfterDraw();

    this._debugUtils.drawDebug(frameCache.frozenColumnsWidth);
    this._debugUtils.drawPerfLines();

    if (frameCache.isRedrawn('scroll')) {
      self.resizeEditInput();
    }
    if (self.dispatchEvent('afterdraw', {})) {
      return;
    }
  };

  private _initDraw = () => {
    const { self } = this;

    self.viewport.reset();
    self.visibleCells = [];
    self.visibleGroups = [];
    self.visibleUnhideIndicators = [];

    // We assume that there will not be any lines that are smaller than 1px,
    // so we shift the pixels based on the ratio.
    //
    // The logic is this:
    // We shift everything by -0.5px when the scaling value is an odd number,
    // so, when the canvas is drawing a line (with stroke() and similar), they
    // end up on a physical pixel, which is related to how `stroke()` works.
    //
    // `stroke()` divides `lineWidth` with 2 and gives both the start and end
    // pixel an equal portion, which causes blurriness when `lineWidth` is 1px,
    // as we would be giving them half a pixel. So, by shifting -0.5px,
    // we force them to end up on physical pixels.
    //
    // Both `canvasOffsetTop` and `canvasOffsetLeft` are used in drawing methods
    // by default, and in the future, if you expand them, you will need to use
    // them as well.
    const shiftingAmount =
      Math.floor(self.scale) % 2 === 0 && self.scale > 1 ? -1 : -0.5;
    self.canvasOffsetTop = shiftingAmount;
    self.canvasOffsetLeft = shiftingAmount;
  };

  /**
   * This returns the value that can be used to match the animation speed to
   * 60fps, accomodating both the display refresh rate and frame drops.
   *
   * This value returned is only accurately produced when the render loop is
   * active. If not, the value returned will always be equal to 1.
   * @returns The frame rate multiplier, or 1 if the render loop is not active.
   * @see requestAnimationFrame
   */
  getFrameRateMultiplier = () => {
    const { self } = this;
    return this._drawRequest && !self.attributes.drawSynchronously
      ? this._frameRateMultiplier
      : 1;
  };

  private _initVariablesAfterDraw = () => {
    const { self } = this;
    const visibleRows = self.viewport.rows.size;
    const visibleColumns = self.viewport.columnHeaders.length;
    // Calculate page.
    self.page.vertical = Math.max(
      1,
      visibleRows - 3 - self.attributes.pageUpDownOverlap,
    );
    self.page.horizontal = Math.max(1, visibleColumns - 3);
  };

  private _drawReorderMarkers = (frameCache: DrawFrameCache) => {
    const { self } = this;
    if (!self.reorderContext) return;

    const { reorderContext } = self;
    const { targetCell, targetSnapToEnd } = reorderContext;
    const { height, width } = frameCache;
    const { rowGroupAreaWidth: dx, columnGroupAreaHeight: dy } = frameCache;
    const { drawLine, fillRect, strokeRect } = this._drawUtils;
    const position = reorderContext.position - reorderContext.offset;

    self.ctx.fillStyle = self.style.reorderMarkerBackgroundColor;
    self.ctx.lineWidth = self.style.reorderMarkerBorderWidth;
    self.ctx.strokeStyle = self.style.reorderMarkerBorderColor;
    if (self.dragMode === 'row-reorder') {
      fillRect(dx, position, width, reorderContext.size);
      strokeRect(dx, position, width, reorderContext.size);
      if (targetCell) {
        self.ctx.lineWidth = self.style.reorderMarkerIndexBorderWidth;
        self.ctx.strokeStyle = self.style.reorderMarkerIndexBorderColor;
        drawLine(
          { width, height: targetCell.height, x: dx, y: targetCell.y },
          targetSnapToEnd ? 'bottom' : 'top',
        );
      }
    } else if (self.dragMode === 'column-reorder') {
      fillRect(position, dy, reorderContext.size, height);
      strokeRect(position, dy, reorderContext.size, height);
      if (targetCell) {
        self.ctx.lineWidth = self.style.reorderMarkerIndexBorderWidth;
        self.ctx.strokeStyle = self.style.reorderMarkerIndexBorderColor;
        drawLine(
          { width: targetCell.width, height, x: targetCell.x, y: dy },
          targetSnapToEnd ? 'right' : 'left',
        );
      }
    }
  };

  private _drawResizeMarkers = (frameCache: DrawFrameCache) => {
    const { self } = this;
    const { fillRect } = this._drawUtils;
    const { rowGroupAreaWidth, columnGroupAreaHeight } = frameCache;

    if (
      !self.pendingDragResize ||
      !self.draggingItem ||
      !/column-resize|row-resize/.test(self.dragMode)
    ) {
      return;
    }

    const markerSize = self.style.scaled.resizeMarkerSize;
    const headerSize = self.style.scaled.resizeMarkerHeaderSize;
    const resizingRow = self.dragMode === 'row-resize';
    const height = resizingRow ? markerSize : self.height;
    const width = resizingRow ? self.width : markerSize;
    const minX =
      self.dragStart.x -
      self.dp(self.resizingStartingWidth - self.style.minColumnWidth);
    const minY =
      self.dragStart.y -
      self.dp(self.resizingStartingHeight - self.style.minRowHeight);
    const x = resizingRow
      ? rowGroupAreaWidth
      : Math.max(self.pendingDragResize.x, minX);
    const y = !resizingRow
      ? columnGroupAreaHeight
      : Math.max(self.pendingDragResize.y, minY);

    const headerOffset = headerSize / 2 - markerSize / 2;

    self.ctx.fillStyle = self.style.resizeMarkerColor;
    fillRect(
      x - (resizingRow ? 0 : headerOffset),
      y - (resizingRow ? headerOffset : 0),
      resizingRow ? self.draggingItem.width : headerSize,
      resizingRow ? headerSize : self.draggingItem.height,
    );
    fillRect(x, y, width, height);
  };

  private _drawSelectionHandles = (frameCache: DrawFrameCache) => {
    const { self } = this;
    // Do not draw handles if a cell is being edited.
    if (self.input) return;

    const { selectionHandles } = frameCache;
    const { drawSelectionHandle } = this._drawUtils;
    if (
      (self.mobile || self.attributes.allowMovingSelection) &&
      self.attributes.editable
    ) {
      self.ctx.lineWidth = self.style.scaled.selectionHandleBorderWidth;
      self.ctx.strokeStyle = self.style.selectionHandleBorderColor;
      self.ctx.fillStyle = self.style.selectionHandleColor;

      for (const handle of Object.values(selectionHandles)) {
        drawSelectionHandle(handle);
        this._cache.pushVisibleProp(handle);
      }
    }
  };

  private _drawFrozenMarkers = (frameCache: DrawFrameCache) => {
    const { self } = this;
    const { topAreaHeight, leftAreaWidth } = frameCache;
    const { fillRect, radiusRect, strokeRect } = this._drawUtils;
    const { scaled } = self.style;

    const { currentCell: cell } = self;
    const xHover =
      cell?.nodeType === 'frozen-marker' && cell.style === 'frozen-row-marker';
    const yHover =
      cell?.nodeType === 'frozen-marker' &&
      cell.style === 'frozen-column-marker';
    const grabZone = scaled.frozenMarkerGrabZone / 2;
    const size = scaled.frozenMarkerWidth + scaled.frozenMarkerBorderWidth;

    const my = self.lastFrozenRowPixel - scaled.cellBorderWidth / 2,
      mx = self.lastFrozenColumnPixel - scaled.cellBorderWidth / 2;
    self.ctx.lineWidth = scaled.frozenMarkerBorderWidth;
    if (self.attributes.allowFreezingColumns) {
      if (
        !self.freezeMarkerPosition ||
        (self.freezeMarkerPosition && self.dragMode === 'frozen-row-marker')
      ) {
        self.ctx.save();

        // Clear the left of the shadow.
        self.ctx.beginPath();
        radiusRect(
          mx - scaled.frozenMarkerBorderWidth,
          0,
          scaled.frozenMarkerShadowBlur + scaled.frozenMarkerWidth * 2,
          self.frozenColumn > 0 ? self.height : topAreaHeight,
          0,
        );
        self.ctx.clip();

        self.ctx.shadowColor = self.style.frozenMarkerShadowColor;
        self.ctx.shadowBlur = scaled.frozenMarkerShadowBlur;

        if (mx > leftAreaWidth) {
          self.ctx.fillStyle = self.style.frozenMarkerColor;
          self.ctx.strokeStyle = self.style.frozenMarkerBorderColor;
          fillRect(mx, topAreaHeight, scaled.frozenMarkerWidth, self.height);
        }
        self.ctx.fillStyle = yHover
          ? self.style.frozenMarkerHoverColor
          : self.style.frozenMarkerHeaderColor;
        self.ctx.strokeStyle = yHover
          ? self.style.frozenMarkerHoverBorderColor
          : self.style.frozenMarkerHeaderColor;

        fillRect(mx, 0, scaled.frozenMarkerWidth, topAreaHeight);

        self.ctx.restore();
      }

      if (!self.dragStartObject || !self.dragStartObject.isRowHeader) {
        self.visibleCells.unshift({
          nodeType: 'frozen-marker',
          x: mx - grabZone,
          y: 0,
          height: self.height,
          width: size + grabZone,
          style: 'frozen-column-marker',
        });
      }
    }
    if (self.attributes.allowFreezingRows) {
      if (
        !self.freezeMarkerPosition ||
        (self.freezeMarkerPosition && self.dragMode === 'frozen-column-marker')
      ) {
        self.ctx.save();

        // Clear the top of the shadow.
        self.ctx.beginPath();
        radiusRect(
          0,
          my - scaled.frozenMarkerBorderWidth,
          self.frozenRow > 0 ? self.width : leftAreaWidth,
          scaled.frozenMarkerShadowBlur + scaled.frozenMarkerWidth * 2,
          0,
        );
        self.ctx.clip();

        self.ctx.shadowColor = self.style.frozenMarkerShadowColor;
        self.ctx.shadowBlur = scaled.frozenMarkerShadowBlur;

        if (my > topAreaHeight) {
          self.ctx.fillStyle = self.style.frozenMarkerColor;
          self.ctx.strokeStyle = self.style.frozenMarkerBorderColor;
          fillRect(leftAreaWidth, my, self.width, scaled.frozenMarkerWidth);
        }
        self.ctx.fillStyle = xHover
          ? self.style.frozenMarkerHoverColor
          : self.style.frozenMarkerHeaderColor;
        self.ctx.strokeStyle = xHover
          ? self.style.frozenMarkerHoverBorderColor
          : self.style.frozenMarkerHeaderColor;
        fillRect(0, my, leftAreaWidth, scaled.frozenMarkerWidth);
        self.ctx.restore();
      }
      if (!self.dragStartObject || !self.dragStartObject.isColumnHeader) {
        self.visibleCells.unshift({
          nodeType: 'frozen-marker',
          x: 0,
          y: my - grabZone,
          height: size + grabZone,
          width: self.width,
          style: 'frozen-row-marker',
        });
      }
    }
    if (
      self.freezeMarkerPosition &&
      self.freezeMarkerPosition.cellPos !== undefined &&
      self.freezeMarkerPosition.index !== undefined
    ) {
      const { cellPos, index, snapIndicator } = self.freezeMarkerPosition;
      let { pos } = self.freezeMarkerPosition;
      self.ctx.fillStyle = self.style.frozenMarkerActiveColor;
      self.ctx.strokeStyle = self.style.frozenMarkerActiveBorderColor;
      if (self.dragMode === 'frozen-column-marker') {
        let x = pos;
        if (pos <= leftAreaWidth || index === 0) {
          x = leftAreaWidth - scaled.frozenMarkerWidth;
        } else if (index === self.frozenColumn) {
          x = self.lastFrozenColumnPixel + scaled.frozenMarkerBorderWidth;
        } else {
          x = cellPos - scaled.frozenMarkerWidth / 2;
        }
        if (snapIndicator) pos = x;
        self.ctx.fillStyle = self.style.frozenMarkerColor;
        self.ctx.strokeStyle = self.style.frozenMarkerBorderColor;
        fillRect(x, 0, scaled.frozenMarkerWidth, self.height);
        strokeRect(x, 0, scaled.frozenMarkerWidth, self.height);
        self.ctx.fillStyle = self.style.frozenMarkerHeaderColor;
        self.ctx.strokeStyle = self.style.frozenMarkerHeaderColor;
        fillRect(x, 0, scaled.frozenMarkerWidth, topAreaHeight);
        strokeRect(x, 0, scaled.frozenMarkerWidth, topAreaHeight);
        self.ctx.fillStyle = self.style.frozenMarkerActiveHeaderColor;
        self.ctx.strokeStyle = self.style.frozenMarkerActiveBorderColor;
        fillRect(pos, 0, scaled.frozenMarkerWidth, topAreaHeight);
        strokeRect(pos, 0, scaled.frozenMarkerWidth, topAreaHeight);
        self.ctx.fillStyle = self.style.frozenMarkerActiveColor;
        fillRect(pos, 0, scaled.frozenMarkerWidth, self.height);
        strokeRect(pos, 0, scaled.frozenMarkerWidth, self.height);
      } else if (self.dragMode === 'frozen-row-marker') {
        let y = pos;
        if (pos <= topAreaHeight || index === 0) {
          y = topAreaHeight - scaled.frozenMarkerWidth;
        } else if (index === self.frozenRow) {
          y = self.lastFrozenRowPixel + scaled.frozenMarkerBorderWidth;
        } else {
          y = cellPos - scaled.frozenMarkerWidth / 2;
        }
        if (snapIndicator) pos = y;
        self.ctx.fillStyle = self.style.frozenMarkerColor;
        self.ctx.strokeStyle = self.style.frozenMarkerBorderColor;
        fillRect(0, y, self.width, scaled.frozenMarkerWidth);
        strokeRect(0, y, self.width, scaled.frozenMarkerWidth);
        self.ctx.fillStyle = self.style.frozenMarkerHeaderColor;
        self.ctx.strokeStyle = self.style.frozenMarkerHeaderColor;
        fillRect(0, y, leftAreaWidth, scaled.frozenMarkerWidth);
        strokeRect(0, y, leftAreaWidth, scaled.frozenMarkerWidth);
        self.ctx.fillStyle = self.style.frozenMarkerActiveHeaderColor;
        self.ctx.strokeStyle = self.style.frozenMarkerActiveBorderColor;
        fillRect(0, pos, leftAreaWidth, scaled.frozenMarkerWidth);
        strokeRect(0, pos, leftAreaWidth, scaled.frozenMarkerWidth);
        self.ctx.fillStyle = self.style.frozenMarkerActiveColor;
        fillRect(0, pos, self.width, scaled.frozenMarkerWidth);
        strokeRect(0, pos, self.width, scaled.frozenMarkerWidth);
      }
    }

    self.ctx.restore();
  };
}
