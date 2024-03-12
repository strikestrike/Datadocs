import type {
  AllowAsync,
  CellDataFormat,
  ColumnType,
  DataSourceBase,
  GridHeader,
  RangeDescriptor,
} from '../../../types';
import type { DataEvent } from './events';

/**
 * The action to perform when about to put data but the targe range contains
 * data.
 */
export type TableSpillBehavior =
  | 'spill'
  | 'replace'
  | 'moveToBottom'
  | 'moveToRight'
  | 'fail';

export interface TableStyle {
  /**
   * Apply a background color to every other row.
   */
  bandedRows: boolean;
  /**
   * Apply a background color to every other column.
   */
  bandedColumns: boolean;
  /**
   * Whether to show filter buttons inside the table columns.
   */
  showFilterButton: boolean;
  /**
   * Whether field headers are visible.
   */
  showHeaderRow: boolean;
  /**
   * Show the total row at the end of the table.
   */
  showTotalRow: boolean;
}

export type TableEventBase = {
  table: TableDescriptor;
};

/**
 * Table is renamed.
 */
export type TableRenameEvent = TableEventBase & {
  type: 'rename';
  oldName: string;
  newName: string;
};

/**
 * The style of the table has been altered.
 */
export type TableStyleChangeEvent = TableEventBase & {
  type: 'styleChange';
  oldStyle: Partial<TableStyle>;
  newStyle: Partial<TableStyle>;
};

/**
 * The table has been moved to another location.
 */
export type TableMoveEvent = TableEventBase & {
  type: 'move';
  oldRowIndex: number;
  oldColumnIndex: number;
  rowIndex: number;
  columnIndex: number;
};

/**
 * The table readonly state has changed.
 */
export type TableReadOnlyEvent = TableEventBase & {
  type: 'readonly';
  isReadOnly: boolean;
};

/**
 * The event dispatched by the data source of a table.
 */
export type TableDataSourceEvent = TableEventBase & {
  type: 'datasource';
  dataSourceEvent: DataEvent;
};

/**
 * Events dispatched from the table.
 */
export type TableEvent =
  | TableRenameEvent
  | TableMoveEvent
  | TableStyleChangeEvent
  | TableReadOnlyEvent
  | TableDataSourceEvent;

export type TableEventListener = (e: TableEvent) => any;

/**
 * The interface with which the table will delegate move, rename, and similar
 * requests to its manager.
 */
export interface TableManagerCallback<Td extends TableDescriptor> {
  /**
   * Table is being moved a new locatio.
   * @param table
   * @param rowIndex
   * @param columnIndex
   */
  onMove(table: Td, rowIndex: number, columnIndex: number): AllowAsync<boolean>;

  /**
   * Table is being renamed.
   * @param table
   * @param newName
   * @return True to notify the table that the renaming is successful.
   */
  onRename(table: Td, newName: string): AllowAsync<boolean>;

  /**
   * Table style is being changed. This is mostly for total row-like features
   * that affect the height of the table.
   * @param table
   * @param newStyle
   */
  onStyleChange(table: Td, newStyle: Partial<TableStyle>): AllowAsync<boolean>;
}

/**
 * The {@link RangeDescriptor} describes the boundaries of the table.
 */
export interface TableDescriptor extends Readonly<RangeDescriptor> {
  /**
   * The unique identifier for the table.
   */
  readonly id: string;
  /**
   * The user-friendly name for the table unique in the Workbook Sheet.
   */
  readonly name: string;
  /**
   * The first row index from which the table starts displaying data.  If
   * headers are hidden, this will be {@link startRow}.
   */
  readonly firstRowIndex: number;
  /**
   * The first column where the table start displaying data. This doesn't affect
   * the selection unlike {@link firstRowIndex}.
   *
   * When grouping is enabled, this will be {@link startColumn} + 1.
   */
  readonly firstColumnIndex: number;
  /**
   * The last row index until which the table diplays data.  If the total row
   * is hidden, this will be the same as {@link endRow}.
   */
  readonly lastRowIndex: number;
  /**
   * The last column index on which the table displays data.
   *
   * @see lastRowIndex
   */
  readonly lastColumnIndex: number;

  /**
   * The data source that displayed as the table.
   */
  readonly dataSource: DataSourceBase;

  /**
   * Whether the table is read-only.
   */
  readonly isReadOnly: boolean;

  /**
   * Whether the table is unable to display due to a cell it covers still
   * containing data.
   */
  readonly isSpilling: boolean;

  /**
   * Whether the data source of the tables has groups.
   */
  readonly hasGroupsColumn: boolean;

  /**
   * The complete boundaries of the table.  Useful when the table is spilling
   * and only points to the cell it's anchored to.  If the table is not spilling
   * this will be the same as the table itself which is also a
   * {@link RangeDescriptor}.
   */
  readonly fullBounds: RangeDescriptor;

