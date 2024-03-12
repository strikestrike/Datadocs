import { updateState } from './update-state';
import { SelectionType } from '../selections/util';
import type {
  CellDescriptor,
  CellIndex,
  GridPrivateProperties,
  SelectionHandleStyleName,
} from '../types';
import { copyMethods } from '../util';
import { applyScrollEasing, sanitizeScrollValues } from './util';

export default function loadGridTouchHelper(self: GridPrivateProperties) {
  copyMethods(new GridTouchHelper(self), self);
}

export class GridTouchHelper {
  constructor(private readonly grid: GridPrivateProperties) {}

  touchstart = (e: TouchEvent) => {
    this.updateStateWithTouch(e, true);

    const self = this.grid;
    if (
      self.dispatchEvent('touchstart', {
        NativeEvent: e,
        cell: self.startingCell,
      })
    ) {
      return;
    }

    e.preventDefault();
  };

  touchmove = (e: TouchEvent) => {
    this.updateStateWithTouch(e);

    const self = this.grid;
    if (self.dispatchEvent('beforetouchmove', { NativeEvent: e })) {
      return;
    }

    e.preventDefault();
    self.dispatchEvent('touchmove', { NativeEvent: e, cell: self.currentCell });

    const { primaryTouchPosition } = self;

    if (!self.draggingItem && !self.touchState) {
      if (self.touchCount === 1) {
        if (self.scrollModes.includes(self.currentDragContext as any)) {
          const { x, y } = primaryTouchPosition;
          self.touchState = 'scrollbar';
          self.draggingItem = self.currentCell;
          self.dragStart = self.primaryTouchPosition;
          self.scrollContext = self.scrollBox.getContext(
            self.currentDragContext as any,
            true,
          );

          self.scrollGridHandler(e, x, y);
        } else if (self.currentCell.nodeType === 'canvas-datagrid-cell') {
          self.touchState = 'scroll';
        } else if (self.currentCell.nodeType === 'selection-handle') {
          self.touchState = 'selection';
        }
      } else if (self.touchCount === 2) {
        self.touchState = 'zoom';
      }

      if (self.touchState) {
        document.body.addEventListener('touchmove', this.touchmoveEvent, false);
        document.body.addEventListener('touchend', this.touchendEvent, false);
      }
    }
  };

  touchend = (e: TouchEvent) => {
    const self = this.grid;
    if (
      self.dispatchEvent('touchend', { NativeEvent: e, cell: self.currentCell })
    ) {
      return;
    }
    self.zoomDeltaStart = undefined;
    self.touchSelecting = false;

    e.preventDefault();
    clearInterval(self.touchScrollTimeout);

    // Call this before updating the state to get the correct delta values.
    if (e.touches.length < 1 && self.touchState === 'scroll') {
      this.animateTouchScroll(true);
    }

    this.updateStateWithTouch(e);
  };

  touchcancel = (e: TouchEvent) => {
    const self = this.grid;
    if (
      self.dispatchEvent('touchcancel', {
        NativeEvent: e,
        cell: self.currentCell,
      })
    ) {
      return;
    }
  };

  touchmoveEvent = (e: TouchEvent) => {
    const self = this.grid;
    const { primaryTouchDelta } = self;
    if (self.touchState === 'scroll') {
      const { x, y } = sanitizeScrollValues(
        self,
        primaryTouchDelta.x,
        primaryTouchDelta.y,
      );
      self.scrollBox.scrollBy(x, y);
    } else if (self.touchState === 'scrollbar') {
      this.touchScrollGrid(e);
    } else if (self.touchState === 'zoom') {
      this.touchZoom(e);
    } else if (
      self.touchState === 'selection' &&
      self.startingCell.nodeType === 'selection-handle'
    ) {
      self.touchSelect(self.currentCell, self.startingCell.style);
    } else {
      this.touchendEvent(e);
    }
  };

  touchendEvent = (e: TouchEvent) => {
    const self = this.grid;
    if (self.touchState && e.touches.length > 0) return;

    document.body.removeEventListener('touchmove', this.touchmoveEvent);
    document.body.removeEventListener('touchend', this.touchendEvent);

    if (self.touchState === 'scrollbar') {
      this.touchScrollGridEnd();
    }

    self.touchState = undefined;
  };

  touchEditCell = (cell: CellIndex) => {
    this.grid.beginEditAt(cell.columnIndex, cell.rowIndex);
  };

  touchSelect = (
    cell: CellDescriptor,
    handleType: SelectionHandleStyleName,
  ) => {
    const self = this.grid;
    const sel = self.getPrimarySelection();
    const isTop = /selection-handle-t(l|r)/.test(handleType);
    const isBottom = !isTop;
    const isLeft = /selection-handle-(t|b)l/.test(handleType);
    const isRight = !isLeft;
    const { rowIndex, columnIndex } = self.activeCell;

    if (sel.type !== SelectionType.Columns) {
      if (isTop && cell.rowIndex >= 0 && cell.rowIndex <= rowIndex) {
        sel.startRow = cell.rowIndex;
      }
      if (isBottom && cell.rowIndex >= rowIndex) {
        sel.endRow = cell.rowIndex;
      }
    }
    if (sel.type !== SelectionType.Rows) {
      if (isLeft && cell.columnIndex >= 0 && cell.columnIndex <= columnIndex) {
        sel.startColumn = cell.columnIndex;
      }
      if (isRight && cell.columnIndex >= columnIndex) {
        sel.endColumn = cell.columnIndex;
      }
    }

    self.dispatchSelectionChangedEvent();
    self.requestRedraw('selection');
    self.redrawCommit();
  };

