import type { GridPrivateProperties, NormalCellDescriptor } from '../types';

export class DrawCellErrorIndication {
  constructor(private readonly self: GridPrivateProperties) {}

  /**
   * Draw cell error indication (a top left red triangle) if there are errors
   * inside cell.
   *
   * @param cell
   * @returns
   */
  draw = (cell: NormalCellDescriptor) => {
    if (!cell.isNormal || !cell.error) {
      return;
    }

    const { errorIndicationWidth } = this.self.style.scaled;
    const { errorIndicationColor } = this.self.style;

    this.drawErrorTriangle(
      cell.x,
      cell.y,
      errorIndicationWidth,
      errorIndicationColor,
    );
  };

  drawErrorTriangle(
    startX: number,
    startY: number,
    size: number,
    fill: string,
  ) {
    const ctx = this.self.ctx;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(startX + size, startY);
    ctx.lineTo(startX, startY + size);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.closePath();
    ctx.restore();
  }
}
