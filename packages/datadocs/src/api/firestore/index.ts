import { buildURL, requestJSON } from "./base";

export type FirestoreDocsOverview = {
  docId: string;
  docTitle: string;
}
export function requestAllFirestoreDocs(): Promise<FirestoreDocsOverview[]> {
  const url = buildURL('/api/v1/docs');
  return requestJSON(url);
}

export function requestFirestoreDocToken(docId: string) {
  const url = buildURL(`/api/v1/docs/${encodeURIComponent(docId)}/token`);
  return requestJSON(url, 'POST');
}
