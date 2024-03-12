import { OrderInLargeData } from '../data/reorder/large-data';
import type { SelectionDescriptor } from '../selections/types';
import { SelectionType } from '../selections/util';
import type { GridPrivateProperties, NormalCellDescriptor } from '../types';
import { copyMethods } from '../util';
import { findLastFreezableColumn, findLastFreezableRow } from './util';

export default function loadGridDragEventHandler(self: GridPrivateProperties) {
  copyMethods(new GridDragEventHandler(self), self);
}

export class GridDragEventHandler {
  constructor(private readonly self: GridPrivateProperties) {}

  dragResize = (e: MouseEvent) => {
    const { self } = this;
    const resizingColumn = self.dragMode === 'column-resize';
    const { x, y } = self.getLayerPos(e);
    if (!self.dragStartObject) return false;
    const dragStartX = self.dragStartObject.x + self.dragStartObject.width;
    const dragStartY = self.dragStartObject.y + self.dragStartObject.height;
    const width = Math.max(
      self.resizingStartingWidth + self.px(x - dragStartX),
      self.style.minColumnWidth,
    );
    const height = Math.max(
      self.resizingStartingHeight + self.px(y - dragStartY),
      self.style.minRowHeight,
    );
    if (
      self.dispatchEvent(resizingColumn ? 'resizecolumn' : 'resizerow', {
        x: width,
        y: height,
        width,
        height,
        columnIndex: resizingColumn ? self.draggingItem.columnIndex : undefined,
        rowIndex: resizingColumn ? undefined : self.draggingItem.rowIndex,
        draggingItem: self.draggingItem,
      })
    ) {
      return false;
    }
    let resizeAfter = false;
    if (self.attributes.resizeAfterDragged === true) {
      resizeAfter = true;
    } else if (
      self.attributes.resizeAfterDragged === 'when-multiple-selected'
    ) {
      let selectedCount = 0;
      const selectionType = resizingColumn
        ? SelectionType.Columns
        : SelectionType.Rows;
      for (const selection of self.selections) {
        if (selection.type !== selectionType) continue;
        const startIndex = resizingColumn
          ? selection.startColumn
          : selection.startRow;
        const endIndex = resizingColumn
          ? selection.endColumn
          : selection.endRow;
        selectedCount += Math.abs(endIndex - startIndex) + 1;
        if (selectedCount > 1) {
          resizeAfter = true;
          break;
        }
      }
    }
    self.pendingDragResize = {
      item: self.draggingItem,
      width,
      height,
      x,
      y,
      resizeAfter,
    };
    if (!resizeAfter) {
      self.dragResizeApply(self.draggingItem, width, height);
    }
    self.requestRedraw('all');
  };

  dragResizeApply = (draggingItem: any, width: number, height: number) => {
    const { self } = this;
    const sizes = self.dataSource.sizes;
    if (self.dragMode === 'column-resize') {
      self.setColumnWidth(draggingItem.columnIndex, width);
    } else if (self.dragMode === 'row-resize') {
      if (draggingItem.rowOpen) {
        sizes.setTreeHeight(draggingItem.rowIndex, height);
      } else if (self.attributes.globalRowResize) {
        self.style.cellHeight = height;
      } else {
        self.setRowHeight(draggingItem.rowIndex, height);
      }
      self.dispatchEvent('resizerow', { row: height });
      return;
    }
    self.ellipsisCache = {};
  };

  stopDragResize = (event: MouseEvent) => {
    const { self } = this;
    const pos = self.getLayerPos(event);

    window.removeEventListener('mousemove', self.dragResize, false);
    window.removeEventListener('mouseup', self.stopDragResize, false);

    if (!self.pendingDragResize) return;

    const { item, width, height, resizeAfter } = self.pendingDragResize;
    self.pendingDragResize = undefined;

    if (resizeAfter) {
      self.dragResizeApply(item, width, height);
    }

    if (self.dragMode === 'column-resize') {
      const hasMoved = !!(pos.x - self.dragStart.x);
      // Check that dragItem is selected or part of selection.
      const dragItemIsSelected = self.isColumnSelected(
        self.dragItem.columnIndex,
      );

      if (hasMoved && dragItemIsSelected) {
        // If the column is selected, resize it to width plus any other selected columns.
        self.fitSelectedColumns(width);
      }
    } else if (self.dragMode === 'row-resize') {
      // Do the above for rows.
      const hasMoved = !!(pos.y - self.dragStart.y);
      const dragItemIsSelected = self.isRowSelected(self.dragItem.rowIndex);

      if (hasMoved && dragItemIsSelected) {
        self.fitSelectedRows(height);
      }
    }

    self.resize();
    self.draw(true);
    self.ignoreNextClick = true;
  };

