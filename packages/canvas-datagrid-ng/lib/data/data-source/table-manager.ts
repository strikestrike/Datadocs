import { checkIfRangesIntersect, isInRange } from '../../range/util';
import type {
  DataSourceBase,
  NamespaceController,
  RangeDescriptor,
  TableDescriptor,
  TableStyle,
  CellClearMode,
  TableManagerCallback,
  TableEvent,
  TableIndexes,
} from '../../types';
import { DefaultDataEventTarget } from '../event-target';
import type { OccupancyGraph } from '../reorder/occupancy-graph';
import { ensureAsync } from './await';
import type { DataEvent } from './spec/events';

type DataEventListner = (event: DataEvent) => any;
type TableEventListner = (event: TableEvent) => any;

type TableData = {
  table: TableDescriptorImpl;
  listener: TableEventListner;
};

type TableRecord = Record<string, TableData>;

type GetTableOptions = {
  /**
   * Get only the spilling tables.
   */
  spillingOnly: boolean;
  /**
   * Match the full bounds of the tables, possibly matching the spilling tables.
   */
  useFullBounds: boolean;
};

export const getLastIndexes = (
  dataSource: DataSourceBase,
  rowIndex: number,
  columnIndex: number,
  style?: Partial<TableStyle>,
) => {
  return {
    endRow: rowIndex + dataSource.state.rows - (style?.showHeaderRow ? 0 : 1),
    endColumn: columnIndex + dataSource.state.cols - 1,
  };
};

const setAnchorCell = (
  table: TableDescriptorImpl,
  rowIndex: number,
  columnIndex: number,
) => {
  const { startRow, startColumn } = table;
  if (startRow === rowIndex && startColumn === columnIndex) return false;

  table.startRow = rowIndex;
  table.startColumn = columnIndex;
  table.dispatchEvent({
    type: 'move',
    table,
    oldRowIndex: startRow,
    oldColumnIndex: startColumn,
    rowIndex,
    columnIndex,
  });

  return true;
};

export class TableManager {
  private readonly tables: TableRecord = {};
  private tableValues = [] as TableDescriptorImpl[];

  private tableManagerCallback: DefaultTableManagerCallback;

  constructor(
    dataSource: DataSourceBase,
    private tableEventHandler?: (
      table: TableDescriptor,
      event: TableEvent,
    ) => any,
  ) {
    this.tableManagerCallback = new DefaultTableManagerCallback(
      dataSource,
      this,
      this.renameInternal,
      tableEventHandler ?? (() => undefined),
    );
  }

  get values(): TableDescriptor[] {
    return this.tableValues;
  }

  add = (
    namespace: NamespaceController,
    name: string,
    rowIndex: number,
    columnIndex: number,
    dataSource: DataSourceBase,
    style?: Partial<TableStyle>,
  ): TableDescriptor => {
    if (!namespace.checkName(name)) throw 'duplicate-name';

    const table = new TableDescriptorImpl(
      this.tableManagerCallback,
      crypto.randomUUID(),
      name,
      rowIndex,
      columnIndex,
      dataSource,
      style,
    );

    this.addTableInternal(table);
    return table;
  };

  checkBeforeMove = (
    range: RangeDescriptor,
    rowOffset: number,
    columnOffset: number,
  ) => {
    const targetRange: RangeDescriptor = {
      startRow: range.startRow + rowOffset,
      startColumn: range.startColumn + columnOffset,
      endRow: range.endRow + rowOffset,
      endColumn: range.endColumn + columnOffset,
    };
    for (const table of this.tableValues) {
      if (
        !table.style.showHeaderRow ||
        range.startRow !== table.startRow ||
        rowOffset === 0 ||
        checkIfRangesIntersect(table, range) ||
        !checkIfRangesIntersect(table, targetRange)
      ) {
        continue;
      }

      return false;
    }
    return true;
  };

