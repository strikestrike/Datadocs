import type {
  GridPrivateProperties,
  ScrollContext,
  ScrollBarTarget,
  ScrollBoxEntity,
} from './types';
import { createScrollState, sanitizeScrollState } from './util';

export type ScrollBoxEntities = {
  horizontalTrack: ScrollBoxEntity;
  horizontalThumb: ScrollBoxEntity;
  verticalTrack: ScrollBoxEntity;
  verticalThumb: ScrollBoxEntity;
  corner: ScrollBoxEntity;
};

/**
 * This class stores scroll-related data, and helps updating it without things
 * going out of boundaries.
 *
 * This class is updated by {@link GridEventHandler.resize} when changes to the
 * total height of the rows or the total width of the columns occur.
 *
 * UPDATING WITH PROPERTIES VS. METHODS
 *
 * Updating the scroll position or the length will trigger an update when done
 * through property setter methods.  If you need to make multiple changes,
 * consider using the method versions of the setter properties so that you can
 * update only once, which also means dispatching a single event per update.
 *
 * You can make multiple changes like this:
 * ```
 * scrollBox.markState(); // Copies the current scroll position.
 *
 * scrollBox.setScrollWidth(100, true); // Disable updating state.
 * scrollBox.setVerticalScroll(1, 20, true); // Disable updating state.
 *
 * scrollBox.updateState(); // Finally update the state and dispatch event.
 * ```
 */
export class ScrollBox {
  private state = {
    /**
     * Current scroll position.
     */
    current: createScrollState(),
    /**
     * Total scroll position.
     */
    total: createScrollState(),
    /**
     * The max scroll position used for infinite scrolling.
     *
     * This will contain values smaller than {@link total}, and smaller than
     * {@link current}.
     */
    scrolled: {
      ...createScrollState(),
      /**
       * We will be caching these values to make sure we only calculate this
       * after a change.
       */
      basedOn: createScrollState(),
    },
    /**
     * Minimum scrollable area coming from the data source (where the last data
     * can be found.)
     */
    minScrollable: createScrollState(),

    /**
     * This is used to store a copy of the {@link current} current state to use
     * for later comporison to see if the scroll changed.
     * @see markState
     * @see updateState
     */
    previous: createScrollState(),
  };

  /**
   * Don't shrink scrolled state.
   */
  preserveMinScrolledState = false;
  /**
   * Last min scrollable indexes we used to update the min scrollable area.
   */
  private lastMinRowIndex = 0;
  private lastMinColumnIndex = 0;
  /**
   * Last min scrollable reported indexes from the data source that we might
   * not have updated the min scrollable area with yet.
   */
  private lastReportedMinRowIndex = 0;
  private lastReportedMinColumnIndex = 0;

  constructor(private readonly self: GridPrivateProperties) {}

  /**
   * This property is created by the method `resize` in event handler.
   * And it is used for rendering the scroll box
   */
  entities: ScrollBoxEntities;

  verticalTrackVisible = false;
  verticalThumbVisible = false;

  horizontalTrackVisible = false;
  horizontalThumbVisible = false;

  /**
   * The ratio of the total size of content to the size of the scroll bar
   * tracks.
   */
  get widthBoxRatio() {
    const { self } = this;
    return (
      self.px(this.entities.horizontalTrack.width) / self.scrollableDataWidth
    );
  }
  get heightBoxRatio() {
    const { self } = this;
    return (
      self.px(this.entities.verticalTrack.height) / self.scrollableDataHeight
    );
  }

  get dynWidthBoxRatio() {
    const width = this.self.px(this.entities?.horizontalTrack.width || 0);
    return width / (this.state.scrolled.width + width);
  }
  get dynHeightBoxRatio() {
    const height = this.self.px(this.entities?.verticalTrack.height || 0);
    return height / (this.state.scrolled.height + height);
  }

  /**
   * Total height of all the rows minus the height of the vertical scroll track.
   */
  get scrollHeight() {
    return this.state.total.height;
  }

  /**
   * Total width of the all the columns minus the width of the horizontal scroll
   * track.
   */
  get scrollWidth() {
    return this.state.total.width;
  }

