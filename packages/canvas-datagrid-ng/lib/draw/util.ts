import type { NormalCellDescriptor } from '../types/cell';
import type {
  CellDescriptor,
  CellLine,
  EllipsisCacheMap,
  HTMLImageCache,
  PixelBoundingRect,
} from '../types';
import type { defaultGridStyles } from '../style/default-styles';
import type { GridAttributes } from '../attributes';
import type { GridPosition } from '../position';
import type { FontStyleRun } from '../types/style';

export interface DrawUtilsContext {
  draw?: (internal?: boolean) => any;
  dp?: (value: number) => number;
  ellipsisCache: EllipsisCacheMap;
  htmlImageCache?: { [cacheKey: string]: HTMLImageCache };

  attributes: GridAttributes;
  ctx?: CanvasRenderingContext2D;
  canvasOffsetLeft?: number;
  canvasOffsetTop?: number;
  height: number;
  width: number;

  frozenColumn: number;
  frozenRow: number;
  lastFrozenColumnPixel?: number;
  lastFrozenRowPixel?: number;

  scale?: number;
  style?: typeof defaultGridStyles;
}

export class DrawUtils {
  cachedImagesDrawn = false;
  constructor(private readonly self: DrawUtilsContext) {
    if (!self.htmlImageCache) self.htmlImageCache = {};
  }

  addEllipsis = (text, width) => {
    const { self } = this;
    if (self.ellipsisCache[text] && self.ellipsisCache[text][width]) {
      return self.ellipsisCache[text][width];
    }
    //TODO Add ellipsis back when there is a fast way to do it
    const w = self.ctx.measureText(text).width;
    const c = { value: text, width: w };
    self.ellipsisCache[text] = self.ellipsisCache[text] || {};
    self.ellipsisCache[text][width] = c;
    return c;
  };

  clipFrozenArea = (mode) => {
    // 0 both, 1 rows, 2 cols
    // self.lastFrozenColumnPixel;
    // self.lastFrozenRowPixel;
    const { self } = this;
    const rowPixel = self.lastFrozenRowPixel;
    const colPixel = self.lastFrozenColumnPixel;

    self.ctx.beginPath();
    if (mode === 0) {
      self.ctx.moveTo(colPixel, rowPixel);
      self.ctx.lineTo(colPixel, self.height);
      self.ctx.lineTo(self.width, self.height);
      self.ctx.lineTo(self.width, rowPixel);
    } else if (mode === 1) {
      self.ctx.moveTo(0, rowPixel);
      self.ctx.lineTo(0, self.height);
      self.ctx.lineTo(self.width, self.height);
      self.ctx.lineTo(self.width, rowPixel);
    } else if (mode === 2) {
      self.ctx.moveTo(colPixel, 0);
      self.ctx.lineTo(self.width, 0);
      self.ctx.lineTo(self.width, self.height);
      self.ctx.lineTo(colPixel, self.height);
    }
    self.ctx.clip();
  };

  drawLine = (c: PixelBoundingRect, pos: GridPosition) => {
    const { self } = this;

    self.ctx.beginPath();
    if (pos === 'top') {
      self.ctx.moveTo(c.x + self.canvasOffsetLeft, c.y + self.canvasOffsetTop);
      self.ctx.lineTo(
        c.x + self.canvasOffsetLeft + c.width,
        c.y + self.canvasOffsetTop,
      );
    } else if (pos === 'right') {
      self.ctx.moveTo(
        c.x + self.canvasOffsetLeft + c.width,
        c.y + self.canvasOffsetTop,
      );
      self.ctx.lineTo(
        c.x + self.canvasOffsetLeft + c.width,
        c.y + self.canvasOffsetTop + c.height,
      );
    } else if (pos === 'bottom') {
      self.ctx.moveTo(
        c.x + self.canvasOffsetLeft,
        c.y + self.canvasOffsetTop + c.height,
      );
      self.ctx.lineTo(
        c.x + self.canvasOffsetLeft + c.width,
        c.y + self.canvasOffsetTop + c.height,
      );
    } else if (pos === 'left') {
      self.ctx.moveTo(c.x + self.canvasOffsetLeft, c.y + self.canvasOffsetTop);
      self.ctx.lineTo(
        c.x + self.canvasOffsetLeft,
        c.y + self.canvasOffsetTop + c.height,
      );
    }
    self.ctx.stroke();
  };

