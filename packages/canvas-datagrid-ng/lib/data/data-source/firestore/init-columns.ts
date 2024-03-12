import { integerToAlpha } from '../../../util';
import type { GridHeader } from '../../../types';
import type { ColumnsManager } from '../columns-manager';
import type { FirestoreUserDocOpener } from './api/open-user-db';

export function initColumnHeaders(
  userDoc: FirestoreUserDocOpener,
  columnsManager: ColumnsManager,
) {
  const cols = userDoc.docBase.cols;
  let columns: GridHeader[] = [];
  if (cols > 0) {
    columns = new Array(cols).fill(null).map((_, columnIndex) => {
      const name = integerToAlpha(columnIndex).toUpperCase();
      return {
        dataKey: name,
        title: name,
        id: name,
        originalColumnIndex: columnIndex,
        letterId: columnIndex,
        type: 'string',
      };
    });
  }
  columnsManager.set(columns);
}