  checkBeforeReorder = (
    isRow: boolean,
    beginIndex: number,
    count: number,
    afterIndex?: number,
    occupancyGraph?: OccupancyGraph,
  ) => {
    const endIndex = beginIndex + count - 1;
    let tableStart = 0,
      tableEnd = 0,
      max: number | undefined;
    const contains = (index: number) =>
      index >= tableStart && index <= tableEnd;

    for (const table of this.tableValues) {
      tableStart = isRow ? table.startRow : table.startColumn;
      tableEnd = isRow ? table.endRow : table.endColumn;

      if (
        (beginIndex <= tableStart && endIndex >= tableEnd) ||
        (afterIndex === undefined &&
          (beginIndex > tableEnd || endIndex < tableStart)) ||
        (afterIndex > beginIndex &&
          (afterIndex < tableStart || beginIndex > tableEnd)) ||
        (afterIndex < beginIndex &&
          (afterIndex > tableEnd || endIndex < tableStart))
      ) {
        continue;
      }

      if (contains(beginIndex) !== contains(endIndex)) {
        return false;
      } else if (
        afterIndex !== undefined &&
        contains(beginIndex) &&
        (afterIndex < tableStart - 1 || afterIndex > tableEnd)
      ) {
        max =
          afterIndex > beginIndex
            ? Math.min(tableEnd, max ?? afterIndex)
            : Math.max(tableStart, max ?? afterIndex);
      } else if (
        afterIndex !== undefined &&
        !contains(beginIndex) &&
        afterIndex >= tableStart &&
        afterIndex < tableEnd
      ) {
        max =
          afterIndex > beginIndex
            ? Math.min(tableStart - 1, max ?? afterIndex)
            : Math.max(tableEnd + 1, max ?? afterIndex);
      } else if (
        isRow &&
        table.style.showHeaderRow &&
        contains(beginIndex) &&
        ((beginIndex <= table.startRow && endIndex < table.endRow) ||
          (afterIndex !== undefined && afterIndex + 1 === table.startRow))
      ) {
        return false;
      }

      // If 'max' is in the reordering boundaries, consider that as if
      // the user hasn't moved the reordering overlay yet.
      if (max >= beginIndex && max <= endIndex) return false;

      if (afterIndex !== undefined && !contains(beginIndex)) {
        occupancyGraph?.add(tableStart, tableEnd);
      }
    }

    return max ?? true;
  };

  contains = (rowIndex: number, columnIndex: number) => {
    for (const table of this.tableValues) {
      if (isInRange(table, rowIndex, columnIndex)) {
        return true;
      }
    }
    return false;
  };

  containsInRange = (range: RangeDescriptor, skipTableWithName?: string) => {
    for (const table of this.tableValues) {
      if (skipTableWithName && table.name === skipTableWithName) continue;
      if (checkIfRangesIntersect(table, range)) {
        return true;
      }
    }
    return false;
  };

  delete = (name: string): TableDescriptorImpl => {
    const tableData = this.tables[name];
    if (!tableData) return;

    this.removeTableInternal(tableData.table);
    return tableData.table;
  };

  deleteRange = (range: RangeDescriptor, wholeTable?: boolean) => {
    const affectedTables: TableDescriptor[] = [];
    for (const table of this.tableValues) {
      if (!checkIfRangesIntersect(table, range)) {
        continue;
      }
      if (
        wholeTable ||
        (range.startRow <= table.startRow &&
          range.startColumn <= table.startColumn &&
          range.endRow >= table.endRow &&
          range.endColumn >= table.endColumn)
      ) {
        this.removeTableInternal(table, true);
      } else if (range.endRow >= table.firstRowIndex) {
        const startRow = Math.max(range.startRow - table.firstRowIndex, 0);
        const startColumn = Math.max(range.startColumn - table.startColumn, 0);

        const tableRange: RangeDescriptor = {
          startRow,
          endRow: Math.min(
            Math.max(range.endRow - table.firstRowIndex, 0),
            Math.max(table.rowCount - 1, 0),
          ),
          startColumn,
          endColumn: Math.min(
            Math.max(range.endColumn - table.startColumn, 0),
            Math.max(table.columnCount - 1, 0),
          ),
        };
        table.dataSource.clearRange(tableRange);
      }
      affectedTables.push(table);
    }
    if (affectedTables.length > 0) this.updateValues();
    return affectedTables;
  };

  clearCells = (range: RangeDescriptor, clearMode: CellClearMode) => {
    // We will not want to delete a table if the range cover the whole table
    // as table field-headers cannot be cleared.
    const affectedTables: TableDescriptor[] = [];

    for (const table of this.tableValues) {
      if (!checkIfRangesIntersect(table, range)) {
        continue;
      }

      if (range.endRow >= table.firstRowIndex) {
        const startRow = Math.max(range.startRow - table.firstRowIndex, 0);
        const startColumn = Math.max(range.startColumn - table.startColumn, 0);

        const tableRange: RangeDescriptor = {
          startRow,
          endRow: Math.min(
            Math.max(range.endRow - table.firstRowIndex, 0),
            Math.max(table.rowCount - 1, 0),
          ),
          startColumn,
          endColumn: Math.min(
            Math.max(range.endColumn - table.startColumn, 0),
            Math.max(table.columnCount - 1, 0),
          ),
        };

        table.dataSource.clearCells(tableRange, clearMode);
      }
      affectedTables.push(table);
    }
    return affectedTables;
  };