  blendColors = (fg: number[], bg: number[]) => {
    const fgAlpha = fg[3];
    const bgAlpha = bg[3];
    const alpha = 1 - (1 - fgAlpha) * (1 - bgAlpha);
    const target = new Array<number>(4);

    target[3] = alpha;
    for (let i = 0; i < 3; i++) {
      target[i] = Math.round(
        (fg[i] * fgAlpha) / alpha + (bg[i] * bgAlpha * (1 - fgAlpha)) / alpha,
      );
    }
    return target;
  };

  /**
   * Darken a given color.
   * @param rgb An array with three members which corresponds to RGB colors.
   * @param multiply The amount of times to darken.
   * @returns {number[]} The array of darkened RGB color.
   */
  darkenColor = (rgb: number[], multiply: number) => {
    const result = [...rgb];
    for (let i = 0; i < 3; i++) {
      result[i] = Math.max(rgb[i] - (255 - rgb[i]) * multiply, 0);
    }
    return result;
  };

  /**
   * @param {number[]} coords [x0,y0, x1,y1, x2,y2, ...]
   * @param {boolean} [fill] fill the area that construct by these lines but not stroke
   */
  drawLines = (coords: number[], fill?: boolean) => {
    if (coords.length < 4) return;
    const { self } = this;
    self.ctx.beginPath();
    self.ctx.moveTo(
      coords[0] + self.canvasOffsetLeft,
      coords[1] + self.canvasOffsetTop,
    );
    for (let i = 2; i < coords.length; i += 2) {
      const x = coords[i] + self.canvasOffsetLeft;
      const y = coords[i + 1] + self.canvasOffsetTop;
      self.ctx.lineTo(x, y);
    }
    if (fill) self.ctx.fill();
    else self.ctx.stroke();
  };

  radiusRect = (x: number, y: number, w: number, h: number, radius: number) => {
    const { self } = this;
    x += self.canvasOffsetLeft;
    y += self.canvasOffsetTop;
    var r = x + w,
      b = y + h;
    self.ctx.beginPath();
    self.ctx.moveTo(x + radius, y);
    self.ctx.lineTo(r - radius, y);
    self.ctx.quadraticCurveTo(r, y, r, y + radius);
    self.ctx.lineTo(r, y + h - radius);
    self.ctx.quadraticCurveTo(r, b, r - radius, b);
    self.ctx.lineTo(x + radius, b);
    self.ctx.quadraticCurveTo(x, b, x, b - radius);
    self.ctx.lineTo(x, y + radius);
    self.ctx.quadraticCurveTo(x, y, x + radius, y);
  };

  fillRect = (x: number, y: number, w: number, h: number) => {
    const { self } = this;
    x += self.canvasOffsetLeft;
    y += self.canvasOffsetTop;
    self.ctx.fillRect(x, y, w, h);
  };
  strokeRect = (x: number, y: number, w: number, h: number) => {
    const { self } = this;
    x += self.canvasOffsetLeft;
    y += self.canvasOffsetTop;
    self.ctx.strokeRect(x, y, w, h);
  };
  fillText = (text: string, x: number, y: number, maxWidth?: number) => {
    if (!text.length) return;
    const { self } = this;
    x += self.canvasOffsetLeft;
    y += self.canvasOffsetTop;
    self.ctx.fillText(text, x, y, maxWidth);
  };
  fillCircle = (x: number, y: number, r: number) => {
    const { self } = this;
    x += self.canvasOffsetLeft;
    y += self.canvasOffsetTop;
    self.ctx.beginPath();
    self.ctx.arc(x, y, r, 0, 2 * Math.PI);
    self.ctx.fill();
  };
  strokeCircle = (x: number, y: number, r: number) => {
    const { self } = this;
    x += self.canvasOffsetLeft;
    y += self.canvasOffsetTop;
    self.ctx.beginPath();
    self.ctx.arc(x, y, r, 0, 2 * Math.PI);
    self.ctx.stroke();
  };

