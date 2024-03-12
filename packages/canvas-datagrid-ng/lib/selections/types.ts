import type { TableDescriptor } from '../data/data-source/spec';
import type { CellIndex } from '../types';
import type { RangeDescriptor } from '../types/base-structs';
import type { SELECTION_CONTEXT_TYPE_TABLE } from './constants';

/**
 * The target that the input landed on to create the context.
 */
export type TableSelectionContextTarget =
  /**
   * The selection target was the top-left corner of the table, and it selected
   * the whole table area.
   */
  | 'table'
  /**
   * The selection target was one of or more rows of the table.
   */
  | 'row'
  /**
   * The selection target was one of or more columns of the table.
   */
  | 'column';

/**
 * Selection context that describes a table selection.
 * @see SelectionDescriptor.context
 */
export type TableSelectionContext = {
  type: typeof SELECTION_CONTEXT_TYPE_TABLE;
  /**
   * The table that the context describes.
   */
  table: TableDescriptor;
  /**
   * The target that received the input.
   * @see TableSelectionContextTarget
   */
  target: TableSelectionContextTarget;
};

export type SelectionContext = TableSelectionContext;

/**
 * The descriptor for a selection
 * @see SelectionType
 */
export type SelectionDescriptor = {
  type: number;
  /**
   * This describes the context when the selection last altered and is used to
   * limit how the user can alter the selection, e.g., when the rows, columns
   * or the whole area of a table are selected, the context will become
   * {@link TableSelectionContext} describing that table and how it was selected
   * so that we can limit how the drag selection behaves.
   *
   * The context is removed once the target changes, i.e., it can start with
   * a {@link TableSelectionContext} and then later be set to undefined or
   * another type depending on where the input lands.
   */
  context?: SelectionContext;
} & Partial<RangeDescriptor>;

export type ContextForSelectionAction = {
  rows?: number;
  columns?: number;
};

type SelectionRequestBase = {
  /**
   * Callback to invoke after the user picks a cell/range.
   * @param selection The range/cell the user picked.
   */
  onSelect: (selection: SelectionDescriptor) => void;
};

/**
 * Select a single cell.
 *
 * Dragging over the grid will move the whole selection.
 */
export type CellSelectionRequest = SelectionRequestBase & {
  type: 'cell';
  /**
   * Mark the given amount of columns on the bottom and the rows at the bottom
   * as the selection.
   */
  covers?: { rows: number; columns: number };
};

/**
 * Select a range of cells.
 *
 * Dragging over the grid will shrink or grow the range.
 */
export type RangeSelectionRequest = SelectionRequestBase & {
  type: 'range';
};

/**
 * The selection request made to the grid.
 */
export type SelectionRequest = CellSelectionRequest | RangeSelectionRequest;

/**
 * The context for the selection request.
 */
export type SelectionRequestContext = {
  /**
   * The request that was made.
   */
  request: SelectionRequest;
  /**
   * The hovered area.
   *
   * After {@link selection} is set, this will become invalid.
   */
  hover?: SelectionDescriptor;
  /**
   * The selection to initialize the request with.
   *
   * This will be updated once the user starts interacting with the grid and
   * will be initialized if undefined.
   */
  selection?: SelectionDescriptor;
  /**
   * Where the selection first started.
   */
  initialCellIndex?: CellIndex;
};
