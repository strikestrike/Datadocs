import type { DocumentReference } from 'firebase/firestore';

export type FirestoreWriteBatchInput<T> = {
  action: FirestoreOpAction;
  ref: DocumentReference<T>;
  data?: any;
  meta?: any;
};

export type FirestoreFieldMeta = {
  method:
    | 'serverTimestamp'
    | 'increment'
    | 'arrayUnion'
    | 'arrayRemove'
    | 'deleteField';
  path: Array<string | number>;
  params: any[];
};

export type FirestoreOpAction = 'setDoc' | 'updateDoc' | 'deleteDoc';
export type FirestoreOp = {
  action: FirestoreOpAction;
  ref: string;
  dbId: string;
  txId?: number;
  batchId?: number;
  payload: string;
  payloadMeta: FirestoreFieldMeta[];
  createdAt: number;
  /**
   * Some extra info to describe this operation
   */
  meta?: any;
};
export type FirestoreOpOptions = {
  /**
   * The controller will not try this operation again after offline if it failed
   * @default false
   */
  oneTimeOnly?: boolean;
  cleanOldOp?: boolean;
  dbId: string;
};
export type FirestoreOpResult = Omit<FirestoreOp, 'opId'> & {
  opId: number;
};

export type FirestoreOpIterator = (
  op: FirestoreOp,
  key: string,
) => void | {
  delete?: boolean;
  break?: boolean;
};
export type FirestoreOpIterateResult = {
  items: number;
  deleted: number;
};

export interface FirestoreOpPersistence {
  /**
   * @returns opId
   */
  save(op: FirestoreOp): Promise<FirestoreOpResult>;
  saveBatch(
    ops: FirestoreOp[],
    type: 'tx' | 'batch',
  ): Promise<FirestoreOpResult[]>;
  delete(opId: number): Promise<void>;
  getHead(count: number, dbId?: number): Promise<FirestoreOpResult[]>;
  getByTxId(txId: number): Promise<FirestoreOpResult[]>;
  getByBatchId(batchId: number): Promise<FirestoreOpResult[]>;
  iterateByRef(
    ref: string,
    iterator: FirestoreOpIterator,
    readonly: boolean,
  ): Promise<FirestoreOpIterateResult>;
  count(): Promise<number>;
}
