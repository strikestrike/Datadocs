/**
 * This file is used for basic utility functions
 * These functions should NOT be related to detailed logic of the grid. But they can be utility functions for array operation, object operation, ...
 */

/**
 * A simple implementation for parsing color string to RGBA numbers
 * @example: `rgba(r,g,b,a)` or `#rrggbbaa`
 */
export function parseColorString(
  color: string,
): [r: number, g: number, b: number, a: number] {
  if (!color) return [0, 0, 0, 0];
  if (color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16) || 0;
    const g = parseInt(color.slice(3, 5), 16) || 0;
    const b = parseInt(color.slice(5, 7), 16) || 0;
    const a = parseInt(color.slice(7, 9), 16) / 255 || 1;
    return [r, g, b, a];
  }
  if (color.startsWith('rgb(') || color.startsWith('rgba(')) {
    const mtx = color.match(/\((.+?)\)/);
    if (mtx) {
      let r = 0,
        g = 0,
        b = 0,
        a = 1;
      const v = mtx[1].split(',').map((it) => it.trim());
      if (v[0]) r = parseInt(v[0], 10) || 0;
      if (v[1]) g = parseInt(v[1], 10) || 0;
      if (v[2]) b = parseInt(v[2], 10) || 0;
      if (v[3]) a = parseFloat(v[3]) || 1;
      return [r, g, b, a];
    }
  }
  return [0, 0, 0, 1];
}

function minmax(value: number, max: number, min: number) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Returns the string representation of the RGB(A) array.
 * @param arr The rgba array (e.g., [100, 150, 200, 0.5]).
 * @param ignoreAlpha Don't put the alpha channel into the string.
 * @returns The string representation or undefined if the colors are invalid.
 */
export function rgbaArrayToString(
  arr: number[],
  ignoreAlpha?: boolean,
): string | undefined {
  if (arr.length < 3) return;

  // Inlined.
  return (
    (arr.length === 3 ? 'rgb' : 'rgba') +
    '(' +
    minmax(arr[0], 255, 0) +
    ', ' +
    minmax(arr[1], 255, 0) +
    ', ' +
    minmax(arr[2], 255, 0) +
    (arr.length >= 4 && !ignoreAlpha ? ', ' + minmax(arr[3], 1, 0) : '') +
    ')'
  );
}

/**
 * Copy methods from an object to another
 * @param src The source object the methods came from
 * @param dest The target object the methods added to
 * @returns The target object
 */
export function copyMethods<T1, T2>(src: T1, dest: T2): T2 {
  if (!src) return dest;
  Object.keys(src).forEach((propName) => {
    // We defined private methods by naming it with the prefix '_' and the modifier 'private'
    // We can the new naming feature '#' to replace it in the future:
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_class_fields
    // But this feature can make rollup throws a bug in the bundling stage.
    if (propName.startsWith('_')) return;
    const prop = src[propName];
    if (typeof prop === 'function') dest[propName] = prop.bind(src);
  });
  return dest;
}

/**
 * Converts a integer into a letter A - ZZZZZ...
 * @method
 * @param {column} n The number to convert.
 */
export function integerToAlpha(n: number | string) {
  if (typeof n !== 'number') n = parseInt(n, 10);
  var ordA = 'a'.charCodeAt(0),
    ordZ = 'z'.charCodeAt(0),
    len = ordZ - ordA + 1,
    s = '';
  while (n >= 0) {
    s = String.fromCharCode((n % len) + ordA) + s;
    n = Math.floor(n / len) - 1;
  }
  return s;
}

/**
 * Converts a letter 'A' - 'ZZZZZ'... into a integer
 * @method
 * @param {column} c The column name to convert.
 */
export function alphaToInteger(c: string): number {
  // A -> 0
  // B -> 1
  // Z -> 25
  // AA -> 26
  // AZ -> 51
  // BA -> 52
  // ZZ -> 701
  // AAA -> 702
  let result: number,
    nextResult = 0;
  const column = c.toLowerCase();
  for (let i = 0; i < column.length; i++, nextResult = result * 26 + 26) {
    result = nextResult;
    result += column.charCodeAt(i) - 'a'.charCodeAt(0);
  }
  return result;
}

export function setDefaults(
  targetObject: any,
  sourceObject: any,
  key: string,
  defaultValue: any,
) {
  targetObject[key] =
    sourceObject[key] === undefined ? defaultValue : sourceObject[key];
}

