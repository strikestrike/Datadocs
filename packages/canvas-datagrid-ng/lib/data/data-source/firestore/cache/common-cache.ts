import type { IDBPDatabase } from 'idb';
import type { FirestoreCacheDB, CachedCommonDocV1 } from './idb-schema';
import { idbUpdate } from '../utils/idb';
import { FirestoreDebugLogger } from '../utils/debug-logger';

const console = new FirestoreDebugLogger('query-cache');

/**
 * This class is used for caching common Firestore documents,
 * excluding Firestore documents for data block
 */
export class FirestoreQueryCacheCommon {
  constructor(
    private readonly getDB: () => Promise<IDBPDatabase<FirestoreCacheDB>>,
  ) {}

  get = async (key: string) => {
    const db = await this.getDB();
    try {
      const v = await db.get('cacheV1', key);
      return v.value;
    } catch (error) {
      console.error(error);
    }
  };

  update = async (
    dbId: string,
    key: string,
    payload: Partial<CachedCommonDocV1> & { [x: string]: any },
  ) => {
    const db = await this.getDB();
    const tx = db.transaction('cacheV1', 'readwrite');

    payload.key = key;
    payload.dbId = dbId;
    payload.updatedAt = Date.now();
    try {
      await idbUpdate(tx, key, payload);
      tx.commit();
      await tx.done;
    } catch (error) {
      console.error(error);
    }
  };

  set = async (dbId: string, key: string, value: any) => {
    const db = await this.getDB();
    const payload: CachedCommonDocV1 = {
      key,
      value,
      dbId,
      updatedAt: Date.now(),
    };
    try {
      await db.put('cacheV1', payload);
    } catch (error) {
      console.error(error);
    }
  };
}
