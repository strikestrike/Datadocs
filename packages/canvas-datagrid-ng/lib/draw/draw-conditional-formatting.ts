import type { GridPrivateProperties } from '../types/grid';
import type {
  ConditionalFormattingIconSet,
  CellConditionalFormattingIcon,
  NormalCellDescriptor,
} from '../types/cell';
import { getConditionalFormattingIcon } from '../data/conditional-formatting';
import { DrawUtils } from './util';

const RED_COLOR = '#F07F84';
const YELLOW_COLOR = '#FCDC74';
const GREEN_COLOR = '#6ABE83';

export class DrawConditionalFormatting {
  private readonly utils: DrawUtils;
  constructor(private readonly self: GridPrivateProperties) {
    this.utils = new DrawUtils(self);
  }

  /**
   * Get conditional formating icon position and size
   *
   * The icon position is according to vertical text alignment,
   * the icon size is scaled up/down depend on the zoom ratio and
   * current font-size of the cell.
   * @param cell
   * @param iconSet
   * @param value
   * @returns
   */
  getIcon = (
    cell: NormalCellDescriptor,
    iconSet: ConditionalFormattingIconSet,
    value: any,
  ): CellConditionalFormattingIcon => {
    const icons = getConditionalFormattingIcon(value, iconSet);
    if (!icons) return null;
    const ratio = cell.fontSize / this.self.style.cellFontSize;
    const iconWidth = Math.floor(
      this.self.style.scaled.conditionalFormattingIconWidth * ratio,
    );
    const iconHeight = Math.floor(
      this.self.style.scaled.conditionalFormattingIconHeight * ratio,
    );
    const startX = cell.x;
    let startY = cell.y + cell.paddingTop;
    if (cell.verticalAlignment === 'middle') {
      startY += (cell.paddedHeight - iconHeight) / 2;
    } else if (cell.verticalAlignment === 'bottom') {
      startY += cell.paddedHeight - iconHeight;
    }

    return {
      iconSet,
      iconImage: icons.iconImage,
      iconRect: {
        x: startX,
        y: startY,
        width: iconWidth,
        height: iconHeight,
      },
    };
  };

