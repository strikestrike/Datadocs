import { getDoc } from 'firebase/firestore';
import type { DocumentReference } from 'firebase/firestore';

import { NetworkStatus } from '../utils/network-status';
import { FirestoreQueryCacheBase } from './base';
import { FirestoreDebugLogger } from '../utils/debug-logger';

const console = new FirestoreDebugLogger('query-cache');

export class FirestoreQueryCache {
  readonly cache = new FirestoreQueryCacheBase();
  readonly networkStatus = NetworkStatus.get();

  readonly common = this.cache.common;
  readonly dataBlocks = this.cache.dataBlocks;
  readonly inMem = this.cache.inMem;

  getDocData = async <T = any>(docRef: DocumentReference<any>): Promise<T> => {
    if (this.networkStatus.online) {
      try {
        const doc = await getDoc(docRef);
        if (!doc.exists()) return null;
        return doc.data();
      } catch (error) {
        console.error(error);
        return null;
      }
    }
    return this.cache.common.get(docRef.path);
  };

  cacheDoc = async (
    dbId: string,
    docRef: DocumentReference<any>,
    data: any,
    updateMode = false,
  ) => {
    return updateMode
      ? this.cache.common.update(dbId, docRef.path, data)
      : this.cache.common.set(dbId, docRef.path, data);
  };

  readonly getCellsDataForRow = <T>(
    basedValues: T[],
    rowIndex: number,
    columnIds: string[],
  ) => {
    const row = this.inMem.get(rowIndex);
    if (!row) return;
    for (let i = 0; i < columnIds.length; i++) {
      const columnId = columnIds[i];
      if (columnId === '__proto__') continue;
      const modification = row.data[columnId];
      if (typeof modification !== 'undefined') basedValues[i] = modification;
    }
    return basedValues;
  };

  readonly getCellValue = (rowIndex: number, columnId: string | number) => {
    const row = this.inMem.get(rowIndex);
    if (!row || columnId === '__proto__') return;
    return row.data[columnId];
  };

  readonly getCellStyle = (rowIndex: number, columnId: string | number) => {
    const row = this.inMem.get(rowIndex);
    if (!row || columnId === '__proto__') return;
    return row.style[columnId];
  };
}
