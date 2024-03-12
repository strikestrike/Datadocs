import type { GridPrivateProperties } from '../types/grid';
import { copyMethods } from '../util';
import { updateState } from './update-state';

export default function loadGridScrollEventHandler(
  self: GridPrivateProperties,
) {
  copyMethods(new GridScrollEventHandler(self), self);
}

export class GridScrollEventHandler {
  nextWheelTime: number;
  constructor(private readonly self: GridPrivateProperties) {}

  scrollGrid = (e: MouseEvent) => {
    const { self } = this;
    const { x, y } = self.getLayerPos(e);
    this.scrollGridHandler(e, x, y);
  };

  scrollGridHandler = (
    e: Event,
    x: number,
    y: number,
    autoScrolling?: boolean,
  ) => {
    const { self } = this;
    if (
      !self.draggingItem ||
      !self.scrollContext ||
      self.scrollModes.indexOf(self.scrollContext.mode) === -1
    ) {
      self.cancelAutoScroll();
      return;
    }

    const { scrollContext: context } = self;
    if (
      context.mode === 'vertical-scroll-box' ||
      context.mode === 'horizontal-scroll-box'
    ) {
      const diff =
        context.mode === 'vertical-scroll-box'
          ? y - self.dragStart.y
          : x - self.dragStart.x;
      self.scrollBox.preserveMinScrolledState = true;
      self.scrollBox.updateWithContext(context, diff, true);
      return;
    }

    const { scrollBoxAutoScrollStartThreshold: threshold } = self.attributes;
    const { dragContext } = self.getCellAt(x, y);

    if (
      dragContext === context.mode &&
      (!autoScrolling || context.autoScrolling)
    ) {
      if (dragContext === 'vertical-scroll-top') {
        self.gotoCell(undefined, self.scrollIndexTop - self.page.vertical);
      } else if (dragContext === 'vertical-scroll-bottom') {
        self.gotoCell(undefined, self.scrollIndexTop + self.page.vertical);
      } else if (dragContext === 'horizontal-scroll-right') {
        self.gotoCell(self.scrollIndexLeft + self.page.horizontal, undefined);
      } else if (dragContext === 'horizontal-scroll-left') {
        self.gotoCell(self.scrollIndexLeft - self.page.horizontal, undefined);
      }
    }

    if (e.timeStamp + threshold < performance.now()) {
      context.autoScrolling = true;
    }

    self.cancelAutoScroll();
    self.scrollTimer = requestAnimationFrame(() => {
      if (!self.scrollTimer) return;
      self.scrollGridHandler(e, x, y, true);
    });
  };

  stopScrollGrid = () => {
    const { self } = this;
    self.scrollContext = undefined;
    self.scrollBox.preserveMinScrolledState = false;
    self.scrollBox.updateState(true);
    self.cancelAutoScroll();
    window.removeEventListener('mousemove', self.scrollGrid, false);
    window.removeEventListener('mouseup', self.stopScrollGrid, false);
    self.requestRedraw('hover');
    self.redrawCommit();
  };

  scrollWheel = (e: WheelEvent & { NativeEvent?: WheelEvent }) => {
    const { self } = this;
    const ev = e,
      deltaMode =
        e.deltaMode === undefined ? e.NativeEvent.deltaMode : e.deltaMode;
    let deltaY = e.deltaY === undefined ? e.NativeEvent.deltaY : e.deltaY,
      deltaX = e.deltaX === undefined ? e.NativeEvent.deltaX : e.deltaX;

    if (e.NativeEvent) e = e.NativeEvent;
    if (performance.now() < this.nextWheelTime) {
      //@ts-ignore
      ev.preventDefault(e);
      return;
    }
    if (self.dispatchEvent('wheel', { NativeEvent: e })) {
      return;
    }
    //BUG Issue 42: https://github.com/TonyGermaneri/canvas-datagrid/issues/42
    //https://stackoverflow.com/questions/20110224/what-is-the-height-of-a-line-in-a-wheel-event-deltamode-dom-delta-line
    if (deltaMode === 1) {
      // Consider lines to be a default cell width/height.
      deltaX = deltaX * self.style.cellWidth;
      deltaY = deltaY * self.style.cellHeight;
    } else if (deltaMode === 2) {
      deltaX = deltaX * self.page.horizontal;
      deltaY = deltaY * self.page.vertical;
    }
    this.nextWheelTime = performance.now() + 1;
    if (self.scrollBox.scrollBy(deltaX, deltaY)) {
      //@ts-ignore
      ev.preventDefault(e);
    }
    self.redrawCommit();

    // User might not move the cursor after scrolling, so keep things
    // up-to-date by updating the state on the next frame.
    requestAnimationFrame(() => {
      const { x, y } = self.mouse;
      const target = self.getCellAt(x, y);
      if (!target) return;
      const { cursor, dragContext, cell } = target;
      updateState(this.self, x, y, e, cell, cursor, dragContext);
    });
  };

  cancelAutoScroll = () => {
    const { self } = this;
    cancelAnimationFrame(self.scrollTimer);
    self.scrollTimer = undefined;
  };
}
