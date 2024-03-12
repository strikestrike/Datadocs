import type {
  CellDescriptor,
  GridParentNode,
  GridPrivateProperties,
  PixelPosition,
} from './types';
import { copyMethods } from './util';

export default function loadGridPositionHelper(self: GridPrivateProperties) {
  copyMethods(new GridPositionHelper(self), self);
}

export type GridPosition = 'top' | 'left' | 'bottom' | 'right';

export class GridPositionHelper {
  constructor(private readonly self: GridPrivateProperties) {}

  /**
   * Offset the given pointer coordinates so that they can be used on the grid.
   *
   * The returned coordinates will be scaled with {@link window.devicePixelRatio}
   * by default.  If you are dealing with CSS values (or anything outside the
   * grid), you will want to disable that using {@link noScale}, which will
   * return the values reported by the browser with only offsets applied.
   *
   * When getting the difference of the two axises, you will need to scale
   * down the resulting value before saving with {@link px}.
   *
   * @param e To get the coordinates from.
   * @param noScale Do not also scale the given coordinates (useful if they are
   *  not going to be used on the grid but on the CSS elements.)
   * @returns The offset coordinates.
   * @see getContentPos
   */
  getLayerPos = (
    e: { clientX: number; clientY: number },
    noScale?: boolean,
  ) => {
    const { self } = this;
    const rect = self.canvas.getBoundingClientRect(),
      pos: PixelPosition = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    return {
      x: noScale ? pos.x : self.dp(pos.x, self.windowScale),
      y: noScale ? pos.y : self.dp(pos.y, self.windowScale),
      rect: rect,
    };
  };

  /**
   * Offset the given touch coordinates so that they can be used on the grid.
   * @param e To get the coordinates from.
   * @param touchIndex The touch index to use.
   * @param noScale Do not also scale the given coordinates (useful if they are
   *  not going to be used on the grid but on the CSS elements.)
   * @returns The offset coordinates.
   */
  getTouchPos = (e: TouchEvent, touchIndex?: number, noScale?: boolean) => {
    const { self } = this;
    const touch = e.touches[touchIndex ?? 0];
    if (!touch) return;

    const rect = self.canvas.getBoundingClientRect(),
      pos: PixelPosition = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    return {
      x: noScale ? pos.x : self.dp(pos.x, self.windowScale),
      y: noScale ? pos.y : self.dp(pos.y, self.windowScale),
      rect: rect,
    };
  };

  /**
   * Returns the position of the content that is drawn onto canvas to be
   * used outside the grid as a global element.
   * @param content To get the position for.
   * @returns The offset position of the content.
   */
  getContentPos = (content: CellDescriptor) => {
    const { self } = this,
      canvasBounds = self.canvas.getBoundingClientRect(),
      scrollOffset = self.scrollOffset(self.intf);

    return {
      x:
        canvasBounds.left +
        self.px(content.x, self.windowScale) +
        scrollOffset.left +
        Math.floor(self.canvasOffsetLeft),
      y:
        canvasBounds.top +
        self.px(content.y, self.windowScale) +
        scrollOffset.top +
        Math.floor(self.canvasOffsetTop),
      width: self.px(content.width, self.windowScale),
      height: self.px(content.height, self.windowScale),
    };
  };

  /**
   * TODO: add description
   * @param e
   * @param ignoreScrollOffset
   * @returns
   */
  position = (e: GridParentNode, ignoreScrollOffset?: boolean) => {
    var x = 0,
      y = 0,
      s: { left?: number; top?: number } = e,
      h: number,
      w: number;
    let calculatedTree = false;
    while (e.offsetParent && e.nodeName !== 'CANVAS-DATAGRID') {
      const isTree = e.nodeType === 'canvas-datagrid-tree';
      if (!isTree || !calculatedTree) {
        x += e.offsetLeft;
        y += e.offsetTop;
        h = e.offsetHeight;
        w = e.offsetWidth;
      }
      if (isTree) calculatedTree = true;
      e = e.offsetParent;
    }
    if (ignoreScrollOffset) {
      return { left: x, top: y, height: h, width: w };
    }
    e = s as any;
    s = this.self.scrollOffset(e);
    return { left: x + s.left, top: y + s.top, height: h, width: w };
  };

  /**
   * Gets the index for the first visible column.
   * @returns
   * @see getLastColumnIndex
   * @see getLastRowIndex
   * @see getAdjacentCells
   */
  getFirstColumnIndex = () => 0;

