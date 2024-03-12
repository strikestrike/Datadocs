import { getAggregationFnsForColumnType } from '../data/table/summary';
import { getTableSummaryFn, toggleTableGroup } from '../data/table/util';
import type { VisibleGroupItem } from '../groups/types';
import { SELECTION_CONTEXT_TYPE_TABLE } from '../selections/constants';
import type {
  SelectionContext,
  TableSelectionContextTarget,
} from '../selections/types';
import { findSelectionForIndex, SelectionType } from '../selections/util';
import type { NormalCellDescriptor } from '../types';
import type { GridPrivateProperties } from '../types/grid';
import { copyMethods } from '../util';
import { updateState } from './update-state';
import { getApproximateCell } from './util';

export default function loadGridMouseEventHandler(self: GridPrivateProperties) {
  copyMethods(new GridMouseEventHandler(self), self);
}

export class GridMouseEventHandler {
  constructor(private readonly self: GridPrivateProperties) {}

  mousemoveOnEventParent = (e: MouseEvent) => {
    const { self } = this;
    self.isGridCursorTarget = true;
    if (self.isDraggingItem()) return;
    self.mousemove(e);
  };

  mousemoveOnWindow = (e: MouseEvent) => {
    const { self } = this;

    // Close cell layover if mouse move outside grid
    if (
      !(e.target instanceof HTMLElement) ||
      !self.componentRoot.contains(e.target as HTMLElement)
    ) {
      self.dispatchEvent('celldatalayover', { NativeEvent: e });
    }

    // Handle the event if something is being dragged, or the grid previously
    // was the mousemove target, and now it is not.
    if (
      self.isDraggingItem() ||
      (self.isGridCursorTarget &&
        !(self.isGridCursorTarget = self.isTargetEventParent(e.target)))
    ) {
      self.mousemove(e);
    }
  };

