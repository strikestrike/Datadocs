import { getDocFromServer, getDocsFromServer } from 'firebase/firestore';
import type { Query, DocumentReference } from 'firebase/firestore';

export type GetDocsDataResult<T> = {
  id: string;
  ref: string;
  data: T;
};

export async function getFDocData(ref: DocumentReference) {
  const doc = await getDocFromServer(ref);
  if (doc.exists()) return doc.data();
  return null;
}

export async function getFDocsData<T = any>(
  q: Query,
): Promise<GetDocsDataResult<T>[]> {
  const docs = await getDocsFromServer(q);
  const result: GetDocsDataResult<T>[] = [];
  docs.forEach((doc) =>
    result.push({
      id: doc.id,
      ref: doc.ref.path,
      data: doc.data() as any,
    }),
  );
  return result;
}