  touchScrollGrid = (e: TouchEvent) => {
    const self = this.grid;
    const { primaryTouchPosition } = self;
    self.scrollGridHandler(e, primaryTouchPosition.x, primaryTouchPosition.y);
  };

  touchScrollGridEnd = () => {
    const self = this.grid;
    self.draggingItem = undefined;
    self.scrollContext = undefined;
    self.scrollBox.preserveMinScrolledState = false;
    self.scrollBox.updateState(true);
    self.cancelAutoScroll();
  };

  touchZoom = (e: TouchEvent) => {
    if (e.touches.length !== 2) return;

    const self = this.grid;
    const { primaryTouchPosition } = self;

    const t1 = primaryTouchPosition.y;
    const t2 = self.touchPositions[1].y;
    if (!self.zoomDeltaStart) {
      self.zoomDeltaStart = Math.abs(t1 - t2);
      self.startScale = self.scale;
    }
    self.scaleDelta = self.zoomDeltaStart - Math.abs(t1 - t2);
    self.userScale =
      self.startScale - self.scaleDelta * self.attributes.touchZoomSensitivity;
    self.userScale = Math.min(
      Math.max(self.scale, self.attributes.touchZoomMin),
      self.attributes.touchZoomMax,
    );
    self.touchState = 'zoom';
    self.resize(true);
  };

  /**
   * Update the touches, relative touch positions, and deltas using the latest
   * {@link TouchEvent}.
   * @param e To get the touches from.
   * @param reset Whether or not to reset the existing delta values.
   */
  updateStateWithTouch = (e: TouchEvent, reset?: boolean) => {
    const self = this.grid;
    const { touches } = e;
    const previousTouchCount = self.touchCount;
    const previousTouches = self.touches;
    self.touches = [];
    self.touchPositions = [];
    self.touchDeltas = [];

    for (let i = 0; i < touches.length; i++) {
      const touch = touches[i];
      const { clientX, clientY } = touch;
      const previous = previousTouches[i];
      if (reset || !previous) {
        self.touchDeltas.push({ x: 0, y: 0 });
      } else {
        self.touchDeltas.push({
          x: previous.clientX - clientX,
          y: previous.clientY - clientY,
        });
      }

      self.touchPositions.push(self.getTouchPos(e, i));
      self.touches.push(touch);
    }

    if (self.touchCount === 1) {
      const { x, y } = self.primaryTouchPosition;
      const { cell, cursor, dragContext } = self.getCellAt(x, y);

      updateState(self, x, y, e, cell, cursor, dragContext);
      self.requestRedraw('hover');

      if (previousTouchCount === 0) {
        self.startingCell = cell;
        self.currentDragContext = dragContext;
        self.touchStartEvent = e;

        if (self.touchScrollAnimationContext) {
          cancelAnimationFrame(self.touchScrollAnimationContext.frameCallback);
          self.touchScrollAnimationContext = undefined;
        }

        if (cell.nodeType === 'canvas-datagrid-cell') {
          if (
            cell.isColumnHeader &&
            self.attributes.columnHeaderClickBehavior === 'sort'
          ) {
            const orderBy = self.dataSource.getCurrentSorters()[0];
            let newDir: 'asc' | 'desc' = 'asc';
            if (orderBy && orderBy.column.id === cell.header.id) {
              newDir = orderBy.dir === 'asc' ? 'desc' : 'asc';
            }
            self.order(cell.header.id, newDir);
          } else {
            self.selectAny(cell, e.ctrlKey || e.metaKey, e.shiftKey);
          }
        }
      }
    }
  };

  /**
   * Animate the scroll using the latest scroll delta.
   * @param initial Set up a context if initial, or bail out if there is no context.
   */
  animateTouchScroll = (initial?: boolean) => {
    const self = this.grid;
    if (!self.touchScrollAnimationContext && !initial) return;
    if (initial) {
      // Consider actually calculating the velocity.
      const { primaryTouchDelta } = self;
      const { x, y } = sanitizeScrollValues(
        self,
        primaryTouchDelta.x,
        primaryTouchDelta.y,
      );
      self.touchScrollAnimationContext = {
        frameCallback: 0,
        iteration: 0,
        x,
        y,
      };
    }

    const rateMultipler = self.getFrameRateMultiplier();
    const x = applyScrollEasing(
      self,
      self.attributes.touchScrollAnimationTotalIteration,
      self.touchScrollAnimationContext.iteration,
      self.touchScrollAnimationContext.x,
    );
    const y = applyScrollEasing(
      self,
      self.attributes.touchScrollAnimationTotalIteration,
      self.touchScrollAnimationContext.iteration,
      self.touchScrollAnimationContext.y,
    );

    self.scrollBox.scrollBy(x * rateMultipler, y * rateMultipler);
    if (
      self.touchScrollAnimationContext.iteration <
      self.attributes.touchScrollAnimationTotalIteration
    ) {
      self.touchScrollAnimationContext.iteration += 1 * rateMultipler;
      requestAnimationFrame(() => {
        this.animateTouchScroll();
      });
    } else {
      self.touchScrollAnimationContext = undefined;
    }
  };
}