  mousemove = (e: MouseEvent, overridePos?: any) => {
    const { self } = this;

    // Cancel dragging action if user ventures outside grid
    if (self.draggingItem && e.which === 0) {
      self.stopFreezeMove(e);
      self.mouseup(e);
      return;
    }

    self.mouse = overridePos || self.getLayerPos(e);

    const ctrl =
        (e.ctrlKey || e.metaKey || self.attributes.persistantSelectionMode) &&
        !self.attributes.singleSelectionMode,
      x = self.mouse.x,
      y = self.mouse.y,
      pointingCell = getApproximateCell(self, x, y) ?? self.getCellAt(x, y);
    if (!pointingCell) return;

    const { cursor, dragContext, cell } = pointingCell,
      mouseEvent = { NativeEvent: e, cell, x, y };
    cancelAnimationFrame(self.scrollTimer);
    if (self.dispatchEvent('mousemove', mouseEvent)) {
      return;
    }
    self.requestRedraw('hover');

    updateState(self, x, y, e, cell, cursor, dragContext);

    if (
      self.currentCell.nodeType === 'canvas-datagrid-cell' &&
      self.checkMouseOnTableTypeButton(self.currentCell, x, y)
    ) {
      const { tableTypeButton, tableHeader, table } = self.currentCell;
      self.dispatchEvent('tablefieldtypetooltip', {
        NativeEvent: e,
        cell: self.currentCell,
        table,
        tableHeader,
        button: tableTypeButton,
        buttonPos: self.getContentPos(tableTypeButton),
        tooltipData: self.getTableCellTypeData(tableHeader.type),
      });
    } else {
      self.dispatchEvent('tablefieldtypetooltip', { NativeEvent: e });
    }

    if (
      self.currentDragContext === 'cell' &&
      self.currentCell.nodeType === 'canvas-datagrid-cell'
    ) {
      self.dispatchEvent('celldatalayover', {
        NativeEvent: e,
        cell: self.currentCell,
        cellPos: self.getContentPos(self.currentCell),
      });
    } else {
      self.dispatchEvent('celldatalayover', { NativeEvent: e });
    }

    // Scroll to start if the user enters a scrolllable area from frozen areas
    // while dragging an item.
    if (
      self.dragStartObject &&
      self.cellBoundaryCrossed &&
      (self.dragStartObject.isNormal ||
        (self.dragStartObject.nodeType === 'selection-handle' &&
          self.dragStartObject.style === 'selection-handle-br')) &&
      self.currentCell.isNormal &&
      (self.frozenRow > 0 || self.frozenColumn > 0)
    ) {
      const { rowIndex, columnIndex } = self.dragStartObject;
      let hasMoved = false;
      // Reset horizontal scroll if the user has moved from the frozen area to
      // non-frozen area or vice versa for the first time.
      if (
        self.frozenRow > 0 &&
        (rowIndex < self.frozenRow ===
          self.currentCell.rowIndex < self.frozenRow) !==
          !self.dragFromFrozenInitialReset.y
      ) {
        self.gotoCell(undefined, 0);
        self.dragFromFrozenInitialReset.y = !self.dragFromFrozenInitialReset.y;
        hasMoved = true;
      }
      // Reset vertical scroll if the user has mvoed from the frozen area to
      // non-frozen area or vice versa for the first time.
      if (
        self.frozenColumn > 0 &&
        (columnIndex < self.frozenColumn ===
          self.currentCell.columnIndex < self.frozenColumn) !==
          !self.dragFromFrozenInitialReset.x
      ) {
        self.gotoCell(0, undefined);
        self.dragFromFrozenInitialReset.x = !self.dragFromFrozenInitialReset.x;
        hasMoved = true;
      }

      // If moved, redraw the cells immediately and recalculate everything.
      // This is needed because we draw before returning from this function,
      // so `self.currentCell` and such will be pointing to old data if we
      // don't redraw earlier, and we don't want that.
      if (hasMoved) {
        self.redrawNow('scroll');

        // Reset this property because we we will have the same one again
        // anyway. This is needed because we don't want the properties such as
        // `cellBoundaryCrossed` to be the wrong state.
        self.currentCell = undefined;
        return self.mousemove(e, overridePos);
      }
    }

    if (self.draggingItem) {
      e.preventDefault();
    }

    self.autoScrollZone(x, y, ctrl, () => window.dispatchEvent(e));
    self.redrawCommit();
  };

  click = (e: MouseEvent, overridePos?: any) => {
    const { self } = this;
    const pos = overridePos || self.getLayerPos(e);
    const pointingCell = self.getCellAt(pos.x, pos.y);
    if (!pointingCell) return;
    const { cursor, dragContext, cell } = pointingCell;

    if (cell.nodeType === 'canvas-datagrid-cell' && cell.grid !== undefined) {
      return;
    }
    if (self.ignoreNextClick) {
      self.ignoreNextClick = false;
      return;
    }
    if (self.processing) return;
    if (self.dispatchEvent('click', { NativeEvent: e, cell })) {
      return;
    }

    const tableDropdownButton = /table-dropdown-button/.test(self.dragMode);
    if (
      tableDropdownButton &&
      self.currentCell.nodeType === 'canvas-datagrid-cell'
    ) {
      const { tableButton: button, tableHeader: header } = self.currentCell;
      self.updateActiveTableFieldDropdown(self.currentCell);
      self.dispatchEvent('tablefielddropdown', {
        NativeEvent: e,
        grid: self.publicApi,
        cell: self.currentCell,
        table: self.currentCell.table,
        header,
        button,
        buttonPos: self.getContentPos(button),
        onClose: self.updateActiveTableFieldDropdown,
        onOpen: () => {
          self.updateActiveTableFieldDropdown(
            self.currentCell as NormalCellDescriptor,
          );
        },
      });
      e.preventDefault();
      return;
    }

    const group: VisibleGroupItem =
      self.getColumnGroupAt(pos.x, pos.y) ?? self.getRowGroupAt(pos.x, pos.y);
    if (group) {
      if (self.toggleGroup(group)) {
        self.refresh();
        return;
      }
    }

    self.controlInput.focus();

    if (
      dragContext === 'cell' &&
      cell.isColumnHeader &&
      self.startingCell?.nodeType === 'canvas-datagrid-cell' &&
      self.attributes.columnHeaderClickBehavior === 'sort'
    ) {
      const orderBy = self.dataSource.getCurrentSorters()[0];
      let newDir: 'asc' | 'desc' = 'asc';
      if (orderBy && orderBy.column.id === self.startingCell.header.id)
        newDir = orderBy.dir === 'asc' ? 'desc' : 'asc';
      self.order(self.startingCell.header.id, newDir);
      self.draw(true);
    }

    updateState(self, pos.x, pos.y, e, cell, cursor, dragContext);
    self.requestRedraw('hover');
  };

