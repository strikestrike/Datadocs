import type { Firestore } from 'firebase/firestore';
import type { FDocMetaNames, FDocDataBlockV2 } from '../spec/storage';
import { query, where, orderBy, limit } from 'firebase/firestore';
import { doc, collection } from '../utils/firestore';

const rowIndexProp: keyof FDocDataBlockV2 = 'r';

export class FirestoreRefBuilder {
  constructor(
    private readonly firestore: Firestore,
    readonly basePath: string,
  ) {}

  readonly base = doc(this.firestore, this.basePath);
  readonly getDoc = (ref: string) => doc(this.firestore, ref);

  readonly getMetaCollection = () =>
    collection(this.firestore, this.basePath + '/meta');
  readonly getMetaDoc = (metaDoc: FDocMetaNames) =>
    doc(this.firestore, this.basePath + '/meta/' + metaDoc);

  readonly getDataCollection = () =>
    collection(this.firestore, this.basePath + '/data');

  readonly getDataDoc = (id: string) =>
    doc(this.firestore, this.basePath + '/data/' + id);

  readonly getRowsQuery = (fromRow: number, toRow: number) =>
    query(
      this.getDataCollection(),
      where(rowIndexProp, '>=', Math.max(0, fromRow)),
      where(rowIndexProp, '<=', toRow),
      orderBy(rowIndexProp),
      limit(Math.floor(Math.max(50, (toRow - fromRow) * 1.5))),
    );

  readonly getSingleRowQuery = (row: number) =>
    query(this.getDataCollection(), where(rowIndexProp, '==', row), limit(1));
}