  dragReorder = (e: MouseEvent) => {
    const { self } = this;
    const columnReorder = self.dragMode === 'column-reorder';
    const rowReorder = self.dragMode === 'row-reorder';
    const { reorderContext, dataSource } = self;
    if (
      !reorderContext ||
      (!columnReorder && !rowReorder) ||
      (!self.attributes.allowColumnReordering && columnReorder) ||
      (!self.attributes.allowRowReordering && rowReorder) ||
      self.dispatchEvent('reordering', {
        NativeEvent: e,
        source: self.dragStartObject,
        target: self.currentCell,
        dragMode: self.dragMode,
      })
    ) {
      return;
    }

    const targetList = rowReorder
      ? self.viewport.rowHeaders
      : self.viewport.columnHeaders;

    const clearTarget = () => {
      self.reorderContext.targetCell = undefined;
      self.reorderContext.targetSnapToEnd = false;
      self.reorderContext.changeInFrozenArea = 0;
    };

    const findTarget = (x: number, y: number) => {
      const target = rowReorder ? y : x;
      for (const cell of targetList) {
        const start = rowReorder ? cell.y : cell.x;
        const end = start + (rowReorder ? cell.height : cell.width);
        if (target < start || (target >= start && target <= end)) {
          return cell;
        }
      }
    };

    const pos = self.getLayerPos(e),
      x = pos.x - self.dragStart.x,
      y = pos.y - self.dragStart.y,
      selection = self.getPrimarySelection(),
      frozenIndex = columnReorder ? self.frozenColumn : self.frozenRow,
      startIndex = columnReorder ? selection.startColumn : selection.startRow,
      endIndex = columnReorder ? selection.endColumn : selection.endRow,
      itemsCount = endIndex - startIndex + 1,
      targetPos = rowReorder ? y : x;

    self.reorderContext.position = rowReorder ? pos.y : pos.x;
    self.requestRedraw('all');

    let target = findTarget(pos.x, pos.y),
      targetSnapToEnd = false,
      // These variables are used to adjust the frozen gridlines when the user
      // rows/cols in and out of them.
      targetViewIndex = -1,
      afterViewIndex = -1;

    const defineTargetAuxData = (cell: NormalCellDescriptor) => {
      targetSnapToEnd =
        (rowReorder &&
          cell.sortRowIndex > reorderContext.startCell.sortRowIndex) ||
        (columnReorder &&
          cell.sortColumnIndex > reorderContext.startCell.sortColumnIndex);
      targetViewIndex = columnReorder
        ? target.viewColumnIndex
        : target.viewRowIndex;
      afterViewIndex = targetSnapToEnd ? targetViewIndex : targetViewIndex - 1;
    };

    const checkTarget = () => {
      return (
        target &&
        !target.selected &&
        Math.abs(targetPos) > self.attributes.reorderDeadZone &&
        ((rowReorder &&
          Math.abs(y) > self.attributes.reorderDeadZone &&
          target.rowIndex > -1 &&
          target.rowIndex !== reorderContext.startCell.rowIndex &&
          target.rowIndex < dataSource.state.rows) ||
          (columnReorder &&
            Math.abs(x) > self.attributes.reorderDeadZone &&
            target.columnIndex > -1 &&
            target.columnIndex !== reorderContext.startCell.columnIndex &&
            target.columnIndex < dataSource.state.cols))
      );
    };

    if (!checkTarget()) {
      clearTarget();
      return;
    }

    defineTargetAuxData(target);

    let targetValidity = self.reorderContext.targetCache[targetViewIndex];
    if (targetValidity === undefined) {
      targetValidity = columnReorder
        ? dataSource.allowReorderColumns(startIndex, itemsCount, afterViewIndex)
        : dataSource.allowReorderRows(startIndex, itemsCount, afterViewIndex);
      self.reorderContext.targetCache[targetViewIndex] = targetValidity;
    }

    if (typeof targetValidity === 'number') {
      target = targetList.find(
        (cell) =>
          (rowReorder ? cell.rowIndex : cell.columnIndex) == targetValidity,
      );
      if (target) defineTargetAuxData(target);
    }

    // Check if the current cell can be used as the target and if so, assign it
    // as the target. If not, remove the previous target.
    if (targetValidity !== false && checkTarget()) {
      let changeInFrozenArea = 0;

      if (startIndex < frozenIndex && afterViewIndex >= frozenIndex) {
        const itemsInNonFrozenArea = Math.max(endIndex - frozenIndex + 1, 0);
        changeInFrozenArea = -(itemsCount - itemsInNonFrozenArea);
      } else if (endIndex >= frozenIndex && afterViewIndex + 1 < frozenIndex) {
        const itemsInFrozenArea = Math.max(frozenIndex - startIndex, 0);
        changeInFrozenArea = itemsCount - itemsInFrozenArea;
      }

      // If increasing the frozen gridline is needed, check if it is valid
      // to do so (similar to what we do in `stopFreezeMove`).
      if (
        changeInFrozenArea <= 0 ||
        (columnReorder &&
          findLastFreezableColumn(self).columnIndex >=
            self.frozenColumn + changeInFrozenArea) ||
        (rowReorder &&
          findLastFreezableRow(self).rowIndex >=
            self.frozenRow + changeInFrozenArea)
      ) {
        self.reorderContext.targetCell = target;
        self.reorderContext.targetSnapToEnd = targetSnapToEnd;
        self.reorderContext.changeInFrozenArea = changeInFrozenArea;
      }
    } else {
      clearTarget();
    }
  };