  mousedown = (e: MouseEvent, overridePos?: any) => {
    const { self } = this;
    self.lastMouseDownTarget = e.target;
    if (self.processing) return;
    if (
      self.dispatchEvent('mousedown', {
        NativeEvent: e,
        cell: self.currentCell,
      })
    ) {
      return;
    }

    e.preventDefault();

    if (self.attributes.showPerformance) {
      self.profiler.startTiming('clickdelay');
    }

    self.controlInput.focus();

    const ctrl = e.ctrlKey || e.metaKey,
      move = /-move/.test(self.dragMode),
      freeze = /frozen-row-marker|frozen-column-marker/.test(self.dragMode),
      resize = /-resize/.test(self.dragMode),
      reorder = /-reorder/.test(self.dragMode),
      selectionHandleMove = /selection-handle-br/.test(self.dragMode),
      unhide = /unhide-indicator-/.test(self.dragMode),
      tableSelection = /^select-table/.test(self.dragMode),
      tableDropdownButton = /table-dropdown-button/.test(self.dragMode),
      tableGroupToggleButton = /table-group-toggle-button/.test(self.dragMode),
      aggregOptsButton = /table-aggregation-opts-button/.test(self.dragMode);
    self.dragStart = overridePos || self.getLayerPos(e);

    // Update the state if the position is being overridden.
    if (overridePos) {
      const { x, y } = self.dragStart;
      const { cell, cursor, dragContext } = self.getCellAt(x, y);
      updateState(self, x, y, e, cell, cursor, dragContext);
    }
    self.dragStartObject = self.currentCell;
    if (self.dragStartObject?.isGrid) {
      return;
    }

    if (self.scrollModes.includes(self.currentDragContext as any)) {
      self.draggingItem = self.dragStartObject;
      self.scrollContext = self.scrollBox.getContext(
        self.currentDragContext as any,
        true,
      );

      self.scrollGrid(e);
      window.addEventListener('mousemove', self.scrollGrid, false);
      window.addEventListener('mouseup', self.stopScrollGrid, false);
      self.ignoreNextClick = true;
      return;
    } else if (self.input) {
      // If there is an ongoing edit, end it here, since the user should have
      // clicked outside the input element for the event to reach here. Note
      // that we still allow scrolling when there is an ongoing edit.
      self.endEdit();
    }

    if (self.dragMode === 'cell' || tableSelection) {
      if (self.currentCell.isCorner) {
        // Google Sheet behavior where the corner click selects all cells and
        // moves the active cell to the first visible to cell on the top-left
        // corner.
        self.setActiveCell(self.scrollIndexLeft, self.scrollIndexTop);
        self.scrollIntoView(self.scrollIndexLeft, self.scrollIndexTop);
        self.selectAll(true, true);
      } else if (
        self.dragStartObject?.nodeType === 'canvas-datagrid-cell' &&
        (!self.dragStartObject.isColumnHeader ||
          self.attributes.columnHeaderClickBehavior === 'select') &&
        (e.button !== 2 ||
          self.currentCell.nodeType !== 'canvas-datagrid-cell' ||
          !self.currentCell.selected)
      ) {
        const isTableSelection = self.dragMode === 'select-table';
        self.selecting = !isTableSelection;
        self.draggingItem = self.dragStartObject;

        let context: SelectionContext | undefined;
        if (tableSelection) {
          let target: TableSelectionContextTarget = 'table';
          if (self.dragMode === 'select-table-row') {
            target = 'row';
          } else if (self.dragMode === 'select-table-column') {
            target = 'column';
          }
          context = {
            type: SELECTION_CONTEXT_TYPE_TABLE,
            table: self.dragStartObject.table,
            target,
          };
        }

        self.selectAny(self.dragStartObject, ctrl, e.shiftKey, false, context);
        if (!isTableSelection) {
          window.addEventListener('mousemove', self.selectionMove, false);
          window.addEventListener('mouseup', self.stopSelectionMove, false);
          self.selectionMove(e);
        }
      }
      self.redrawNow('selection');
      return;
    }

    if (
      tableDropdownButton &&
      self.currentCell.nodeType === 'canvas-datagrid-cell'
    ) {
      // Prevent the event here and create the dropdown on the `click` listener.
      const { tableButton: button, tableHeader: header } = self.currentCell;
      e.preventDefault();
      return;
    }

    if (
      aggregOptsButton &&
      self.currentCell.nodeType === 'canvas-datagrid-cell'
    ) {
      const closeHandle = self.updateActiveAggregationOptsDropdown(
        self.currentCell,
      );
      if (closeHandle) {
        self.dispatchEvent('tableaggregationoptionsdropdown', {
          grid: self.publicApi,
          cell: self.currentCell,
          cellPos: self.getContentPos(self.currentCell),
          table: self.currentCell.table,
          header: self.currentCell.tableHeader,
          currentFn: getTableSummaryFn(self.currentCell.tableHeader),
          availableFns: getAggregationFnsForColumnType(
            self.currentCell.tableHeader.type,
          ),
          onClose: self.updateActiveAggregationOptsDropdown,
          closeHandle,
        });
      }
    }

    if (
      tableGroupToggleButton &&
      self.currentCell.nodeType === 'canvas-datagrid-cell'
    ) {
      toggleTableGroup(
        self.currentCell.table,
        self.currentCell.tableContext.groupContext.header,
      );
      return;
    }

    // Do not other action typs if the button is not MOUSE0.
    if (e.button !== 0) {
      return;
    }

    if (selectionHandleMove) {
      const sel = self.getPrimarySelection();
      if (!sel) return;

      self.draggingItem = self.dragStartObject;
      self.fillOverlay = {
        rowIndex: self.dragStartObject.rowIndex,
        columnIndex: self.dragStartObject.columnIndex,
        distance: {},
        selection: self.convertSelectionToRange(sel),
      };
      if (self.dispatchEvent('beginselectionhandlemove', { NativeEvent: e })) {
        return;
      }
      window.addEventListener('mousemove', self.selectionHandleMove, false);
      window.addEventListener('mouseup', self.stopSelectionHandleMove, false);
      self.setCursor('crosshair');
      return self.selectionHandleMove(e);
    }
    if (move) {
      const selection = findSelectionForIndex(
        self.selections,
        self.dragStartObject.rowIndex,
        self.dragStartObject.columnIndex,
        true,
      );
      if (!selection) return;

      self.draggingItem = self.dragItem;
      self.dragging = self.dragStartObject;
      self.moveContext = { column: 0, row: 0, selection };
      if (
        self.dispatchEvent('beginmove', {
          NativeEvent: e,
          cell: self.currentCell,
        })
      ) {
        return;
      }

      if (selection.type === SelectionType.Cells) {
        // Clear the old context since we are about the assign if possible.
        if (selection.context?.type === SELECTION_CONTEXT_TYPE_TABLE) {
          selection.context = undefined;
        }
        /** @todo Remove the following line after the table feature is completed */
        //@ts-ignore
        const table = self.dataSource?.getTableByIndex?.(
          selection.startRow,
          selection.startColumn,
        );
        if (table) {
          const coversAllColumns =
            selection.startColumn === table.startColumn &&
            selection.endColumn === table.endColumn;

          // TODO: Make sure to convert the view indexes into original indexes.
          if (
            table.style.showHeaderRow &&
            selection.startRow === table.startRow &&
            selection.endRow === table.startRow &&
            selection.startColumn >= table.startColumn &&
            selection.endColumn <= table.endColumn &&
            !coversAllColumns
          ) {
            selection.endRow = table.endRow;
          }

          if (
            selection.startRow >= table.startRow &&
            selection.endRow <= table.endRow &&
            coversAllColumns
          ) {
            selection.context = {
              type: SELECTION_CONTEXT_TYPE_TABLE,
              table,
              target: 'row',
            };
          } else if (
            selection.startColumn >= table.startColumn &&
            selection.endColumn <= table.endColumn &&
            selection.startRow === table.startRow &&
            selection.endRow === table.endRow
          ) {
            selection.context = {
              type: SELECTION_CONTEXT_TYPE_TABLE,
              table,
              target: 'column',
            };
          }
        }
      }

      window.addEventListener('mousemove', self.dragMove, false);
      window.addEventListener('mouseup', self.stopDragMove, false);
      self.requestRedraw('moveOverlay');
      self.setCursor(self.cursorGrabbing);
      return self.mousemove(e);
    }
    if (freeze) {
      self.draggingItem = self.dragItem;
      self.startFreezeMove = {
        rowIndex: self.frozenRow,
        columnIndex: self.frozenColumn,
      };
      if (self.dispatchEvent('beginfreezemove', { NativeEvent: e })) {
        return;
      }
      const isColumn = self.dragMode == 'frozen-column-marker';
      self.gotoCell(isColumn ? 0 : undefined, isColumn ? undefined : 0);
      self.freezeMarkerPosition = {
        pos: isColumn ? self.mouse.x : self.mouse.y,
      };
      window.addEventListener('mousemove', self.freezeMove, false);
      window.addEventListener('mouseup', self.stopFreezeMove, false);
      // Call `freezeMove` early so that the marker doesn't disappear.
      self.setCursor(self.cursorGrabbing);
      self.freezeMove(e);
      return self.mousemove(e);
    }
    if (resize) {
      self.draggingItem = self.dragItem;
      // todo: `rowOpen` is not defined anywhere, check if it is okay to remove
      // the following line.
      /* if (self.draggingItem.rowOpen) {
        self.resizingStartingHeight = self.getTreeHeight(
          self.draggingItem.rowIndex,
        );
      } else {
        self.resizingStartingHeight = self.getRowHeight(
          self.draggingItem.rowIndex,
        );
      } */
      self.resizingStartingHeight = self.getRowHeight(
        self.draggingItem.rowIndex,
      );
      self.resizingStartingWidth = self.getColumnWidth(
        self.draggingItem.columnIndex,
      );
      // Since dragging just started ensure that the same cursor is globally set
      // for <body>
      self.setCursor(self.currentCursor);
      window.addEventListener('mousemove', self.dragResize, false);
      window.addEventListener('mouseup', self.stopDragResize, false);
      return;
    }
    if (unhide) {
      const unhideIndicator = self.getUnhideIndicator(
        self.dragStart.x,
        self.dragStart.y,
      );

      if (unhideIndicator) {
        const { dir, orderIndex0, orderIndex1 } = unhideIndicator;
        if (dir === 'l' || dir === 'r') self.unhideColumns(orderIndex0);
        else self.unhideRows(orderIndex0, orderIndex1);
        return;
      }
    }
    if (reorder && self.dragStartObject?.nodeType === 'canvas-datagrid-cell') {
      const sel = self.getPrimarySelection();

      if (
        sel.type !== SelectionType.Rows &&
        sel.type !== SelectionType.Columns
      ) {
        return;
      }

      const isRow = sel.type === SelectionType.Rows;
      const { rowIndex, columnIndex } = self.dragStartObject;
      let size = 0,
        offset = isRow
          ? self.dragStart.y - self.dragStartObject.y
          : self.dragStart.x - self.dragStartObject.x;

      // Find the width of the column or height of the rows depending on the
      // reordering type. Also, find where the current row/col is located in
      // the selection and use the position to offset the location the reorder
      // overlay.
      for (
        let i = isRow ? sel.startRow : sel.startColumn;
        i <= (isRow ? sel.endRow : sel.endColumn);
        i++
      ) {
        if (isRow) {
          const hidingRange = self.dataSource.positionHelper.getHidingRange(i);
          if (hidingRange) {
            i = hidingRange.end;
            continue;
          }
        }
        const change = isRow ? self.getRowHeight(i) : self.getColumnWidth(i);
        size += self.dp(change);
        if (i < (isRow ? rowIndex : columnIndex)) {
          offset += change;
        }
      }

      self.draggingItem = self.dragStartObject;
      self.reorderContext = {
        position: isRow ? self.draggingItem.y : self.draggingItem.x,
        size,
        offset,
        changeInFrozenArea: 0,
        startCell: self.draggingItem,
        targetCache: {},
      };

      window.addEventListener('mousemove', self.dragReorder, false);
      window.addEventListener('mouseup', self.stopDragReorder, false);
      self.setCursor(self.cursorGrabbing);
      return;
    }
  };

