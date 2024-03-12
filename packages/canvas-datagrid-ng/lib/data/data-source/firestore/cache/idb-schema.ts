import type { DBSchema } from 'idb';
import type { FDocDataBlockV2 } from '../spec/storage';

export interface FirestoreCacheDB extends DBSchema {
  /** For common Firestore Document. Eg: Basic info, meta info, ... */
  cacheV1: {
    key: string;
    value: {
      key: string;
      /** Firestore databse Id */
      dbId: string;
      value: any;
      updatedAt: number;
    };
    indexes: {
      byDbId: string;
    };
  };
  /** For data block Firestore Document */
  dataBlockV2: {
    key: string;
    value: CachedDataBlockV2;
    indexes: {
      byDbId: string;
      byBaseRowId: number;
    };
  };
}
export type FirestoreCacheTableNames = 'cacheV1' | 'dataBlockV2';

export type CachedCommonDocV1 = FirestoreCacheDB['cacheV1']['value'];
export type CachedDataBlockV2 = FDocDataBlockV2 & {
  blockId: string;
  /** Firestore databse Id */
  dbId: string;
  unsaved?: Partial<FDocDataBlockV2>;
};
