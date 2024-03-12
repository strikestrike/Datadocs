import type { GridPrivateProperties } from '../types/grid';
import type { CellLinkedNode } from '../types/drawing';
import type { DrawUtils } from './util';
import type { NormalCellDescriptor } from '../types';

export const drawCellChips = (
  self: GridPrivateProperties,
  utils: DrawUtils,
  cellNode: CellLinkedNode,
) => {
  const { radiusRect, fillText } = utils;
  const { cell } = cellNode;
  if (!Array.isArray(cell.chips) || cell.chips.length === 0) return;

  self.ctx.save();
  radiusRect(cell.x, cell.y, cell.width, cell.height, 0);
  self.ctx.clip();

  const {
    cellChipBorderRadius,
    cellChipGap,
    cellChipHeight,
    cellChipMarginTop,
    cellChipPaddingLeft,
    cellChipPaddingRight,
    cellPaddingLeft,
    cellPaddingRight,
  } = self.style.scaled;
  const { cellChipBackgroundColor } = self.style;

  self.ctx.textBaseline = 'middle';

  const chipStartX = cell.x + cellPaddingLeft;
  const chipStartY = cell.y + cellChipMarginTop;

  const cellRemainSpace = cell.width - cellPaddingLeft - cellPaddingRight;
  const ellipsisText = self.attributes.ellipsisText,
    ellipsisWidth = self.ctx.measureText(ellipsisText).width;
  const chipText = truncateCellChipWithEllipsis(self, cell.chips[0]);
  const chipWidth = chipText.width + cellChipPaddingLeft + cellChipPaddingRight;
  const remainCount = cell.chipsCount - 1;

  function drawChip() {
    radiusRect(
      chipStartX,
      chipStartY,
      chipWidth,
      cellChipHeight,
      cellChipBorderRadius,
    );
    self.ctx.fillStyle = cellChipBackgroundColor;
    self.ctx.fill();

    applyCellChipStyle(self);
    fillText(
      chipText.text,
      chipStartX + cellChipPaddingLeft,
      chipStartY + cellChipHeight / 2,
    );
  }

  function drawClipChipWithEllipsis() {
    const chipRemainSpace = cellRemainSpace - cellChipGap - ellipsisWidth;

    self.ctx.save();
    radiusRect(
      cell.x,
      cell.y,
      cellPaddingLeft + chipRemainSpace,
      cell.height,
      0,
    );
    self.ctx.clip();
    drawChip();
    self.ctx.restore();

    fillText(
      ellipsisText,
      chipStartX + chipRemainSpace + cellChipGap,
      chipStartY + cellChipHeight / 2,
    );
  }

  if (remainCount > 0) {
    const moreText = `& ${remainCount} more`;
    const moreTextWidth = self.ctx.measureText(moreText).width;

    if (cellRemainSpace >= chipWidth + cellChipGap + moreTextWidth) {
      drawChip();
      fillText(
        moreText,
        chipStartX + chipWidth + cellChipGap,
        chipStartY + cellChipHeight / 2,
      );
    } else if (cellRemainSpace <= chipWidth + cellChipGap + ellipsisWidth) {
      drawClipChipWithEllipsis();
    } else {
      drawChip();
      const textRemainSpace = cellRemainSpace - chipWidth - cellChipGap;
      const text = truncateCellChipWithEllipsis(
        self,
        moreText,
        textRemainSpace,
      );
      fillText(
        text.text,
        chipStartX + chipWidth + cellChipGap,
        chipStartY + cellChipHeight / 2,
      );
    }
  } else {
    if (cellRemainSpace >= chipWidth) {
      drawChip();
    } else {
      drawClipChipWithEllipsis();
    }
  }

  /*
  const visibleChips =
    cell.chips.length === 1 ? cell.chips : getVisibleChips(self, cell);

  for (let i = 0; i < visibleChips.length; i++) {
    const chipText = truncateCellChipWithEllipsis(self, visibleChips[i]);
    const chipWidth =
      chipText.width + cellChipPaddingLeft + cellChipPaddingRight;

    radiusRect(
      chipStartX,
      chipStartY,
      chipWidth,
      cellChipHeight,
      cellChipBorderRadius,
    );
    self.ctx.fillStyle = cellChipBackgroundColor;
    self.ctx.fill();

    applyCellChipStyle(self);
    fillText(
      chipText.text,
      chipStartX + cellChipPaddingLeft,
      chipStartY + cellChipHeight / 2,
    );

    chipStartX += chipWidth + cellChipGap;
  }
  */

  self.ctx.restore();
};