export function fillSequence(
  target: number[],
  low: number,
  high: number,
  step = 1,
  targetOffset = 0,
): number[] {
  let ptr = low;
  while (ptr <= high) {
    target[targetOffset++] = ptr;
    ptr += step;
  }
  return target;
}

export function dumpCellPosition(cell: {
  viewRowIndex: number;
  viewColumnIndex: number;
  boundRowIndex?: number;
  boundColumnIndex?: number;
}): string {
  if (!cell) return '';

  const parts = [`row=${cell.viewRowIndex}`, `col=${cell.viewColumnIndex}`];
  if (
    'boundColumnIndex' in cell &&
    'boundRowIndex' in cell &&
    (cell.viewColumnIndex !== cell.boundColumnIndex ||
      cell.viewRowIndex !== cell.boundRowIndex)
  ) {
    parts.push(
      `boundRow=${cell.boundColumnIndex}`,
      `boundCol=${cell.boundRowIndex}`,
    );
  }
  return parts.join(', ');
}

export function forEachLinkedList<T extends { nextSibling?: T }, R>(
  node: T,
  each: (node: T, index: number) => R,
): R[] {
  let index = 0;
  const result: R[] = [];
  while (node) {
    result.push(each(node, index));
    node = node.nextSibling;
    index++;
  }
  return result;
}

export function createScrollState() {
  return {
    indexTop: 0,
    indexLeft: 0,

    pixelTop: 0,
    pixelLeft: 0,

    height: 0,
    width: 0,

    /**
     * The amount of total indexes that are hidden.
     */
    hiddenRowCount: 0,
  };
}

/**
 * Apply an upper or lower limit to a scroll state where one or other state has
 * values smaller or larger values than the other, depending on {@link max}.
 *
 * When {@link max} is a truthy value, `b` is considered the min value and grows
 * `a` where the latter is smaller.
 *
 * When {@link max} is a falsy value, `a` is consider the max value and shrinks
 * `b` where the latter is larger.
 * @param a
 * @param b
 * @param max
 */
export function sanitizeScrollState(
  a: ReturnType<typeof createScrollState>,
  b: ReturnType<typeof createScrollState>,
  max = false,
) {
  if (
    b.indexLeft > a.indexLeft ||
    (b.indexLeft === a.indexLeft && b.pixelLeft > a.pixelLeft)
  ) {
    if (max) {
      a.indexLeft = b.indexLeft;
      a.pixelLeft = b.pixelLeft;
    } else {
      b.indexLeft = a.indexLeft;
      b.pixelLeft = a.pixelLeft;
    }
  }

  if (
    b.indexTop > a.indexTop ||
    (b.indexTop === a.indexTop && b.pixelTop > a.pixelTop)
  ) {
    if (max) {
      a.indexTop = b.indexTop;
      a.pixelTop = b.pixelTop;
      a.hiddenRowCount = b.hiddenRowCount;
    } else {
      b.indexTop = a.indexTop;
      b.pixelTop = a.pixelTop;
      b.hiddenRowCount = a.hiddenRowCount;
    }
  }

  if (b.width > a.width && a.width >= 0) {
    if (max) {
      a.width = b.width;
    } else {
      b.width = a.width;
    }
  }

  if (b.height > a.height && a.height >= 0) {
    if (max) {
      a.height = b.height;
    } else {
      b.height = a.height;
    }
  }
}

export const copyScrollState = (
  from: ReturnType<typeof createScrollState>,
  to: ReturnType<typeof createScrollState>,
) => {
  to.width = from.width;
  to.height = from.height;
  to.pixelLeft = from.pixelLeft;
  to.pixelTop = from.pixelTop;
  to.indexLeft = from.indexLeft;
  to.indexTop = from.indexTop;
};

/**
 * Returns true if it's metaKey or ctrlKey .
 */
export const isMetaCtrlKey = (event: KeyboardEvent): boolean => {
  if (event.metaKey || event.ctrlKey) {
    return true;
  }

  return false;
};

export const isCoordsInBounds = (
  bounds: { x: number; y: number; width: number; height: number },
  x: number,
  y: number,
) => {
  return !(
    x < bounds.x ||
    x > bounds.x + bounds.width ||
    y < bounds.y ||
    y > bounds.y + bounds.height
  );
};
