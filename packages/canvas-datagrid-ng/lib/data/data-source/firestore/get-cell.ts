import type { FirestoreDataSource } from '.';

export function getCellValue(
  this: FirestoreDataSource,
  rowViewIndex: number,
  columnViewIndex: number,
) {
  const column = this.columns.get(columnViewIndex);
  if (!column) return;

  const caches = this.context.caches;
  const realRowIndex = this.resolveRowIndex(rowViewIndex);
  return caches.getCellValue(realRowIndex, column.dataKey);
}

export function getCellStyle(
  this: FirestoreDataSource,
  rowViewIndex: number,
  columnViewIndex: number,
) {
  const column = this.columns.get(columnViewIndex);
  if (!column) return;

  const caches = this.context.caches;
  const realRowIndex = this.resolveRowIndex(rowViewIndex);
  return caches.getCellStyle(realRowIndex, column.dataKey);
}