  get = (name: string): TableDescriptor => this.tables[name]?.table;

  getByIndex = (
    rowIndex: number,
    columnIndex: number,
    options?: Partial<GetTableOptions>,
  ): TableDescriptor | undefined => {
    for (const table of this.tableValues) {
      if (
        (options?.spillingOnly && !table.isSpilling) ||
        !isInRange(
          options?.useFullBounds ? table.fullBounds : table,
          rowIndex,
          columnIndex,
        )
      ) {
        continue;
      }
      return table;
    }
  };

  getById = (tableId: string): TableDescriptor | undefined => {
    for (const table of this.tableValues) {
      if (table.id === tableId) return table;
    }
  };

  getForRange = (
    range: RangeDescriptor,
    target?: TableDescriptor[],
    options?: Partial<GetTableOptions>,
  ) => {
    const tables: TableDescriptor[] = target ?? [];
    for (const table of this.tableValues) {
      if (!this.checkIfRangeIntersectTable(range, table, options)) {
        continue;
      }
      tables.push(table);
    }
    return tables;
  };

  checkIfRangeIntersectTable = (
    range: RangeDescriptor,
    table: TableDescriptor,
    options?: Partial<GetTableOptions>,
  ) => {
    return (
      !(options?.spillingOnly && !table.isSpilling) &&
      checkIfRangesIntersect(
        options?.useFullBounds ? table.fullBounds : table,
        range,
      )
    );
  };

  has = (name: string): boolean => !!this.tables[name];

  move = (name: string, newRowIndex: number, newColumnIndex: number) => {
    if (newRowIndex < 0 || newColumnIndex < 0) {
      throw 'invalid-range';
    }
    const tableData = this.tables[name];
    if (!tableData) return false;

    const { table } = tableData;
    const rowOffset = table.startRow - newRowIndex;
    const columnOffset = table.startColumn - newColumnIndex;
    const range: RangeDescriptor = {
      startRow: table.startRow + rowOffset,
      startColumn: table.startColumn + columnOffset,
      endRow: table.endRow + rowOffset,
      endColumn: table.endColumn + columnOffset,
    };
    const overlapping = this.containsInRange(range, table.name);
    if (overlapping) throw 'overlap';

    return setAnchorCell(table, newRowIndex, newColumnIndex);
  };

  moveRange = (
    range: RangeDescriptor,
    rowOffset: number,
    columnOffset: number,
  ): TableDescriptor[] => {
    const { startRow, startColumn, endRow, endColumn } = range;
    const dataTables: TableDescriptor[] = [];
    for (const table of this.tableValues) {
      if (!checkIfRangesIntersect(table, range)) continue;
      if (
        startRow <= table.startRow &&
        startColumn <= table.startColumn &&
        endRow >= table.endRow &&
        endColumn >= table.endColumn
      ) {
        setAnchorCell(
          table,
          table.startRow + rowOffset,
          table.startColumn + columnOffset,
        );
        for (const other of this.tableValues) {
          if (table === other) continue;
          if (isInRange(other, table.startRow, table.startColumn)) {
            if (checkIfRangesIntersect(other, table)) {
              if (
                table.startRow >= other.startRow ||
                table.startColumn >= other.startRow
              ) {
                other.isSpilling = true;
              } else {
                table.isSpilling = true;
              }
            }
            other.isSpilling = true;
          }
        }
      } else if (
        columnOffset === 0 &&
        table.startColumn === startColumn &&
        table.endColumn === endColumn &&
        startRow >= table.firstRowIndex &&
        endRow <= table.endRow &&
        startRow + rowOffset >= table.firstRowIndex &&
        endRow + rowOffset <= table.endRow
      ) {
        // Row reordering inside the table.
        const startIndex = startRow - table.firstRowIndex;
        const endIndex = endRow - table.firstRowIndex;
        table.dataSource.reorderRows(
          startIndex,
          endIndex - startIndex + 1,
          rowOffset > 0 ? endIndex + rowOffset : startIndex + rowOffset - 1,
        );
      } else if (
        rowOffset === 0 &&
        table.startRow === startRow &&
        table.endRow === endRow &&
        startColumn >= table.startColumn &&
        endColumn <= table.endColumn &&
        startColumn + columnOffset >= table.startColumn &&
        endColumn + columnOffset <= table.endColumn
      ) {
        // Column reordering inside the table.
        const startIndex = startColumn - table.startColumn;
        const endIndex = endColumn - table.startColumn;
        table.dataSource.reorderColumns(
          startIndex,
          endIndex - startIndex + 1,
          columnOffset > 0
            ? endIndex + columnOffset
            : startIndex + columnOffset - 1,
        );
      } else {
        dataTables.push(table);
      }
    }
    return dataTables;
  };

