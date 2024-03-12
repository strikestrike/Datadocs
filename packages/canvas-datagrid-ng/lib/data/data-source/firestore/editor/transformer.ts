import type { FDocDataBlockV2 } from '../spec/storage';

export function addFieldIntoUpdatePayload<T, X extends keyof T>(
  target: T,
  keys: [X, (keyof T[X])?, ...any],
  value: any,
) {
  target[keys.join('.')] = value;
}

export function deleteFromUpdatePayload<T, X extends keyof T>(
  target: T,
  keys: [X, (keyof T[X])?, ...any],
) {
  delete target[keys.join('.')];
}

export function transformSetDataV2PayloadToUpdate(setDoc: FDocDataBlockV2) {
  const update: typeof setDoc = {} as any;
  if (setDoc.d) {
    const keys = Object.keys(setDoc.d);
    keys.forEach((key) => {
      addFieldIntoUpdatePayload(update, ['d', key], setDoc.d[key]);
    });
  }
  if (setDoc.v) {
    const keys = Object.keys(setDoc.v);
    keys.forEach((key) => {
      addFieldIntoUpdatePayload(update, ['v', key], setDoc.v[key]);
    });
  }
  if (setDoc.u) update.u = setDoc.u;
  return update as any;
}
