export const FIRESTORE_API_BASE = 'https://ui3.datadocs.com'

export function buildURL(uri: string, query?: any) {
  const url = new URL(FIRESTORE_API_BASE);
  url.pathname = uri;
  if (query) {
    let queryString = "";
    for (let key in query) {
      if (!queryString) {
        queryString += "?";
      } else {
        queryString += "&";
      }
      queryString += key + "=" + encodeURIComponent(query[key]);
    }
    url.search = query;
  }
  return url;
}

export async function requestJSON(url: URL, method?: string, body?: any) {
  const req = await fetch(url, {
    method: method || 'GET',
    body,
  });
  if (!req.ok) throw new Error(`API response ${req.status}`);
  return req.json();
}