  insertRows = (afterIndex: number, count: number) =>
    this.insert(true, afterIndex, count);

  insertColumns = (afterIndex: number, count: number) =>
    this.insert(false, afterIndex, count);

  private insert = (isRow: boolean, afterIndex: number, count: number) => {
    for (const table of this.tableValues) {
      const index = isRow ? table.startRow : table.startColumn;
      if (afterIndex >= index) continue;

      if (isRow) {
        table.startRow += count;
      } else {
        table.startColumn += count;
      }
    }
  };

  private renameInternal = (name: string, newName: string) => {
    const tableData = this.tables[name];
    if (!tableData) return false;

    this.tables[newName] = tableData;
    delete this.tables[name];
    this.updateValues();
    tableData.table.dispatchEvent({
      type: 'rename',
      table: tableData.table,
      oldName: name,
      newName,
    });

    return true;
  };

  reorderColumns = (beginIndex: number, count: number, afterIndex: number) =>
    this.reorder(beginIndex, count, afterIndex, false);

  reorderRows = (beginIndex: number, count: number, afterIndex: number) =>
    this.reorder(beginIndex, count, afterIndex, true);

  private reorder = (
    beginIndex: number,
    count: number,
    afterIndex: number,
    isRow: boolean,
  ) => {
    const endIndex = beginIndex + count - 1;
    const isAscending = afterIndex > beginIndex;
    const affectedStart = isAscending ? endIndex + 1 : afterIndex + 1;
    const affectedEnd = isAscending ? afterIndex : beginIndex - 1;
    const normalizedTarget = afterIndex + (isAscending ? 0 : 1);

    for (const table of this.tableValues) {
      const tableStart = isRow ? table.firstRowIndex : table.startColumn;
      const tableEnd = isRow ? table.endRow : table.endColumn;

      if (affectedStart <= tableStart && affectedEnd >= tableEnd) {
        // Move the table if it is affected by the move but is not inside
        // selection.
        const diff = isAscending ? -count : count;
        if (isRow) {
          table.startRow += diff;
        } else {
          table.startColumn += diff;
        }
      } else if (beginIndex <= tableStart && endIndex >= tableEnd) {
        // Move the table if its fully covered by the selection.
        const diff = isAscending
          ? afterIndex - endIndex
          : afterIndex + 1 - beginIndex;
        if (isRow) {
          table.startRow += diff;
        } else {
          table.startColumn += diff;
        }
      } else if (
        !(beginIndex > tableEnd || endIndex < tableStart) &&
        normalizedTarget >= tableStart &&
        normalizedTarget <= tableEnd
      ) {
        // Reorder the table if its partly covered by the selection and the
        // target is still inside the table.
        const relBeginIndex = beginIndex - tableStart;
        const relAfterIndex = afterIndex - tableStart;

        if (isRow) {
          table.dataSource.reorderRows(relBeginIndex, count, relAfterIndex);
        } else {
          table.dataSource.reorderColumns(relBeginIndex, count, relAfterIndex);
        }
      }
    }
  };

  setSpillingStateForRange = (
    range: RangeDescriptor,
    callback: (tableRange: TableDescriptor) => boolean,
  ) => {
    this.tableValues.sort(
      (a, b) => a.startRow - b.startRow || a.startColumn - b.startColumn,
    );
    for (const table of this.tableValues) {
      if (!checkIfRangesIntersect(table.fullBounds, range)) continue;
      table.isSpilling = callback(table);
    }
  };

  private updateValues = () => {
    this.tableValues = Object.values(this.tables).map(({ table }) => table);
  };