  /**
   * The horizontal scroll offset.
   */
  get scrollLeft() {
    return this.state.current.width;
  }
  set scrollLeft(value: number) {
    this.setScrollLeft(value);
  }
  setScrollLeft = (value: number, skipUpdate?: boolean) => {
    if (!skipUpdate) this.markState();

    const { self } = this;
    const { current } = this.state;
    const { index, pixel } = self.findHorizontalScrollTargetForPixel(value);

    current.indexLeft = index;
    current.pixelLeft = pixel;

    if (!skipUpdate) this.updateState();
  };

  /**
   * The vertical scroll offset.
   */
  get scrollTop() {
    return this.state.current.height;
  }
  set scrollTop(value: number) {
    this.setScrollTop(value);
  }
  setScrollTop = (value: number, skipUpdate?: boolean) => {
    if (!skipUpdate) this.markState();

    const { self } = this;
    const { current } = this.state;
    const { index, pixel } = self.findVerticalScrollTargetForPixel(value);

    current.indexTop = index;
    current.pixelTop = pixel;

    if (!skipUpdate) this.updateState();
  };

  /**
   * The first visible scrollable row index.
   */
  get scrollIndexTop(): number {
    return this.state.current.indexTop;
  }
  set scrollIndexTop(value: number) {
    this.setScrollIndexTop(value);
  }
  setScrollIndexTop = (value: number, skipUpdate?: boolean) => {
    if (!skipUpdate) this.markState();
    const { self } = this;
    const { current, total } = this.state;
    if (!this.limitVerticalScroll(value, this.scrollPixelTop)) {
      current.indexTop = Math.min(
        Math.max(value, self.frozenRow),
        total.indexTop,
      );
    }
    if (!skipUpdate) this.updateState();
  };

  /**
   * The first visible scrollable column index.
   */
  get scrollIndexLeft(): number {
    return this.state.current.indexLeft;
  }
  set scrollIndexLeft(value: number) {
    this.markState();
    this.setScrollIndexLeft(value);
    this.dispatchScrollEvent();
  }
  private setScrollIndexLeft = (value: number, skipUpdate?: boolean) => {
    if (!skipUpdate) this.markState();
    const { self } = this;
    const { current, total } = this.state;
    if (!this.limitHorizontalScroll(value, total.indexLeft)) {
      current.indexLeft = Math.min(
        Math.max(value, self.frozenColumn),
        total.indexLeft,
      );
    }
    if (!skipUpdate) this.updateState();
  };

  /**
   * The amount the user scrolled the pixels of {@link scrollIndexTop}.
   */
  get scrollPixelTop(): number {
    return this.state.current.pixelTop;
  }
  set scrollPixelTop(value: number) {
    this.setScrollPixelTop(value);
  }
  private setScrollPixelTop = (value: number, skipUpdate?: boolean) => {
    if (!skipUpdate) this.markState();
    if (this.scrollIndexTop >= this.state.total.indexTop) {
      value = Math.min(this.state.total.pixelTop, value);
    }
    this.state.current.pixelTop = Math.floor(Math.max(value, 0));
    if (!skipUpdate) this.updateState();
  };

  /**
   * The amount the user scrolled the pixels of {@link scrollIndexLeft}.
   */
  get scrollPixelLeft(): number {
    return this.state.current.pixelLeft;
  }
  set scrollPixelLeft(value: number) {
    this.setScrollPixelLeft(value);
  }
  setScrollPixelLeft = (value: number, skipUpdate?: boolean) => {
    if (!skipUpdate) this.markState();
    if (this.scrollIndexLeft >= this.state.total.indexLeft) {
      value = Math.min(this.state.total.pixelLeft, value);
    }
    this.state.current.pixelLeft = Math.floor(Math.max(0, value));
    if (!skipUpdate) this.updateState();
  };

  /**
   * Check and update the vertical scroll position to prevent it from going out
   * of bounds.
   * @see doAfterScroll
   */
  checkVerticalScroll = () => {
    if (this.verticalTrackVisible) {
      this.limitVerticalScroll(this.scrollIndexTop, this.scrollPixelTop);
    } else {
      this.setVerticalScroll(0, 0, true);
    }
  };

  /**
   * Check and update the horizontal scroll position to prevent it from going
   * out of bounds.
   * @see doAfterScroll
   */
  checkHorizontalScroll = () => {
    if (this.horizontalTrackVisible) {
      this.limitHorizontalScroll(this.scrollIndexLeft, this.scrollPixelLeft);
    } else {
      this.setHorizontalScroll(0, 0, true);
    }
  };

