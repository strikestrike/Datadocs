import type { GridPrivateProperties } from '../types';
import type { DrawUtils } from './util';

const perfWindowSize = 300;

export class DrawDebugInfo {
  /** performance.now() */
  perfCounter: number;
  drawCount = 0;

  private perfCounters: Array<number> = [];
  private entityCount = [];
  private scrollDebugCounters = [];
  private touchPPSCounters = [];

  constructor(
    private readonly self: GridPrivateProperties,
    private readonly utils: DrawUtils,
  ) {}

  private drawPerfLine = (
    w: number,
    h: number,
    x: number,
    y: number,
    perfArr: number[],
    arrIndex?: number,
    max?: number,
    color?: string,
    useAbs?: boolean,
  ) => {
    const { self } = this;
    const i = w / perfArr.length;
    const r = h / max;

    x += self.canvasOffsetLeft;
    y += self.canvasOffsetTop;
    self.ctx.beginPath();
    self.ctx.moveTo(x, y + h);
    perfArr.forEach((n: number) => {
      let val = arrIndex === undefined ? n : n[arrIndex];
      if (useAbs) val = Math.abs(val);
      const cx = x + i;
      const cy = y + h - val * r;
      self.ctx.lineTo(cx, cy);
      x += i;
    });
    self.ctx.moveTo(x + w, y + h);
    self.ctx.strokeStyle = color;
    self.ctx.stroke();
  };

  private fillArray = <T>(
    low: number,
    high: number,
    step?: number,
    def?: ((x: number) => T) | T,
  ) => {
    step = step || 1;
    const i: Array<T> = [];
    if (def === undefined) {
      for (let x = low; x <= high; x += step) i[x] = x as any;
    } else if (typeof def === 'function') {
      for (let x = low; x <= high; x += step) i[x] = (def as any)(x);
    } else {
      for (let x = low; x <= high; x += step) i[x] = def;
    }
    return i;
  };

  drawPerfLines = () => {
    const { self, utils } = this;
    if (!self.attributes.showPerformance) return;

    const columnHeaderCellHeight = self.getColumnHeaderCellHeight();
    var pw = 250,
      px =
        self.width -
        pw -
        self.style.scrollBarWidth -
        self.style.scrollBarBorderWidth * 2,
      py = columnHeaderCellHeight,
      ph = 100;
    if (this.scrollDebugCounters.length === 0) {
      this.scrollDebugCounters = this.fillArray(0, perfWindowSize, 1, () => {
        return [0, 0];
      });
    }
    if (this.touchPPSCounters.length === 0) {
      this.touchPPSCounters = this.fillArray(0, perfWindowSize, 1, () => {
        return [0, 0];
      });
    }
    if (this.entityCount.length === 0) {
      this.entityCount = this.fillArray(0, perfWindowSize, 1, 0);
    }
    self.ctx.lineWidth = 0.5;

    const { entityCount, scrollDebugCounters, touchPPSCounters } = this;
    const dpl = (
      name: string,
      perfArr: any[],
      arrIndex: number,
      max: number,
      color: string,
      useAbs: boolean,
      rowIndex: number,
    ) => {
      var v;
      this.drawPerfLine(pw, ph, px, py, perfArr, arrIndex, max, color, useAbs);
      self.ctx.fillStyle = color;
      utils.fillRect(3 + px, py + 9 + rowIndex * 11, 8, 8);
      self.ctx.fillStyle = self.style.debugPerfChartTextColor;
      v = arrIndex !== undefined ? perfArr[0][arrIndex] : perfArr[0];
      utils.fillText(
        name + ' ' + (isNaN(v) ? 0 : v).toFixed(3),
        14 + px,
        py + 16 + rowIndex * 11,
      );
    };

    self.ctx.textAlign = 'left';
    self.ctx.font = self.style.debugFont;
    self.ctx.fillStyle = self.style.debugPerfChartBackground;
    utils.fillRect(px, py, pw, ph);
    [
      [
        'Scroll Height',
        scrollDebugCounters,
        0,
        self.scrollBox.scrollHeight,
        self.style.debugScrollHeightColor,
        false,
      ],
      [
        'Scroll Width',
        scrollDebugCounters,
        1,
        self.scrollBox.scrollWidth,
        self.style.debugScrollWidthColor,
        false,
      ],
      [
        'Performance',
        this.perfCounters,
        undefined,
        100,
        self.style.debugPerformanceColor,
        false,
      ],
      [
        'Entities',
        entityCount,
        undefined,
        1500,
        self.style.debugEntitiesColor,
        false,
      ],
      [
        'TouchPPSX',
        touchPPSCounters,
        0,
        1000,
        self.style.debugTouchPPSXColor,
        true,
      ],
      [
        'TouchPPSY',
        touchPPSCounters,
        1,
        1000,
        self.style.debugTouchPPSYColor,
        true,
      ],
    ].forEach(function (i, index) {
      i.push(index);
      // eslint-disable-next-line prefer-spread
      dpl.apply(null, i);
    });
    self.ctx.fillStyle = self.style.debugPerfChartBackground;
    entityCount.pop();
    entityCount.unshift(self.visibleCells.length);
    scrollDebugCounters.pop();
    scrollDebugCounters.unshift([
      self.scrollBox.scrollTop,
      self.scrollBox.scrollLeft,
    ]);
    touchPPSCounters.pop();
  };

