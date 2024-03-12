import type { FirestoreDataSource } from '.';
import type { DataSourceBase } from '../spec';
import { updateFirestoreDataSourceState } from './update-state';

type AssertAPI<APIFn, ImplementFn extends APIFn> = ImplementFn;
type _ =
  | AssertAPI<DataSourceBase['reorderColumns'], typeof reorderColumns>
  | AssertAPI<DataSourceBase['reorderRows'], typeof reorderRows>;

export function reorderColumns(
  this: FirestoreDataSource,
  columnViewIndex: number,
  count: number,
  afterViewIndex: number,
): boolean {
  this.columns.reorder(columnViewIndex, count, afterViewIndex);
  this.sizes.reorderColumns(columnViewIndex, count, afterViewIndex);
  updateFirestoreDataSourceState(this.state, this.userDoc.docBase);
  return true;
}

export function reorderRows(
  this: FirestoreDataSource,
  beginViewIndex: number,
  count: number,
  afterViewIndex: number,
): boolean {
  const rowIndexes: number[] = [];
  for (let i = 0; i < count; i++) rowIndexes.push(beginViewIndex + i);
  this.context.caches.inMem.reorderRows(beginViewIndex, count, afterViewIndex);

  this.sizes.reorderRows(beginViewIndex, count, afterViewIndex);
  updateFirestoreDataSourceState(this.state, this.userDoc.docBase);
  return true;
}