  /**
   * Dispatch a `scroll` event.
   */
  dispatchScrollEvent = () => {
    this.self.dispatchEvent('scroll', {
      // Row & columns indexes.
      top: this.scrollIndexTop,
      left: this.scrollIndexLeft,

      // Pixel offsets from the top & left indexes above.
      pixelTop: this.scrollPixelTop,
      pixelLeft: this.scrollPixelLeft,

      // Pixel offsets from the start.
      scrollTop: this.scrollTop,
      scrollLeft: this.scrollLeft,

      previousState: { ...this.state.previous },
    });
  };

  /**
   * Check the boundaries and update {@link scrollPixelTotalTop}.
   */
  private refreshVerticalScroll = () => {
    const { self } = this;
    const { current } = this.state;
    const { positionHelper: ph } = self.dataSource;
    this.checkVerticalScroll();
    current.hiddenRowCount = ph.getHiddenRowCount(current.indexTop);
    current.height =
      self.getScrollCacheY(this.scrollIndexTop, true) + this.scrollPixelTop;
  };

  /**
   * Check the boundaries and update {@link scrollPixelTotalLeft}.
   */
  private refreshHorizontalScroll = () => {
    const { self } = this;
    const { current } = this.state;
    this.checkHorizontalScroll();
    current.width =
      self.getScrollCacheX(this.scrollIndexLeft, true) + this.scrollPixelLeft;
  };

  /**
   * Calculates and returns the horizontal scroll position as a percentage.
   * @param dyn Whether this should produce results for infinite scrolling.
   * @returns A number value between 0-1 with (1 being scrolled to the end).
   */
  getHorizontalScrollAmount = (dyn?: boolean) => {
    const { current, scrolled } = this.state;
    if (dyn) {
      return current.width && scrolled.width
        ? current.width / scrolled.width
        : 0;
    }
    return current.width / this.scrollWidth;
  };

  /**
   * Calculates and returns the vertical scroll position as a percentage.
   * @param dyn Whether this should produce results for infinite scrolling.
   * @returns A number value between 0-1 with (1 being scrolled to the end).
   * @see setVerticalScrollAmount
   */
  getVerticalScrollAmount = (dyn?: boolean) => {
    const { current, scrolled } = this.state;
    if (dyn) {
      return current.height && scrolled.height
        ? current.height / scrolled.height
        : 0;
    }
    return current.height / this.scrollHeight;
  };

  /**
   * Scroll both vertical and horizontal orientations by the given pixels amount.
   *
   * Passing `0` means no scroll for that orientation.  Negative values scroll
   * backwards.
   * @param x Horizontal amount to scroll.
   * @param y Vertical amount to scroll.
   * @param skipUpdate Don't update the state.
   * @returns True if updating is allowed, and scroll state changes.
   * @see GridMiscMethods.scrollIntoView
   * @see GridMiscMethods.gotoCell
   */
  scrollBy = (x: number, y: number, skipUpdate?: boolean) => {
    const { self } = this;
    if (x === 0 && y === 0) return;
    if (!skipUpdate) this.markState();

    if (y !== 0) {
      const { positionHelper } = self.dataSource;
      const { index, pixel } = positionHelper.shiftVerticalPositionByPixels(
        self.style.cellHeight,
        self.frozenRow,
        self.scrollIndexTop,
        self.scrollPixelTop,
        y,
      );
      this.setVerticalScroll(index, pixel, true);
    }

    if (x !== 0) {
      const { positionHelper } = self.dataSource;
      const { index, pixel } = positionHelper.shiftHorizontalPositionByPixels(
        self.style.cellWidth,
        self.frozenColumn,
        self.scrollIndexLeft,
        self.scrollPixelLeft,
        x,
      );
      this.setHorizontalScroll(index, pixel, true);
    }

    if (!skipUpdate) return this.updateState();
    return false;
  };

  /**
   * Set the max available scroll target. Note that this doesn't trigger an
   * update.
   * @param index
   * @param pixel
   * @param width
   */
  setHorizontalScrollTotal = (index: number, pixel: number, width = -1) => {
    const { total } = this.state;
    total.indexLeft = index;
    total.pixelLeft = pixel;
    total.width = Math.max(width, -1);
  };

