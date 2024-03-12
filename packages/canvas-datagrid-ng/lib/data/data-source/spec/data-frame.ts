import type {
  SkippedRangeDescriptor,
  GridHeader,
  TableGroupHeader,
  TableSummaryContext,
} from '../../../types';
import type {
  CellStyleDeclaration,
  MergedCellDescriptor,
} from '../../../types/cell';
import type { RangeResult } from '../../../range/result';
import type { TableDescriptor } from './table';

/**
 * @version 2023-02-23
 */
export type RequestDataFrameInput = SkippedRangeDescriptor & {
  /**
   * This parameter tells the data source that:
   *   The data source can abort the request to the remote after x milliseconds if
   *   this frame is not ready adn the grid don't request again.
   * It is useful for reducing the request when the user is quick scrolling
   */
  abortAfter?: number;
  /**
   * Also, load summary cells.
   */
  loadSummary?: boolean;
};

/**
 * @version 2023-11-11
 */
export type RequestDataFrameOutput = {
  /**
   * If this request triggers a cancellable asynchronous request
   * to the data backend (e.g., database/remote API),
   * this value will be a non-falsy token (number or string) for the purpose of
   * aborting this additional request.
   */
  abortToken?: any;

  /**
   * The info of columns in this data frame
   */
  columns: GridHeader[];

  /**
   * The real indexes (as opposed to view indexes) that are used to generate
   * the frame.  If there are skips in between, this also includes the ranges
   * where those occur.
   */
  range?: SkippedRangeDescriptor;

  /**
   * @todo renamed to `rawValues`
   * raw value. because they can be any types,
   * so they needs to be formatted by the grid before rendering
   */
  cells: any[][];

  /**
   * Style modification for particular cells
   */
  style?: Partial<CellStyleDeclaration>[][];

  meta: any[][];

  /**
   * Custom row header text/number
   */
  rowHeaders?: Array<string | number>;

  /**
   * Visible merged cells for this output.
   */
  mergedCells?: RangeResult<MergedCellDescriptor>;

  /**
   * Visible tables for this output.
   */
  tables?: RangeResult<TableDescriptor>;

  /**
   * Summary row data, loaded only when specifically requested.
   */
  summaryData?: TableSummaryContext[];

  /**
   * Group headers reported by the tables that this data source hosts.
   *
   * Each header represents a row.
   */
  tableGroups?: Record<string, TableGroupHeader[]>;

  /**
   * Summary data reported by the tables.
   */
  tableSummaryData?: Record<string, TableSummaryContext[]>;

  /**
   * Group headers if groups are enabled in this data source.
   *
   * Each header represents a row.
   */
  groups?: TableGroupHeader[];
};
