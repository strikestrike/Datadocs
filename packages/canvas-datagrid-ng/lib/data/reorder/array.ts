const compareNumberDesc = (a: number, b: number) => b - a;

/**
 * Reorder in the small array
 */
export function reorderInArray(
  array: any[],
  indexes: number[],
  afterIndex: number,
) {
  // large number => small number
  indexes = indexes
    .filter((it) => it >= 0 && it < array.length && it !== afterIndex)
    .sort(compareNumberDesc);

  const count = indexes.length;
  if (count <= 0) return false;

  // move to the beginning
  if (afterIndex < 0) {
    const items = new Array(count);
    indexes.forEach((index, i) => {
      items[count - 1 - i] = array.splice(index, 1)[0];
    });
    array.unshift(...items);
    return true;
  }

  const borderAt = indexes.findIndex((index) => index < afterIndex);
  let indexesLeft: number[] = [];
  let indexesRight: number[] = [];
  if (borderAt >= 0) {
    indexesRight = indexes.slice(0, borderAt);
    indexesLeft = indexes.slice(borderAt);
  } else if (indexes[0] < afterIndex) {
    indexesLeft = indexes;
  } else {
    indexesRight = indexes;
  }

  if (indexesRight.length > 0) {
    const count = indexesRight.length;
    const sliced = new Array(count);
    indexesRight.forEach((index, i) => {
      sliced[count - 1 - i] = array.splice(index, 1)[0];
    });
    array.splice(afterIndex + 1, 0, ...sliced);
  }
  if (indexesLeft.length > 0) {
    const count = indexesLeft.length;
    const sliced = new Array(count);
    indexesLeft.forEach((index, i) => {
      sliced[count - 1 - i] = array.splice(index, 1)[0];
    });
    array.splice(afterIndex - count + 1, 0, ...sliced);
  }
  return true;
}

/**
 * Reorder consequent items in the small array
 */
export function reorderConsequentInArray(
  array: any[],
  index: number,
  count: number,
  afterIndex: number,
) {
  if (count <= 0) return false;
  if (index < 0) index = 0;

  const length = array.length;
  if (index >= length) return false;

  // this '{' limits `endViewIndex` scope, avoid being used incorrectly.
  {
    const endViewIndex = index + count - 1;
    if (endViewIndex >= length) count = length - index;
  }

  // in-situ
  if (afterIndex >= index - 1 && afterIndex < index + count) return false;

  const sliced = array.splice(index, count);
  if (afterIndex < index) {
    array.splice(afterIndex + 1, 0, ...sliced);
    return { newIndex: afterIndex + 1 };
  }

  array.splice(afterIndex - count + 1, 0, ...sliced);
  return { newIndex: afterIndex - count + 1 };
}
