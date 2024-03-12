import { openDB } from 'idb';
import type {
  FirestorePersistenceHistoryV1Keys,
  FirestorePersistenceIDB,
} from './idb-schema';

const IDB_NAME = 'firestore-op-persistence';
const IDB_LATEST_VERSION = 1;
const checkHistoryV1Key = (key: FirestorePersistenceHistoryV1Keys) =>
  key as string;

export async function _initIDB() {
  const db = await openDB<FirestorePersistenceIDB>(
    IDB_NAME,
    IDB_LATEST_VERSION,
    {
      upgrade(db) {
        const historyV1 = db.createObjectStore('historyV1', {
          keyPath: checkHistoryV1Key('opId'),
        });
        historyV1.createIndex('byCreatedAt', checkHistoryV1Key('createdAt'));
        historyV1.createIndex('byTxId', checkHistoryV1Key('txId'));
        historyV1.createIndex('byBatchId', checkHistoryV1Key('batchId'));
        historyV1.createIndex('byRef', checkHistoryV1Key('ref'));
      },
    },
  );
  return db;
}
