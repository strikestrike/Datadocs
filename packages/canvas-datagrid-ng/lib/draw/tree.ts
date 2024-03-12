import type { GridPrivateProperties } from '../types';
import type { NormalCellDescriptor } from '../types/cell';
import type { DrawUtils } from './util';

export class DrawCellTree {
  constructor(
    private readonly self: GridPrivateProperties,
    private readonly utils: DrawUtils,
  ) {}

  draw = (
    cell: NormalCellDescriptor,
    tree: { parentCount: number; icon?: boolean; expand?: boolean },
    rowTree: boolean,
  ) => {
    const { self } = this;
    const parentCount = rowTree ? tree.parentCount : 0;
    const iconSize = self.style.cellTreeIconWidth * self.scale,
      marginTop = self.style.cellTreeIconMarginTop * self.scale,
      marginRight = self.style.cellTreeIconMarginRight * self.scale,
      marginLeft =
        self.style.cellTreeIconMarginLeft * self.scale +
        parentCount * (iconSize + cell.paddingLeft);

    const x = cell.x + cell.paddingLeft + self.canvasOffsetLeft + marginLeft,
      y = cell.y + self.canvasOffsetTop + marginTop;

    if (tree.icon) {
      self.ctx.beginPath();
      const oldFillStyle = self.ctx.fillStyle;
      const oldStrokeStyle = self.ctx.strokeStyle;

      if (cell.hovered && self.hovers.onCellTreeIcon) {
        self.ctx.fillStyle = self.style.cellTreeIconHoverFillColor;
      } else {
        self.ctx.fillStyle = self.style.cellTreeIconFillColor;
      }

      self.ctx.fillRect(x, y, iconSize, iconSize);
      self.ctx.strokeStyle = self.style.cellTreeIconBorderColor;
      self.ctx.rect(x, y, iconSize, iconSize);
      self.ctx.stroke();

      self.ctx.beginPath();
      if (tree.expand) {
        self.ctx.moveTo(x + 3, y + iconSize * 0.5);
        self.ctx.lineTo(x + iconSize - 3, y + iconSize * 0.5);
      } else {
        self.ctx.moveTo(x + 2, y + iconSize * 0.5);
        self.ctx.lineTo(x + iconSize - 2, y + iconSize * 0.5);
        self.ctx.moveTo(x + iconSize * 0.5, y + 2);
        self.ctx.lineTo(x + iconSize * 0.5, y + iconSize - 2);
      }
      self.ctx.lineWidth = self.style.cellTreeIconLineWidth;
      self.ctx.strokeStyle = self.style.cellTreeIconLineColor;
      self.ctx.stroke();

      self.ctx.strokeStyle = oldStrokeStyle;
      self.ctx.fillStyle = oldFillStyle;
    }

    return marginLeft + iconSize + marginRight;
  };
}
