import type { FirestoreContext } from '../base/context';
import type { FDocRowRangesV1 } from '../spec/storage';
import type { FirestoreBasicEditor } from './basic-editor';
import type { OfflineUpdateRangeMeta } from './types';

export async function pushDataRangeToFirestore(
  context: FirestoreContext,
  editor: FirestoreBasicEditor,
  newRows: number[],
) {
  const { caches, docsRef, userDocId, rowRanges } = context;
  const dataRange: FDocRowRangesV1 = rowRanges.encodeForSave();
  const docRef = docsRef.getMetaDoc('rows');
  const meta: OfflineUpdateRangeMeta = { newRows };
  await caches.cacheDoc(userDocId, docRef, dataRange);
  await editor.setDoc(docRef, dataRange, { meta, dbId: userDocId });
  console.log(`updated data range: ${newRows.length} new rows`);
}