  /**
   * Set the max available scroll target. Note that this doesn't trigger an
   * update.
   * @param index
   * @param pixel
   * @param hiddenCount
   * @param height
   */
  setVerticalScrollTotal = (
    index: number,
    pixel: number,
    hiddenCount: number,
    height = -1,
  ) => {
    const { total } = this.state;
    total.indexTop = index;
    total.pixelTop = pixel;
    total.hiddenRowCount = hiddenCount;
    total.height = Math.max(height, -1);
  };

  /**
   * Set horizontal scroll position.
   *
   * Shortcut to setting the index and pixel in one go.
   * @param index The cell column index.
   * @param pixel The width of the invisible part of the cell.
   * @param skipUpdate Don't update the state.
   */
  setHorizontalScroll = (
    index: number,
    pixel: number,
    skipUpdate?: boolean,
  ) => {
    if (index === this.scrollIndexLeft && pixel === this.scrollPixelLeft) {
      return;
    }
    if (!skipUpdate) this.markState();

    if (!this.limitHorizontalScroll(index, pixel)) {
      this.setScrollIndexLeft(index, true);
      this.setScrollPixelLeft(pixel, true);
    }

    if (!skipUpdate) this.updateState();
  };

  /**
   * (For internal use only).
   *
   * Set the horizontal scroll position without checking boundaries.
   * @param index The cell column index.
   * @param pixel The width of the invisible part of the cell.
   */
  setHorizontalScrollExact = (index: number, pixel: number) => {
    const { current } = this.state;
    current.indexLeft = Math.max(index, 0);
    current.pixelLeft = Math.max(pixel, 0);
    current.width = this.self.getScrollCacheX(current.indexLeft, true);
  };

  /**
   * Set vertical scroll position.
   *
   * Shortcut to setting the index and pixel in one go.
   * @param index The cell row index.
   * @param pixel The height of the invisible part of the cell.
   * @param skipUpdate Don't update the state.
   */
  setVerticalScroll = (index: number, pixel: number, skipUpdate?: boolean) => {
    if (index === this.scrollIndexTop && pixel === this.scrollPixelTop) return;
    if (!skipUpdate) this.markState();

    if (!this.limitVerticalScroll(index, pixel)) {
      this.setScrollIndexTop(index, true);
      this.setScrollPixelTop(pixel, true);
    }

    if (!skipUpdate) this.updateState();
  };

  /**
   * (For internal use only).
   *
   * Set the vertical scroll position without checking boundaries.
   * @param index The cell column index.
   * @param pixel The width of the invisible part of the cell.
   */
  setVerticalScrollExact = (index: number, pixel: number) => {
    const { current } = this.state;
    current.indexTop = Math.max(index, 0);
    current.pixelTop = Math.max(pixel, 0);
    current.height = this.self.getScrollCacheY(current.indexTop, true);
  };

  /**
   * Mark the current vertical and horizontal scroll position before making
   * changes in batch, and for confirming that there was a change.
   * @see updateState
   */
  markState = () => {
    const { previous: ps } = this.state;
    ps.indexLeft = this.scrollIndexLeft;
    ps.indexTop = this.scrollIndexTop;
    ps.pixelLeft = this.scrollPixelLeft;
    ps.pixelTop = this.scrollPixelTop;
  };

  /**
   * Check if there has been any change after marking the state, and if so,
   * update the state and dispatch an event.
   * @param force Force the update without checking for changes.
   * @returns True if there was a change, and we dispatched a scroll event.
   */
  updateState = (force?: boolean) => {
    const { self } = this;
    const { current, total, scrolled, minScrollable, previous } = this.state;
    const { positionHelper: ph } = self.dataSource;
    this.lastReportedMinRowIndex = ph.getMinScrollableRowIndex();
    this.lastReportedMinColumnIndex = ph.getMinScrollableColumnIndex();

    if (
      !force &&
      this.scrollIndexLeft === previous.indexLeft &&
      this.scrollIndexTop === previous.indexTop &&
      this.scrollPixelLeft === previous.pixelLeft &&
      this.scrollPixelTop === previous.pixelTop &&
      this.lastReportedMinRowIndex === this.lastMinRowIndex &&
      this.lastReportedMinColumnIndex === this.lastMinColumnIndex
    ) {
      return false;
    }

    self.ellipsisCache = {};

    if (
      force ||
      this.scrollIndexLeft !== previous.indexLeft ||
      this.scrollPixelLeft !== previous.pixelLeft ||
      this.lastReportedMinColumnIndex !== this.lastMinColumnIndex
    ) {
      this.refreshHorizontalScroll();
    }

    if (
      force ||
      this.scrollIndexTop !== previous.indexTop ||
      this.scrollPixelTop !== previous.pixelTop ||
      this.lastReportedMinRowIndex !== this.lastMinRowIndex
    ) {
      this.refreshVerticalScroll();
    }

    this.updateMinScrollableArea();

    sanitizeScrollState(total, current);
    sanitizeScrollState(scrolled, minScrollable, true);

    this.updateScrolledArea(force);
    sanitizeScrollState(total, scrolled);

    self.requestRedraw('scroll');
    this.dispatchScrollEvent();

    return true;
  };

