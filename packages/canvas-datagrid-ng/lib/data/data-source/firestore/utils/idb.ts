import { updateObject } from './update-object';
import type { IDBPTransaction } from 'idb';

/**
 * Warn: The store must be crated with a `keyPath`
 * @param update
 */
export async function idbUpdate(
  tx: IDBPTransaction<any, any, 'readwrite'>,
  key: string,
  update: ((key: string, data: any) => any) | { [x: string]: any },
) {
  if (!tx.store) throw new Error(`no store in the transaction`);

  let item = await tx.store.get(key);
  if (!item) item = {} as any;
  if (typeof update === 'function') update(key, item);
  else applyUpdate(item);
  await tx.store.put(item);

  function applyUpdate(item: any) {
    Object.keys(update).forEach((path) => {
      const value = update[path];
      updateObject(item, path, value);
    });
  }
}
