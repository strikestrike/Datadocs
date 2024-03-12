import type { FirestoreDataSource } from '.';
import type { EditCellDescriptor } from '../spec/edit';
import { EditCellDescriptor as EditFirestoreCell } from './editor/edit-cells-base';
import { updateFirestoreDataSourceState } from './update-state';

export function editCells(
  this: FirestoreDataSource,
  edit: EditCellDescriptor[],
): boolean {
  const editNext: EditFirestoreCell[] = [];
  for (let i = 0; i < edit.length; i++) {
    const e = edit[i];
    const column = this.columns.get(e.column);
    if (!column) continue;
    const rowId = this.resolveRowIndex(e.row);
    if (e.value !== undefined) {
      editNext.push(
        new EditFirestoreCell(rowId, column.id, {
          data: e.value,
          style: e.style,
        }),
      );
    }
  }

  this.editor.edit(editNext);
  updateFirestoreDataSourceState(this.state, this.userDoc.docBase, false);
  return true;
}
