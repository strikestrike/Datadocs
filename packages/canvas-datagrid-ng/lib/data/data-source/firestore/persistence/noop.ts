import type {
  FirestoreOp,
  FirestoreOpIterator,
  FirestoreOpPersistence,
} from './types';

export class FirestoreOpPersistenceNoop implements FirestoreOpPersistence {
  save = (op: FirestoreOp) => Promise.resolve({ ...op, opId: 0 });
  saveBatch = (op: FirestoreOp[], type) =>
    Promise.resolve(op.map((it) => ({ ...it, opId: 0 })));
  delete = (opId: number) => Promise.resolve();
  getHead = (count: number) => Promise.resolve([]);
  getByTxId = (txId: number) => Promise.resolve([]);
  getByBatchId = (batchId: number) => Promise.resolve([]);
  iterateByRef = (
    ref: string,
    iterator: FirestoreOpIterator,
    readonly: boolean,
  ) => Promise.resolve({ deleted: 0, items: 0 });
  count = () => Promise.resolve(0);
}