  private readonly drawThreeArrowsColored = (
    cell: NormalCellDescriptor,
    iconImage: string,
  ) => {
    const { self } = this;
    const {
      x: startX,
      y: startY,
      width: iconWidth,
      height: iconHeight,
    } = cell.conditionalFormatIcon.iconRect;

    const iconPadding = self.dp(2);
    const arrowTipWidth = Math.floor(iconWidth * 0.8);
    const arrowBodyWidth = Math.floor(iconWidth * 0.4);
    const arrowTipHeight = Math.floor((iconHeight - 2 * iconPadding) * 0.5);

    if (iconImage === 'arrow-up') {
      const arrowCenter = Math.floor(startX + iconWidth / 2);
      const arrowTop = startY + iconPadding;
      const arrowBottom = arrowTop + iconHeight - 2 * iconPadding;

      self.ctx.beginPath();
      self.ctx.moveTo(arrowCenter, arrowTop);
      self.ctx.lineTo(
        arrowCenter + arrowTipWidth / 2,
        arrowTop + arrowTipHeight,
      );
      self.ctx.lineTo(
        arrowCenter + arrowBodyWidth / 2,
        arrowTop + arrowTipHeight,
      );
      self.ctx.lineTo(arrowCenter + arrowBodyWidth / 2, arrowBottom);
      self.ctx.lineTo(arrowCenter - arrowBodyWidth / 2, arrowBottom);
      self.ctx.lineTo(
        arrowCenter - arrowBodyWidth / 2,
        arrowTop + arrowTipHeight,
      );
      self.ctx.lineTo(
        arrowCenter - arrowTipWidth / 2,
        arrowTop + arrowTipHeight,
      );
      self.ctx.fillStyle = GREEN_COLOR;
      self.ctx.fill();
      self.ctx.closePath();
    } else if (iconImage === 'arrow-down') {
      const arrowCenter = Math.floor(startX + iconWidth / 2);
      const arrowTop = startY + iconPadding;
      const arrowBottom = arrowTop + iconHeight - 2 * iconPadding;

      self.ctx.beginPath();
      self.ctx.moveTo(arrowCenter - arrowBodyWidth / 2, arrowTop);
      self.ctx.lineTo(arrowCenter + arrowBodyWidth / 2, arrowTop);
      self.ctx.lineTo(
        arrowCenter + arrowBodyWidth / 2,
        arrowBottom - arrowTipHeight,
      );
      self.ctx.lineTo(
        arrowCenter + arrowTipWidth / 2,
        arrowBottom - arrowTipHeight,
      );
      self.ctx.lineTo(arrowCenter, arrowBottom);
      self.ctx.lineTo(
        arrowCenter - arrowTipWidth / 2,
        arrowBottom - arrowTipHeight,
      );
      self.ctx.lineTo(
        arrowCenter - arrowBodyWidth / 2,
        arrowBottom - arrowTipHeight,
      );
      self.ctx.fillStyle = RED_COLOR;
      self.ctx.fill();
      self.ctx.closePath();
    } else if (iconImage === 'arrow-right') {
      const arrowCenter = Math.floor(startY + iconHeight / 2);
      const arrowLeft = startX + iconPadding;
      const arrowRight = arrowLeft + iconWidth - 2 * iconPadding;

      self.ctx.beginPath();
      self.ctx.moveTo(arrowLeft, arrowCenter - arrowBodyWidth / 2);
      self.ctx.lineTo(
        arrowRight - arrowTipHeight,
        arrowCenter - arrowBodyWidth / 2,
      );
      self.ctx.lineTo(
        arrowRight - arrowTipHeight,
        arrowCenter - arrowTipWidth / 2,
      );
      self.ctx.lineTo(arrowRight, arrowCenter);
      self.ctx.lineTo(
        arrowRight - arrowTipHeight,
        arrowCenter + arrowTipWidth / 2,
      );
      self.ctx.lineTo(
        arrowRight - arrowTipHeight,
        arrowCenter + arrowBodyWidth / 2,
      );
      self.ctx.lineTo(arrowLeft, arrowCenter + arrowBodyWidth / 2);
      self.ctx.fillStyle = YELLOW_COLOR;
      self.ctx.fill();
      self.ctx.closePath();
    }
  };

  private readonly drawThreeTrafficLights = (
    cell: NormalCellDescriptor,
    iconImage: string,
  ) => {
    const { self } = this;
    const {
      x: startX,
      y: startY,
      width: iconWidth,
      height: iconHeight,
    } = cell.conditionalFormatIcon.iconRect;

    const iconPadding = self.dp(2);
    const radius = Math.floor(iconWidth / 2 - iconPadding);
    const centerX = Math.floor(startX + iconWidth / 2);
    const centerY = Math.floor(startY + iconHeight / 2);
    self.ctx.beginPath();
    self.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    if (iconImage === 'green-light') {
      self.ctx.fillStyle = GREEN_COLOR;
      self.ctx.fill();
    } else if (iconImage === 'yellow-light') {
      self.ctx.fillStyle = YELLOW_COLOR;
      self.ctx.fill();
    } else if (iconImage === 'red-light') {
      self.ctx.fillStyle = RED_COLOR;
      self.ctx.fill();
    }
    self.ctx.closePath();
  };

  private readonly drawConditionalFormattingIcon = (
    cell: NormalCellDescriptor,
  ) => {
    const icon = cell.conditionalFormatIcon;
    if (!icon) return;

    switch (icon.iconSet) {
      case '3-arrows-colored': {
        this.drawThreeArrowsColored(cell, icon.iconImage);
        break;
      }
      case '3-traffic-lights': {
        this.drawThreeTrafficLights(cell, icon.iconImage);
        break;
      }
      default:
        break;
    }
  };

  readonly draw = (cell: NormalCellDescriptor) => {
    const { self } = this;
    if (!cell || !cell.conditionalFormatIcon) return;
    self.ctx.save();
    this.utils.radiusRect(cell.x, cell.y, cell.width, cell.height, 0);
    self.ctx.clip();
    this.drawConditionalFormattingIcon(cell);
    self.ctx.restore();
  };
}