  stopDragReorder = (e?: Event) => {
    const { self } = this;
    const { dragMode, reorderContext, dataSource } = self;
    const isReorderRow = dragMode === 'row-reorder';
    const isReorderColumn = !isReorderRow && dragMode === 'column-reorder';
    if (!isReorderColumn && !isReorderRow) return;

    window.removeEventListener('mousemove', self.dragReorder);
    window.removeEventListener('mouseup', self.stopDragReorder);

    const { startCell, targetCell, targetSnapToEnd } = reorderContext;
    const postHandle = () => {
      self.reorderContext = undefined;
      self.draw(true);
    };

    // check if current state is ok for reorder
    if (!reorderContext || !targetCell) return postHandle();
    // trigger event
    const cancelled = self.dispatchEvent('reorder', {
      NativeEvent: e,
      source: startCell,
      target: targetCell,
      context: reorderContext,
      dragMode: self.dragMode,
    });
    if (cancelled) return postHandle();

    const selection = self.getPrimarySelection();
    const targetViewIndex = isReorderColumn
      ? targetCell.viewColumnIndex
      : targetCell.viewRowIndex;
    const afterViewIndex = targetSnapToEnd
      ? targetViewIndex
      : targetViewIndex - 1;

    self.ignoreNextClick = true;
    if (isReorderColumn) {
      /** Select column view indexes in the first row */
      const intervals = OrderInLargeData.getIntervalsFromIndexes(
        self.getRowSelectionStates(0),
      );
      let selected = 0;
      for (let i = intervals.length - 1; i >= 0; i--) {
        const [begin, end] = intervals[i];
        const count = end - begin + 1;
        selected += count;
        // TODO: Move order and grouping related logic to data source
        if (!dataSource.reorderColumns(begin, count, afterViewIndex)) {
          return postHandle();
        }
        self.reorderColumnGroups(begin, end, afterViewIndex);
      }
      const newSelection: SelectionDescriptor = { type: SelectionType.Columns };
      if (targetSnapToEnd) {
        newSelection.startColumn = afterViewIndex - selected + 1;
        newSelection.endColumn = afterViewIndex;
      } else {
        newSelection.startColumn = afterViewIndex + 1;
        newSelection.endColumn = afterViewIndex + selected;
      }
      self.replaceAllSelections([newSelection]);
      self.frozenColumn += reorderContext.changeInFrozenArea;
    } else {
      // reorder rows
      const indexes = [] as number[];
      for (let i = selection.startRow; i <= selection.endRow; i++) {
        indexes.push(i);
      }
      const intervals = OrderInLargeData.getIntervalsFromIndexes(indexes);
      let selected = 0;
      for (let i = intervals.length - 1; i >= 0; i--) {
        const [begin, end] = intervals[i];
        const count = end - begin + 1;
        selected += count;
        // TODO: Move order and grouping related logic to data source
        if (!dataSource.reorderRows(begin, count, afterViewIndex)) {
          return postHandle();
        }
        self.reorderRowGroups(begin, end, afterViewIndex);
      }
      const newSelection: SelectionDescriptor = { type: SelectionType.Rows };
      if (targetSnapToEnd) {
        newSelection.startRow = afterViewIndex - selected + 1;
        newSelection.endRow = afterViewIndex;
      } else {
        newSelection.startRow = afterViewIndex + 1;
        newSelection.endRow = afterViewIndex + selected;
      }
      self.replaceAllSelections([newSelection]);
      self.frozenRow += reorderContext.changeInFrozenArea;
    }
    self.resize();
    return postHandle();
  };

