/**
 * This is used to create a cell list with the given properties.
 * For more details, see {@link DrawCell.createCellList}.
 */
export type CellCreationContext = {
  /**
   * The indexes to start generating cells from.
   */
  startRowIndex: number;
  startColumnIndex: number;

  /**
   * The optional indexes to limit the creation of cells.  Note that these are
   * the indexes stop BEFORE, meaning they will not be included unless you
   * define them as `index + 1`.
   */
  untilRowIndex?: number;
  untilColumnIndex?: number;

  /**
   * These are the coordinates that creation of the cells start from.  And they
   * will be updated by the cells during their creation, meaning when the
   * creation is complete, they will point the x and y coordinates of the last
   * row and column.
   */
  nextX: number;
  nextY: number;
};
