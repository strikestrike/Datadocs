import { updateDoc } from 'firebase/firestore';
import { FirestoreDebugLogger } from '../utils/debug-logger';
import type { DocumentReference } from 'firebase/firestore';

export const LATEST_FORMAT_VERSION = '1';

const console = new FirestoreDebugLogger('migration');

export async function updateDocumentFormat(
  docData: any,
  docRef: DocumentReference,
) {
  const currentFormat = docData.format;
  if (currentFormat === LATEST_FORMAT_VERSION) return false;

  if (typeof currentFormat !== 'string' || !currentFormat)
    throw new Error(`Invalid doc (without format)`);

  switch (currentFormat) {
    case '0': {
      // an example migration flow
      const update: any = { format: LATEST_FORMAT_VERSION };
      if (typeof docData.rows !== 'number') update.rows = 100000;
      if (typeof docData.cols !== 'number') update.cols = 1000;
      await updateDoc(docRef, update);
      console.log(docRef.path, currentFormat, '->', LATEST_FORMAT_VERSION);
      return true;
    }
    default:
      throw new Error(`Unknown doc format "${currentFormat}"`);
  }
}
