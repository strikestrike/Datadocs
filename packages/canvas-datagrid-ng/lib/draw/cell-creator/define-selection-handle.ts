import type {
  CellCorner,
  NormalCellDescriptor,
  SelectionHandleDescriptor,
  SelectionHandleStyleName,
} from '../../types/cell';
import type { GridPrivateProperties } from '../../types/grid';
import type { DrawFrameCache } from '../frame-cache';

/**
 * Define props that should be drawn on top of the cell (if one exists).
 *
 * Right now, this only adds the selection handles.
 * @param {NormalCellDescriptor} cell The cell that might contain a prop.
 */
export function defineSelectionHandles(
  self: GridPrivateProperties,
  frameCache: DrawFrameCache,
  cell: NormalCellDescriptor,
) {
  if (cell.containsTopLeftHandle)
    defineSingleSelectionHandle(self, frameCache, cell, 'tl');
  if (cell.containsTopRightHandle)
    defineSingleSelectionHandle(self, frameCache, cell, 'tr');
  if (cell.containsBottomLeftHandle)
    defineSingleSelectionHandle(self, frameCache, cell, 'bl');
  if (cell.containsBottomRightHandle)
    defineSingleSelectionHandle(self, frameCache, cell, 'br');
}

/**
 * Create a fill handle (or selection handle for touch input) with the given
 * corner and cell.
 * @param {NormalCellDescriptor} cell
 * @param {CellCorner} corner
 */
export function defineSingleSelectionHandle(
  self: GridPrivateProperties,
  frameCache: DrawFrameCache,

  cell: NormalCellDescriptor,
  corner: CellCorner,
) {
  if (!self.mobile && corner !== 'br') return;

  const az = self.attributes.touchSelectHandleZone / 2,
    ax = cell.x + (corner === 'tl' || corner === 'bl' ? 0 : cell.width) - az,
    ay = cell.y + (corner === 'bl' || corner === 'br' ? cell.height : 0) - az;
  const handle: SelectionHandleDescriptor = {
    nodeType: 'selection-handle',
    x: ax,
    y: ay,
    height: az * 2,
    width: az * 2,
    style: ('selection-handle-' + corner) as SelectionHandleStyleName,
    meta: cell.meta,
    rowIndex: cell.rowIndex,
    columnIndex: cell.columnIndex,
  };
  frameCache.selectionHandles[corner] = handle;
}
