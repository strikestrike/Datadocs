import { deleteField } from 'firebase/firestore';
import type { SyncUserState } from '../spec/storage';

/**
 * @todo comment
 */
export function cleanOutdatedUserStates<T = any>(
  currAppId: string,
  syncDoc: T,
): T | undefined {
  const appIds = Object.keys(syncDoc);
  const now = Date.now();
  const exp = now - 3600 * 1000; // 1h
  const result: any = {};

  for (let i = 0; i < appIds.length; i++) {
    const appId = appIds[i];
    if (appId === currAppId || appId.startsWith('__')) continue;

    const state: SyncUserState = syncDoc[appId];
    if (!state) continue;
    if (typeof state.lastPingAt !== 'number') continue;

    if (state.lastPingAt < exp) result[appId] = deleteField();
  }
  if (Object.keys(result).length > 0) return result;
}
