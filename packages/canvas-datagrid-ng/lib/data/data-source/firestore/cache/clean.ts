import type { IDBPDatabase } from 'idb';
import type { FirestoreCacheDB } from './idb-schema';

export async function cleanFirestoreQueryCache(
  db: IDBPDatabase<FirestoreCacheDB>,
  dbId: string,
) {
  let count = 0;
  {
    const tx = db.transaction('cacheV1', 'readwrite');
    try {
      let cursor = await tx.store.index('byDbId').openCursor(dbId);
      while (cursor) {
        await cursor.delete();
        count++;
        cursor = await cursor.continue();
      }
      tx.commit();
      await tx.done;
    } catch (error) {
      console.error(error);
    }
  }
  {
    const tx = db.transaction('dataBlockV2', 'readwrite');
    try {
      let cursor = await tx.store.index('byDbId').openCursor(dbId);
      while (cursor) {
        await cursor.delete();
        count++;
        cursor = await cursor.continue();
      }
      tx.commit();
      await tx.done;
    } catch (error) {
      console.error(error);
    }
  }
  return count;
}
