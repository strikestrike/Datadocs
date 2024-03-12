import type { IDBPTransaction, IDBPDatabase, IDBPCursorWithValue } from 'idb';
import type {
  FirestoreOp,
  FirestoreOpIterator,
  FirestoreOpPersistence,
  FirestoreOpResult,
} from './types';
import type {
  FirestorePersistenceIDB,
  FirestorePersistenceHistoryV1,
} from './idb-schema';
import { FirestoreDebugLogger } from '../utils/debug-logger';
import { _initIDB } from './idb-init';

const console = new FirestoreDebugLogger('op-idb');

//#region types shortcut
type IDB = FirestorePersistenceIDB;
type Tx = IDBPTransaction<IDB, ['historyV1'], any>;
type ReadOnlyCursor = IDBPCursorWithValue<
  IDB,
  ['historyV1'],
  'historyV1',
  any,
  'readonly'
>;
//#endregion types shortcut

export class FirestoreOpPersistenceIDB implements FirestoreOpPersistence {
  db: IDBPDatabase<IDB>;

  static async cursorToArray(cursor: ReadOnlyCursor, limit?: number) {
    const result: FirestoreOpResult[] = [];
    while (cursor) {
      result.push(cursor.value);
      if (result.length >= limit) break;
      cursor = await cursor.continue();
    }
    return result;
  }

  init = async () => {
    if (!this.db) this.db = await _initIDB();
    return this.db;
  };

  private getReadWriteTx = async () => {
    const db = await this.init();
    const tx = db.transaction('historyV1', 'readwrite');
    return { db, tx };
  };
  private getNextOpId = async (tx: Tx) => {
    let opId = 1;
    const last = await tx.store.openKeyCursor(null, 'prev');
    if (last) {
      opId = last.key + 1;
      console.log(`assigned opId for the new item: ${opId}`);
    }
    return opId;
  };

  save = async (op: FirestoreOp) => {
    const { tx } = await this.getReadWriteTx();
    const opId = await this.getNextOpId(tx);
    const add = {
      ...op,
      opId,
    };
    await tx.store.add(add);
    tx.commit();
    await tx.done;
    return add;
  };

  saveBatch = async (ops: FirestoreOp[], type: 'tx' | 'batch') => {
    const { tx } = await this.getReadWriteTx();
    const opId = await this.getNextOpId(tx);
    const result: FirestoreOpResult[] = [];
    const relationId = opId;
    for (let i = 0; i < ops.length; i++) {
      const op = ops[i];
      const payload: FirestorePersistenceHistoryV1['value'] = {
        opId,
        ...op,
      };
      switch (type) {
        case 'tx':
          payload.txId = relationId;
          break;
        case 'batch':
          payload.batchId = relationId;
          break;
      }
      await tx.store.add(payload);
      result.push(payload);
    }
    tx.commit();
    await tx.done;
    return result;
  };

  delete = async (opId: number) => {
    const db = await this.init();
    await db.delete('historyV1', opId);
  };

  getHead = async (count: number) => {
    const db = await this.init();
    const tx = db.transaction('historyV1', 'readonly');

    const cursor = await tx.store.index('byCreatedAt').openCursor(null, 'next');
    const result = await FirestoreOpPersistenceIDB.cursorToArray(cursor, count);
    await tx.done;
    return result;
  };

  getByTxId = async (txId: number) => {
    const db = await this.init();
    const tx = db.transaction('historyV1', 'readonly');

    const cursor = await tx.store
      .index('byTxId')
      .openCursor(IDBKeyRange.only(txId));
    return FirestoreOpPersistenceIDB.cursorToArray(cursor);
  };

  getByBatchId = async (batchId: number) => {
    const db = await this.init();
    const tx = db.transaction('historyV1', 'readonly');

    const cursor = await tx.store
      .index('byBatchId')
      .openCursor(IDBKeyRange.only(batchId));
    return FirestoreOpPersistenceIDB.cursorToArray(cursor);
  };

  iterateByRef = async (
    ref: string,
    iterator: FirestoreOpIterator,
    readonly: boolean,
  ) => {
    const db = await this.init();
    const tx = db.transaction('historyV1', readonly ? 'readonly' : 'readwrite');

    let items = 0;
    let deleted = 0;
    let cursor = await tx.store
      .index('byRef')
      .openCursor(IDBKeyRange.only(ref));
    while (cursor) {
      items++;
      const r = iterator(cursor.value, cursor.key);
      if (r) {
        if (r.break) break;
        if (r.delete) {
          await cursor.delete();
          deleted++;
        }
      }
      cursor = await cursor.continue();
    }
    tx.commit();
    await tx.done;
    return { deleted, items };
  };

  count = async () => {
    const db = await this.init();
    return db.count('historyV1');
  };
}