  applyCellStyles = (cell: NormalCellDescriptor) => {
    const { self } = this;
    if (cell.textColor) {
      self.ctx.fillStyle = cell.textColor;
    } else if (cell.selected && self.style[cell.style + 'SelectedColor']) {
      self.ctx.fillStyle = self.style[cell.style + 'SelectedColor'];
    } else if (
      cell.highlighted &&
      self.style[cell.style + 'HighlightedColor']
    ) {
      self.ctx.fillStyle = self.style[cell.style + 'HighlightedColor'];
    } else if (cell.hovered && self.style[cell.style + 'HoverColor']) {
      self.ctx.fillStyle = self.style[cell.style + 'HoverColor'];
    } else {
      self.ctx.fillStyle = self.style[cell.style + 'Color'];
    }
  };

  /**
   * Apply font styles for the given cell.
   * @param cell To apply styles for.
   * @param noScale Whether or not to apply scaling.  If it is going to be
   *  used raw, prefer not scaling.
   */
  applyCellFontStyles = (
    cell: {
      style: string;
      fontSize?: number;
      fontWeight?: string;
      fontStyle?: string;
      fontFamily?: string;
    },
    noScale?: boolean,
  ) => {
    const { self } = this;
    self.ctx.font =
      (cell.fontWeight || (self.style[cell.style + 'FontWeight'] ?? '')) +
      ' ' +
      (cell.fontStyle ? cell.fontStyle + ' ' : '') +
      (cell.fontSize || self.style[cell.style + 'FontSize']) *
        (noScale ? 1 : self.scale) +
      'px ' +
      (cell.fontFamily || self.style[cell.style + 'FontFamily']);
  };

  drawOnAllImagesLoaded = () => {
    let loaded = true;
    const { htmlImageCache } = this.self;
    Object.keys(htmlImageCache).forEach(function (html) {
      if (!htmlImageCache[html].img.complete) {
        loaded = false;
      }
    });
    if (loaded && !this.cachedImagesDrawn) {
      this.cachedImagesDrawn = true;
      this.self.draw();
    }
  };

  drawHtml = (cell: NormalCellDescriptor) => {
    const { self } = this;
    let img: HTMLImageElement;
    const v = cell.innerHTML || cell.formattedValue;
    const cacheKey =
      v.toString() + cell.rowIndex.toString() + cell.columnIndex.toString();
    const x = Math.round(cell.x + self.canvasOffsetLeft);
    const y = Math.round(cell.y + self.canvasOffsetTop);
    const { htmlImageCache } = this.self;
    if (htmlImageCache[cacheKey]) {
      img = htmlImageCache[cacheKey].img;
      if (
        htmlImageCache[cacheKey].height !== cell.height ||
        htmlImageCache[cacheKey].width !== cell.width
      ) {
        // height and width of the cell has changed, invalidate cache
        htmlImageCache[cacheKey] = undefined;
      } else {
        if (!img.complete) {
          return;
        }
        return self.ctx.drawImage(img, x, y);
      }
    } else {
      this.cachedImagesDrawn = false;
    }
    img = new Image(cell.width, cell.height);
    htmlImageCache[cacheKey] = {
      img,
      width: cell.width,
      height: cell.height,
    };
    img.onload = () => {
      self.ctx.drawImage(img, x, y);
      this.drawOnAllImagesLoaded();
    };
    img.src =
      'data:image/svg+xml;base64,' +
      btoa(
        '<svg xmlns="http://www.w3.org/2000/svg" width="' +
          cell.width +
          '" height="' +
          cell.height +
          '">\n' +
          '<foreignObject class="node" x="0" y="0" width="100%" height="100%">\n' +
          '<body xmlns="http://www.w3.org/1999/xhtml" style="margin:0;padding:0;">\n' +
          v +
          '\n' +
          '</body>' +
          '</foreignObject>\n' +
          '</svg>\n',
      );
  };

