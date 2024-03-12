import type { QueryDocumentSnapshot, QuerySnapshot } from 'firebase/firestore';
import type { CachedDataBlockV2 } from './idb-schema';

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};
const returnTrue = () => true;

export function createOfflineEmptyDocs(): QuerySnapshot {
  return {
    metadata: null,
    query: null,
    docs: [],
    empty: true,
    size: 0,
    forEach: noop,
    docChanges: () => [],
  };
}

export function createCachedDataBlocks(
  caches: CachedDataBlockV2[],
): QuerySnapshot<CachedDataBlockV2> {
  const docs: QueryDocumentSnapshot<CachedDataBlockV2>[] = caches.map((it) => {
    return {
      id: it.blockId,
      metadata: null,
      ref: null,
      exists: returnTrue,
      data: () => it,
      get: () => null,
    };
  });
  return {
    metadata: null,
    query: null,
    docs,
    empty: caches.length === 0,
    size: caches.length,
    forEach: docs.forEach.bind(docs),
    docChanges: () => [],
  };
}
