const str2int = (it: string) => parseInt(it, 10);
const compareNumberAsc = (a: number, b: number) => a - b;
const compareNumberDesc = (a: number, b: number) => b - a;

/**
 * Reorder in the sparse data. Eg: `{ 1000000: DATA1, 1000001: DATA2, 97222000: DATA3 }`
 */
export function reorderInSparseData<T = any>(
  data: { [index: string]: T } | T[],
  reorderIndexes: number[],
  afterIndex: number,
) {
  const allIndexes = Object.keys(data).map(str2int);
  if (allIndexes.length === 0) return false;

  reorderIndexes = reorderIndexes.filter((it) => it >= 0 && it !== afterIndex);
  if (reorderIndexes.length === 0) return false;

  // temporary fill up elements for align
  for (let ptr = 0; ptr < reorderIndexes.length; ptr++) {
    const index = reorderIndexes[ptr];
    if (index in data) continue;
    allIndexes.push(index);
  }

  // sort indexes
  allIndexes.sort(compareNumberAsc);
  reorderIndexes.sort(compareNumberDesc);

  /** ASC: 0 => 9999... */
  let leftIndexes: number[] = [];
  /** DESC: 9999... => 0 */
  const rightIndexes: number[] = [];

  let removedOnTheLeft = reorderIndexes.length;
  for (let i = 0; i < reorderIndexes.length; i++) {
    const index = reorderIndexes[i];
    if (index < afterIndex) {
      leftIndexes = reorderIndexes.slice(i).reverse();
      break;
    }
    rightIndexes.push(index);
    removedOnTheLeft--;
  }

  const insertFromTheLeft: T[] = [];
  const insertFromTheRight: T[] = [];
  // insert elements :=
  //        insertFromTheLeft
  //        +
  //        insertFromTheRight.reverse()

  // handle the elements to the left of `afterIndex`
  // direction: =====>>
  if (leftIndexes.length > 0) {
    leftIndexes.push(afterIndex);
    for (let ptr = 0, sub = 0; ptr < allIndexes.length; ptr++) {
      const index = allIndexes[ptr];
      if (index >= afterIndex) break;
      if (index === leftIndexes[0]) {
        insertFromTheLeft.push(data[index]);
        delete data[index];
        leftIndexes.shift();
        sub++;
        continue;
      }

      if (index > leftIndexes[0]) {
        leftIndexes.shift();
        sub++;
        ptr--; // keep this index for the check in the next loop
        continue;
      }

      if (sub > 0) {
        data[index - sub] = data[index];
        delete data[index];
      }
    }
  }

  // handle the elements to the right of `afterIndex`
  // direction: <<=====
  if (rightIndexes.length > 0) {
    rightIndexes.push(afterIndex);
    for (let ptr = allIndexes.length - 1, add = 0; ptr >= 0; ptr--) {
      const index = allIndexes[ptr];
      if (index <= afterIndex) break;

      if (index === rightIndexes[0]) {
        insertFromTheRight.push(data[index]);
        delete data[index];
        rightIndexes.shift();
        add++;
        continue;
      }

      if (index < rightIndexes[0]) {
        rightIndexes.shift();
        add++;
        ptr++; // keep this index for the check in the next loop
        continue;
      }

      if (add > 0) {
        data[index + add] = data[index];
        delete data[index];
      }
    }
  }

  const newAfterIndex = afterIndex - removedOnTheLeft;
  if (afterIndex in data) data[newAfterIndex] = data[afterIndex];

  let insertTo = newAfterIndex + 1;
  for (let i = 0; i < insertFromTheLeft.length; i++) {
    const element = insertFromTheLeft[i];
    data[insertTo++] = element;
  }
  for (let i = insertFromTheRight.length - 1; i >= 0; i--) {
    const element = insertFromTheRight[i];
    data[insertTo++] = element;
  }

  return {
    afterIndex: newAfterIndex,
    reordered: insertFromTheLeft.length + insertFromTheRight.length,
  };
}

export function extractFromSparseData<T = any>(
  data: { [index: string]: T } | T[],
  indexes: number[],
) {
  const result: Array<[index: number, value: T]> = [];

  const allIndexes = Object.keys(data).map(str2int);
  if (allIndexes.length === 0) return result;

  indexes = indexes.filter((it) => it >= 0);
  if (indexes.length === 0) return result;

  allIndexes.sort(compareNumberAsc);
  indexes.sort(compareNumberAsc);

  for (let ptr = 0, sub = 0; ptr < allIndexes.length; ptr++) {
    const index = allIndexes[ptr];
    if (indexes.length > 0) {
      if (index === indexes[0]) {
        result.push([index, data[index]]);
        delete data[index];
        indexes.shift();
        sub++;
        continue;
      }
      if (index > indexes[0]) {
        indexes.shift();
        sub++;
        ptr--; // keep this index for the check in the next loop
        continue;
      }
    }
    if (sub > 0) {
      data[index - sub] = data[index];
      delete data[index];
    }
  }
  return result;
}

/**
 * Eg:
 * ```
 * data := { 1:"A", 3:"B", 5:"C" }; insert := [[2,"A2","A3"], [3,"B2"], [10,"D"] }
 * new data := { 1:"A", 3:"A2", 4:"B", 5:"B2", 7:"C", 10:"D" }
 * ```
 */
export function insertIntoSparseData<T = any>(
  data: { [index: string]: T } | T[],
  ...allItems: Array<[afterIndex: number, items: T[]]>
) {
  const result: Array<[index: number, value: T]> = [];
  const allIndexes = Object.keys(data).map(str2int);

  let remaining = 0;
  const filteredItems: typeof allItems = [];
  for (let i = 0; i < allItems.length; i++) {
    const it = allItems[i];
    if (it[0] >= -1 && it[1].length >= 1) {
      filteredItems.push(it);
      remaining += it[1].length;
    }
  }
  allItems = filteredItems;
  if (allItems.length === 0) return result;

  allIndexes.sort(compareNumberAsc);
  allItems.sort((a, b) => a[0] - b[0]);

  let insert = allItems.pop();
  const executeInsert = () => {
    const currentItems = insert[1];
    const base = insert[0] - currentItems.length + remaining + 1;
    currentItems.forEach((it: T, i) => {
      data[base + i] = it;
      result.push([base + i, it]);
    });
    remaining -= currentItems.length;
  };

  for (let ptr = allIndexes.length - 1; ptr >= 0; ptr--) {
    const index = allIndexes[ptr];
    if (index <= insert[0]) {
      executeInsert();
      insert = allItems.pop();
      if (!insert) break;
      ptr++; // keep this index for the check in the next loop
      continue;
    }
    data[index + remaining] = data[index];
    delete data[index];
  }
  if (insert) executeInsert();
  return result;
}