  drawSelectionHandle = (cell: CellDescriptor) => {
    const { self } = this;
    const { selectionHandleSize } = self.style.scaled;
    const x = cell.x + (cell.width - selectionHandleSize) / 2;
    const y = cell.y + (cell.height - selectionHandleSize) / 2;

    if (self.style.selectionHandleType === 'circle') {
      const i = selectionHandleSize * 0.5;
      this.fillCircle(x + i, y + i, i);
      this.strokeCircle(x + i, y + i, i);
    } else {
      this.fillRect(x, y, selectionHandleSize, selectionHandleSize);
      this.strokeRect(x, y, selectionHandleSize, selectionHandleSize);
    }
  };

  drawOrderByArrow = (x: number, y: number, direction: 'asc' | 'desc') => {
    const { self } = this;
    var mt = self.style.columnHeaderOrderByArrowMarginTop * self.scale,
      ml = self.style.columnHeaderOrderByArrowMarginLeft * self.scale,
      mr = self.style.columnHeaderOrderByArrowMarginRight * self.scale,
      aw = self.style.columnHeaderOrderByArrowWidth * self.scale,
      ah = self.style.columnHeaderOrderByArrowHeight * self.scale;
    x += self.canvasOffsetLeft;
    y += self.canvasOffsetTop;
    self.ctx.fillStyle = self.style.columnHeaderOrderByArrowColor;
    self.ctx.strokeStyle = self.style.columnHeaderOrderByArrowBorderColor;
    self.ctx.beginPath();
    x = x + ml;
    y = y + mt;
    if (direction === 'asc') {
      self.ctx.lineTo(x, y + ah);
      self.ctx.lineTo(x + aw, y + ah);
      self.ctx.lineTo(x + aw * 0.5, y);
      self.ctx.lineTo(x, y + ah);
    } else {
      self.ctx.moveTo(x, y);
      self.ctx.lineTo(x + aw, y);
      self.ctx.lineTo(x + aw * 0.5, y + ah);
      self.ctx.moveTo(x, y);
    }
    self.ctx.stroke();
    self.ctx.fill();
    return ml + aw + mr;
  };