  private addTableInternal = (table: TableDescriptorImpl) => {
    const listener = (event: TableEvent) => {
      this.tableEventHandler?.(table, event);
    };
    this.tables[table.name] = { table, listener };
    this.updateValues();
  };

  private removeTableInternal = (
    table: TableDescriptor,
    skipUpdate?: boolean,
  ) => {
    const { name } = table;
    const tableData = this.tables[table.name];
    if (!tableData) return;

    delete this.tables[name];

    if (!skipUpdate) this.updateValues();
  };
}

class DefaultTableManagerCallback
  implements TableManagerCallback<TableDescriptorImpl>
{
  constructor(
    protected readonly dataSource: DataSourceBase,
    protected readonly manager: TableManager,
    protected readonly renameCallback: (name: string, newName: string) => any,
    readonly onAnyEvent: (table: TableDescriptorImpl, event: TableEvent) => any,
  ) {}

  onMove = (
    table: TableDescriptorImpl,
    rowIndex: number,
    columnIndex: number,
  ) => {
    const { startRow, startColumn, endRow, endColumn } = table.fullBounds;
    return this.dataSource.move(
      {
        startRow,
        startColumn,
        endRow,
        endColumn,
      },
      rowIndex - table.startRow,
      columnIndex - table.startColumn,
    );
  };

  onRename = (table: TableDescriptorImpl, newName: string) => {
    const name = table.name;
    newName = (newName ?? '')
      .trim()
      .replace(/(?:(?![ _])\W+)/gi, '')
      .replace(/(?:[ ]{2,})/gi, ' ');
    if (newName.length > 250) throw 'name-too-long';
    if (newName.length <= 0) throw 'name-too-short';
    if (name === newName) return true;
    if (!this.dataSource.namespace.checkName(newName)) {
      throw 'duplicate-name';
    }
    table.name = newName;
    return this.renameCallback(name, newName);
  };

  onStyleChange = async (
    table: TableDescriptorImpl,
    newStyle: Partial<TableStyle>,
  ) => {
    const oldStyle = { ...table.style };

    if (
      oldStyle.showTotalRow !== newStyle.showTotalRow &&
      newStyle.showTotalRow
    ) {
      const targetRange: RangeDescriptor = {
        startRow: table.endRow + 1,
        startColumn: table.startColumn,
        endRow: table.endRow + 1,
        endColumn: table.endColumn,
      };
      const result = await ensureAsync(
        this.dataSource.containsDataInRange(targetRange),
      );
      if (result) return false;
    }

    Object.assign(table.style, newStyle);
    table.dispatchEvent({
      type: 'styleChange',
      table,
      newStyle: { ...table.style },
      oldStyle,
    });
    return true;
  };
}

class FullBoundsDescriptor implements RangeDescriptor {
  constructor(private readonly table: TableDescriptorImpl) {}

  get startRow() {
    return this.table.startRow;
  }

  get startColumn() {
    return this.table.startColumn;
  }

  get endRow() {
    const { table } = this;
    return (
      table.startRow +
      Math.max(table.dataSource.state.rows - 1, 0) +
      (table.style.showHeaderRow && table.dataSource.state.rows > 0 ? 1 : 0) +
      (table.style.showTotalRow && !table.hasGroupsColumn ? 1 : 0)
    );
  }

  get endColumn() {
    const { table } = this;
    return (
      table.startColumn +
      Math.max(table.dataSource.state.cols - 1, 0) +
      (table.hasGroupsColumn ? 1 : 0)
    );
  }
}

const DEFAULT_TABLE_STYLES: TableStyle = {
  bandedRows: true,
  bandedColumns: false,
  showHeaderRow: true,
  showFilterButton: true,
  showTotalRow: false,
};

class TableIndexesImpl implements TableIndexes {
  constructor(private readonly table: TableDescriptorImpl) {}

  get headerRow() {
    return this.table.style.showHeaderRow ? this.table.startRow : -1;
  }

  get totalRow() {
    return this.table.style.showTotalRow ? this.table.endRow : -1;
  }

  get groupHeaderColumn() {
    return this.table.hasGroupsColumn ? this.table.startColumn : -1;
  }
}

