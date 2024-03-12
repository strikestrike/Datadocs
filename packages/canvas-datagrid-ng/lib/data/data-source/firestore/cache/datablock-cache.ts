import type { IDBPDatabase } from 'idb';
import type { FirestoreCacheDB, CachedDataBlockV2 } from './idb-schema';
import { idbUpdate } from '../utils/idb';
import { FirestoreDebugLogger } from '../utils/debug-logger';
import type { FDocDataBlockV2 } from '../spec/storage';

const console = new FirestoreDebugLogger('query-cache');

export class FirestoreQueryCacheDataBlock {
  constructor(
    private readonly getDB: () => Promise<IDBPDatabase<FirestoreCacheDB>>,
  ) {}

  private forEach = async (
    dbId: string,
    range: [number, number],
    forEach: (
      row: CachedDataBlockV2,
      index: number,
    ) => unknown | Promise<unknown>,
  ) => {
    const db = await this.getDB();
    const fromRow = Math.max(0, range[0]);
    const toRow = Math.max(fromRow, range[1]);

    const rows = await db.getAllFromIndex(
      'dataBlockV2',
      'byBaseRowId',
      IDBKeyRange.bound(fromRow, toRow, false, false),
    );
    let index = 0;
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (dbId !== row.dbId) continue;
      await forEach(row, index++);
    }
  };

  get = async (
    dbId: string,
    range: [number, number],
  ): Promise<CachedDataBlockV2[]> => {
    const result: CachedDataBlockV2[] = [];
    await this.forEach(dbId, range, (row) => result.push(row));
    return result;
  };

  set = async (dbId: string, blockIds: string[], blocks: FDocDataBlockV2[]) => {
    const db = await this.getDB();
    const tx = db.transaction('dataBlockV2', 'readwrite');
    try {
      for (let i = 0; i < blocks.length; i++) {
        const blockId = blockIds[i];
        const block: CachedDataBlockV2 = {
          ...blocks[i],
          dbId,
          blockId,
        };
        await tx.store.put(block);
      }
      tx.commit();
      await tx.done;
    } catch (error) {
      console.error(error);
      return false;
    }
    return true;
  };

  update = async (
    dbId: string,
    payload: {
      blockId: string;
      update: Partial<CachedDataBlockV2> & { [x: string]: any };
    }[],
  ) => {
    const db = await this.getDB();
    const tx = db.transaction('dataBlockV2', 'readwrite');

    try {
      for (let i = 0; i < payload.length; i++) {
        const { blockId, update } = payload[i];
        update.blockId = blockId;
        update.dbId = dbId;
        update.u = Date.now();
        await idbUpdate(tx, blockId, update);
      }
      tx.commit();
      await tx.done;
    } catch (error) {
      console.error(error);
      return false;
    }
    return true;
  };

  modifyByIterator = async (
    dbId: string,
    range: [number, number],
    fn: (
      row: CachedDataBlockV2,
      index: number,
    ) => void | CachedDataBlockV2 | Promise<void | CachedDataBlockV2>,
  ): Promise<number> => {
    const db = await this.getDB();
    let modifyCount = 0;
    await this.forEach(dbId, range, async (row, index) => {
      const modified = await fn(row, index);
      if (modified) {
        await db.put('dataBlockV2', modified);
        // Rollup bug: Assigning to rvalue (Note that you need plugins to import files that are not JavaScript)
        // modifyCount++;
        modifyCount = modifyCount + 1;
      }
    });
    return modifyCount;
  };

  removeUnsavedMarks = async (
    dbId: string,
    row: number,
    columnNames?: string[],
  ): Promise<boolean> => {
    const db = await this.getDB();
    const tx = db.transaction('dataBlockV2', 'readwrite');
    let updated = false;
    let cursor = await tx.store
      .index('byBaseRowId')
      .openCursor(IDBKeyRange.only(row));
    while (cursor) {
      const v = cursor.value;
      if (v.dbId === dbId) {
        if (v.unsaved?.d) {
          const unsavedData = v.unsaved.d;
          if (columnNames) {
            deleteKeys(unsavedData, columnNames);
            if (Object.keys(unsavedData).length === 0) delete v.unsaved.d;
          } else {
            delete v.unsaved.d;
          }
          await cursor.update(v);
          updated = true;
        }
        break;
      }
      cursor = await cursor.continue();
    }
    tx.commit();
    await tx.done;
    return updated;
  };
}

function deleteKeys(obj: any, keys: string[]) {
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    delete obj[key];
  }
  return obj;
}