  drawTextWithStyleRuns = (cell: NormalCellDescriptor, treeCellPadding = 0) => {
    const { self, fillText, applyCellFontStyles, applyCellStyles } = this;

    let startY = cell.y + cell.paddingTop + treeCellPadding;
    if (cell.verticalAlignment === 'middle') {
      startY += Math.max((cell.paddedHeight - cell.text.height) / 2, 0);
    } else if (cell.verticalAlignment === 'bottom') {
      startY += Math.max(cell.paddedHeight - cell.text.height, 0);
    }

    const drawFontStyle = (styleFont: FontStyleRun, line: CellLine) => {
      applyCellFontStyles(styleFont.fontStyle);
      let startX = cell.x + styleFont.x + cell.paddingLeft + line.offsetLeft;
      if (cell.horizontalAlignment === 'center') {
        if (cell.isNormal && cell.wrapMode !== 'multi-line') {
          startX = cell.x + line.offsetLeft + styleFont.x;
        } else {
          startX =
            cell.x +
            (cell.contentWidth - line.width - line.offsetLeft) / 2 +
            styleFont.x;
        }
        startX += cell.prefixWidth / 2;
      } else if (cell.horizontalAlignment === 'right') {
        if (cell.wrapMode === 'multi-line') {
          startX =
            cell.x + cell.width - cell.paddingRight - line.width + styleFont.x;
        } else {
          startX = cell.x + cell.width - cell.paddingRight + styleFont.x;
        }
      } else {
        startX += cell.prefixWidth;
      }

      if (styleFont.fontStyle.textColor) {
        self.ctx.fillStyle = styleFont.fontStyle.textColor;
      } else {
        applyCellStyles(cell);
      }
      const text = line.value.slice(styleFont.startOffset, styleFont.endOffset);
      fillText(text, startX + line.x, startY + line.y + line.height);
      if (styleFont.fontStyle.isUnderline) {
        self.ctx.fillRect(
          startX + line.x,
          Math.floor(startY + line.y + line.height + 1),
          styleFont.width,
          self.dp(1),
        );
      }
      if (styleFont.fontStyle.isStrikethrough) {
        self.ctx.fillRect(
          startX + line.x,
          Math.floor(
            startY +
              line.y +
              line.offsetTop +
              line.height -
              styleFont.height / 2,
          ),
          styleFont.width,
          self.dp(1),
        );
      }
    };

    for (let x = 0; x < cell.text.lines.length; x += 1) {
      const line = cell.text.lines[x];
      if (line.fontStyles && line.fontStyles.length) {
        for (const fontStyle of line.fontStyles) {
          drawFontStyle(fontStyle, line);
        }
      } else {
        let startX = cell.x + cell.paddingLeft + line.offsetLeft;
        if (cell.horizontalAlignment === 'center') {
          if (cell.isNormal && cell.wrapMode !== 'multi-line') {
            startX = cell.x + line.offsetLeft;
          } else {
            startX =
              cell.x + (cell.contentWidth - line.width - line.offsetLeft) / 2;
          }
          startX += cell.prefixWidth / 2;
        } else if (cell.horizontalAlignment === 'right') {
          startX = cell.x + cell.width - cell.paddingRight - line.width;
        } else {
          startX += cell.prefixWidth;
        }

        fillText(line.value, startX + line.x, startY + line.y + line.height);
        if (cell.isUnderline) {
          self.ctx.fillRect(
            startX + line.x,
            Math.floor(startY + line.y + line.height + 1),
            line.width,
            self.dp(1),
          );
        }
        if (cell.isStrikethrough) {
          self.ctx.fillRect(
            startX + line.x,
            Math.floor(startY + line.y + line.offsetTop + line.height / 2),
            line.width,
            self.dp(1),
          );
        }
      }
    }

    if (cell.prefixText) {
      fillText(
        cell.prefixText.value,
        cell.x + cell.prefixText.offsetLeft,
        startY + cell.prefixText.height,
      );
    }
    if (self.attributes.debug && cell.active) {
      requestAnimationFrame(function () {
        self.ctx.font = self.style.debugFont;
        self.ctx.fillStyle = self.style.debugColor;
        fillText(
          JSON.stringify(
            {
              x: cell.x,
              y: cell.y,
              h: cell.height,
              w: cell.width,
              pw: cell.paddedWidth,
              cw: cell.contentWidth,
              idx: cell.columnIndex,
              idx_ord: cell.sortColumnIndex,
            },
            null,
            '\t',
          ),
          cell.x + 14,
          cell.y + 14,
        );
        fillText(
          JSON.stringify(
            cell.text.lines.map(function (l) {
              return { w: l.width, v: l.value.length };
            }),
            null,
            '\t',
          ),
          cell.x + 14,
          cell.y + 30,
        );
      });
    }
  };