  dragMove = (e: MouseEvent) => {
    const { self } = this;
    if (
      self.dispatchEvent('moving', { NativeEvent: e, cell: self.currentCell })
    ) {
      return;
    }
    const { selection } = self.moveContext;
    const nextRowOffset =
      self.currentCell.rowIndex - self.dragStartObject.rowIndex;
    const nextColumnOffset =
      self.currentCell.columnIndex - self.dragStartObject.columnIndex;

    // Limit column offset so that the selection doesn't overflow the grid
    // boundaries.
    if (selection.type !== SelectionType.Rows) {
      self.moveContext.column = Math.max(
        -selection.startColumn,
        Math.min(
          Math.max(self.dataSource.state.cols - 1, 0) - selection.endColumn,
          nextColumnOffset,
        ),
      );
    }

    // Limit row offset so that the selection doesn't overflow the grid
    // boundaries.
    if (selection.type !== SelectionType.Columns) {
      self.moveContext.row = Math.max(
        -selection.startRow,
        Math.min(
          Math.max(self.dataSource.state.rows - 1, 0) - selection.endRow,
          nextRowOffset,
        ),
      );
    }

    self.requestRedraw('moveOverlay');
  };

  stopDragMove = async (e?: Event) => {
    const { self } = this;
    window.removeEventListener('mousemove', self.dragMove, false);
    window.removeEventListener('mouseup', self.stopDragMove, false);

    const context = self.moveContext;
    self.moveContext = undefined;

    if (!context || (context.column === 0 && context.row === 0)) {
      self.requestRedraw('moveOverlay');
      return;
    }

    if (
      self.dispatchEvent('endmove', { NativeEvent: e, cell: self.currentCell })
    ) {
      self.draw(true);
      return;
    }

    const { selection, row: rowOffset, column: columnOffset } = context;
    const range = self.convertSelectionToRange(selection);
    const callback = async (replace = false) => {
      if (!(await self.moveTo(range, rowOffset, columnOffset, replace))) {
        return false;
      }
      if (
        selection.type === SelectionType.Rows ||
        selection.type === SelectionType.Cells
      ) {
        selection.startRow += rowOffset;
        selection.endRow += rowOffset;
      }
      if (
        selection.type === SelectionType.Columns ||
        selection.type === SelectionType.Cells
      ) {
        selection.startColumn += columnOffset;
        selection.endColumn += columnOffset;
      }
      self.setActiveCell(
        self.activeCell.columnIndex + columnOffset,
        self.activeCell.rowIndex + rowOffset,
      );

      self.requestRedraw('all');
      self.redrawCommit();

      return true;
    };

    if (!(await callback())) {
      const defaultPrevented = self.dispatchEvent('confirmationmodal', {
        title: 'Overwrite Data?',
        message: 'There are some data here. Do you want to replace them?',
        yesAction: () => callback(true),
      });
      if (!defaultPrevented) {
        console.info('Modal handler did not handle the event');
      }
    }
  };
}
