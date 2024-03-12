import type {
  FDocSyncUserStatesOmitFormatV1,
  FDocSyncUserStatesV1,
} from '../spec/storage';
import { IntIntervals } from '../utils/int-intervals';

export type DiffUserStatesResult = {
  newSync: FDocSyncUserStatesV1;
  outdatedRows: IntIntervals;
};

export function diffUserStates(
  currAppId: string,
  lastSync: FDocSyncUserStatesV1 | undefined | null,
  upstream: Readonly<FDocSyncUserStatesV1>,
): DiffUserStatesResult {
  const copiedUpstream: FDocSyncUserStatesOmitFormatV1 = {
    ...upstream,
  } as any;
  delete copiedUpstream[currAppId];
  delete copiedUpstream.format;

  const outdatedRows = new IntIntervals();
  const getResult = (): DiffUserStatesResult => ({
    newSync: upstream,
    outdatedRows,
  });
  if (!lastSync) return getResult();

  const lastAppIds = Object.keys(lastSync);
  for (let i = 0; i < lastAppIds.length; i++) {
    const appId = lastAppIds[i];
    if (appId === currAppId) continue;

    const lastAppState: FDocSyncUserStatesV1 = lastSync[appId] as any;
    const currAppState = copiedUpstream[appId];
    if (!currAppState || typeof currAppState !== 'object') continue;
    if (typeof currAppState.editIndex !== 'number') continue;

    const currEditIndex = currAppState.editIndex;
    const hasNewEdits =
      typeof lastAppState.editIndex !== 'number' ||
      currEditIndex > lastAppState.editIndex;

    if (hasNewEdits && currAppState.lastEdit) {
      const { row0, row1 } = currAppState.lastEdit;
      outdatedRows.add([row0, row1]);
    }
    delete copiedUpstream[appId];
  }

  Object.keys(copiedUpstream).forEach((appId) => {
    const state = copiedUpstream[appId];
    if (state.editIndex && state.lastEdit) {
      const { row0, row1 } = state.lastEdit;
      outdatedRows.add([row0, row1]);
    }
  });

  return getResult();
}
