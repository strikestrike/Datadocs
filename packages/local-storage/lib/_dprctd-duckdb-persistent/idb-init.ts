import { openDB } from 'idb';
import type { IDBPDatabase, IDBPTransaction, StoreNames } from 'idb';
import type {
  LocalDuckDBEntry,
  LocalDuckDBWAL,
  LocalDatabaseSchema,
} from './idb';

const keyOfLocalDB = (key: keyof LocalDuckDBEntry) => key;
const keyOfWALog = (key: keyof LocalDuckDBWAL) => key;

type UpgradeToVersionFnArgs = [
  db: IDBPDatabase<LocalDatabaseSchema>,
  tx: IDBPTransaction<
    LocalDatabaseSchema,
    StoreNames<LocalDatabaseSchema>[],
    'versionchange'
  >,
];

async function upgradeToVersion1(...args: UpgradeToVersionFnArgs) {
  const [db, tx] = args;
  const store = db.createObjectStore('localdbV1', {
    keyPath: keyOfLocalDB('dbId'),
    autoIncrement: true,
  });
  store.createIndex('byName', keyOfLocalDB('dbName'), { unique: true });
  db.createObjectStore('walV1', {
    keyPath: [keyOfWALog('dbId'), keyOfWALog('logId')],
  });
}

export const localDatabaseIDBName = 'persistent-duckdb';
export async function initLocalDatabaseIDB() {
  let upgradePromise: Promise<void> = Promise.resolve();
  const db = await openDB<LocalDatabaseSchema>(localDatabaseIDBName, 1, {
    upgrade(db, oldVer, newVer, tx) {
      if (typeof oldVer !== 'number') oldVer = 0;
      if (oldVer < 1)
        upgradePromise = upgradePromise.then(() => upgradeToVersion1(db, tx));
    },
  });
  await upgradePromise;
  return db;
}
