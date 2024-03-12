import type { DoublyLinkedNode } from './base-structs';
import type { GridHeader } from './column-header';
import type {
  CellStyleDeclaration,
  MergedCellDescriptor,
  NormalCellDescriptor,
} from './cell';
import type {
  TableDescriptor,
  TableGroupHeader,
  TableSummaryContext,
} from '../data/data-source/spec';
import type { CellMeta } from '../data/data-source/spec/base';

/**
 * Denotes the current drawing status of a cell.
 */
export const DrawingStatus = {
  /**
   * The cell is waiting to be drawn.
   */
  Pending: 0,
  /**
   * The cell is waiting to be (re)drawn, meaning it was already drawn
   * but is now waiting for another draw. On redraws, we draw all four
   * sides of the borders to avoid them being erased.
   */
  PendingRedraw: 1,
  /**
   * The cell background has been drawn but its text draw is delayed so that
   * it can be drawn over other cells without being overwritten.
   */
  PendingTextDraw: 2,
  /**
   * The cell borders is waiting to be redrawn. It was fully drawn but its
   * borders might be damaged if the neighbour cells background get redrawn.
   */
  PendingBorderRedraw: 3,
  /**
   * The cell has been drawn. If will not be drawn again if it enters
   * {@link DrawCell.drawCell}. The cell is waiting for
   * {@link DrawCell.drawBorders} so that its borders can also be drawn.
   */
  Drawn: 10,
  /**
   * The cell has been (re)drawn. If will not be drawn again if it enters
   * {@link DrawCell.drawCell}. This flags exists so that
   * {@link DrawCell.drawBorders} can know it is a cell that was redrawn.
   */
  Redrawn: 11,
  /**
   * The cell state has not changed and still cache valid when checking by
   * {@link DrawCell.isCellCacheInvalid}, but part of it is poluted because
   * of outdated drawing from their neighbour cells. A poluted cells
   * will be marked with this status in {@link DrawCell.createCellListWithCache}
   * and then replaced by {@link DrawingStatus.PendingRedraw}. Not mark poluted
   * cell as {@link DrawingStatus.PendingRedraw} directly to prevent recursion.
   */
  RequestRedrawn: 12,
  /**
   * The cell is fully drawn, including its borders. This is set by
   * {@link DrawCell.drawBorders} to indicate that the cell is fully visible.
   */
  SkipDrawn: 20,
  /**
   * The cell was cached and still has a valid cache but needs to be added to
   * {@link GridPrivateProperties.visibleCells}. This flag hints at
   * {@link DrawCell.drawCell} so that it is added to that array.
   */
  SkipCached: 21,
  /**
   * This cell should never be drawn. This is useful when you don't want a cell
   * to appear. If the cell enters a drawing method with this flag, nothing
   * will happen.
   */
  SkipNotDrawn: 30,
};

export type CellLinkedNode = DoublyLinkedNode<{
  source: CellSource;
  cell?: NormalCellDescriptor;
}>;

export interface CellSource {
  cellValue: any;
  cellMeta?: CellMeta;
  rowOrderIndex: number;
  rowIndex: number;
  rowHeaderText?: string;
  header: GridHeader;
  headerIndex: number;
  columnOrderIndex: number;
  customStyle?: Partial<CellStyleDeclaration>;

  /**
   * The table that the cell is a part of.
   */
  table?: TableDescriptor;
  /**
   * Available when the source is a table and it has groups enabled.
   */
  tableGroupHeader?: TableGroupHeader;

  /**
   * When the cell is on a total row, this will become available to correctly
   * format the summary data.
   */
  tableSummaryContext?: TableSummaryContext;

  /**
   * The merged cell that the cells is a part of.
   */
  mergedCell?: MergedCellDescriptor;

  /**
   * The height of the row and the width of the column that the cell exists on.
   * These are used to set the initial height and width of the cell and should
   * NOT be modified.
   */
  rowHeight: number;
  columnWidth: number;

  /**
   * If a cell is left/right overflowing invisible, @columnWidth is different
   * from its real size. Store the real size as aditional information for use
   * in wrapping text.
   */
  originalColumnWidth?: number;

  /**
   * The requested row height or column width by the current cell if there is
   * a need to expand (but not shrink) an entire row or column.
   *
   * Veli's note: Right now, these are UNUSED and are put in place because of
   * a previous code that compares cell height to row height and cause a
   * resize.  Ideally we may want to expand a cell's height or width without
   * affecting an entire row or column, as in the case of merged cells or
   * overflowing cell texts.  At some point, unifying this and those
   * two features to work in a similar way can reduce the duplicate code.
   * @see NormalCellDescriptor.contentWidth
   */
  requestedRowHeight?: number;
  requestedColumnWidth?: number;

  /**
   * This will be `true` when the cell is an overflowing one whose text is
   * partly visible.
   *
   * When `true`, the cell will not be able to define props with
   * {@link DrawCell.defineProps}.
   */
  isLeftOverflowingInvisibleCell?: boolean;
  isRightOverflowingInvisibleCell?: boolean;
}
