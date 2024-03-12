import { onSnapshot } from 'firebase/firestore';
import { FirestoreDebugLogger } from '../utils/debug-logger';
import type { FirestoreContext } from '../base/context';
import type {
  DocumentData,
  DocumentSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import type { UserStatesManager } from '../user-states/manager';

const console = new FirestoreDebugLogger(`sub`);

export type OnNext<T> = (snapshot: DocumentSnapshot<T>) => void;
export type AsyncOnNext = (data: any, isLocalChange: boolean) => Promise<void>;

export class UpstreamSubscriber {
  private readonly subscribers = {
    sync: null as Unsubscribe,
    range: null as Unsubscribe,
  };

  constructor(
    private readonly context: FirestoreContext,
    private readonly userStates: UserStatesManager,
  ) {}

  readonly sub = (quiet = true) => {
    const sb = this.subscribers;
    const { docsRef, rowRanges } = this.context;
    if (!sb.sync) {
      const ref = docsRef.getMetaDoc('sync');
      this.subscribers.sync = onSnapshot(
        ref,
        this.createOnNext(ref.path, this.userStates.onUpstreamMetaChanges),
      );
      if (!quiet) console.info(`subscribed ${ref.path}`);
    }
    if (!sb.range) {
      const ref = docsRef.getMetaDoc('rows');
      this.subscribers.range = onSnapshot(
        ref,
        this.createOnNext(ref.path, rowRanges.onUpstreamMetaChanges),
      );
      if (!quiet) console.info(`subscribed ${ref.path}`);
    }
  };

  readonly unsub = () => {
    const sb = this.subscribers;
    if (sb.sync) {
      sb.sync();
      sb.sync = null;
    }
    if (sb.range) {
      sb.range();
      sb.range = null;
    }
  };

  private readonly createOnNext = (
    ref: string,
    onNextAsync: AsyncOnNext,
  ): OnNext<DocumentData> => {
    const wrapped: OnNext<DocumentData> = (doc) => {
      const data = doc.data();
      const isLocalChange = doc.metadata.hasPendingWrites;
      const changed = ref + (isLocalChange ? ' local' : ' remote') + ' changed';

      console.log(changed, doc.data());
      onNextAsync(data, isLocalChange).catch((e) => {
        console.error(`onNext for "${ref}" error:`, e);
      });
    };
    return wrapped;
  };
}
