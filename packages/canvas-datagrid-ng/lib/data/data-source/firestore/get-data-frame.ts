import type { FirestoreDataSource } from '.';
import type { RequestDataFrameInput, RequestDataFrameOutput } from '../spec';

export function getDataFrame(
  this: FirestoreDataSource,
  request: RequestDataFrameInput,
): RequestDataFrameOutput {
  let { startRow, endRow, startColumn, endColumn } = request;

  const cells: string[][] = [];
  const rowHeaders: number[] = [];
  const cellsStyle: any[][] = [];
  const meta: any[] = [];
  function getResult(): RequestDataFrameOutput {
    return {
      cells,
      meta,
      columns,
      rowHeaders,
      style: cellsStyle,
    };
  }

  // The user doc has not been opened
  if (!this || !this.opened) return getResult();
  if (startColumn < 0) startColumn = 0;
  if (startColumn >= this.columns.length) return getResult();
  if (endColumn >= this.columns.length) endColumn = this.columns.length - 1;

  const columns = this.columns.slice(startColumn, endColumn + 1);
  const columnIds = columns.map((it) => it.id);

  const totalRows = this.state.rows;
  if (startRow < 0) startRow = 0;
  if (endRow >= totalRows) endRow = totalRows - 1;

  let rowHeader = startRow + 1;
  for (let rowIndex = startRow; rowIndex <= endRow; rowIndex++) {
    const row = [];
    const rowStyle = [];
    this.context.caches.getCellsDataForRow(
      row,
      this.resolveRowIndex(rowIndex),
      columnIds,
    );
    cells.push(row);
    cellsStyle.push(rowStyle);
    rowHeaders.push(rowHeader++);
  }

  /** fetch 100 more rows for more fluency */
  const getter = this.getDataQueue.add({
    range: [startRow - 100, endRow + 100],
  });
  const result = getResult();
  if (getter.cancellable && getter.id) result.abortToken = getter.id;
  return result;
}
