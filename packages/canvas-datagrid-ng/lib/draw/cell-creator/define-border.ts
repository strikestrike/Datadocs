import { isInSelection, SelectionType } from '../../selections/util';
import type { GridPosition } from '../../position';
import type { CellLinkedNode } from '../../types/drawing';
import type { GridPrivateProperties } from '../../types/grid';
import type { DrawFrameCache } from '../frame-cache';
import type { CellStatusDetector } from './status-detector';
import type { CellBorder, CellBorders } from '../../types';
import { dirToLinkedNodeKeys } from '../../utils/graph-node';

/**
 * Used a way iterate over {@link NormalCellDescriptor.borders} object.
 */
export const borderList: GridPosition[] = ['top', 'left', 'bottom', 'right'];

/**
 * Used as a fast way to access the opposite side of a border.
 */
export const borderOpposites: { [key: string]: GridPosition } = {
  top: 'bottom',
  left: 'right',
  bottom: 'top',
  right: 'left',
};

/**
 * Set the custom borders (the selection, fill, move) for a given cell
 * depending on the current state of things (selection, filling, or moving).
 * @param node
 * @returns True if there was a change in borders or the {@link NormalCellDescriptor.selectedCount} has changed.
 */
export function defineCustomBorders(
  self: GridPrivateProperties,
  frameCache: DrawFrameCache,
  cellStatus: CellStatusDetector,
  node: CellLinkedNode,
): boolean {
  const { cell } = node;
  if (!cell.isNormal) return;

  const { rowIndex, columnIndex, mergedCell: merge } = cell;
  const { firstColumnIndex, lastColumnIndex, lastRowIndex, primarySelection } =
    frameCache;
  const ogCount = cell.selectedCount;
  const ogBorders = cell.borders;

  cell.borders = {};
  cell.selectedCount = 0;

  // Define default border of table. For example, light blue borders around
  // table area or header cell. It should be added as custom borders if there
  // is no user-defined borders.
  if (cell.table && !cell.table.isSpilling) {
    const { table, customBorders } = cell;
    const columnIndex = cell.header.columnIndex;
    const tableBorders: CellBorders = {};
    let isChanged = false;

    const getTableBorder = (): CellBorder => {
      return {
        style: 'thin',
        color: self.style.tableBorderColor,
        type: 'table',
      };
    };

    if (table.startRow === rowIndex) {
      tableBorders.top = getTableBorder();
      if (table.style.showHeaderRow) {
        tableBorders.bottom = getTableBorder();
      }
      isChanged = true;
    }

    if (cell.tableContext?.isTotalRow) {
      tableBorders.top = getTableBorder();
      tableBorders.bottom = getTableBorder();
      isChanged = true;
    }

    if (table.startColumn === columnIndex) {
      tableBorders.left = getTableBorder();
      isChanged = true;
    }

    if (table.endRow === rowIndex) {
      tableBorders.bottom = getTableBorder();
      isChanged = true;
    }

    if (
      table.endColumn === columnIndex ||
      cell.tableContext?.groupContext?.isHeaderColumn
    ) {
      tableBorders.right = getTableBorder();
      isChanged = true;
    }

    if (
      cell.tableContext?.groupContext?.isHeaderColumn &&
      table.firstRowIndex < rowIndex &&
      table.lastRowIndex > rowIndex
    ) {
      const { groupContext } = cell.tableContext;
      tableBorders.bottom = { isHidden: true };
      if (groupContext.header?.level === 0 && groupContext.header?.changing) {
        tableBorders.top = { isHidden: false };
      } else {
        tableBorders.top = { isHidden: true };
      }
    }

    if (
      cell.tableContext?.groupContext?.isHeaderColumn &&
      cell.tableContext?.isTotalRow
    ) {
      tableBorders.top = getTableBorder();
    }

    if (isChanged) {
      cell.customBorders = { ...tableBorders, ...customBorders };
    }
  }

  if (cell.selected) {
    const endRowIndex = cell.mergedCell?.endRow ?? rowIndex;
    const endColumnIndex = cell.mergedCell?.endColumn ?? columnIndex;

    for (const selection of self.selections) {
      if (!isInSelection(selection, rowIndex, columnIndex)) continue;

      cell.selectedCount++;

      const { type, startRow, endRow, startColumn, endColumn } = selection;
      const top =
        rowIndex === startRow ||
        (type === SelectionType.Columns && rowIndex === 0);
      const left =
        columnIndex === startColumn ||
        (type === SelectionType.Rows && columnIndex === firstColumnIndex);
      const bottom =
        endRowIndex === endRow ||
        (type === SelectionType.Columns && endRowIndex === lastRowIndex);
      const right =
        endColumnIndex === endColumn ||
        (type === SelectionType.Rows && endColumnIndex === lastColumnIndex);

      if (top || left || bottom || right) {
        if (top) cell.borders.top = { style: 'selection' };
        if (left) cell.borders.left = { style: 'selection' };
        if (bottom) cell.borders.bottom = { style: 'selection' };
        if (right) cell.borders.right = { style: 'selection' };

        if (selection == primarySelection) {
          if (top) {
            if (left) cell.containsTopLeftHandle = true;
            if (right) cell.containsTopRightHandle = true;
          }
          if (bottom) {
            if (left) cell.containsBottomLeftHandle = true;
            if (right) cell.containsBottomRightHandle = true;
          }

          if (self.fillOverlay) {
            if (left) self.fillOverlay.distance.x = cell.x;
            if (top) self.fillOverlay.distance.y = cell.y;
            if (right) self.fillOverlay.distance.x0 = cell.x + cell.width;
            if (bottom) self.fillOverlay.distance.y0 = cell.y + cell.height;
          }
        }
      }
    }
  }

  if (self.moveContext && cell.moveHighlighted) {
    /** Extract utils method */
    const isMoveSelected = cellStatus.isCellMoveHighlighted;
    const upperIndex = node.upperSibling?.cell?.rowIndex ?? rowIndex - 1;
    const lowerIndex = node.lowerSibling?.cell?.rowIndex ?? rowIndex + 1;

    if (isMoveSelected(rowIndex, columnIndex)) {
      if (
        (!isMoveSelected(upperIndex, columnIndex) || rowIndex === 0) &&
        !cell.isHeader
      ) {
        cell.borders.top = { style: 'move' };
      }
      if (
        rowIndex >= lastRowIndex ||
        (!merge && !isMoveSelected(lowerIndex, columnIndex)) ||
        (merge && !isMoveSelected(merge.endRow + 1, columnIndex))
      ) {
        cell.borders.bottom = { style: 'move' };
      }
      if (columnIndex === 0 || !isMoveSelected(rowIndex, columnIndex - 1)) {
        cell.borders.left = { style: 'move' };
      }
      if (
        columnIndex >= lastColumnIndex ||
        (!merge && !isMoveSelected(rowIndex, columnIndex + 1)) ||
        (merge && !isMoveSelected(rowIndex, merge.endColumn + 1))
      ) {
        cell.borders.right = { style: 'move' };
      }
    }
  }

  if (cell.picked && self.selectionRequestContext) {
    const { selectionRequestContext: context } = self;
    const selection = context?.selection ?? context?.hover;

    if (cell.rowIndex === selection.startRow) {
      cell.borders.top = { style: 'pick' };
    }
    if (cell.rowIndex === selection.endRow) {
      cell.borders.bottom = { style: 'pick' };
    }
    if (cell.columnIndex === selection.startColumn) {
      cell.borders.left = { style: 'pick' };
    }
    if (cell.columnIndex === selection.endColumn) {
      cell.borders.right = { style: 'pick' };
    }
  }

  if (self.fillOverlay && cell.isInFillRegion) {
    const row = self.fillOverlay.rowIndex;
    const col = self.fillOverlay.columnIndex;
    const sel = self.fillOverlay.selection;

    if (self.fillOverlay.direction === 'x') {
      if (col < sel.startColumn || col > sel.endColumn) {
        const startCol = col < sel.startColumn ? col : sel.endColumn + 1;
        const endCol = col < sel.startColumn ? sel.startColumn - 1 : col;

        if (cell.columnIndex >= startCol && cell.columnIndex <= endCol) {
          if (cell.rowIndex === sel.startRow) {
            cell.borders.top = { style: 'fill' };
          }
          if (cell.rowIndex === sel.endRow) {
            cell.borders.bottom = { style: 'fill' };
          }
        }
        if (cell.rowIndex >= sel.startRow && cell.rowIndex <= sel.endRow) {
          if (col === cell.columnIndex && col > sel.endColumn) {
            cell.borders.right = { style: 'fill' };
          } else if (col === cell.columnIndex && col < sel.startColumn) {
            cell.borders.left = { style: 'fill' };
          }
        }
      }
    } else if (self.fillOverlay.direction === 'y') {
      if (row < sel.startRow || row > sel.endRow) {
        const startRow = row < sel.startRow ? row : sel.endRow + 1;
        const endRow = row < sel.startRow ? sel.startRow - 1 : row;

        if (cell.rowIndex >= startRow && cell.rowIndex <= endRow) {
          if (cell.columnIndex === sel.startColumn) {
            cell.borders.left = { style: 'fill' };
          }
          if (cell.columnIndex === sel.endColumn) {
            cell.borders.right = { style: 'fill' };
          }
        }
        if (
          cell.columnIndex >= sel.startColumn &&
          cell.columnIndex <= sel.endColumn
        ) {
          if (row === cell.rowIndex && row > sel.endRow) {
            cell.borders.bottom = { style: 'fill' };
          } else if (row === cell.rowIndex && row < sel.startRow) {
            cell.borders.top = { style: 'fill' };
          }
        }
      }
    }
  }

  if (cell.selectedCount !== ogCount) return true;

  for (const border of borderList) {
    if (
      ogBorders[border]?.style != cell.borders[border]?.style ||
      ogBorders[border]?.isHidden != cell.borders[border]?.isHidden
    ) {
      return true;
    }
  }
  return false;
}

