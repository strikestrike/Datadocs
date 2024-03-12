import type { GridPrivateProperties } from '../types';
import { resizeGridScroller } from './resize-grid-scroller';
import resizeGridElement from './resize-grid-element';
import { updateScalableDimensions } from './util';

/**
 * Resizes the grid as a whole.
 * @param self
 * @param drawAfterResize
 */
export function resizeGrid(
  self: GridPrivateProperties,
  drawAfterResize?: boolean,
): boolean {
  if (!self.canvas) {
    return;
  }

  // Apply an initial width to row number column.
  if (self.rowNumberColumnDigitCount <= 0) {
    self.calcRowHeaderWidth(1);
  }

  // Update dimensions.
  updateScalableDimensions(self);
  resizeGridElement(self);

  self.frozenColumnsWidth = self.getScrollCacheX(self.frozenColumn);
  self.frozenRowsHeight = self.getScrollCacheY(self.frozenRow);
  self.hiddenRowCount = self.dataSource.getHiddenRowCount();

  // Calculate the total scroll width.
  self.scrollableDataWidth = self.initializeAllColumnsWidth();
  // Calculate the total scroll height.
  self.scrollableDataHeight = self.initializeAllRowsHeight();

  resizeGridScroller(self);
  // resize any open dom elements (input/textarea)
  self.resizeEditInput();
  self.scrollBox.updateState(true);
  if (drawAfterResize) {
    self.draw(true);
  }
  self.dispatchEvent('resize', {});
  return true;
}
