import type { GridPrivateProperties, ScrollBoxEntity } from '../types';

/**
 * Resizes the scroller related parts of the grid.
 * @param self
 */
export function resizeGridScroller(self: GridPrivateProperties) {
  const style = self.style;
  const scrollBox = self.scrollBox;
  const scrollBarBoxWidth = style.scaled.scrollBarBoxWidth;
  const overflowX = style.overflowX;
  const overflowY = style.overflowY;
  const positionHelper = self.dataSource.positionHelper;
  const thumbMargin = style.scaled.scrollBarBoxMargin,
    scrollBarWidth = style.scaled.scrollBarWidth,
    trackSize = scrollBarWidth + style.scrollBarBorderWidth + thumbMargin,
    verticalTrack: ScrollBoxEntity = {
      nodeType: 'scrollbar',
      x: 0,
      y: 0,
      height: 0,
      width: trackSize,
      isScrollBar: true,
      isVerticalScrollBar: true,
      style: 'vertical-scroll-bar',
    },
    horizontalTrack: ScrollBoxEntity = {
      nodeType: 'scrollbar',
      x: 0,
      y: 0,
      height: trackSize,
      width: 0,
      style: 'horizontal-scroll-bar',
      isScrollBar: true,
      isHorizontalScrollBar: true,
    },
    verticalThumb: ScrollBoxEntity = {
      nodeType: 'scrollbar',
      x: 0,
      y: 0,
      height: 0,
      width: scrollBarBoxWidth,
      isScrollBar: true,
      isVerticalScrollBar: true,
      style: 'vertical-scroll-box',
    },
    horizontalThumb: ScrollBoxEntity = {
      nodeType: 'scrollbar',
      x: 0,
      y: 0,
      height: scrollBarBoxWidth,
      width: 0,
      isScrollBar: true,
      isHorizontalScrollBar: true,
      style: 'horizontal-scroll-box',
    },
    corner: ScrollBoxEntity = {
      nodeType: 'scrollbar',
      x: 0,
      y: 0,
      height: 0,
      width: 0,
      isCorner: true,
      isScrollBoxCorner: true,
      style: 'scroll-box-corner',
    },
    topAreaHeight = self.dp(self.getTopAreaHeight()),
    leftAreaWidth = self.dp(self.getLeftAreaWidth());

  const frozenColumnsWidth = self.dp(self.frozenColumnsWidth);
  const frozenRowsHeight = self.dp(self.frozenRowsHeight);

  // Calculate these early to align them better.
  verticalTrack.x += self.width - scrollBarWidth;
  horizontalTrack.y += self.height - scrollBarWidth;

  // horizontal scroll bar
  horizontalTrack.x += leftAreaWidth + frozenColumnsWidth;
  horizontalTrack.width = verticalTrack.x - horizontalTrack.x - thumbMargin * 2;
  horizontalThumb.y = horizontalTrack.y + thumbMargin;

  // vertical scroll bar
  verticalTrack.y += topAreaHeight + frozenRowsHeight;
  verticalTrack.height = horizontalTrack.y - verticalTrack.y - thumbMargin * 2;
  verticalThumb.x = verticalTrack.x + thumbMargin;

  corner.x = verticalTrack.x;
  corner.y = horizontalTrack.y;
  corner.width = verticalTrack.width;
  corner.height = horizontalTrack.height;

  scrollBox.entities = {
    horizontalTrack: horizontalTrack,
    horizontalThumb: horizontalThumb,
    verticalTrack: verticalTrack,
    verticalThumb: verticalThumb,
    corner,
  };

  const { scrollableDataWidth, scrollableDataHeight } = self,
    trackWidth = self.px(horizontalTrack.width),
    trackHeight = self.px(verticalTrack.height),
    needsHorizontalScrollbar = scrollableDataWidth > trackWidth,
    needsVerticalScrollbar = scrollableDataHeight > trackHeight;

  // Set the visibility of scrollbars.
  scrollBox.horizontalTrackVisible =
    (needsHorizontalScrollbar && overflowX !== 'hidden') ||
    overflowX === 'scroll';
  scrollBox.horizontalThumbVisible = needsHorizontalScrollbar;
  scrollBox.verticalTrackVisible =
    (needsVerticalScrollbar && overflowY !== 'hidden') ||
    overflowY === 'scroll';
  scrollBox.verticalThumbVisible = needsVerticalScrollbar;

  const scrollWidth = scrollableDataWidth - trackWidth,
    scrollHeight = scrollableDataHeight - trackHeight;

  if (needsHorizontalScrollbar) {
    const { index: lastIndex, pixel: lastPixel } =
      positionHelper.getHorizontalLastScrollTarget(
        style.cellWidth,
        self.getLastColumnIndex(),
        trackWidth,
      );
    scrollBox.setHorizontalScrollTotal(lastIndex, lastPixel, scrollWidth);
  } else {
    scrollBox.setHorizontalScrollTotal(0, 0);
  }
  if (needsVerticalScrollbar) {
    const { index: lastIndex, pixel: lastPixel } =
      positionHelper.getVerticalLastScrollTarget(
        style.cellHeight,
        self.getLastRowIndex(),
        trackHeight,
      );
    scrollBox.setVerticalScrollTotal(
      lastIndex,
      lastPixel,
      self.hiddenRowCount,
      scrollHeight,
    );
  } else {
    scrollBox.setVerticalScrollTotal(0, 0, self.hiddenRowCount);
  }
}
