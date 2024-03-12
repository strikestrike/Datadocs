/**
 * @param index The index of the first element
 * @returns return a non-negative integer.
 * it represents how many consequent items with falsy value from the subscript `index`
 */
export function findConsequentEmptyItemInArray(
  array: unknown[],
  index = 0,
): number {
  let count = 0;
  for (; index < array.length; index++, count++) if (array[index]) return count;
  return count;
}

/**
 * It changes partial elements in an array to `value`.
 * This method doesn't respect to the `length` property of the array, but the parameter `length`
 * @param offset default value: 0
 * @param length default value: `array.length`
 */
export function fillArray<T = unknown>(
  array: T[],
  value: T,
  offset?: number,
  length?: number,
): T[] {
  if (offset === null || offset === undefined) offset = 0;
  if (length === null || length === undefined) length = array.length;
  if (length === 0) return array;

  for (; length > 0; offset++, length--) array[offset] = value;
  return array;
}

export function fillMatrix<T = unknown>(
  matrix: T[][],
  value: T,
  width: number,
  height: number,
  offsetX?: number,
  offsetY?: number,
): T[][] {
  if (offsetX === null || offsetX === undefined) offsetX = 0;
  if (offsetY === null || offsetY === undefined) offsetY = 0;
  if (!matrix) matrix = [];

  for (let yI = 0, y = offsetY; yI < height; yI++, offsetY++) {
    if (!matrix[y]) matrix[y] = [];
    const row = matrix[y];
    for (let xI = 0, x = offsetX; xI < width; xI++, offsetX++) {
      row[x] = value;
    }
  }

  return matrix;
}
