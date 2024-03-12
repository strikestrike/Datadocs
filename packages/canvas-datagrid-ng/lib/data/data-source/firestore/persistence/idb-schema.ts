import type { DBSchema } from 'idb';
import type { FirestoreOpAction } from './types';

export interface FirestorePersistenceIDB extends DBSchema {
  historyV1: {
    key: number;
    value: {
      opId: number;
      createdAt: number;
      dbId: string;

      /** An id number if this operation in a write batch */
      batchId?: number;
      /** An id number if this operation in a transaction */
      txId?: number;

      ref: string;

      action: FirestoreOpAction;
      /** Document Reference */
      /** JSON */
      payload: any;
      /** JSON */
      payloadMeta: any[];
      meta?: any;
    };
    indexes: {
      byTxId: number;
      byRef: string;
      byBatchId: number;
      byCreatedAt: number;
    };
  };
}

export type FirestorePersistenceHistoryV1 =
  FirestorePersistenceIDB['historyV1'];

export type FirestorePersistenceHistoryV1Keys =
  keyof FirestorePersistenceIDB['historyV1']['value'];
