import type { FirestoreDataSource } from '.';
import type { DataSourceBase } from '../spec';
import { updateFirestoreDataSourceState } from './update-state';

type AssertAPI<APIFn, ImplementFn extends APIFn> = ImplementFn;
type _ =
  | AssertAPI<DataSourceBase['hideRows'], typeof hideRows>
  | AssertAPI<DataSourceBase['hideColumns'], typeof hideColumns>
  | AssertAPI<DataSourceBase['unhideRows'], typeof unhideRows>
  | AssertAPI<DataSourceBase['unhideColumns'], typeof unhideColumns>;

export function hideRows(
  this: FirestoreDataSource,
  beginIndex: number,
  endIndex: number,
  isGroup?: boolean,
) {
  return this.hiddenRowRanges.hide(beginIndex, endIndex, isGroup);
}
export function unhideRows(
  this: FirestoreDataSource,
  beginIndex: number,
  endIndex: number,
) {
  return this.hiddenRowRanges.unhide(beginIndex, endIndex);
}

export function hideColumns(
  this: FirestoreDataSource,
  columnViewIndex: number,
  count: number,
  isGroup?: boolean,
) {
  const removed = this.columns.hide(columnViewIndex, count, isGroup);
  if (removed) {
    this.sizes.hide(removed);
    updateFirestoreDataSourceState(this.state, this.userDoc.docBase);
    return true;
  }
  return false;
}

export function unhideColumns(
  this: FirestoreDataSource,
  afterViewIndex: number,
  isGroup?: boolean,
) {
  const inserted = this.columns.unhide(afterViewIndex, isGroup);
  if (inserted) {
    this.sizes.unhide(afterViewIndex, inserted.columns);
    updateFirestoreDataSourceState(this.state, this.userDoc.docBase);
    return inserted.columns.map((it) => it.columnViewIndex);
  }
  return;
}

export function getHiddenColumns(this: FirestoreDataSource, viewIndex: number) {
  return this.columns.getHiddenColumns(viewIndex);
}