  drawDebug = (frozenColumnsWidth: number) => {
    const { self, utils } = this;
    self.ctx.save();
    var d;
    if (self.attributes.showPerformance || self.attributes.debug) {
      if (this.perfCounters.length === 0) {
        this.perfCounters = this.fillArray(0, perfWindowSize, 1, 0);
      }
      this.perfCounters.pop();
      this.perfCounters.unshift(performance.now() - this.perfCounter);
    }

    if (!self.attributes.debug) {
      self.ctx.restore();
      return;
    }

    const { perfCounters, drawCount } = this;
    self.ctx.font = self.style.debugFont;
    d = {};
    d.perf = (
      perfCounters.reduce(function (a, b) {
        return a + b;
      }, 0) / Math.min(drawCount, perfCounters.length)
    ).toFixed(1);
    d.perfDelta = perfCounters[0].toFixed(1);
    d.frozenColumnsWidth = frozenColumnsWidth;
    d.htmlImages = Object.keys(self.htmlImageCache).length;
    d.reorderContext =
      'x: ' +
      (self.reorderContext?.startCell?.columnIndex ?? 0) +
      ', y: ' +
      (self.reorderContext?.startCell?.rowIndex ?? 0);
    d.scale = self.scale;
    d.startScale = self.startScale;
    d.scaleDelta = self.scaleDelta;
    d.zoomDeltaStart = self.zoomDeltaStart;
    d.touchLength = self.touches?.length ?? 0;
    d.touches =
      'y0: ' +
        self.primaryTouchPosition.y +
        ' y1: ' +
        self.touchPositions[1]?.y ?? 0;
    d.scrollBox = self.scrollBox.toString();
    d.scrollIndex =
      'x: ' + self.scrollIndexLeft + ', y: ' + self.scrollIndexTop;
    d.scrollPixel =
      'x: ' + self.scrollPixelLeft + ', y: ' + self.scrollPixelTop;
    d.canvasOffset =
      'x: ' + self.canvasOffsetLeft + ', y: ' + self.canvasOffsetTop;
    d.touchDelta =
      'x: ' + self.primaryTouchDelta.x + ', y: ' + self.primaryTouchDelta.y;
    d.pointerLockPosition = '';
    d.size = 'w: ' + self.width + ', h: ' + self.height;
    d.mouse = 'x: ' + self.mouse.x + ', y: ' + self.mouse.y;
    d.touch = !self.touchStart
      ? ''
      : 'x: ' + self.touchStart.x + ', y: ' + self.touchStart.y;
    d.entities = self.visibleCells.length;
    d.hasFocus = self.hasFocus;
    d.dragMode = self.dragMode;
    if (self.currentCell) {
      const { currentCell: cell } = self;
      d.columnIndex = cell.columnIndex;
      d.rowIndex = cell.rowIndex;
      d.dragContext = self.currentDragContext;
      if (cell.nodeType === 'canvas-datagrid-cell') {
        d.sortColumnIndex = cell.sortColumnIndex;
        d.sortRowIndex = cell.sortRowIndex;
        d.style = cell.style;
        d.type = cell.type;
      }
    }
    self.ctx.textAlign = 'right';
    self.ctx.fillStyle = self.style.debugBackgroundColor;
    utils.fillRect(0, 0, self.width, self.height);
    Object.keys(d).forEach(function (key, index) {
      var m = key + ': ' + d[key],
        lh = 14;
      self.ctx.fillStyle = self.style.debugColor;
      utils.fillText(
        m,
        self.width - 20,
        (self.attributes.showPerformance ? 140 : 24) + index * lh,
      );
    });
    self.ctx.restore();
  };
}
