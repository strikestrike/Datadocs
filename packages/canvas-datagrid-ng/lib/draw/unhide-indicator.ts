import type { GridPrivateProperties, VisibleUnhideIndicator } from '../types';
import type { NormalCellDescriptor } from '../types/cell';
import type { CellLinkedNode } from '../types/drawing';
import type { DrawUtils } from './util';

type Direction = 't' | 'b' | 'l' | 'r';

export class DrawUnhideIndicator {
  constructor(
    private readonly self: GridPrivateProperties,
    private readonly utils: DrawUtils,
  ) {}

  createColumnIndicator = (cell: NormalCellDescriptor, isLeft?: boolean) => {
    const { self } = this;

    const { viewColumnIndex } = cell;
    const orderIndex0 = isLeft ? viewColumnIndex - 1 : viewColumnIndex;
    const orderIndex1 = isLeft ? viewColumnIndex : viewColumnIndex + 1;
    const size = self.style.scaled.unhideIndicatorSize;
    const x = Math.floor(
      cell.x + (isLeft ? 0 : Math.max(cell.width - size, 0)),
    );
    const y = Math.floor(cell.y + Math.max(0.5 * (cell.height - size), 0));

    return {
      x: x,
      y: y,
      x2: x + size,
      y2: y + size,
      orderIndex0,
      orderIndex1,
      dir: isLeft ? 'r' : 'l',
    } as VisibleUnhideIndicator;
  };

  createRowIndicator = (cell: NormalCellDescriptor, isTop?: boolean) => {
    const { self } = this;

    const { viewRowIndex } = cell;
    const orderIndex0 = isTop ? viewRowIndex - 1 : viewRowIndex;
    const orderIndex1 = isTop ? viewRowIndex : viewRowIndex + 1;
    const size = self.style.scaled.unhideIndicatorSize;
    const x = Math.floor(cell.x + cell.width - size);
    const y = Math.floor(
      cell.y + (isTop ? 0 : Math.max(cell.height - size, 0)),
    );

    return {
      x: x,
      y: y,
      x2: x + size,
      y2: y + size,
      orderIndex0,
      orderIndex1,
      dir: isTop ? 'b' : 't',
    } as VisibleUnhideIndicator;
  };

  /**
   * @param {number} x
   * @param {number} y
   * @param {number} size
   * @param {string} dir Direction of the triangle, one of the 't','b','l' and 'r'
   * @param {boolean} [active]
   */
  private draw = (
    cell: NormalCellDescriptor,
    x: number,
    y: number,
    size: number,
    dir: Direction,
    active?: boolean,
  ) => {
    const { self, utils } = this;
    const minPadding = size * 0.2;
    const maxPadding = size * 0.3;
    /** The long edge width of the triangle */
    const longEdge = size - 2 * minPadding;
    /** The median width of the triangle */
    const median = size - 2 * maxPadding;
    const halfLongEdge = longEdge * 0.5;
    let x0: number, y0: number;
    let coords: number[], borderCoords: number[];
    switch (dir) {
      case 'r':
        x0 = x + maxPadding;
        y0 = y + minPadding;
        borderCoords = [x, y, x + size, y, x + size, y + size, x, y + size];
        coords = [x0, y0, x0, y0 + longEdge, x0 + median, y0 + halfLongEdge];
        break;
      case 'l':
        x0 = x + size - maxPadding;
        y0 = y + minPadding;
        borderCoords = [x + size, y, x, y, x, y + size, x + size, y + size];
        coords = [x0, y0, x0, y0 + longEdge, x0 - median, y0 + halfLongEdge];
        break;
      case 't':
        x0 = x + minPadding;
        y0 = y + size - maxPadding;
        borderCoords = [x, y + size, x, y, x + size, y, x + size, y + size];
        coords = [x0, y0, x0 + longEdge, y0, x0 + halfLongEdge, y0 - median];
        break;
      case 'b':
        x0 = x + minPadding;
        y0 = y + maxPadding;
        borderCoords = [x, y, x, y + size, x + size, y + size, x + size, y];
        coords = [x0, y0, x0 + longEdge, y0, x0 + halfLongEdge, y0 + median];
        break;
    }

    self.ctx.save();
    utils.radiusRect(cell.x, cell.y, cell.width, cell.height, 0);
    self.ctx.clip();

    if (active) {
      self.ctx.strokeStyle = self.style.unhideIndicatorBorderColor;
      self.ctx.lineWidth = self.style.scaled.unhideIndicatorBorderWidth;
      utils.drawLines(borderCoords);

      self.ctx.fillStyle = self.style.unhideIndicatorBackgroundColor;
      const offset = dir === 'r' || dir === 'b' ? 1 : 0;
      if (dir === 'l' || dir === 'r')
        utils.fillRect(x - offset, y, size + offset, size);
      else utils.fillRect(x, y - offset, size, size + offset);
    }

    self.ctx.fillStyle = self.style.unhideIndicatorColor;
    utils.drawLines(coords, true);

    self.ctx.restore();
  };

  drawOnColumnHeader = (node: CellLinkedNode, iconsWidth: number) => {
    const { self } = this;
    const { cell } = node;
    const size = self.style.scaled.unhideIndicatorSize;

    const drawIndicator = (isLeft: boolean, active: boolean) => {
      const indicator = this.createColumnIndicator(cell, isLeft);
      if (!active) {
        const line = cell.text && cell.text.lines && cell.text.lines[0];
        if (line) {
          const lineX0 = iconsWidth > 0 ? iconsWidth : line.x;
          const lineX1 = line.x + line.width;
          if (indicator.x + size >= lineX0 && indicator.x <= lineX1) return;
        }
      }
      this.draw(cell, indicator.x, indicator.y, size, indicator.dir, active);
    }; // end of drawIndicator

    if (cell.containsUnhideIndicatorAtStart) {
      const hovered =
        cell.hoverContext === 'unhide-indicator-start' ||
        node.prevSibling?.cell?.hoverContext === 'unhide-indicator-end';
      drawIndicator(true, hovered);
    }
    if (cell.containsUnhideIndicatorAtEnd) {
      const hovered =
        cell.hoverContext === 'unhide-indicator-end' ||
        node.nextSibling?.cell?.hoverContext === 'unhide-indicator-start';
      drawIndicator(false, hovered);
    }
  };

  drawOnRowHeader = (node: CellLinkedNode) => {
    const { self } = this;
    const { cell } = node;
    const size = self.style.scaled.unhideIndicatorSize;
    // Leo's comment:
    // from the first row to the last row, `rowIndex` is from 0 to the count of rows
    // but `boundRowIndex` can be disordered if there are any ordered columns or filtered columns
    // Like this statement:
    // console.log(rowIndex, cell.boundRowIndex, cell.formattedValue);
    // can output the result like this:
    // 0 1 '2'
    // 1 3 '4'

    const drawIndicator = (isTop: boolean, active: boolean) => {
      const indicator = this.createRowIndicator(cell, isTop);
      this.draw(cell, indicator.x, indicator.y, size, indicator.dir, active);
    }; // end of drawIndicator

    if (cell.containsUnhideIndicatorAtStart) {
      const hovered =
        cell.hoverContext === 'unhide-indicator-start' ||
        node.upperSibling?.cell?.hoverContext === 'unhide-indicator-end';
      drawIndicator(true, hovered);
    }
    if (cell.containsUnhideIndicatorAtEnd) {
      const hovered =
        cell.hoverContext === 'unhide-indicator-end' ||
        node.lowerSibling?.cell?.hoverContext === 'unhide-indicator-start';
      drawIndicator(false, hovered);
    }
  };
}