function applyCellChipStyle(self: GridPrivateProperties) {
  const { cellChipFontSize: fontSize } = self.style.scaled;
  const {
    cellChipFontFamily: fontFamily,
    cellChipFontWeight: fontWeight,
    cellChipTextColor: textColor,
  } = self.style;

  self.ctx.font = fontWeight + ' ' + fontSize + 'px ' + fontFamily;
  self.ctx.fillStyle = textColor;
}

/**
 * Get visible chips depend on remaining spaces inside a cell.
 * Add +<remaining_count> at the end to know there are more chips
 * but there isn't enough space to show them.
 *
 * @param self
 * @param cell
 * @returns
 */
function getVisibleChips(
  self: GridPrivateProperties,
  cell: NormalCellDescriptor,
): string[] {
  applyCellChipStyle(self);

  const {
    cellChipGap,
    cellChipMaxWidth,
    cellChipPaddingLeft,
    cellChipPaddingRight,
    cellPaddingLeft,
    cellPaddingRight,
  } = self.style.scaled;
  const estimateChipWidth = (chipText: string) => {
    const contentWidth =
      self.ctx.measureText(chipText).width +
      cellChipPaddingLeft +
      cellChipPaddingRight;
    return Math.min(contentWidth, cellChipMaxWidth);
  };
  const getRemainChip = (count: number) => '+' + count;

  const { width: cellWidth, chips } = cell;
  const cellRemainSpace = cellWidth - cellPaddingLeft - cellPaddingRight;
  const visibleChips: string[] = [];
  const chipsCount = chips.length;

  let currentWidth = 0;
  for (let i = 0; i < chipsCount; i++) {
    const remainCount = chipsCount - visibleChips.length - 1;
    const remainChipWidth =
      remainCount > 0 ? estimateChipWidth(getRemainChip(remainCount)) : 0;
    const chipGap = visibleChips.length * cellChipGap;

    currentWidth += estimateChipWidth(chips[i]);
    if (currentWidth + chipGap + remainChipWidth > cellRemainSpace) {
      visibleChips.push(getRemainChip(remainCount + 1));
      break;
    } else {
      visibleChips.push(chips[i]);
    }
  }

  return visibleChips;
}

function truncateCellChipWithEllipsis(
  self: GridPrivateProperties,
  value: string,
  maxWidth?: number,
): { text: string; width: number } {
  applyCellChipStyle(self);
  value = value.replace(/\r\n|\r|\n/g, '');
  const { cellChipMaxWidth, cellChipPaddingLeft, cellChipPaddingRight } =
    self.style.scaled;
  const words = value.split(/(\s)/);
  const maxContentWidth =
    maxWidth ?? cellChipMaxWidth - cellChipPaddingLeft - cellChipPaddingRight;

  let currentWidth = 0;
  let currentText = '';
  for (let i = 0; i < words.length; i++) {
    currentText += words[i];
    currentWidth += self.ctx.measureText(words[i]).width;
    if (currentWidth > maxContentWidth) {
      break;
    }
  }

  if (currentWidth > maxContentWidth) {
    const ellipsisText = self.attributes.ellipsisText;
    const ellipsisWidth = self.ctx.measureText(ellipsisText).width;
    const truncateWidth = currentWidth - maxContentWidth;
    let redundantText = '';
    let redundantWidth = 0;

    for (let i = currentText.length - 1; i >= 0; i--) {
      const char = currentText[i];
      redundantText = char + redundantText;
      redundantWidth += self.ctx.measureText(char).width;
      if (redundantWidth > ellipsisWidth + truncateWidth) {
        break;
      }
    }

    currentText = currentText.slice(0, -redundantText.length) + ellipsisText;
    currentWidth = currentWidth + ellipsisWidth - redundantWidth;
  }

  return { text: currentText, width: currentWidth };
}
