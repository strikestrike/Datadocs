import type { GridPrivateProperties } from '../types';
import type { DrawUtils } from './util';

export function drawScrollBars(self: GridPrivateProperties, utils: DrawUtils) {
  const { fillRect, strokeRect, radiusRect } = utils;
  const {
    horizontalTrack,
    horizontalThumb,
    verticalTrack,
    verticalThumb,
    corner,
  } = self.scrollBox.entities;

  let drawCorner: boolean;
  const thumbMargin = self.style.scaled.scrollBarBoxMargin,
    scrollBarWidth = self.style.scaled.scrollBarWidth,
    trackBorderWidth = self.style.scrollBarBorderWidth,
    trackWidth = self.px(horizontalTrack.width),
    trackHeight = self.px(verticalTrack.height);

  self.ctx.strokeStyle = self.style.scrollBarBorderColor;
  self.ctx.lineWidth = self.style.scaled.scrollBarBorderWidth;

  const horizontalDiff = self.scrollBox.getHorizontalScrollAmount(true);
  horizontalThumb.width = Math.max(
    self.dp(trackWidth * self.scrollBox.dynWidthBoxRatio) -
      scrollBarWidth -
      trackBorderWidth -
      thumbMargin,
    self.style.scaled.scrollBarBoxMinSize,
  );
  horizontalThumb.x =
    horizontalTrack.x +
    thumbMargin +
    (horizontalTrack.width - horizontalThumb.width) * horizontalDiff;

  const verticalDiff = self.scrollBox.getVerticalScrollAmount(true);
  verticalThumb.height = Math.max(
    self.dp(trackHeight * self.scrollBox.dynHeightBoxRatio) -
      scrollBarWidth -
      trackBorderWidth -
      thumbMargin,
    self.style.scaled.scrollBarBoxMinSize,
  );
  verticalThumb.y =
    verticalTrack.y +
    thumbMargin +
    (verticalTrack.height - verticalThumb.height) * verticalDiff;

  // Set a minumum height to the thumbs.
  horizontalThumb.width = Math.max(
    horizontalThumb.width,
    self.style.scaled.scrollBarBoxMinSize,
  );
  verticalThumb.height = Math.max(
    verticalThumb.height,
    self.style.scaled.scrollBarBoxMinSize,
  );

  if (self.scrollBox.horizontalTrackVisible) {
    self.ctx.fillStyle = self.style.scrollBarBackgroundColor;
    fillRect(
      horizontalTrack.x,
      horizontalTrack.y,
      horizontalTrack.width + thumbMargin * 2,
      horizontalTrack.height,
    );
    strokeRect(
      horizontalTrack.x,
      horizontalTrack.y,
      horizontalTrack.width + thumbMargin * 2,
      horizontalTrack.height,
    );
    self.ctx.fillStyle = self.style.scrollBarBoxColor;
    if (self.scrollBox.horizontalThumbVisible) {
      if (
        (self.currentCell?.isHorizontalScrollBar && !self.draggingItem) ||
        /horizontal-scroll/.test(self.scrollContext?.mode)
      ) {
        self.ctx.fillStyle = self.style.scrollBarActiveColor;
      }
      radiusRect(
        horizontalThumb.x,
        horizontalThumb.y,
        horizontalThumb.width,
        horizontalThumb.height,
        self.style.scaled.scrollBarBoxBorderRadius,
      );
      self.ctx.stroke();
      self.ctx.fill();
    }
    drawCorner = true;
    self.visibleCells.unshift(horizontalTrack);
    self.visibleCells.unshift(horizontalThumb);
  }
  if (self.scrollBox.verticalTrackVisible) {
    self.ctx.fillStyle = self.style.scrollBarBackgroundColor;
    fillRect(
      verticalTrack.x,
      verticalTrack.y,
      verticalTrack.width,
      verticalTrack.height + thumbMargin * 2,
    );
    strokeRect(
      verticalTrack.x,
      verticalTrack.y,
      verticalTrack.width,
      verticalTrack.height + thumbMargin * 2,
    );
    if (self.scrollBox.verticalThumbVisible) {
      self.ctx.fillStyle = self.style.scrollBarBoxColor;
      if (
        (self.currentCell?.isVerticalScrollBar && !self.draggingItem) ||
        /vertical-scroll/.test(self.scrollContext?.mode)
      ) {
        self.ctx.fillStyle = self.style.scrollBarActiveColor;
      }
      radiusRect(
        verticalThumb.x,
        verticalThumb.y,
        verticalThumb.width,
        verticalThumb.height,
        self.style.scaled.scrollBarBoxBorderRadius,
      );
      self.ctx.stroke();
      self.ctx.fill();
    }
    drawCorner = true;
    self.visibleCells.unshift(verticalTrack);
    self.visibleCells.unshift(verticalThumb);
  }
  if (drawCorner) {
    //corner
    self.ctx.strokeStyle = self.style.scrollBarCornerBorderColor;
    self.ctx.fillStyle = self.style.scrollBarCornerBackgroundColor;
    radiusRect(corner.x, corner.y, corner.width, corner.height, 0);
    self.ctx.fill();
    self.ctx.stroke();
    self.visibleCells.unshift(corner);
  }
}
