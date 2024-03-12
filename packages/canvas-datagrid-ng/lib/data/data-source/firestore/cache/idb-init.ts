import { openDB } from 'idb';
import type {
  CachedCommonDocV1,
  CachedDataBlockV2,
  FirestoreCacheDB,
} from './idb-schema';

const checkCommonCacheV1Key = (key: keyof CachedCommonDocV1) => key as string;
const checkDataCacheV2Key = (key: keyof CachedDataBlockV2) => key as string;

const IDB_NAME = 'firestore-query-cache';
const IDB_LATEST_VERSION = 1;

export async function _initIDB() {
  const db = await openDB<FirestoreCacheDB>(IDB_NAME, IDB_LATEST_VERSION, {
    upgrade(db) {
      const historyV1 = db.createObjectStore('cacheV1', {
        keyPath: checkCommonCacheV1Key('key'),
      });

      historyV1.createIndex('byDbId', checkCommonCacheV1Key('dbId'));

      const dataV2 = db.createObjectStore('dataBlockV2', {
        keyPath: checkDataCacheV2Key('blockId'),
      });
      dataV2.createIndex('byBaseRowId', checkDataCacheV2Key('r'));
      dataV2.createIndex('byDbId', checkDataCacheV2Key('dbId'));
    },
  });
  return db;
}