  mouseupOnEventParent = (e: MouseEvent) => {
    const { self } = this;
    if (self.isDraggingItem()) return;
    self.mouseup(e);
  };

  mouseupOnWindow = (e: MouseEvent) => {
    const { self } = this;
    if (!self.isDraggingItem()) return;
    self.mouseup(e);
  };

  mouseup = (e: MouseEvent) => {
    const { self } = this;
    cancelAnimationFrame(self.scrollTimer);
    self.cellBoundaryCrossed = true;
    self.rowBoundaryCrossed = true;
    self.columnBoundaryCrossed = true;
    self.draggingItem = undefined;
    self.dragStartObject = undefined;
    self.dragFromFrozenInitialReset = {};
    self.scrollTimer = undefined;

    if (
      self.dispatchEvent('mouseup', { NativeEvent: e, cell: self.currentCell })
    ) {
      return;
    }
    if (!self.hasFocus && e.target !== self.canvas) {
      return;
    }
    if (
      self.currentCell &&
      self.currentCell.nodeType === 'canvas-datagrid-cell' &&
      self.currentCell.grid !== undefined
    ) {
      return;
    }
    if (self.contextMenu || self.input) {
      return;
    }
    if (self.dragStart && self.isInGrid(self.dragStart)) {
      self.controlInput.focus();
    }
    e.preventDefault();
  };

