import type { DataSourceBase } from '../data/data-source/spec';
import type { RangeResult } from '../range/result';
import type {
  CellStyleDeclaration,
  GridHeader,
  MergedCellDescriptor,
  TableDescriptor,
  TableGroupHeader,
  TableSummaryContext,
} from '../types';

export function getSingleRowDataForRendering(
  dataSource: DataSourceBase,
  row: number,
  startColumn: number,
  endColumn: number,
): {
  values: any[];
  styles: Partial<CellStyleDeclaration>[];
  meta: any[];
  mergedCells: RangeResult<MergedCellDescriptor>;
  tables: RangeResult<TableDescriptor>;
  columns: GridHeader[];
  rowHeader: string | number;
  tableGroups: Record<string, TableGroupHeader[]>;
  tableSummaryData: Record<string, TableSummaryContext[]>;
} {
  if (!dataSource) {
    return {
      values: [],
      styles: [],
      meta: [],
      mergedCells: null,
      tables: null,
      tableGroups: {},
      tableSummaryData: {},
      columns: [],
      rowHeader: '',
    };
  }

  const result = dataSource.getDataFrame({
    startRow: row,
    endRow: row,
    startColumn,
    endColumn,
  });
  const values = result.cells[0] || [];
  const styles = (result.style && result.style[0]) || [];
  const meta = (result.meta && result.meta[0]) || [];
  const tableGroups = result.tableGroups || {};
  const tableSummaryData = result.tableSummaryData || {};
  const count = endColumn - startColumn + 1;
  for (let i = values.length; i < count; i++) values[i] = null;
  for (let i = 0; i < count; i++) styles[i] = styles[i] || null;
  for (let i = 0; i < count; i++) meta[i] = meta[i] || null;

  return {
    values,
    styles,
    meta,
    mergedCells: result.mergedCells,
    tables: result.tables,
    tableGroups,
    tableSummaryData,
    columns: result.columns,
    rowHeader: result.rowHeaders[0],
  };
}