  getFirstRowIndex = () => {
    const { self } = this;
    return self.dataSource.positionHelper.getVisibleRowIndex(-1, 1);
  };

  /**
   * Gets the index for the last visible column.
   * @returns
   * @see getFirstColumnIndex
   * @see getLastRowIndex
   * @see getAdjacentCells
   */
  getLastColumnIndex = () => this.self.dataSource.state.cols - 1 || 0;

  /**
   * Gets the index for the last row.
   * @returns {number}
   * @see getFirstColumnIndex
   * @see getLastColumnIndex
   * @see getAdjacentCells
   */
  getLastRowIndex = () => {
    const { self } = this;
    return self.dataSource.positionHelper.getVisibleRowIndex(
      self.dataSource.state.rows,
      -1,
    );
  };

  getClippingRect = (ele: GridParentNode) => {
    const { self } = this;
    var boundingRect = self.position(self.parentNode),
      eleRect = self.position(ele),
      s = self.scrollOffset(self.canvas),
      clipRect = {
        x: 0,
        y: 0,
        h: 0,
        w: 0,
      },
      parentRect = {
        x: -Infinity,
        y: -Infinity,
        h: Infinity,
        w: Infinity,
      },
      columnHeaderCellHeight = self.getColumnHeaderCellHeight(),
      rowHeaderCellWidth = self.getRowHeaderCellWidth();
    boundingRect.top -= s.top;
    boundingRect.left -= s.left;
    eleRect.top -= s.top;
    eleRect.left -= s.left;
    clipRect.h =
      boundingRect.top +
      boundingRect.height -
      ele.offsetTop -
      self.style.scrollBarWidth;
    clipRect.w =
      boundingRect.left +
      boundingRect.width -
      ele.offsetLeft -
      self.style.scrollBarWidth;
    clipRect.x = boundingRect.left + eleRect.left * -1 + rowHeaderCellWidth;
    clipRect.y = boundingRect.top + eleRect.top * -1 + columnHeaderCellHeight;
    return {
      x: clipRect.x > parentRect.x ? clipRect.x : parentRect.x,
      y: clipRect.y > parentRect.y ? clipRect.y : parentRect.y,
      h: clipRect.h < parentRect.h ? clipRect.h : parentRect.h,
      w: clipRect.w < parentRect.w ? clipRect.w : parentRect.w,
    };
  };

  /**
   * Offsets the given {@link rowIndex} with the given {@link change} value.
   *
   * If the resulting change points to a row index that is in a hidden row
   * range, moves the index to the first visible row index.
   *
   * @param rowIndex The base visible row index.
   * @param change The change that should be applied to {@link rowIndex}
   * @returns The first visible row index.
   */
  getVisibleRowIndex = (rowIndex: number, change: number) => {
    const { self } = this;
    if (!change) return rowIndex;

    return self.dataSource.positionHelper.getVisibleRowIndex(
      rowIndex,
      change,
      self.dataSource.state.rows - 1,
    );
  };

  /**
   * TODO: add description
   * @param e
   * @returns
   */
  isInGrid = (e: { x: number; y: number }): boolean => {
    if (e.x < 0 || e.x > this.self.width || e.y < 0 || e.y > this.self.height) {
      return false;
    }
    return true;
  };

  /**
   * Scale up the given physical pixel value to density-independent equivalent.
   *
   * The dynamically scaled version of styling values such as dimensions can be
   * accessed with `self.styles.scaled`.
   *
   * The dimensions such as a column width will be stored and reported in
   * physical pixels, so you will need to scale them up when before them for
   * drawing.
   *
   * If a value is going to be used on the browser side of things such as CSS,
   * you will only want to scale up with `self.userScale` since
   * {@link window.devicePixelRatio} will be applied by the browser by default.
   * @param value To scale up.
   * @param scale Alternative scaling value to use.
   * @returns Density independent pixel value.
   * @see px
   */
  dp = (value: number, scale?: number) => {
    return Math.floor(value * (scale ?? this.self.scale));
  };

  /**
   * Scale down the given density-independent pixel value to a physical one.
   * @param value To scale down.
   * @param scale Alternative scaling value to use.
   * @returns Physical pixel value.
   * @see dp
   */
  px = (value: number, scale?: number) => {
    return Math.round(value * (1 / (scale ?? this.self.scale)));
  };
}
