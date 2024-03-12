import type { FirestoreOpResult } from '../persistence/types';

export type RestoreAfterOnlineHandler = (
  op: FirestoreOpResult,
  parsedPayload: any,
  state: { index: number; total: number; [x: string]: any },
) => Promise<boolean>;

export type OfflineEditCommitMeta = {
  row: number;
  columns: string[];
};

export type OfflineUpdateRangeMeta = {
  newRows: number[];
};