export function defineStylePreviewBorders(
  self: GridPrivateProperties,
  nodes: CellLinkedNode[],
) {
  if (self.stylePreviewManager.hasStylePreview()) {
    const manager = self.stylePreviewManager;
    for (const firstNode of nodes) {
      if (!firstNode || !firstNode.source || !firstNode.cell) continue;
      let curNode = firstNode;
      while (curNode) {
        const { cell } = curNode;
        const borders = manager.getCustomBorders(curNode);
        // keep custom border of cell if exist
        if (borders) cell.customBorders = { ...borders, ...cell.customBorders };
        curNode = curNode.nextSibling;
      }
    }
  }
}

/**
 * Get custom border of a node at @position
 *
 * The custom border can be from adjacent node. For merged cells,
 * borders not at the edge of block will be considered as empty.
 *
 * NOTE: Prefer borders at top/left over bottom/right and Table border
 * will have lower priority. It ensures that we have consistent behavior
 * in case there are multiple potential borders style at one position (from
 * different cells)
 * @param node
 * @param position
 * @returns
 */
export function getCellCustomBorder(
  node: CellLinkedNode,
  position: GridPosition,
): CellBorder {
  if (!node) return;

  const { cell } = node;

  // Cell border on the text overflow way should be empty
  if (isSubsumedHiddenBorder(node, position)) {
    return { style: 'empty' };
  }

  // Merge cell borders should be empty if its position not at the edge
  if (cell.mergedCell) {
    const { mergedCell: merge } = cell;
    if (
      !(
        (merge.startColumn === cell.columnIndex && position === 'left') ||
        (merge.endColumn === cell.columnIndex && position === 'right') ||
        (merge.startRow === cell.rowIndex && position === 'top') ||
        (merge.endRow === cell.rowIndex && position === 'bottom')
      )
    ) {
      return { style: 'empty' };
    }
  }

  const adjNode: CellLinkedNode = node[dirToLinkedNodeKeys[position]];
  const adjBorder = adjNode?.cell.customBorders[borderOpposites[position]];
  const cellBorder = cell.customBorders[position];

  if (adjBorder && cellBorder) {
    if (adjBorder.type === 'table') return cellBorder;
    if (cellBorder.type === 'table') return adjBorder;
    return position === 'left' || position === 'top' ? cellBorder : adjBorder;
  } else {
    return adjBorder ?? cellBorder;
  }
}

export function isSubsumedHiddenBorder(
  node: CellLinkedNode,
  position: GridPosition,
) {
  const { cell } = node;
  return (
    (position === 'left' &&
      (cell.subsumedLeftCellCount > 0 ||
        cell.subsumedByLeftNeighbor ||
        node.prevSibling?.cell?.subsumedByRightNeighbor)) ||
    (position === 'right' &&
      (cell.subsumedRightCellCount > 0 ||
        cell.subsumedByRightNeighbor ||
        node.nextSibling?.cell?.subsumedByLeftNeighbor))
  );
}