  getContext = (mode: ScrollBarTarget, dyn?: boolean): ScrollContext => {
    const { current } = this.state;
    return {
      left: current.width,
      top: current.height,
      mode,
    };
  };

  updateWithContext = (
    context: ScrollContext,
    barDiff: number,
    dyn?: boolean,
  ) => {
    const { self } = this;
    const { current, scrolled } = this.state;

    if (context.mode === 'vertical-scroll-box') {
      this.markState();

      const diff =
        context.top +
        self.px(barDiff) / (dyn ? this.dynHeightBoxRatio : this.heightBoxRatio);
      const result = Math.max(
        Math.min(diff, dyn ? scrolled.height : this.scrollHeight),
        0,
      );
      const { index, pixel } = self.findVerticalScrollTargetForPixel(result);

      current.height = result;
      this.setVerticalScroll(index, pixel, true);

      this.updateState();
    } else if (context.mode === 'horizontal-scroll-box') {
      this.markState();

      const diff =
        context.left +
        self.px(barDiff) / (dyn ? this.dynWidthBoxRatio : this.widthBoxRatio);
      const result = Math.max(
        Math.min(diff, dyn ? scrolled.width : this.scrollWidth),
        0,
      );
      const { index, pixel } = self.findHorizontalScrollTargetForPixel(result);

      current.width = result;
      this.setHorizontalScroll(index, pixel, true);

      this.updateState();
    } else {
      return false;
    }

    return true;
  };

  private limitHorizontalScroll = (index: number, pixel: number) => {
    const { self } = this;
    const { total, scrolled } = this.state;
    const limit = this.preserveMinScrolledState ? scrolled : total;
    if (index < self.frozenColumn) {
      this.setHorizontalScrollExact(self.frozenColumn, 0);
    } else if (
      index > limit.indexLeft ||
      (index === limit.indexLeft && pixel > limit.pixelLeft)
    ) {
      this.setHorizontalScrollExact(limit.indexLeft, limit.pixelLeft);
    } else {
      return false;
    }
    return true;
  };

  private limitVerticalScroll = (index: number, pixel: number) => {
    const { self } = this;
    const { total, scrolled } = this.state;
    const limit = this.preserveMinScrolledState ? scrolled : total;
    if (index < self.frozenRow) {
      this.setVerticalScrollExact(self.frozenRow, 0);
    } else if (
      index > limit.indexTop ||
      (index === limit.indexTop && pixel > limit.pixelTop)
    ) {
      this.setVerticalScrollExact(limit.indexTop, limit.pixelTop);
    } else {
      return false;
    }
    return true;
  };

  /**
   * Reload the min scrollable data if the position helper reports a difference.
   */
  private updateMinScrollableArea = () => {
    if (
      !this.entities ||
      (this.lastReportedMinRowIndex === this.lastMinRowIndex &&
        this.lastReportedMinColumnIndex === this.lastMinColumnIndex)
    ) {
      return false;
    }

    const {
      lastReportedMinRowIndex: rowIndex,
      lastReportedMinColumnIndex: columnIndex,
    } = this;

    this.lastMinRowIndex = rowIndex;
    this.lastMinColumnIndex = columnIndex;

    const { self } = this;
    const { minScrollable } = this.state;
    const { positionHelper: ph } = self.dataSource;
    const hiddenRowCount = ph.getHiddenRowCount(rowIndex);

    minScrollable.hiddenRowCount = hiddenRowCount;
    minScrollable.width = self.getScrollCacheX(columnIndex, true);
    minScrollable.height = self.getScrollCacheY(rowIndex, true);

    minScrollable.indexLeft = columnIndex;
    minScrollable.indexTop = rowIndex;

    minScrollable.pixelLeft = 0;
    minScrollable.pixelTop = 0;

    return true;
  };

