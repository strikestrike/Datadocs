import type {
  RequestDataFrameInput,
  CellStyleDeclaration,
  RequestDataFrameOutput,
  TableGroupHeader,
  TableSummaryContext,
} from '@datadocs/canvas-datagrid-ng';
import { filterColumnsWithSparseRange } from '@datadocs/canvas-datagrid-ng/lib/range/util';
import type { FromDuckDbThis } from './internal-types';

export function getDataFrame(
  this: FromDuckDbThis,
  request: RequestDataFrameInput,
) {
  const { startRow, endRow, startColumn, endColumn } = request;

  const columns = filterColumnsWithSparseRange(
    this.columns.slice(startColumn, endColumn + 1),
    request?.skippedColumns,
  );
  const { dataGroups } = this;
  const cells: any[][] = [];
  const style: Partial<CellStyleDeclaration>[][] = [];
  const meta: any[][] = [];
  const rowHeaders: (string | number)[] = [];
  const groups: TableGroupHeader[] = [];
  const summaryData: TableSummaryContext[] = [];
  const columnIds = columns.map((it) => it.id);
  const logRequest = () => {
    const logs = [
      `DuckDB.getDataFrame(`,
      `[${startRow},${startColumn}]~[${endRow},${endColumn}])`,
    ];
    console.log(logs.join(''), cells);
  };
  const getResult = (): RequestDataFrameOutput => {
    return {
      cells,
      meta,
      columns,
      rowHeaders,
      style,
      groups,
      summaryData,
    };
  };

  let rowHeader = startRow + 1;
  for (let rowIndex = startRow; rowIndex <= endRow; rowIndex++) {
    const row = [];
    const rowStyle = [];
    const rowMeta = [];
    this.rowsLoader.getCellsDataForRow(row, rowIndex, columnIds);
    this.rowsLoader.getCellsStyleForRow(rowStyle, rowIndex, columnIds);
    this.rowsLoader.getCellsMetaForRow(rowMeta, rowIndex, columnIds);
    if (dataGroups.length > 0) {
      const group = this.rowsLoader.getGroupHeader(rowIndex);
      groups.push(group);

      if (group?.rowType === 'total') {
        for (let i = 0; i < columnIds.length; i++) {
          const columnId = columnIds[i];
          const summaryData = group.summaryData[columnId];
          if (summaryData) row[i] = summaryData.data;
        }
      }
    }
    cells.push(row);
    style.push(rowStyle);
    meta.push(rowMeta);
    rowHeaders.push(rowHeader++);
  }

  if (request.loadSummary) {
    this.rowsLoader.getSummaryRow(summaryData, columnIds);
  }

  /** fetch 100 more rows for more fluency */
  const loadBegin = Math.max(startRow - 100, 0);
  let loadEnd = endRow + 100;
  const { numRows } = this.dbState;
  if (typeof numRows === 'number' && numRows <= loadEnd) loadEnd = numRows - 1;
  const task = this.rowsLoader.loading.add({
    range: [loadBegin, loadEnd],
  });
  const result = getResult();
  if (task.cancellable && task.id) result.abortToken = task.id;

  return getResult();
}

export function getCellValue(
  this: FromDuckDbThis,
  rowViewIndex: number,
  columnViewIndex: number,
) {
  const column = this.columns.get(columnViewIndex);
  if (!column) return;
  const groupHeader = this.rowsLoader.getGroupHeader(rowViewIndex);
  if (
    groupHeader?.rowType === 'total' ||
    groupHeader?.rowType === 'intermediate'
  ) {
    return groupHeader.summaryData[column.id]?.data;
  }
  const loadedRow = this.rowsLoader.loaded.get(rowViewIndex);
  if (!loadedRow) return '';
  return loadedRow.data[column.id];
}

export function getCellValueByColumnId(
  this: FromDuckDbThis,
  columnId: string,
  rowViewIndex: number,
) {
  const loadedRow = this.rowsLoader.loaded.get(rowViewIndex);
  if (!loadedRow) return;
  return loadedRow.data[columnId];
}

export function getCellStyle(
  this: FromDuckDbThis,

  rowViewIndex: number,
  columnViewIndex: number,
) {
  const column = this.getHeader(columnViewIndex);
  if (!column) return;
  const rowStyle = [];
  this.rowsLoader.getCellsStyleForRow(rowStyle, rowViewIndex, [column.id]);
  return rowStyle[0];
}

export function getCellMeta(
  this: FromDuckDbThis,
  rowViewIndex: number,
  columnViewIndex: number,
) {
  const column = this.getHeader(columnViewIndex);
  if (!column) return;
  const rowMeta = [];
  this.rowsLoader.getCellsMetaForRow(rowMeta, rowViewIndex, [column.id]);
  return rowMeta[0];
}
