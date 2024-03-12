import type { InMemoryPositionHelper } from '../in-memory-position-helper';
import type { DataSourceBase, DataSourceState } from '../spec';
import type { TableManager } from '../table-manager';

// Update visible indexes if the position helper has been initialized.
export function updateVisibleIndexes(
  position: InMemoryPositionHelper,
  tables: TableManager,
) {
  const { visibleScrollIndexes: indexes } = position;
  const { rowIndex, columnIndex } = indexes;

  indexes.rowIndex = 0;
  indexes.columnIndex = 0;
  for (const table of tables.values) {
    indexes.rowIndex = Math.max(table.endRow, indexes.rowIndex);
    indexes.columnIndex = Math.max(table.endColumn, indexes.columnIndex);
  }

  return indexes.rowIndex !== rowIndex || indexes.columnIndex !== columnIndex;
}

export function updateDataSourceState(
  dataSource: DataSourceBase,
  position: InMemoryPositionHelper | undefined,
  tables: TableManager,
  state: DataSourceState,
  rowCount: number,
  columnCount: number,
) {
  if (state.rows === rowCount && state.cols === columnCount) {
    return false;
  }

  const { rows, cols } = state;

  state.rows = rowCount;
  state.cols = columnCount;

  if (position) updateVisibleIndexes(position, tables);

  dataSource.dispatchEvent(
    {
      name: 'dataCount',
      prevRowCount: rows,
      prevColumnCount: cols,
      rowCount,
      columnCount,
    },
    true,
  );
  return true;
}
