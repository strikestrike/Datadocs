import type { Firestore } from 'firebase/firestore';
import { FirestoreQueryCache } from '../cache';
import type { FirestoreConnectInfo } from './connect-info';
import { FirestoreRefBuilder } from './ref-builder';
import { RowRangesManager } from '../api/row-ranges';
import { FDOC_BASE_PATH } from '../spec/storage';
import { IntIntervals } from '../utils/int-intervals';
import type { Dispatcher } from '../spec/utils';

export class FirestoreContext {
  readonly userDocId: string;

  /** Firestore Instance */
  readonly firestore: Firestore;

  /** Firestore Document Reference Builder */
  readonly docsRef: FirestoreRefBuilder;

  /** Managing rows that contain datsa  */
  readonly rowRanges = new RowRangesManager();

  /** Caches for reading Firestore documents */
  readonly caches = new FirestoreQueryCache();

  /**
   * Remember fetched rows in memory,
   * The data source don't need to fetch the same range again
   * if the data still in the memory
   */
  readonly fetchedRanges = new IntIntervals();

  /**
   * Is the document be opened.
   * It means that `connect.connected` is `true` if this value is `true`
   */
  opened = false;

  constructor(
    readonly connect: FirestoreConnectInfo,
    readonly events: Dispatcher,
  ) {
    this.userDocId = connect.docId;
    this.firestore = connect.store;
    this.docsRef = new FirestoreRefBuilder(
      this.firestore,
      FDOC_BASE_PATH + '/' + connect.docId,
    );
  }
}