class TableDescriptorImpl implements TableDescriptor {
  private readonly eventTarget = new DefaultDataEventTarget<TableEvent>();
  private readonly dataSourceListener: DataEventListner = (event) => {
    if (
      event.name === 'dataGroup' &&
      typeof this.dataSource.getGroups === 'function'
    ) {
      this.groupCount = this.dataSource
        .getGroups()
        .filter((group) => !group.disabled).length;
    }

    const tableEvent: TableEvent = {
      type: 'datasource',
      table: this,
      dataSourceEvent: event,
    };
    this.dispatchEvent(tableEvent);
    this.callback.onAnyEvent(this, tableEvent);
  };
  private groupCount = 0;

  readonly style: TableStyle;

  constructor(
    protected readonly callback: DefaultTableManagerCallback,
    readonly id: string,
    public name: string,
    public startRow: number,
    public startColumn: number,
    public readonly dataSource: DataSourceBase,
    style?: Partial<TableStyle>,
  ) {
    this.style = Object.assign({}, DEFAULT_TABLE_STYLES, style);
    this.dataSource.addListener(this.dataSourceListener);
  }

  isReadOnly = false;

  isSpilling = false;

  readonly fullBounds = new FullBoundsDescriptor(this);

  readonly indexes = new TableIndexesImpl(this);

  get firstRowIndex() {
    return this.startRow + (this.style.showHeaderRow ? 1 : 0);
  }
  get firstColumnIndex() {
    return this.startColumn + (this.hasGroupsColumn ? 1 : 0);
  }

  get lastRowIndex() {
    return this.isSpilling
      ? this.startRow
      : this.firstRowIndex + this.rowCount - 1;
  }
  get lastColumnIndex() {
    return this.isSpilling
      ? this.startColumn
      : this.firstColumnIndex + this.columnCount - 1;
  }

  get endRow() {
    return this.isSpilling ? this.startRow : this.fullBounds.endRow;
  }
  get endColumn() {
    return this.isSpilling ? this.startColumn : this.fullBounds.endColumn;
  }

  get columnCount() {
    if (this.isSpilling) return 0;
    return this.dataSource.state.cols + (this.groupCount > 0 ? 1 : 0);
  }
  get rowCount() {
    return this.isSpilling ? 0 : this.dataSource.state.rows;
  }

  get hasGroupsColumn() {
    return this.groupCount > 0;
  }

  hideColumns = (ranges: { startIndex: number; endIndex: number }[]) => {
    if (typeof this.dataSource.hideColumns === 'function') {
      // After each hide, the indexes that the selections point to will
      // become invalid, so we cache the column names before hiding any
      // columns.
      const hidingColumnsIdPairs = [] as [string, string][];
      for (const range of ranges) {
        const from = this.dataSource.getHeader(
          range.startIndex - this.startColumn,
        );
        const to = this.dataSource.getHeader(range.endIndex - this.startColumn);
        if (!from || !to) continue;
        hidingColumnsIdPairs.push([from.id, to.id]);
      }

      if (hidingColumnsIdPairs.length > 0) {
        for (const [fromId, toId] of hidingColumnsIdPairs) {
          const from = this.dataSource.getHeaderById(fromId);
          const to = this.dataSource.getHeaderById(toId);
          if (!from || !to) continue;
          this.dataSource.hideColumns(
            from.columnViewIndex,
            to.columnViewIndex - from.columnViewIndex + 1,
            false,
          );
        }
      }
      return true;
    }
    return false;
  };

  unhideAllColumns = () => {
    if (typeof this.dataSource.unhideAllColumns === 'function') {
      return this.dataSource.unhideAllColumns();
    }
    return false;
  };

  getHiddenColumnCount = () => {
    return this.dataSource.getHiddenColumnCount();
  };

  move = (rowIndex: number, columnIndex: number) => {
    return this.callback.onMove(this, rowIndex, columnIndex);
  };

  rename = (newName: string) => {
    return this.callback.onRename(this, newName);
  };

  setStyle = (style: Partial<TableStyle>, overwrite?: boolean) => {
    return this.callback.onStyleChange(
      this,
      overwrite ? style : Object.assign({ ...this.style }, style),
    );
  };

  setReadOnly(isReadOnly: boolean) {
    if (this.isReadOnly === isReadOnly) return;
    this.isReadOnly = isReadOnly;
    this.dispatchEvent({
      type: 'readonly',
      table: this,
      isReadOnly,
    });
  }

  addEventListener = this.eventTarget.addListener;

  removeEventListener = this.eventTarget.removeListener;

  dispatchEvent = (event: TableEvent) => {
    this.callback.onAnyEvent(this, event);
    this.eventTarget.dispatchEvent(event);
  };
}