  private updateScrolledArea = (force?: boolean) => {
    if (this.preserveMinScrolledState || !this.entities) return;
    const { current, minScrollable, scrolled } = this.state;
    const { basedOn } = scrolled;
    const { scrollBoxInfiniteScrollSpace: room } = this.self.style.scaled;
    const { scrollBoxInfiniteScrollMaxSpace: maxRatio } = this.self.attributes;
    {
      /* const target =
        minScrollable.indexLeft > current.indexLeft ? minScrollable : current; */
      const target = current;
      if (
        force ||
        target.indexLeft !== basedOn.indexLeft ||
        target.pixelLeft !== basedOn.pixelLeft
      ) {
        const { horizontalTrack: track } = this.entities;
        // Increase the scrollable area with this to show extra space on the
        // right.
        const multiplier = Math.min(1 + room / track.width, maxRatio);
        const width = Math.floor(
          target.width * multiplier + track.width * (multiplier - 1),
        );
        const { index, pixel } = this.getHorizontalPixelTarget(width);

        scrolled.indexLeft = index;
        scrolled.pixelLeft = pixel;
        scrolled.width = width;

        basedOn.indexLeft = target.indexLeft;
        basedOn.pixelLeft = target.pixelLeft;
        basedOn.width = target.width;

        // If the new scrolled target is smaller than the min scrollable target
        // use the min scrollable.
        if (minScrollable.indexLeft > scrolled.indexLeft) {
          scrolled.indexLeft = minScrollable.indexLeft;
          scrolled.pixelLeft = minScrollable.pixelLeft;
          scrolled.width = minScrollable.width;
        }
      }
    }

    {
      /* const target =
        minScrollable.indexTop > current.indexTop ? minScrollable : current; */
      const target = current;
      if (
        force ||
        target.indexTop !== basedOn.indexTop ||
        target.pixelTop !== basedOn.pixelTop
      ) {
        const { verticalTrack: track } = this.entities;
        const { positionHelper: ph } = this.self.dataSource;
        // Increase the scrollable area with this multiplier to show extra space
        // at the bottom.
        const multiplier = Math.min(1 + room / track.height, maxRatio);
        const height = Math.floor(
          target.height * multiplier + track.height * (multiplier - 1),
        );
        const { index, pixel } = this.getVerticalPixelTarget(height);

        scrolled.indexTop = index;
        scrolled.pixelTop = pixel;
        scrolled.height = height;

        scrolled.hiddenRowCount = ph.getHiddenRowCount(scrolled.indexTop);

        basedOn.indexTop = target.indexTop;
        basedOn.pixelTop = target.pixelTop;
        basedOn.height = target.height;

        // If the new scrolled target is smaller than the min scrollable target
        // use the min scrollable.
        if (minScrollable.indexTop > scrolled.indexTop) {
          scrolled.indexTop = minScrollable.indexTop;
          scrolled.pixelTop = minScrollable.pixelTop;
          scrolled.height = minScrollable.height;
        }
      }
    }
  };

  private getHorizontalPixelTarget = (pixel: number) => {
    const { self } = this;
    const { positionHelper: ph } = self.dataSource;
    return ph.getHorizontalScrollTargetForPixel(
      self.style.cellWidth,
      self.frozenColumn,
      pixel,
    );
  };

  private getVerticalPixelTarget = (pixel: number) => {
    const { self } = this;
    const { positionHelper: ph } = self.dataSource;
    return ph.getVerticalScrollTargetForPixel(
      self.style.cellHeight,
      self.frozenRow,
      pixel,
    );
  };

  toString = () => {
    return (
      '{"width": ' +
      this.scrollWidth.toFixed(2) +
      ', "height": ' +
      this.scrollHeight.toFixed(2) +
      ', "left": ' +
      this.scrollLeft.toFixed(2) +
      ', "top": ' +
      this.scrollTop.toFixed(2) +
      ', "widthRatio": ' +
      this.widthBoxRatio.toFixed(5) +
      ', "heightRatio": ' +
      this.heightBoxRatio.toFixed(5) +
      '}'
    );
  };
}