  dblclick = (e: MouseEvent) => {
    const { self } = this;
    if (
      self.dispatchEvent('dblclick', { NativeEvent: e, cell: self.currentCell })
    ) {
      return;
    }

    const { currentCell: cell, currentDragContext: dragContext } = self;
    if (!self.hasFocus || cell.nodeType !== 'canvas-datagrid-cell') {
      return;
    }
    if (dragContext === 'column-resize' && cell.isColumnHeader) {
      // Check that double-clicked cell is selected or part of selection.
      const currentCellIsSelected = self.isColumnSelected(cell.columnIndex);

      if (currentCellIsSelected) {
        // There might be more
        self.fitSelectedColumns();
      } else {
        self.fitColumnToValues(cell.header.id);
      }
      self.resize(true);
    } else if (dragContext === 'column-resize' && cell.isCorner) {
      self.fitColumnToValues('cornerCell');
      self.resize(true);
    } else if (
      cell.isNormal &&
      !self.hovers.onFilterButton &&
      !self.hovers.onCellTreeIcon
    ) {
      if (cell.isRowTree || cell.isColumnTree) {
        // self.cellTreeExpandCollapse(
        //   self.currentCell.rowIndex,
        //   self.currentCell.columnIndex,
        // );
        self.draw();
      } else if (self.dragMode === 'cell') {
        // Only allow editing with double click in the default drag mode so that
        // the cursor doesn't flicker and behavior stays consistent
        self.beginEditAt(cell.columnIndex, cell.rowIndex);
      }
    }
  };
}
