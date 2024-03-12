import type { IDBPDatabase } from 'idb';
import type { FirestoreCacheDB } from './idb-schema';
import { _initIDB } from './idb-init';
import { cleanFirestoreQueryCache } from './clean';
import { FirestoreQueryCacheCommon } from './common-cache';
import { FirestoreQueryCacheDataBlock } from './datablock-cache';
import { InMemRowsCacheManager } from '../../../rows-loader/in-mem';
import { defaultInMemRow } from './rows';
import type { InMemFetchedRow } from './rows';

export class FirestoreQueryCacheBase {
  private db: IDBPDatabase<FirestoreCacheDB>;

  readonly init = async () => {
    if (!this.db) this.db = await _initIDB();
    return this.db;
  };

  readonly dispose = async () => {
    if (!this.db) return;
    this.db.close();
    this.db = undefined;
  };

  readonly clean = async (dbId: string) => {
    const db = await this.init();
    return cleanFirestoreQueryCache(db, dbId);
  };

  /** Common Firestore Document Cache */
  readonly common = new FirestoreQueryCacheCommon(this.init);

  /** Data Block Firestore Document Cache */
  readonly dataBlocks = new FirestoreQueryCacheDataBlock(this.init);

  /** In-memeory caches for fetched rows */
  readonly inMem = new InMemRowsCacheManager<InMemFetchedRow>(defaultInMemRow);
}
