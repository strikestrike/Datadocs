'use strict';

import type { CellDescriptor, GridPrivateProperties } from '../types';
import type { CellLinkedNode } from '../types/drawing';

/**
 * This class holds data you want to preserve between multiple frames.
 *
 * Unlike {@link DrawFrameCache}, this class isn't recreated for each draws.
 */
export class DrawCache {
  /**
   * The cache for the headers.
   */
  columnHeaders?: CellLinkedNode;
  rowHeaders?: CellLinkedNode[];

  /**
   * The cache frozen headers.
   */
  frozenColumnHeaders?: CellLinkedNode;
  frozenRowHeaders?: CellLinkedNode[];

  /**
   * The cache for cells in different areas.
   */
  frozenCellsTopLeft?: CellLinkedNode[];
  frozenCellsBottomLeft?: CellLinkedNode[];
  frozenCellsTopRight?: CellLinkedNode[];
  cells?: CellLinkedNode[];

  /**
   * @see pushVisibleProp
   * @see DrawCache.isUnderProp
   */
  props = {} as { [key: string]: CellDescriptor };

  constructor(readonly self: GridPrivateProperties) {}

  /**
   * Keep a cell with an unique style name for use in invalidation of cached
   * items to cause a redraw.
   *
   * This will also push the cell into the
   * {@link GridPrivateProperties.visibleCells} array.
   * @param {CellDescriptor} cell To keep.
   */
  pushVisibleProp = (cell: CellDescriptor) => {
    if ('style' in cell && typeof cell.style === 'string')
      this.props[cell.style] = cell;
    this.self.visibleCells.unshift(cell);
  };
}