  /**
   * The total data count for this table.  This might change depending on the
   * state of the table (e.g., when the table is spilling these will be equal
   * to '0').
   */
  readonly columnCount: number;
  readonly rowCount: number;

  readonly indexes: TableIndexes;

  style: Readonly<TableStyle>;

  /**
   * Hide table columns
   * @param columnViewIndex
   * @param count
   */
  hideColumns(ranges: { startIndex: number; endIndex: number }[]): boolean;

  /**
   * Unhide all table columns
   */
  unhideAllColumns(): boolean;

  /**
   * Get hidden table columns count
   */
  getHiddenColumnCount?(): number;

  /**
   * Move the table to a new position.
   * @param rowIndex
   * @param columnIndex
   * @returns True if the move was successful or the position didn't change.
   */
  move(rowIndex: number, columnIndex: number): AllowAsync<boolean>;

  /**
   * Rename this table.
   * @param newName New name.
   * @returns True if the rename was successful or the name is the same.
   */
  rename(newName: string): AllowAsync<boolean>;

  /**
   * Set the style of the table.
   * @param style New style to apply.
   * @param overwrite When true, only the properties defined in the new style
   *  object will be altered, and if false, the new style completely replace
   *  the previous one.
   */
  setStyle(
    style: Partial<TableStyle>,
    overwrite?: boolean,
  ): AllowAsync<boolean>;

  /**
   * @param listener
   */
  addEventListener(listener: TableEventListener);

  /**
   * @param listener
   */
  removeEventListener(listener: TableEventListener);

  /**
   * Dispatch a table event as if it is the table reporting a change.
   * @param event To dispatch.
   */
  dispatchEvent(event: TableEvent);

  /**
   * Set whether this table should allow changes.
   * @param isReadOnly True to disallow changed.
   */
  setReadOnly(isReadOnly: boolean);
}

/**
 * A class that provides the indexes where this table produces auxialiary data,
 * which is not directly produced by the data source.
 *
 * When the data is not showing or unavailable, the index will be -1.
 */
export interface TableIndexes {
  /**
   * The index of the header row that displays the field information.
   *
   * @see TableStyle.showHeaderRow
   */
  readonly headerRow: number;

  /**
   * The index of the row that is shown when the groups are disabled and the
   * total row is enabled.
   *
   * @see TableStyle.showTotalRow
   */
  readonly totalRow: number;

  /**
   * The index of the first column that shows the group headers when the groups
   * are enabled.
   */
  readonly groupHeaderColumn: number;
}

/**
 * Describes the column that represents a group inside a table when grouping is
 * enabled.
 */
export interface TableGroupHeader {
  /**
   * The data used generate the group.
   */
  data: any;
  dataType: ColumnType;
  /**
   * The header representing the group.
   * @see rowType
   */
  header: GridHeader;
  /**
   * Whether the group is collapsed.
   *
   * When collapsed, the row that this header is on will only show a single a
   * row from that group.
   *
   * When a parent group is collapsed, the child group headers are not shown.
   */
  collapsed: boolean;
  /**
   * Whether the header represents a new value used for grouping.
   */
  changing: boolean;
  /**
   * The number of rows that this group has.
   */
  rowCount: number;
  /**
   * The number of upper (parent) groups that are above this group.
   */
  level: number;
  /**
   * The type of the row that the group is representing.
   *
   * The 'total' type row only appears once at the bottom of the table with its
   * {@link header} being the first field used to generate the groups. The row
   * group header will not be shown.
   *
   * The 'intermediate' type rows are the ones with the group headers that
   * appear in between data type rows. For these to be visible, there should at
   * least be 2 groups available.
   *
   * The 'dataStart' rows only appear on the first row of the data rows and
   * display a group header.
   *
   * The 'data' rows are ones that display the data but does not display a
   * group header.
   */
  rowType: 'total' | 'intermediate' | 'dataStart' | 'data';
  /**
   * The summary of the total and intermediate type rows.
   *
   * The key is the column id and value is the result.
   */
  summaryData: Record<string, TableSummaryContext>;
  /**
   * Whether the row actually contains summary data.
   */
  hasSummaryData: boolean;
  /**
   * Values to use to filter this group.
   */
  filterValues: string[];
}

export type TableSummaryFn = {
  /**
   * The unique identifier.
   */
  name: string;
  /**
   * The friendly name.
   */
  title: string;
  shortenedTitle: string;
  /**
   * The formatter to use on the data.
   */
  format: CellDataFormat;
  getAsSql: (field: string) => string;
};

export type TableSummaryContext = {
  fn: TableSummaryFn;
  dataType: ColumnType;
  data: any;
};

export type TableGroupSummary = {
  group: any;
  summary: any;
  headerDataType: ColumnType;
  summaryDataType: ColumnType;
  summaryFn: TableSummaryFn;
  subgroups: TableGroupSummary[];
};