  drawText = (cell: NormalCellDescriptor, treeCellPadding = 0) => {
    const { self, fillText } = this;

    let startY = cell.y + cell.paddingTop + treeCellPadding;
    if (cell.verticalAlignment === 'middle') {
      startY += Math.max((cell.paddedHeight - cell.text.height) / 2, 0);
    } else if (cell.verticalAlignment === 'bottom') {
      startY += Math.max(cell.paddedHeight - cell.text.height, 0);
    }

    for (let x = 0; x < cell.text.lines.length; x += 1) {
      const line = cell.text.lines[x];

      let startX = cell.x + cell.paddingLeft + line.offsetLeft;
      if (cell.horizontalAlignment === 'center') {
        if (cell.isNormal && cell.wrapMode !== 'multi-line') {
          startX = cell.x + line.offsetLeft;
        } else {
          startX =
            cell.x + (cell.contentWidth - line.width - line.offsetLeft) / 2;
        }
        startX += cell.prefixWidth / 2;
      } else if (cell.horizontalAlignment === 'right') {
        startX = cell.x + cell.width - cell.paddingRight - line.width;
      } else {
        startX += cell.prefixWidth;
      }

      fillText(line.value, startX + line.x, startY + line.y + line.height);

      if (cell.isStrikethrough) {
        self.ctx.fillRect(
          startX + line.x,
          Math.floor(startY + line.y + line.offsetTop + line.height / 2),
          line.width,
          self.dp(1),
        );
      }
      if (cell.isUnderline) {
        self.ctx.fillRect(
          startX + line.x,
          Math.floor(startY + line.y + line.height + 1),
          line.width,
          self.dp(1),
        );
      }
    }

    if (cell.prefixText) {
      fillText(
        cell.prefixText.value,
        cell.x + cell.prefixText.offsetLeft,
        startY + cell.prefixText.height,
      );
    }
    if (self.attributes.debug && cell.active) {
      requestAnimationFrame(function () {
        self.ctx.font = self.style.debugFont;
        self.ctx.fillStyle = self.style.debugColor;
        fillText(
          JSON.stringify(
            {
              x: cell.x,
              y: cell.y,
              h: cell.height,
              w: cell.width,
              pw: cell.paddedWidth,
              cw: cell.contentWidth,
              idx: cell.columnIndex,
              idx_ord: cell.sortColumnIndex,
            },
            null,
            '\t',
          ),
          cell.x + 14,
          cell.y + 14,
        );
        fillText(
          JSON.stringify(
            cell.text.lines.map(function (l) {
              return { w: l.width, v: l.value.length };
            }),
            null,
            '\t',
          ),
          cell.x + 14,
          cell.y + 30,
        );
      });
    }
  };

