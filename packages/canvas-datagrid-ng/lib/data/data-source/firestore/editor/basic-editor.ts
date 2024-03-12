import type {
  DocumentReference,
  UpdateData,
  WithFieldValue,
} from 'firebase/firestore';
import { updateDoc, writeBatch, setDoc } from 'firebase/firestore';
import { FirestoreDebugLogger } from '../utils/debug-logger';
import { FirestoreOpPersistenceNoop } from '../persistence/noop';
import { strinigfy } from './serialization';
import type {
  FirestoreOp,
  FirestoreOpOptions,
  FirestoreOpIterateResult,
  FirestoreOpIterator,
  FirestoreOpPersistence,
  FirestoreOpResult,
  FirestoreWriteBatchInput,
} from '../persistence/types';
import { NetworkStatus } from '../utils/network-status';
import { DefaultDataEventTarget } from '../../../event-target';
import type { FirestoreConnectInfo } from '../base/connect-info';

const console = new FirestoreDebugLogger('offline-editor');

export type BasicEditorEventName = 'save-op' | 'delete-op' | 'clean-old-op';
type AddListener = DefaultDataEventTarget['addListener'];
type RemoveListener = DefaultDataEventTarget['removeListener'];

export class FirestoreBasicEditor {
  //#region event target
  private listeners = new DefaultDataEventTarget();
  readonly addListener: AddListener = this.listeners.addListener.bind(
    this.listeners,
  );
  readonly removeListener: RemoveListener = this.listeners.removeListener.bind(
    this.listeners,
  );
  private readonly dispatch = (
    error: Error | null,
    eventName: BasicEditorEventName,
    ops?: FirestoreOp[],
  ) => {
    this.listeners.dispatchEvent({
      name: eventName,
      error,
      ops,
    });
  };
  //#endregion event target

  constructor(
    private readonly connect: FirestoreConnectInfo,
    readonly persistence: FirestoreOpPersistence = new FirestoreOpPersistenceNoop(),
  ) {}

  private saveOpSafe = async (
    payload: FirestoreOp,
    opts: FirestoreOpOptions,
  ) => {
    let op: FirestoreOpResult;
    if (opts && opts.cleanOldOp === true) await this.cleanOldOp(payload.ref);

    if (!opts || opts.oneTimeOnly !== true) {
      try {
        op = await this.persistence.save(payload);
      } catch (error) {
        this.dispatch(error, 'save-op', [payload]);
        console.error(error);
        return;
      }
      this.dispatch(null, 'save-op', [op]);
    }
    return op;
  };

  private saveBatchOpSafe = async (
    type: 'tx' | 'batch',
    payload: FirestoreOp[],
    opts: FirestoreOpOptions,
  ) => {
    let ops: FirestoreOpResult[];
    if (!opts || opts.oneTimeOnly !== true) {
      try {
        ops = await this.persistence.saveBatch(payload, type);
      } catch (error) {
        this.dispatch(error, 'save-op', payload);
        console.error(error);
        return [];
      }
      this.dispatch(null, 'save-op', ops);
    }
    return ops;
  };

  private deleteOpIdSafe = async (op: FirestoreOpResult | null) => {
    if (op?.opId) {
      try {
        await this.persistence.delete(op.opId);
      } catch (error) {
        this.dispatch(error, 'delete-op', [op]);
        console.error(error);
        return;
      }
      this.dispatch(null, 'delete-op', [op]);
    }
  };

  setDoc = async <T>(
    documentRef: DocumentReference<T>,
    data: WithFieldValue<T>,
    opts?: FirestoreOpOptions & { meta?: any },
  ) => {
    const createdAt = Date.now();
    const opId = await this.saveOpSafe(
      {
        action: 'setDoc',
        createdAt,
        ref: documentRef.path,
        dbId: opts.dbId,
        ...strinigfy(data),
        meta: opts?.meta || undefined,
      },
      opts,
    );

    const online = NetworkStatus.get().online;
    if (online) {
      try {
        await setDoc(documentRef, data);
      } catch (error) {
        console.error(error);
        return;
      }
      const elapsed = (Date.now() - createdAt).toFixed(0);
      console.debug(`setDoc ${documentRef.path}: done! (+${elapsed}ms)`);
    } else {
      console.debug(`setDoc ${documentRef.path}: offline`);
      return;
    }

    await this.deleteOpIdSafe(opId);
  };

  updateDoc = async <T>(
    documentRef: DocumentReference<T>,
    data: UpdateData<T>,
    opts?: FirestoreOpOptions,
  ) => {
    const createdAt = Date.now();
    const opId = await this.saveOpSafe(
      {
        action: 'updateDoc',
        createdAt,
        ref: documentRef.path,
        dbId: opts.dbId,
        ...strinigfy(data),
      },
      opts,
    );

    const online = NetworkStatus.get().online;
    if (online) {
      try {
        await updateDoc(documentRef, data);
      } catch (error) {
        console.error(error);
        return;
      }
      const elapsed = (Date.now() - createdAt).toFixed(0);
      console.debug(`updateDoc ${documentRef.path}: done! (+${elapsed}ms)`);
    } else {
      console.debug(`updateDoc ${documentRef.path}: offline`);
      return;
    }

    await this.deleteOpIdSafe(opId);
  };

  cleanOldOp = async (ref: string, iterator?: FirestoreOpIterator) => {
    if (!iterator) iterator = () => ({ delete: true });
    return this.persistence
      .iterateByRef(ref, iterator, false)
      .catch((error) => {
        this.dispatch(error, 'clean-old-op');
        console.error(error);
        return { items: 0, deleted: 0 } as FirestoreOpIterateResult;
      });
  };

  /**
   * @returns `true` means these operation have been pushed to upstream. Otherwise, returning `false`
   */
  writeBatch = async <T>(
    items: FirestoreWriteBatchInput<T>[],
    opts: FirestoreOpOptions,
  ): Promise<boolean> => {
    const createdAt = Date.now();

    const opIds = await this.saveBatchOpSafe(
      'batch',
      items.map((it) => ({
        dbId: opts.dbId,
        action: it.action,
        createdAt,
        ref: it.ref.path,
        ...strinigfy(it.data),
        meta: it.meta,
      })),
      opts,
    );

    const online = NetworkStatus.get().online;
    if (online) {
      const firestore = this.connect.store;
      try {
        const batch = writeBatch(firestore);
        for (let i = 0; i < items.length; i++) {
          const { action, ref, data } = items[i];
          switch (action) {
            case 'updateDoc': {
              batch.update(ref, data);
              break;
            }
            case 'setDoc': {
              batch.set(ref, data);
              break;
            }
            case 'deleteDoc': {
              batch.delete(ref);
              break;
            }
            default:
              console.error(`unknown action in writeBatch[${i}]: "${action}"`);
          }
        }
        await batch.commit();
      } catch (error) {
        console.error(error);
        return;
      }
      const elapsed = (Date.now() - createdAt).toFixed(0);
      console.info(`watchBatch: done! (+${elapsed}ms)`);
    } else {
      console.debug(`watchBatch offline`);
      return false;
    }

    for (let i = 0; i < opIds.length; i++) {
      const opId = opIds[i];
      await this.deleteOpIdSafe(opId);
    }
    return true;
  };
}
