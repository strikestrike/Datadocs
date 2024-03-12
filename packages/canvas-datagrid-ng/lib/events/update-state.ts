import { SelectionType } from '../selections/util';
import type {
  CellDescriptor,
  Cursor,
  DragContext,
  GridDragMode,
  GridPrivateProperties,
} from '../types';

export function updateState(
  this: unknown,
  self: GridPrivateProperties,
  x: number,
  y: number,
  event: Event,
  cell: CellDescriptor,
  cursor: Cursor,
  dragContext: DragContext,
) {
  const mouseEvent = { NativeEvent: event, cell, x, y },
    previousCell = self.currentCell;

  if (cell && self.currentCell) {
    self.rowBoundaryCrossed = self.currentCell.rowIndex !== cell.rowIndex;
    self.columnBoundaryCrossed =
      self.currentCell.columnIndex !== cell.columnIndex;
    self.cellBoundaryCrossed =
      self.rowBoundaryCrossed || self.columnBoundaryCrossed;
    ['row', 'column', 'cell'].forEach(function (prefix) {
      if (self[prefix + 'BoundaryCrossed']) {
        mouseEvent.cell = previousCell;
        self.dispatchEvent(prefix + 'mouseout', mouseEvent);
        mouseEvent.cell = cell;
        self.dispatchEvent(prefix + 'mouseover', mouseEvent);
      }
    });
  }

  self.currentCell = cell;
  self.currentDragContext = self.draggingItem ? 'none' : dragContext;
  self.hovers = {};

  if (!cell || self.draggingItem) return;

  self.dragItem = cell;
  self.dragMode = dragContext as GridDragMode;
  if (self.selectionRequestContext && !self.selectionRequestContext.selection) {
    if (!self.selectionRequestContext.hover) {
      self.selectionRequestContext.hover = {
        type: SelectionType.Cells,
        startRow: cell.rowIndex,
        startColumn: cell.columnIndex,
        endRow: cell.rowIndex,
        endColumn: cell.columnIndex,
      };
    }

    const { hover, request } = self.selectionRequestContext;
    const selectable =
      cell.nodeType === 'canvas-datagrid-cell' && cell.isNormal;

    self.setCursor(selectable ? 'crosshair' : 'not-allowed');

    if (selectable) {
      hover.startRow = cell.rowIndex;
      hover.startColumn = cell.columnIndex;
      hover.endRow = cell.rowIndex;
      hover.endColumn = cell.columnIndex;

      if (request.type === 'cell' && request.covers) {
        hover.endRow += request.covers.rows - 1;
        hover.endColumn += request.covers.columns - 1;
      }
    } else {
      self.selectionRequestContext.hover = undefined;
    }
    self.requestRedraw('selection');
  } else if (
    self.currentDragContext === 'cell' &&
    cell.nodeType === 'canvas-datagrid-cell'
  ) {
    self.setCursor(cursor);
    self.hovers = {
      rowIndex: cell.rowIndex,
      columnIndex: cell.columnIndex,
      onFilterButton: false,
      onCellTreeIcon: false,
    };
    if (
      cell.isFilterable &&
      x >
        cell.x +
          cell.width +
          self.canvasOffsetLeft -
          self.style.filterButtonWidth &&
      x < cell.x + cell.width + self.canvasOffsetLeft &&
      y >
        cell.y +
          cell.height +
          self.canvasOffsetTop -
          self.style.filterButtonHeight &&
      y < cell.y + cell.height + self.canvasOffsetTop
    ) {
      self.hovers.onFilterButton = true;
    }
    if (cell.isRowTree || cell.isColumnTree) {
      const pc = cell.isRowTree
        ? self.cellTree.rows[cell.rowIndex].parentCount
        : 0;
      const rc = self.style.cellTreeIconWidth * self.scale,
        rx =
          cell.x +
          cell.paddingLeft +
          self.canvasOffsetLeft +
          self.style.cellTreeIconMarginLeft +
          pc * (rc + cell.paddingLeft),
        ry =
          cell.y +
          self.canvasOffsetTop +
          self.style.cellTreeIconMarginTop * self.scale;
      if (x >= rx && x <= rx + rc && y >= ry && y < ry + rc) {
        self.hovers.onCellTreeIcon = true;
      }
    }
  } else {
    self.setCursor(cursor);
  }

  if (
    (self.selecting || self.reorderContext) &&
    self.currentCell.columnIndex !== undefined &&
    self.currentCell.rowIndex !== undefined
  ) {
    if (
      !self.selecting &&
      !self.dragStartObject?.isCorner &&
      self.cellBoundaryCrossed &&
      cell.nodeType === 'canvas-datagrid-cell'
    ) {
      if (self.attributes.selectionMode !== 'row') {
        if (cell.hovered && self.hovers.onFilterButton) {
          if (cell.openedFilter) {
            cell.openedFilter = false;
            self.selectedFilterButton = {
              columnIndex: -1,
              rowIndex: -1,
            };
          } else if (event.type == 'mousemove') {
            self.selectedFilterButton.rowIndex = cell.rowIndex;
            self.selectedFilterButton.columnIndex = cell.columnIndex;
            self.contextmenuEvent(event as MouseEvent, {
              x: cell.x + cell.width - self.style.filterButtonWidth,
              y: cell.y + cell.height,
            });
          }
          return;
        } else if (
          cell.hovered &&
          self.hovers.onCellTreeIcon &&
          event.type == 'mousedown'
        ) {
          // self.toggleCollapseTree(cell.rowIndex, cell.columnIndex);
          return;
        } else {
          self.selectedFilterButton = {
            columnIndex: -1,
            rowIndex: -1,
          };
          if (self.hovers.onFilterButton) return;
          if (self.hovers.onCellTreeIcon) return;
        }
      }

      self.ignoreNextClick = true;
    }
  }

  const columnGroup = self.getColumnGroupAt(self.mouse.x, self.mouse.y);
  if (columnGroup) self.setCursor('pointer');

  const rowGroup = self.getRowGroupAt(self.mouse.x, self.mouse.y);
  if (rowGroup) self.setCursor('pointer');
}
