import type { GridPrivateProperties } from '../types';
import type { NormalCellDescriptor } from '../types/cell';
import type { DrawUtils } from './util';

export class DrawFilterButton {
  constructor(
    private readonly self: GridPrivateProperties,
    private readonly utils: DrawUtils,
  ) {}

  private draw = (x: number, y: number) => {
    const { self } = this;
    const mt =
        ((self.style.filterButtonHeight - self.style.filterButtonArrowHeight) /
          2) *
        self.scale,
      ml =
        ((self.style.filterButtonWidth - self.style.filterButtonArrowWidth) /
          2) *
        self.scale,
      aw = self.style.filterButtonArrowWidth * self.scale,
      ah = self.style.filterButtonArrowHeight * self.scale;
    x += self.canvasOffsetLeft;
    y += self.canvasOffsetTop;
    self.ctx.fillStyle = self.style.filterButtonArrowColor;
    self.ctx.strokeStyle = self.style.filterButtonArrowBorderColor;
    self.ctx.beginPath();
    x = x + ml;
    y = y + mt;

    self.ctx.moveTo(x, y);
    self.ctx.lineTo(x + aw, y);
    self.ctx.lineTo(x + aw * 0.5, y + ah);
    self.ctx.moveTo(x, y);

    self.ctx.stroke();
    self.ctx.fill();
    return ml + aw;
  };

  drawOnCell = (cell: NormalCellDescriptor, ev?: Event) => {
    const { self, utils } = this;
    const posX = cell.x + cell.width - self.style.filterButtonWidth - 1;
    const posY = cell.y + cell.height - self.style.filterButtonHeight - 2;
    if (self.dispatchEvent('beforerenderfilterbutton', ev)) {
      return;
    }
    self.ctx.save();
    self.ctx.strokeStyle = self.style.filterButtonBorderColor;
    self.ctx.fillStyle = self.style.filterButtonBackgroundColor;
    if (cell.openedFilter) {
      self.ctx.fillStyle = self.style.filterButtonActiveBackgroundColor;
    } else if (cell.hovered && self.hovers.onFilterButton) {
      self.ctx.fillStyle = self.style.filterButtonHoverBackgroundColor;
    }
    utils.radiusRect(
      posX,
      posY,
      self.style.filterButtonWidth,
      self.style.filterButtonHeight,
      self.style.filterButtonBorderRadius,
    );
    self.ctx.stroke();
    self.ctx.fill();
    this.draw(posX, posY);
    self.ctx.clip();
    self.dispatchEvent('afterrenderfilterbutton', ev);
    self.ctx.restore();
  };
}
