import type { GridPrivateProperties } from '../types/grid';
import type { CellLinkedNode } from '../types/drawing';
import type { DrawFrameCache } from './frame-cache';
import type { DrawCellTree } from './tree';
import type { DrawUtils } from './util';
import { drawCellChips } from './draw-cell-chips';

/**
 * Draw a cells text.
 * @param cellNode The cell whose text is going to be drawn.
 */
export const drawCellText = (
  self: GridPrivateProperties,
  utils: DrawUtils,
  frameCache: DrawFrameCache,
  cellTree: DrawCellTree,
  cellNode: CellLinkedNode,
) => {
  const { cell, source } = cellNode;
  const {
    radiusRect,
    drawHtml,
    drawRotationText,
    drawText,
    drawTextWithStyleRuns,
    applyCellStyles,
    applyCellFontStyles,
  } = utils;
  const { dataSourceState } = frameCache;
  if (self.dispatchEvent('rendertext', cell.event)) return;

  if (cell.chips) {
    drawCellChips(self, utils, cellNode);
    return;
  }

  applyCellStyles(cell);
  applyCellFontStyles(cell);

  const clipForText =
    !cell.isEmpty &&
    !cell.textRotation &&
    (cell.text.width > cell.contentWidth ||
      cell.text.height > cell.height ||
      cell.drawStyleRuns?.length > 0);
  if (clipForText) {
    self.ctx.save();
    radiusRect(
      cell.text.clipStartX ?? cell.x,
      cell.y,
      cell.contentWidth,
      cell.height,
      0,
    );
    self.ctx.clip();
  }

  if (cell.innerHTML || source.header.type === 'html') {
    drawHtml(cell);
  } else {
    let treeCellPadding = 0,
      isDrawText = true;
    if (
      cell.columnIndex == self.cellTree.rowTreeColIndex &&
      !cell.isColumnHeader &&
      self.cellTree.rows.length > 0 &&
      Object.keys(self.cellTree.rows[cell.rowIndex]).length > 1
    )
      treeCellPadding = cellTree.draw(
        cell,
        self.cellTree.rows[cell.rowIndex],
        true,
      );

    if (
      !cell.isRowHeader &&
      cell.rowIndex > 0 &&
      self.cellTree.columns[cell.rowIndex - 1] &&
      self.cellTree.columns[cell.rowIndex - 1][cell.columnIndex].icon
    ) {
      for (let r = cell.rowIndex - 1; r >= 0; r--) {
        if (!self.cellTree.columns[r]) break;
        if (!self.cellTree.columns[r][cell.columnIndex].icon) break;
        if (!self.cellTree.columns[r][cell.columnIndex].expand) {
          isDrawText = false;
          break;
        }
      }
    }
    if (
      isDrawText &&
      !cell.isRowHeader &&
      self.cellTree.columns[cell.rowIndex] &&
      self.cellTree.columns[cell.rowIndex][cell.columnIndex].icon
    ) {
      if (dataSourceState.rows > 0 && cell.value)
        treeCellPadding = cellTree.draw(
          cell,
          self.cellTree.columns[cell.rowIndex][cell.columnIndex],
          false,
        );
    }
    if (isDrawText) {
      if (cell.textRotation) {
        drawRotationText(cell, treeCellPadding);
      } else {
        if (cell.drawStyleRuns?.length > 0) {
          drawTextWithStyleRuns(cell, treeCellPadding);
        } else {
          drawText(cell, treeCellPadding);
        }
      }
    }
  }

  if (clipForText) {
    self.ctx.restore();
  }

  if (
    cell.wrapMode === 'multi-line' &&
    cell.text &&
    cell.text.height > cellNode.source.rowHeight &&
    self.setRowHeight(cell.rowIndex, self.px(cell.text.height) + 4, true)
  ) {
    frameCache.checkScrollHeight = true;
  }
};
