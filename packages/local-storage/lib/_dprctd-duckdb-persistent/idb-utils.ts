import type { DBSchema, StoreKey, StoreNames } from 'idb';

export function boundKeyRange<
  DBTypes extends DBSchema,
  StoreName extends StoreNames<DBTypes>,
>(
  lower: StoreKey<DBTypes, StoreName>,
  upper: StoreKey<DBTypes, StoreName>,
  lowerOpen?: boolean,
  upperOpen?: boolean,
) {
  return IDBKeyRange.bound(lower, upper, lowerOpen, upperOpen);
}

type CurosrWithValue<ValueType> = {
  value: ValueType;
  continue: () => Promise<any>;
};
export async function listAllFromCursor<ValueItem>(
  cursor: CurosrWithValue<ValueItem>,
) {
  const result: ValueItem[] = [];
  while (cursor) {
    result.push(cursor.value);
    cursor = await cursor.continue();
  }
  return result;
}