  /**
   * Draw rotation text style
   * @param cell
   * @param treeCellPadding
   * @returns
   */
  drawRotationText = (cell: NormalCellDescriptor, treeCellPadding = 0) => {
    if (cell.text?.stackVertically) {
      this.drawStackVerticallyText(cell, treeCellPadding);
      return;
    }

    const { self, fillText } = this;
    const lines = cell.text.lines;
    const angle = -cell.text.rotationAngle;
    const { x: cellX, y: cellY } = cell;

    self.ctx.save();
    this.radiusRect(0, cell.y, self.width, cell.height, 0);
    self.ctx.clip();

    if (cell.prefixText) {
      const textHeight = cell.prefixText.height;
      const padding = self.style.scaled.cellRotationContentPadding;
      let startY = cellY + padding;
      if (cell.verticalAlignment === 'middle') {
        startY += Math.max((cell.paddedHeight - textHeight) / 2, 0);
      } else if (cell.verticalAlignment === 'bottom') {
        startY += Math.max(cell.paddedHeight - textHeight - padding, 0);
      }
      this.applyCellFontStyles(cell);
      const top = startY + textHeight;
      const left = cellX + cell.prefixText.offsetLeft;
      fillText(cell.prefixText.value, left, top);
    }

    for (const line of lines) {
      const textY = line.height / 2;

      if (!line.fontStyles?.length) {
        // Reset transformation matrix to the identity matrix
        self.ctx.setTransform(1, 0, 0, 1, 0, 0);

        // There is no style run, draw the line using cell style
        this.applyCellFontStyles(cell);
        const left = cellX + line.offsetLeft;
        const top = cellY + line.offsetTop;
        self.ctx.translate(left, top);
        self.ctx.rotate(angle);
        fillText(line.value, 0, textY);

        if (cell.isStrikethrough) {
          self.ctx.fillRect(0, Math.floor(textY * 0.3), line.width, self.dp(1));
        }
        if (cell.isUnderline) {
          self.ctx.fillRect(0, textY + 1, line.width, self.dp(1));
        }
      } else {
        self.ctx.setTransform(1, 0, 0, 1, 0, 0);

        const left = cellX + line.offsetLeft;
        const top = cellY + line.offsetTop;
        self.ctx.translate(left, top);
        self.ctx.rotate(angle);

        for (const run of line.fontStyles) {
          this.applyCellFontStyles(run.fontStyle);
          self.ctx.fillStyle = run.fontStyle.textColor;
          const text = line.value.slice(run.startOffset, run.endOffset);
          fillText(text, run.offsetLeft, textY);

          if (run.fontStyle.isStrikethrough) {
            self.ctx.fillRect(
              run.offsetLeft,
              Math.floor(textY - run.height * 0.35),
              run.width,
              self.dp(1),
            );
          }
          if (run.fontStyle.isUnderline) {
            self.ctx.fillRect(
              run.offsetLeft,
              Math.floor(textY + 1),
              run.width,
              self.dp(1),
            );
          }
        }
      }
    }
    self.ctx.restore();
  };

  /**
   * Draw stack vertically style (part of Text-rotation style)
   * @param cell
   * @param treeCellPadding
   */
  private readonly drawStackVerticallyText = (
    cell: NormalCellDescriptor,
    treeCellPadding = 0,
  ) => {
    const { self, fillText } = this;
    const { x: cellX, y: cellY, isUnderline } = cell;
    const lines = cell.text.lines;

    self.ctx.save();
    this.radiusRect(cellX, cellY, cell.width, cell.height, 0);
    self.ctx.clip();

    if (cell.prefixText) {
      const textHeight = cell.prefixText.height;
      const padding = self.style.scaled.cellRotationContentPadding;
      let startY = cellY + padding;
      if (cell.verticalAlignment === 'middle') {
        startY += Math.max((cell.paddedHeight - textHeight) / 2, 0);
      } else if (cell.verticalAlignment === 'bottom') {
        startY += Math.max(cell.paddedHeight - textHeight - padding, 0);
      }
      this.applyCellFontStyles(cell);
      const top = startY + textHeight;
      const left = cellX + cell.prefixText.offsetLeft;
      fillText(cell.prefixText.value, left, top);
    }

    for (const line of lines) {
      for (const charData of line.fontStyles) {
        const char = line.value.slice(charData.startOffset, charData.endOffset);
        const fontStyle = charData.fontStyle;
        this.applyCellFontStyles(fontStyle);
        self.ctx.fillStyle = fontStyle.textColor;

        fillText(char, cellX + charData.offsetLeft, cellY + charData.offsetTop);
        if (fontStyle.isStrikethrough) {
          self.ctx.fillRect(
            cellX + charData.offsetLeft,
            Math.floor(cellY + charData.offsetTop - charData.height * 0.3),
            charData.width,
            self.dp(1),
          );
        }
        if (fontStyle.isUnderline) {
          self.ctx.fillRect(
            cellX + charData.offsetLeft,
            Math.floor(cellY + charData.offsetTop + 1),
            charData.width,
            self.dp(1),
          );
        }
      }
    }

    self.ctx.restore();
  };

  /**
   * Convert angle degrees to radians
   * @param degrees
   * @returns
   */
  getAngleInRadians = (degrees: number) => {
    return degrees * (Math.PI / 180);
  };
}
