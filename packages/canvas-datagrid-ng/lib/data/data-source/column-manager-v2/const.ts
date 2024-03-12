import type { ActionResultWithUndoDescriptor } from './types/action-result';

export const ACTION_FAILED: Readonly<ActionResultWithUndoDescriptor<any, any>> =
  Object.freeze({
    ok: false,
  });
